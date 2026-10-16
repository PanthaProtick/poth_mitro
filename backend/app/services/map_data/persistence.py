"""Transactional persistence for a validated normalized map manifest."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import MapDataImport, MapDataSourceFile, RouteSegment, TransitRoute, TransitStop


def import_manifest(session: Session, manifest: dict[str, Any]) -> dict[str, Any]:
    if manifest["summary"]["errors"]:
        raise ValueError("Map manifest contains validation errors; no rows were imported")
    canonical = json.dumps(manifest, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    with session.begin():
        existing_import = session.scalar(select(MapDataImport).where(MapDataImport.manifest_sha256 == digest))
        if existing_import:
            counts = {
                "routes": len(manifest["routes"]),
                "stops": len(manifest["stops"]),
                "segments": len(manifest["segments"]),
            }
            return {"status": "already_imported", "manifest_sha256": digest, **counts}

        imported_at = datetime.now(timezone.utc).isoformat()
        import_record = MapDataImport(
            source_version=manifest["source_version"],
            manifest_sha256=digest,
            imported_at=imported_at,
        )
        session.add(import_record)
        session.flush()

        for source in manifest["source_files"]:
            session.add(MapDataSourceFile(
                import_id=import_record.id,
                path=source["path"],
                sha256=source["sha256"],
                bytes=source["bytes"],
                format=source["format"],
                coordinate_order=source["coordinate_order"],
                crs_datum=source["crs_datum"],
                parsed_record_count=source["parsed_record_count"],
                accepted_count=source["accepted_count"],
                exclusion_reason=source.get("exclusion_reason"),
            ))

        routes: dict[str, TransitRoute] = {}
        for item in manifest["routes"]:
            route = session.scalar(select(TransitRoute).where(TransitRoute.source_key == item["source_key"]))
            if route is None:
                route = TransitRoute(source_key=item["source_key"], source_id=item["source_id"], name=item["name"], mode=item["mode"], original_status=item["original_status"], source_path=item["source_path"], source_version=item["source_version"], data_quality=item["data_quality"])
                session.add(route)
            else:
                for field in ("source_id", "name", "mode", "original_status", "source_path", "source_version", "data_quality"):
                    setattr(route, field, item[field])
            routes[item["source_key"]] = route
        session.flush()

        stops: dict[str, TransitStop] = {}
        for item in manifest["stops"]:
            stop = session.scalar(select(TransitStop).where(TransitStop.source_key == item["source_key"]))
            values = {
                "source_id": item["source_id"], "route_id": routes[item["route_key"]].id,
                "name": item["name"], "latitude": item["latitude"], "longitude": item["longitude"],
                "source_path": item["source_path"], "coordinate_order": item["coordinate_order"],
                "crs_datum": item["crs_datum"], "data_quality": item["data_quality"],
            }
            if stop is None:
                stop = TransitStop(source_key=item["source_key"], **values)
                session.add(stop)
            else:
                for field, value in values.items():
                    setattr(stop, field, value)
            stops[item["source_key"]] = stop
        session.flush()

        for item in manifest["segments"]:
            segment = session.scalar(select(RouteSegment).where(RouteSegment.source_key == item["source_key"]))
            values = {
                "route_id": routes[item["route_key"]].id,
                "ordinal": item["ordinal"],
                "from_stop_id": stops[item["from_stop_key"]].id,
                "to_stop_id": stops[item["to_stop_key"]].id,
                "geometry_json": json.dumps(item["geometry"], ensure_ascii=False, sort_keys=True, separators=(",", ":")),
                "source_path": item["source_path"],
                "source_version": item["source_version"],
                "data_quality": item["data_quality"],
                "csv_comparison_json": json.dumps(item["csv_comparison"], ensure_ascii=False, sort_keys=True, separators=(",", ":")) if item["csv_comparison"] is not None else None,
            }
            if segment is None:
                segment = RouteSegment(source_key=item["source_key"], **values)
                session.add(segment)
            else:
                for field, value in values.items():
                    setattr(segment, field, value)

    return {
        "status": "imported",
        "manifest_sha256": digest,
        "imported_at": imported_at,
        "routes": len(manifest["routes"]),
        "stops": len(manifest["stops"]),
        "segments": len(manifest["segments"]),
    }
