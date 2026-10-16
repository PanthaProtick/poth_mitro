"""Small local read endpoint for checking imported approximate map references."""

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.db.models import MapDataImport, MapDataSourceFile, RouteSegment, TransitRoute, TransitStop
from app.models.schemas import IncidentCreate, IncidentEvidenceView, IncidentUpdate, TripContextResponse, TripListResponse
from app.services.incidents import create_report, get_report, update_report
from app.services.trips import get_trip_context, list_trips

router = APIRouter()


@router.post("/incidents", status_code=201, summary="Create a locally stored incident report")
def incident_create(
    request: IncidentCreate,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    session: Session = Depends(get_db),
):
    status, body = create_report(session, idempotency_key, request)
    return JSONResponse(status_code=status, content=body)


@router.patch("/incidents/{incident_id}", summary="Correct or update a local incident report")
def incident_update(
    incident_id: str,
    request: IncidentUpdate,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    session: Session = Depends(get_db),
):
    status, body = update_report(session, incident_id, idempotency_key, request)
    return JSONResponse(status_code=status, content=body)


@router.get("/incidents/{incident_id}", response_model=IncidentEvidenceView, summary="Read a locally stored incident report")
def incident_detail(incident_id: str, session: Session = Depends(get_db)):
    report = get_report(session, incident_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/trips", response_model=TripListResponse, summary="List locally prepared trips")
def trips_list(
    limit: int = Query(default=20, ge=1, le=50),
    cursor: str | None = Query(default=None, min_length=1, max_length=512),
    session: Session = Depends(get_db),
):
    try:
        return list_trips(session, limit, cursor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor") from exc


@router.get("/trips/{trip_id}/context", response_model=TripContextResponse, summary="Read prepared trip context")
def trip_context(
    trip_id: str,
    report_limit: int = Query(default=20, ge=1, le=50),
    report_cursor: str | None = Query(default=None, min_length=1, max_length=512),
    session: Session = Depends(get_db),
):
    try:
        context = get_trip_context(session, trip_id, report_limit, report_cursor)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid cursor") from exc
    if context is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return context


@router.get("/map-data/summary", summary="Read imported map-data inventory")
def map_data_summary(session: Session = Depends(get_db)):
    latest_import = session.scalar(select(MapDataImport).order_by(MapDataImport.id.desc()).limit(1))
    counts = {
        "routes": session.scalar(select(func.count()).select_from(TransitRoute)) or 0,
        "stops": session.scalar(select(func.count()).select_from(TransitStop)) or 0,
        "segments": session.scalar(select(func.count()).select_from(RouteSegment)) or 0,
        "source_files": session.scalar(select(func.count()).select_from(MapDataSourceFile)) or 0,
    }
    if latest_import is None:
        return {
            "status": "empty",
            "source_version": None,
            "imported_at": None,
            "data_quality": "approximate",
            "counts": counts,
        }
    return {
        "status": "available",
        "source_version": latest_import.source_version,
        "imported_at": latest_import.imported_at,
        "data_quality": "approximate",
        "counts": counts,
    }
