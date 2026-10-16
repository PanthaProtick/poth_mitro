"""Persist local route validation feedback tied to a currently offered path."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import JourneyFeedback, MapDataImport
from app.models.schemas import JourneyFeedbackCreate
from app.services.journeys import search_journeys


class StaleJourneyFeedback(ValueError):
    pass


def _view(record: JourneyFeedback, origin_name: str, destination_name: str) -> dict:
    return {
        "id": record.id,
        "path_fingerprint": record.path_fingerprint,
        "catalog_version": record.catalog_version,
        "origin_id": record.origin_id,
        "destination_id": record.destination_id,
        "origin_name": origin_name,
        "destination_name": destination_name,
        "verdict": record.verdict,
        "correction": record.correction,
        "created_at": record.created_at,
    }


def create_feedback(session: Session, request: JourneyFeedbackCreate) -> dict:
    if request.origin_id == request.destination_id:
        raise StaleJourneyFeedback("Origin and destination must be different. Search again before submitting feedback.")
    latest_import = session.scalar(select(MapDataImport).order_by(MapDataImport.id.desc()).limit(1))
    if latest_import is None or latest_import.manifest_sha256 != request.catalog_version:
        raise StaleJourneyFeedback("The network catalog changed. Search again before submitting feedback.")

    result = search_journeys(
        session,
        request.origin_id,
        request.destination_id,
        request.avoid_reported_routes,
    )
    if result is None or result["catalog_version"] != request.catalog_version:
        raise StaleJourneyFeedback("The network catalog changed. Search again before submitting feedback.")
    option = next(
        (item for item in result["options"] if item["path_fingerprint"] == request.path_fingerprint),
        None,
    )
    if option is None:
        raise StaleJourneyFeedback("This path is no longer offered. Search again before submitting feedback.")

    record = JourneyFeedback(
        id=str(uuid4()),
        path_fingerprint=request.path_fingerprint,
        catalog_version=request.catalog_version,
        origin_id=request.origin_id,
        destination_id=request.destination_id,
        verdict=request.verdict,
        correction=request.correction,
        path_snapshot_json=json.dumps(option, ensure_ascii=False, sort_keys=True),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    session.add(record)
    session.commit()
    return _view(record, result["origin"]["name"], result["destination"]["name"])


def list_feedback(session: Session, limit: int = 100) -> list[dict]:
    records = list(session.scalars(
        select(JourneyFeedback).order_by(JourneyFeedback.created_at.desc(), JourneyFeedback.id.desc()).limit(limit)
    ))
    results = []
    for record in records:
        snapshot = json.loads(record.path_snapshot_json)
        results.append(_view(record, snapshot["steps"][0]["from_stop"]["name"], snapshot["steps"][-1]["to_stop"]["name"]))
    return results
