from contextlib import asynccontextmanager
import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.api.routes import router as api_router

logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)
EXPECTED_MIGRATION = "20261016_02"


def verify_database_ready() -> None:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1")).scalar_one()
        version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
    if version != EXPECTED_MIGRATION:
        raise RuntimeError(
            f"Database schema is not at the expected migration ({EXPECTED_MIGRATION}); run 'uv run alembic upgrade head' first"
        )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting %s in %s mode with a local SQLite database", settings.PROJECT_NAME, settings.ENV)
    try:
        verify_database_ready()
    except Exception as exc:
        logger.error("API started but local database is not ready: %s", exc)
    yield
    engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Local-only DhakaPath API using persistent SQLite storage.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Idempotency-Key", "If-Match"],
)


def _error_response(status_code: int, code: str, message: str, fields=None, headers=None):
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "fields": fields},
                 "request_id": f"req_{uuid4().hex}", "meta": None},
        headers=headers,
    )


@app.exception_handler(StarletteHTTPException)
async def http_error_handler(_request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        code, message = "RESOURCE_NOT_FOUND", "The requested resource was not found."
    elif exc.status_code == 400:
        code, message = "INVALID_CURSOR", "The supplied cursor is invalid."
    else:
        code, message = "REQUEST_ERROR", str(exc.detail)
    return _error_response(exc.status_code, code, message, headers=exc.headers)


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(_request: Request, exc: RequestValidationError):
    fields = [
        {"name": ".".join(str(part) for part in error["loc"] if part != "query"),
         "issue": error["msg"]}
        for error in exc.errors()
    ]
    return _error_response(422, "VALIDATION_ERROR", "One or more request fields are invalid.", fields)


app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/health/live", include_in_schema=False)
def health_live():
    return {"status": "live", "environment": settings.ENV}


@app.get("/health/ready", include_in_schema=False)
def health_ready():
    try:
        verify_database_ready()
    except Exception as exc:
        logger.warning("Database readiness check failed: %s", exc)
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "DATABASE_UNAVAILABLE",
                    "message": "The local database or required migration is unavailable.",
                    "fields": None,
                },
                "request_id": f"req_{uuid4().hex}",
                "meta": {"reason": "database_or_migration_unavailable"},
            },
        )
    return {"status": "ready", "database": "sqlite", "scope": "local_single_operator"}


@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=settings.DEBUG)
