"""Load source files without mutating them or interpreting undocumented roads."""

from __future__ import annotations

import csv
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any


JSON_RELATIVE = Path("Map Data/json/transit-data.json")
BUS_CSV_RELATIVE = {
    "bikolpo": Path("Map Data/csv/Routemap-BikolpoBus.csv"),
    "uttara_bus": Path("Map Data/csv/Routemap-UttaraBus.csv"),
}
METRO_CSV_RELATIVE = Path("Map Data/csv/Routemap-DhakaMetroRail.csv")
ROAD_CSV_RELATIVE = Path("Map Data/csv/Roadmap-Dhaka.csv")


@dataclass(frozen=True)
class CsvComparisonRow:
    row_number: int
    dataset_label: str
    points: list[dict[str, float]]
    trailing_labels: list[str]
    raw_labels: list[str]


@dataclass(frozen=True)
class LoadedSources:
    root: Path
    json_path: str
    source_data: dict[str, Any]
    bus_csv_rows: dict[str, list[CsvComparisonRow]]
    metro_csv_rows: int
    file_records: list[dict[str, Any]]
    issues: list[dict[str, Any]]


def project_root() -> Path:
    """Return the repository root from this module's fixed package location."""
    return Path(__file__).resolve().parents[4]


def _metadata(root: Path, relative: Path, *, format_name: str, coordinate_order: str,
              parsed_count: int | None, accepted_count: int,
              exclusion_reason: str | None = None) -> dict[str, Any]:
    path = root / relative
    content = path.read_bytes()
    record: dict[str, Any] = {
        "path": relative.as_posix(),
        "sha256": hashlib.sha256(content).hexdigest(),
        "bytes": len(content),
        "format": format_name,
        "coordinate_order": coordinate_order,
        "crs_datum": "unknown",
        "parsed_record_count": parsed_count,
        "accepted_count": accepted_count,
        "issues": [],
    }
    if exclusion_reason:
        record["exclusion_reason"] = exclusion_reason
    return record


def _number(value: str) -> float | None:
    try:
        return float(value.strip())
    except (TypeError, ValueError):
        return None


def _load_bus_csv(path: Path, relative: Path, issues: list[dict[str, Any]]) -> list[CsvComparisonRow]:
    result: list[CsvComparisonRow] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row_number, row in enumerate(csv.reader(handle), start=1):
            if not row or all(not value.strip() for value in row):
                issues.append({
                    "severity": "error", "source_path": relative.as_posix(),
                    "record_id": str(row_number), "field": "row",
                    "message": "Blank CSV rows are not valid comparison records.",
                })
                continue

            dataset_label = row[0]
            numeric_values: list[float] = []
            suffix_index = 1
            for index, cell in enumerate(row[1:], start=1):
                number = _number(cell)
                if number is None:
                    suffix_index = index
                    break
                numeric_values.append(number)
                suffix_index = index + 1

            trailing = [value for value in row[suffix_index:] if value.strip()]
            if len(numeric_values) < 4 or len(numeric_values) % 2:
                issues.append({
                    "severity": "error", "source_path": relative.as_posix(),
                    "record_id": str(row_number), "field": "coordinates",
                    "message": "Expected at least two complete longitude/latitude pairs before trailing labels.",
                })
                continue

            points = [
                {"latitude": numeric_values[index + 1], "longitude": numeric_values[index]}
                for index in range(0, len(numeric_values), 2)
            ]
            if any(not (-90 <= point["latitude"] <= 90 and -180 <= point["longitude"] <= 180) for point in points):
                issues.append({
                    "severity": "error", "source_path": relative.as_posix(),
                    "record_id": str(row_number), "field": "coordinates",
                    "message": "CSV coordinate is outside valid latitude/longitude bounds.",
                })
            if len(trailing) not in (1, 2):
                issues.append({
                    "severity": "warning", "source_path": relative.as_posix(),
                    "record_id": str(row_number), "field": "trailing_labels",
                    "message": f"Found {len(trailing)} trailing labels; preserve them verbatim for review.",
                })
            elif len(trailing) == 1:
                issues.append({
                    "severity": "warning", "source_path": relative.as_posix(),
                    "record_id": str(row_number), "field": "trailing_labels",
                    "message": "This row has one combined/unresolved trailing label; it was not split heuristically.",
                })
            result.append(CsvComparisonRow(
                row_number=row_number,
                dataset_label=dataset_label,
                points=points,
                trailing_labels=trailing,
                raw_labels=trailing.copy(),
            ))
    return result


def load_sources(root: Path | None = None) -> LoadedSources:
    root = (root or project_root()).resolve()
    json_file = root / JSON_RELATIVE
    source_data = json.loads(json_file.read_text(encoding="utf-8"))
    issues: list[dict[str, Any]] = []
    bus_csv_rows: dict[str, list[CsvComparisonRow]] = {}
    file_records: list[dict[str, Any]] = []

    buses = source_data.get("buses", [])
    segment_counts = {route.get("id"): len(route.get("segments", [])) for route in buses}
    metro_rows = 0
    for route_id, relative in BUS_CSV_RELATIVE.items():
        rows = _load_bus_csv(root / relative, relative, issues)
        bus_csv_rows[route_id] = rows
        file_records.append(_metadata(
            root, relative, format_name="headerless_csv", coordinate_order="longitude, latitude",
            parsed_count=len(rows), accepted_count=len(rows),
        ))

    with (root / METRO_CSV_RELATIVE).open("r", encoding="utf-8-sig", newline="") as handle:
        metro_rows = sum(1 for row in csv.reader(handle) if row and any(value.strip() for value in row))
    file_records.append(_metadata(
        root, METRO_CSV_RELATIVE, format_name="headerless_csv_inventory_only",
        coordinate_order="longitude, latitude", parsed_count=metro_rows, accepted_count=0,
        exclusion_reason="Not mapped to the JSON station list; excluded from connected-route import.",
    ))

    road_reason = "Undocumented 49,869-row variable-width file; schema/provenance unknown, excluded from parsing and routing."
    file_records.append(_metadata(
        root, ROAD_CSV_RELATIVE, format_name="csv_inventory_only", coordinate_order="unknown",
        parsed_count=None, accepted_count=0, exclusion_reason=road_reason,
    ))
    file_records.insert(0, _metadata(
        root, JSON_RELATIVE, format_name="json", coordinate_order=source_data.get("coordinateOrder", "unknown"),
        parsed_count=len(source_data.get("metro", {}).get("stations", []))
        + sum(len(route.get("stops", [])) + len(route.get("segments", [])) for route in buses),
        accepted_count=len(source_data.get("metro", {}).get("stations", []))
        + sum(len(route.get("stops", [])) + len(route.get("segments", [])) for route in buses),
    ))

    for route_id, rows in bus_csv_rows.items():
        expected = segment_counts.get(route_id, 0)
        if len(rows) != expected:
            issues.append({
                "severity": "warning", "source_path": BUS_CSV_RELATIVE[route_id].as_posix(),
                "record_id": route_id, "field": "row_count",
                "message": f"CSV has {len(rows)} valid rows; canonical JSON has {expected} segments.",
            })

    return LoadedSources(
        root=root,
        json_path=JSON_RELATIVE.as_posix(),
        source_data=source_data,
        bus_csv_rows=bus_csv_rows,
        metro_csv_rows=metro_rows,
        file_records=file_records,
        issues=issues,
    )
