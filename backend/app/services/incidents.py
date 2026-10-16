"""Transactional local incident writes with idempotent request receipts."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import IncidentEvent, IncidentReport, MutationReceipt, TransitRoute
from app.models.schemas import IncidentCreate, IncidentUpdate
from app.services.trips import _report_view


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _error(status: int, code: str, message: str, meta=None) -> tuple[int, dict]:
    return status, {
        "error": {"code": code, "message": message, "fields": None},
        "request_id": f"req_{uuid4().hex}",
        "meta": meta,
    }


def _key(value: str | None) -> tuple[str | None, tuple[int, dict] | None]:
    if value is None:
        return None, _error(400, "IDEMPOTENCY_KEY_REQUIRED", "An Idempotency-Key UUIDv4 header is required.")
    try:
        parsed = UUID(value)
    except (ValueError, AttributeError):
        parsed = None
    if parsed is None or parsed.version != 4:
        return None, _error(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key must be a UUIDv4 value.")
    return str(parsed), None


def _canonical(value: dict) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _fingerprint(operation: str, payload: dict) -> str:
    raw = _canonical({"operation": operation, "payload": payload}).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def _snapshot(report: IncidentReport) -> dict:
    return {
        "id": report.id, "kind": report.kind, "title": report.title,
        "description": report.description, "location": report.location,
        "mode": report.mode, "direction": report.direction, "route_id": report.route_id,
        "status": report.status, "version": report.version,
        "source_type": report.source_type, "report_source": report.report_source,
        "is_synthetic": report.is_synthetic,
        "observed_at": report.observed_at, "actor_label": report.actor_label,
        "created_at": report.created_at, "updated_at": report.updated_at,
        "confirmation_note": report.confirmation_note,
    }


def _view(report: IncidentReport) -> dict:
    return _report_view(report, datetime.now(timezone.utc))


def get_report(session: Session, report_id: str) -> dict | None:
    report = session.get(IncidentReport, report_id)
    return _view(report) if report is not None else None


def _receipt_result(receipt: MutationReceipt, fingerprint: str) -> tuple[int, dict]:
    if receipt.request_fingerprint != fingerprint:
        return _error(409, "IDEMPOTENCY_KEY_REUSED", "This idempotency key was already used for a different request.")
    return receipt.status_code, json.loads(receipt.response_json)


def _save_receipt(
    session: Session, key: str, fingerprint: str, operation: str, status: int, body: dict, now: str,
) -> None:
    session.add(MutationReceipt(
        idempotency_key=key,
        request_fingerprint=fingerprint,
        operation=operation,
        status_code=status,
        response_json=_canonical(body),
        created_at=now,
    ))


def _report_event(report: IncidentReport, event_type: str, reason: str, before: dict | None, now: str) -> IncidentEvent:
    return IncidentEvent(
        report_id=report.id,
        event_type=event_type,
        actor_label="local_operator",
        reason=reason,
        before_json=_canonical(before) if before is not None else None,
        after_json=_canonical(_snapshot(report)),
        created_at=now,
    )


def _replay_or_key_conflict(session: Session, key: str, fingerprint: str) -> tuple[int, dict] | None:
    receipt = session.scalar(select(MutationReceipt).where(MutationReceipt.idempotency_key == key))
    if receipt is None:
        return None
    return _receipt_result(receipt, fingerprint)


def create_report(session: Session, key_header: str | None, request: IncidentCreate) -> tuple[int, dict]:
    key, key_error = _key(key_header)
    if key_error:
        return key_error
    payload = request.model_dump(mode="json")
    operation = "POST /api/v1/incidents"
    fingerprint = _fingerprint(operation, payload)
    try:
        with session.begin():
            session.execute(text("BEGIN IMMEDIATE"))
            replay = _replay_or_key_conflict(session, key, fingerprint)
            if replay:
                return replay
            if request.route_id is not None and session.get(TransitRoute, request.route_id) is None:
                return _error(422, "VALIDATION_ERROR", "The selected route does not exist.")
            now = _timestamp()
            report = IncidentReport(
                id=str(uuid4()), kind=request.kind, title=request.title,
                description=request.description or "", location=request.location,
                mode=request.mode, direction=request.direction, route_id=request.route_id,
                status="reported", version=1, source_type="rider_report", report_source=request.source_type,
                is_synthetic=False,
                observed_at=request.observed_at.isoformat().replace("+00:00", "Z") if request.observed_at else None,
                actor_label="local_operator", created_at=now, updated_at=now,
            )
            session.add(report)
            session.flush()
            session.add(_report_event(report, "created", "Report created by the local operator.", None, now))
            body = _view(report)
            _save_receipt(session, key, fingerprint, operation, 201, body, now)
        return 201, body
    except IntegrityError:
        session.rollback()
        replay = _replay_or_key_conflict(session, key, fingerprint)
        if replay:
            return replay
        raise


def update_report(
    session: Session, report_id: str, key_header: str | None, request: IncidentUpdate,
) -> tuple[int, dict]:
    key, key_error = _key(key_header)
    if key_error:
        return key_error
    supplied = request.model_dump(mode="json", exclude_unset=True)
    expected_version = supplied.pop("expected_version")
    reason = supplied.pop("reason")
    allowed = {"kind", "title", "description", "location", "mode", "direction", "route_id",
               "observed_at", "status", "confirmation_note"}
    changes = {name: value for name, value in supplied.items() if name in allowed}
    if not changes:
        return _error(422, "VALIDATION_ERROR", "At least one report field must be changed.")
    for required in ("kind", "title", "location", "mode", "status"):
        if required in changes and changes[required] is None:
            return _error(422, "VALIDATION_ERROR", f"{required} cannot be cleared.")
    operation = f"PATCH /api/v1/incidents/{report_id}"
    fingerprint = _fingerprint(operation, {"expected_version": expected_version, "reason": reason, **changes})
    if "observed_at" in changes and changes["observed_at"] is not None:
        observed = request.observed_at
        changes["observed_at"] = observed.isoformat().replace("+00:00", "Z") if observed else None
    if changes.get("description", object()) is None:
        changes["description"] = ""
    try:
        with session.begin():
            session.execute(text("BEGIN IMMEDIATE"))
            replay = _replay_or_key_conflict(session, key, fingerprint)
            if replay:
                return replay
            report = session.get(IncidentReport, report_id)
            if report is None:
                status, body = _error(404, "RESOURCE_NOT_FOUND", "The requested report was not found.")
                _save_receipt(session, key, fingerprint, operation, status, body, _timestamp())
                return status, body
            if "route_id" in changes and changes["route_id"] is not None and session.get(TransitRoute, changes["route_id"]) is None:
                return _error(422, "VALIDATION_ERROR", "The selected route does not exist.")
            if report.version != expected_version:
                status, body = _error(409, "VERSION_CONFLICT", "The report changed since it was loaded.", {"current_version": report.version})
                _save_receipt(session, key, fingerprint, operation, status, body, _timestamp())
                return status, body

            before = _snapshot(report)
            now = _timestamp()
            values = {name: value for name, value in changes.items()}
            result = session.execute(
                update(IncidentReport)
                .where(IncidentReport.id == report_id, IncidentReport.version == expected_version)
                .values(**values, version=expected_version + 1, updated_at=now)
                .execution_options(synchronize_session=False)
            )
            if result.rowcount != 1:
                session.refresh(report)
                status, body = _error(409, "VERSION_CONFLICT", "The report changed since it was loaded.", {"current_version": report.version})
                _save_receipt(session, key, fingerprint, operation, status, body, now)
                return status, body
            session.refresh(report)
            session.add(_report_event(report, "updated", reason, before, now))
            body = _view(report)
            _save_receipt(session, key, fingerprint, operation, 200, body, now)
        return 200, body
    except IntegrityError:
        session.rollback()
        replay = _replay_or_key_conflict(session, key, fingerprint)
        if replay:
            return replay
        raise
