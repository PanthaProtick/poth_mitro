"""Typed shapes used by the map-data validation pipeline."""

from typing import Literal, NotRequired, TypedDict


class Point(TypedDict):
    latitude: float
    longitude: float


class Issue(TypedDict):
    severity: Literal["error", "warning"]
    source_path: str
    record_id: str | None
    field: str | None
    message: str


class SourceFile(TypedDict):
    path: str
    sha256: str
    bytes: int
    format: str
    coordinate_order: str
    crs_datum: str
    parsed_record_count: int | None
    accepted_count: int
    exclusion_reason: NotRequired[str]
    issues: list[Issue]


class Route(TypedDict):
    source_key: str
    source_id: str
    name: str
    mode: str
    original_status: str
    source_path: str
    source_version: str
    data_quality: str
    stop_keys: list[str]
    segment_keys: list[str]


class Stop(TypedDict):
    source_key: str
    source_id: str
    name: str
    route_key: str
    latitude: float
    longitude: float
    source_path: str
    coordinate_order: str
    crs_datum: str
    data_quality: str


class Segment(TypedDict):
    source_key: str
    route_key: str
    ordinal: int
    from_stop_key: str
    to_stop_key: str
    geometry: list[Point]
    source_path: str
    source_version: str
    data_quality: str
    csv_comparison: dict[str, object] | None


class Manifest(TypedDict):
    manifest_version: int
    source_version: str
    source_files: list[SourceFile]
    routes: list[Route]
    stops: list[Stop]
    segments: list[Segment]
    issues: list[Issue]
    summary: dict[str, int]
