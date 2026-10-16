"""Normalize canonical JSON transit records and attach CSV diagnostics."""

from __future__ import annotations

from typing import Any

from .loader import BUS_CSV_RELATIVE, CsvComparisonRow, LoadedSources


def _source_key(*parts: object) -> str:
    return ":".join(str(part).strip() for part in parts)


def _point(pair: list[float]) -> dict[str, float]:
    return {"latitude": float(pair[0]), "longitude": float(pair[1])}


def _comparison(csv_row: CsvComparisonRow | None, segment: dict[str, Any]) -> dict[str, Any] | None:
    if csv_row is None:
        return None
    canonical_start = _point(segment["coordinates"][0])
    canonical_end = _point(segment["coordinates"][-1])
    start = csv_row.points[0]
    end = csv_row.points[-1]
    start_delta = max(
        abs(start["latitude"] - canonical_start["latitude"]),
        abs(start["longitude"] - canonical_start["longitude"]),
    )
    end_delta = max(
        abs(end["latitude"] - canonical_end["latitude"]),
        abs(end["longitude"] - canonical_end["longitude"]),
    )
    return {
        "csv_path": BUS_CSV_RELATIVE[segment["_route_id"]].as_posix(),
        "row_number": csv_row.row_number,
        "dataset_label": csv_row.dataset_label,
        "raw_labels": csv_row.raw_labels,
        "csv_point_count": len(csv_row.points),
        "endpoint_tolerance_degrees": 1e-6,
        "start_max_delta_degrees": start_delta,
        "end_max_delta_degrees": end_delta,
        "matches_json_endpoints": start_delta <= 1e-6 and end_delta <= 1e-6,
        "csv_geometry": csv_row.points,
    }


def normalize_sources(loaded: LoadedSources) -> dict[str, Any]:
    source_data = loaded.source_data
    source_version = str(source_data.get("version", "unknown"))
    routes: list[dict[str, Any]] = []
    stops: list[dict[str, Any]] = []
    segments: list[dict[str, Any]] = []
    metro = source_data.get("metro", {})
    metro_key = _source_key(source_version, "route", metro.get("id", "mrt6"))
    metro_stop_keys: list[str] = []
    metro_segment_keys: list[str] = []
    for station in metro.get("stations", []):
        stop_key = _source_key(source_version, "stop", metro.get("id", "mrt6"), station["id"])
        metro_stop_keys.append(stop_key)
        stops.append({
            "source_key": stop_key,
            "source_id": str(station["id"]),
            "name": str(station["name"]),
            "route_key": metro_key,
            "latitude": float(station["lat"]),
            "longitude": float(station["lng"]),
            "source_path": loaded.json_path,
            "coordinate_order": "latitude, longitude",
            "crs_datum": "unknown",
            "data_quality": "approximate",
        })
    # The source provides MRT station order and station coordinates but no rail
    # polylines. Preserve adjacent station connectivity as straight-line,
    # approximate reference edges so the catalog can be searched as a graph.
    stations = metro.get("stations", [])
    for ordinal, (start, end) in enumerate(zip(stations, stations[1:]), start=1):
        segment_key = _source_key(source_version, "segment", metro.get("id", "mrt6"), start["id"], end["id"], ordinal)
        metro_segment_keys.append(segment_key)
        segments.append({
            "source_key": segment_key,
            "route_key": metro_key,
            "ordinal": ordinal,
            "from_stop_key": _source_key(source_version, "stop", metro.get("id", "mrt6"), start["id"]),
            "to_stop_key": _source_key(source_version, "stop", metro.get("id", "mrt6"), end["id"]),
            "geometry": [_point([start["lat"], start["lng"]]), _point([end["lat"], end["lng"]])],
            "source_path": loaded.json_path,
            "source_version": source_version,
            "data_quality": "approximate",
            "csv_comparison": None,
        })
    routes.append({
        "source_key": metro_key,
        "source_id": str(metro.get("id", "mrt6")),
        "name": str(metro.get("name", "MRT-6")),
        "mode": "rail",
        "original_status": "station-reference-only",
        "source_path": loaded.json_path,
        "source_version": source_version,
        "data_quality": "approximate",
        "stop_keys": metro_stop_keys,
        "segment_keys": metro_segment_keys,
    })

    for route in source_data.get("buses", []):
        route_id = str(route["id"])
        route_key = _source_key(source_version, "route", route_id)
        route_stop_keys: list[str] = []
        for stop in route.get("stops", []):
            stop_key = _source_key(source_version, "stop", route_id, stop["id"])
            normalized_stop = {
                "source_key": stop_key,
                "source_id": str(stop["id"]),
                "name": str(stop["name"]),
                "route_key": route_key,
                "latitude": float(stop["lat"]),
                "longitude": float(stop["lng"]),
                "source_path": loaded.json_path,
                "coordinate_order": "latitude, longitude",
                "crs_datum": "unknown",
                "data_quality": "approximate",
            }
            stops.append(normalized_stop)
            route_stop_keys.append(stop_key)

        route_segment_keys: list[str] = []
        csv_rows = loaded.bus_csv_rows.get(route_id, [])
        for ordinal, segment in enumerate(route.get("segments", []), start=1):
            segment_id = str(segment["id"])
            segment_key = _source_key(source_version, "segment", route_id, segment_id, ordinal)
            route_segment_keys.append(segment_key)
            row = csv_rows[ordinal - 1] if ordinal <= len(csv_rows) else None
            comparison_segment = dict(segment)
            comparison_segment["_route_id"] = route_id
            segments.append({
                "source_key": segment_key,
                "route_key": route_key,
                "ordinal": ordinal,
                "from_stop_key": _source_key(source_version, "stop", route_id, segment["from"]),
                "to_stop_key": _source_key(source_version, "stop", route_id, segment["to"]),
                "geometry": [_point(point) for point in segment.get("coordinates", [])],
                "source_path": loaded.json_path,
                "source_version": source_version,
                "data_quality": "approximate",
                "csv_comparison": _comparison(row, comparison_segment),
            })

        routes.append({
            "source_key": route_key,
            "source_id": route_id,
            "name": str(route.get("name", route_id)),
            "mode": "bus",
            "original_status": str(route.get("status", "unknown")),
            "source_path": loaded.json_path,
            "source_version": source_version,
            "data_quality": "approximate",
            "stop_keys": route_stop_keys,
            "segment_keys": route_segment_keys,
        })

    return {
        "manifest_version": 1,
        "source_version": source_version,
        "source_coordinate_order": str(source_data.get("coordinateOrder", "unknown")),
        "source_files": loaded.file_records,
        "routes": routes,
        "stops": stops,
        "segments": segments,
        "issues": loaded.issues.copy(),
        "summary": {},
    }
