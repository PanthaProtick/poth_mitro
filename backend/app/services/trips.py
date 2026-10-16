"""Deterministic read services for locally prepared trip context."""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import IncidentReport, RouteSegment, Trip, TripSegment, TransitRoute

FRESHNESS_CURRENT_MINUTES = 30
FRESHNESS_MAX_MINUTES = 120


def _encode_cursor(values: list[str]) -> str:
    raw = json.dumps(values, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _decode_cursor(cursor: str | None, expected_size: int) -> list[str] | None:
    if cursor is None:
        return None
    try:
        padded = cursor + "=" * (-len(cursor) % 4)
        values = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
        if (not isinstance(values, list) or len(values) != expected_size
                or any(not isinstance(value, str) for value in values)):
            raise ValueError
        return values
    except (ValueError, UnicodeError, json.JSONDecodeError):
        raise ValueError("Invalid cursor") from None


def _trip_name(trip: Trip) -> str:
    return f"{trip.origin} to {trip.destination}"


def list_trips(session: Session, limit: int, cursor: str | None) -> dict:
    key = _decode_cursor(cursor, 3)
    statement = select(Trip).order_by(
        Trip.origin, Trip.destination, Trip.id
    )
    if key:
        origin, destination, trip_id = key
        statement = statement.where(
            (Trip.origin > origin)
            | ((Trip.origin == origin) & (Trip.destination > destination))
            | ((Trip.origin == origin) & (Trip.destination == destination) & (Trip.id > trip_id))
        )
    rows = list(session.scalars(statement.limit(limit + 1)))
    has_more = len(rows) > limit
    rows = rows[:limit]
    items = [
        {"id": row.id, "name": _trip_name(row), "is_synthetic": row.is_synthetic}
        for row in rows
    ]
    next_cursor = None
    if has_more and rows:
        last = rows[-1]
        next_cursor = _encode_cursor([last.origin, last.destination, last.id])
    return {"items": items, "next_cursor": next_cursor}


def _parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            return None
        return parsed.astimezone(timezone.utc)
    except ValueError:
        return None


def _utc_string(value: str | None) -> str | None:
    parsed = _parse_time(value)
    return parsed.isoformat().replace("+00:00", "Z") if parsed is not None else None


def _report_view(report: IncidentReport, as_of: datetime) -> dict:
    observed = _parse_time(report.observed_at)
    age = None
    freshness = "unknown"
    if observed is not None:
        minutes = (as_of - observed).total_seconds() / 60
        if minutes >= 0:
            age = int(minutes)
            freshness = "current" if age <= FRESHNESS_CURRENT_MINUTES else "aging" if age <= FRESHNESS_MAX_MINUTES else "stale"
    return {
        "id": report.id,
        "kind": report.kind,
        "title": report.title,
        "location": report.location,
        "route_id": report.route_id,
        # Preserve what the report actually supplied. Inferring a mode from its
        # linked route would hide incomplete evidence from callers.
        "mode": report.mode,
        "direction": report.direction,
        "observed_at": _utc_string(report.observed_at),
        "age_minutes": age,
        "freshness": freshness,
        "source_type": report.report_source or ("synthetic_example" if report.source_type == "synthetic_example" else "traveller_report"),
        "status": report.status,
        "is_synthetic": report.is_synthetic,
        "version": report.version,
        "created_at": _utc_string(report.created_at) or report.created_at,
        "updated_at": _utc_string(report.updated_at) or report.updated_at,
        "actor_label": report.actor_label,
        "description": report.description or None,
        "confirmation_note": report.confirmation_note,
    }


def get_trip_context(
    session: Session, trip_id: str, report_limit: int, report_cursor: str | None,
) -> dict | None:
    trip = session.scalar(
        select(Trip).where(Trip.id == trip_id).options(
            selectinload(Trip.segments).joinedload(TripSegment.route_segment).joinedload(RouteSegment.route)
        )
    )
    if trip is None:
        return None

    key = _decode_cursor(report_cursor, 2)
    as_of = datetime.now(timezone.utc)
    route_by_id: dict[int, TransitRoute] = {}
    for segment in trip.segments:
        if segment.route_segment is not None:
            route_by_id[segment.route_segment.route_id] = segment.route_segment.route
    route_ids = set(route_by_id)
    complete_route_trace = bool(trip.segments) and all(
        segment.route_segment is not None for segment in trip.segments
    )

    reports: list[IncidentReport] = []
    if route_ids:
        statement = select(IncidentReport).where(IncidentReport.route_id.in_(route_ids)).order_by(
            IncidentReport.created_at.desc(), IncidentReport.id.desc()
        )
        if key:
            created_at, report_id = key
            statement = statement.where(
                (IncidentReport.created_at < created_at)
                | ((IncidentReport.created_at == created_at) & (IncidentReport.id < report_id))
            )
        page = list(session.scalars(statement.limit(report_limit + 1)))
        has_more = len(page) > report_limit
        reports = page[:report_limit]
        evidence_total = int(session.scalar(
            select(func.count(IncidentReport.id)).where(IncidentReport.route_id.in_(route_ids))
        ) or 0)
    else:
        has_more = False
        evidence_total = 0

    next_cursor = None
    if has_more and reports:
        last = reports[-1]
        next_cursor = _encode_cursor([last.created_at, last.id])

    # Relevance considers every route-linked report, regardless of the evidence page.
    all_reports = list(session.scalars(
        select(IncidentReport).where(IncidentReport.route_id.in_(route_ids))
    )) if route_ids else []
    active = [report for report in all_reports if report.status in {"reported", "confirmed"}]
    disputed = [report for report in all_reports if report.status == "disputed"]
    matched_fresh = []
    uncertain_match = bool(disputed)
    for report in active:
        observed = _parse_time(report.observed_at)
        if observed is None or not report.location.strip() or not report.mode:
            uncertain_match = True
            continue
        age = (as_of - observed).total_seconds() / 60
        if age < 0 or age > FRESHNESS_MAX_MINUTES:
            uncertain_match = True
        else:
            matched_fresh.append(report)

    if matched_fresh and not uncertain_match:
        relevance = {
            "state": "affects_trip",
            "reason": "A saved report is linked to a route used by this trip. Its precise location and on-route impact have not been independently verified.",
        }
    elif uncertain_match or not complete_route_trace:
        relevance = {
            "state": "unknown",
            "reason": "Available report times or trip route references are incomplete, stale, future-dated, or disputed, so the available data cannot support a clear match.",
        }
    else:
        relevance = {
            "state": "not_affected",
            "reason": "No match found in available reports for the stored route references. This does not confirm that the trip is clear.",
        }

    return {
        "trip": {
            "id": trip.id,
            "name": _trip_name(trip),
            "is_synthetic": trip.is_synthetic,
            "segments": [
                {"id": segment.id, "ordinal": segment.ordinal, "mode": segment.mode,
                 "origin": segment.origin, "destination": segment.destination,
                 "route_reference_available": segment.route_segment is not None,
                 "route_data_quality": segment.route_segment.data_quality if segment.route_segment else None}
                for segment in sorted(trip.segments, key=lambda item: item.ordinal)
            ],
        },
        "reports": [_report_view(report, as_of) for report in reports],
        "as_of": as_of.isoformat().replace("+00:00", "Z"),
        "evidence_total": evidence_total,
        "reports_next_cursor": next_cursor,
        "relevance": relevance,
    }
