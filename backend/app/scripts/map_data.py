"""Validate and emit a deterministic manifest for the checked-in map data."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any
from datetime import datetime, timezone

from sqlalchemy import select, text
from sqlalchemy.orm import sessionmaker

from app.services.map_data.loader import load_sources, project_root
from app.services.map_data.normalize import normalize_sources
from app.services.map_data.validate import validate_manifest

EXPECTED_MIGRATION = "20261016_02"


def _require_expected_migration(connection) -> None:
    try:
        version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
    except Exception as exc:
        raise RuntimeError("Run 'uv run alembic upgrade head' before importing or seeding") from exc
    if version != EXPECTED_MIGRATION:
        raise RuntimeError(f"Database migration must be {EXPECTED_MIGRATION}; current revision is {version!r}")


def build_manifest(root: Path | None = None) -> dict[str, Any]:
    loaded = load_sources(root)
    manifest = normalize_sources(loaded)
    return validate_manifest(manifest)


def _summary(manifest: dict[str, Any]) -> dict[str, Any]:
    source_files = []
    for source in manifest["source_files"]:
        compact = {key: value for key, value in source.items() if key != "issues"}
        compact["issue_count"] = len(source["issues"])
        source_files.append(compact)
    return {
        "manifest_version": manifest["manifest_version"],
        "source_version": manifest["source_version"],
        "summary": manifest["summary"],
        "source_files": source_files,
        "issues": manifest["issues"],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    validate = subparsers.add_parser("validate", help="validate sources and emit normalized manifest JSON")
    validate.add_argument("--root", type=Path, help="project root (defaults to discovered repository root)")
    validate.add_argument("--output", type=Path, help="write JSON to this explicit path instead of stdout")
    validate.add_argument("--summary-only", action="store_true", help="omit normalized route/stop/segment arrays")
    importer = subparsers.add_parser("import", help="import validated map references into the migrated local SQLite database")
    importer.add_argument("--root", type=Path, help="project root (defaults to discovered repository root)")
    importer.add_argument("--database-path", type=Path, help="override DATABASE_PATH for this command")
    seed = subparsers.add_parser("seed-demo", help="insert clearly marked synthetic local demo trip/report records")
    seed.add_argument("--database-path", type=Path, help="override DATABASE_PATH for this command")
    args = parser.parse_args()

    if args.command == "seed-demo":
        try:
            return _seed_demo(args.database_path)
        except Exception as exc:
            sys.stderr.write(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False) + "\n")
            return 2

    try:
        manifest = build_manifest(args.root or project_root())
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError) as exc:
        result = {"status": "error", "message": str(exc)}
        sys.stderr.write(json.dumps(result, ensure_ascii=False) + "\n")
        return 2

    if args.command == "import":
        if manifest["summary"]["errors"]:
            sys.stderr.write(json.dumps({"status": "error", "message": "Map validation errors block import", "summary": manifest["summary"]}, ensure_ascii=False) + "\n")
            return 1
        try:
            from app.core.database import make_engine
            from app.services.map_data.persistence import import_manifest

            engine = make_engine(args.database_path) if args.database_path else make_engine()
            with engine.connect() as connection:
                _require_expected_migration(connection)
            factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
            with factory() as session:
                result = import_manifest(session, manifest)
            engine.dispose()
            sys.stdout.write(json.dumps(result, ensure_ascii=False, sort_keys=True) + "\n")
            return 0
        except Exception as exc:
            sys.stderr.write(json.dumps({"status": "error", "message": str(exc)}, ensure_ascii=False) + "\n")
            return 2

    result = _summary(manifest) if args.summary_only else manifest
    serialized = json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2) + "\n"
    if args.output:
        root = (args.root or project_root()).resolve()
        destination = args.output if args.output.is_absolute() else root / args.output
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(serialized, encoding="utf-8", newline="\n")
    else:
        sys.stdout.write(serialized)

    return 1 if manifest["summary"]["errors"] else 0


def _seed_demo(database_path: Path | None) -> int:
    from app.core.database import make_engine
    from app.db.models import IncidentEvent, IncidentReport, RouteSegment, TransitRoute, TransitStop, Trip, TripSegment

    engine = make_engine(database_path) if database_path else make_engine()
    with engine.connect() as connection:
        _require_expected_migration(connection)
    factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    timestamp = datetime.now(timezone.utc).isoformat()
    with factory() as session:
        with session.begin():
            existing_trip = session.scalar(select(Trip).where(Trip.seed_key == "local-demo-trip-v1"))
            existing_report = session.get(IncidentReport, "seed:local-demo-report-v1")
            if existing_trip is not None and existing_report is not None:
                print(json.dumps({"status": "already_seeded", "trip_id": existing_trip.id, "report_id": existing_report.id}))
                return 0

            if existing_trip is None:
                segment = session.scalar(select(RouteSegment).order_by(RouteSegment.id))
                if segment is None:
                    raise RuntimeError("Import the validated map data before running seed-demo")
                start = session.get(TransitStop, segment.from_stop_id)
                end = session.get(TransitStop, segment.to_stop_id)
                trip = Trip(
                    id="seed:local-demo-trip-v1",
                    origin=start.name,
                    destination=end.name,
                    summary="Synthetic example trip using one approximate stored route segment; fare and duration are unknown.",
                    is_synthetic=True,
                    seed_key="local-demo-trip-v1",
                    created_at=timestamp,
                )
                trip.segments.append(TripSegment(ordinal=1, mode="bus", origin=start.name, destination=end.name, route_segment_id=segment.id, fare_bdt=None, estimated_minutes=None))
                session.add(trip)

            if existing_report is None:
                route = session.scalar(select(TransitRoute).where(TransitRoute.mode == "bus").order_by(TransitRoute.id))
                report = IncidentReport(
                    id="seed:local-demo-report-v1",
                    kind="illustrative_disruption",
                    title="Synthetic example: disruption report",
                    description="Illustrative seed record only. This is not a live or independently verified street alert.",
                    location="Dhaka (illustrative; not a verified point)",
                    route_id=route.id if route else None,
                    status="reported",
                    version=1,
                    source_type="synthetic_example",
                    is_synthetic=True,
                    observed_at=None,
                    actor_label="local-demo-seed (not a verified identity)",
                    created_at=timestamp,
                    updated_at=timestamp,
                )
                report.events.append(IncidentEvent(event_type="seeded", actor_label=report.actor_label, reason="Created by the explicit local demo seed command.", before_json=None, after_json=json.dumps({"status": "reported", "is_synthetic": True, "source_type": "synthetic_example"}, sort_keys=True), created_at=timestamp))
                session.add(report)
    engine.dispose()
    sys.stdout.write(json.dumps({"status": "seeded", "trip_id": "seed:local-demo-trip-v1", "report_id": "seed:local-demo-report-v1"}) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
