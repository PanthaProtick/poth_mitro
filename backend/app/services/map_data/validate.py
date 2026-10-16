"""Validate normalized map records and summarize comparison warnings."""

from __future__ import annotations

from collections import Counter
from typing import Any


def _issue(issues: list[dict[str, Any]], severity: str, source_path: str,
           record_id: str | None, field: str | None, message: str) -> None:
    issues.append({
        "severity": severity,
        "source_path": source_path,
        "record_id": record_id,
        "field": field,
        "message": message,
    })


def _valid_point(point: dict[str, Any]) -> bool:
    try:
        latitude = float(point["latitude"])
        longitude = float(point["longitude"])
    except (KeyError, TypeError, ValueError):
        return False
    return -90 <= latitude <= 90 and -180 <= longitude <= 180


def validate_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    issues = manifest["issues"]
    source_path = "Map Data/json/transit-data.json"
    if manifest["source_version"] != "basic-1":
        _issue(issues, "error", source_path, None, "version", "Unsupported source dataset version.")
    if manifest.get("source_coordinate_order") != "latitude, longitude":
        _issue(issues, "error", source_path, None, "coordinateOrder", "Canonical JSON coordinate order must be latitude, longitude.")

    routes = manifest["routes"]
    stops = manifest["stops"]
    segments = manifest["segments"]
    route_keys = {route["source_key"] for route in routes}
    stops_by_key = {stop["source_key"]: stop for stop in stops}
    if len(route_keys) != len(routes):
        _issue(issues, "error", source_path, None, "routes", "Duplicate route source keys.")
    if len(stops_by_key) != len(stops):
        _issue(issues, "error", source_path, None, "stops", "Duplicate stop source keys.")
    segment_keys = [segment["source_key"] for segment in segments]
    if len(set(segment_keys)) != len(segment_keys):
        _issue(issues, "error", source_path, None, "segments", "Duplicate segment source keys.")

    for route in routes:
        if route["source_key"] not in route_keys:
            _issue(issues, "error", route["source_path"], route["source_id"], "source_key", "Route key is unresolved.")
        actual_stop_keys = {stop["source_key"] for stop in stops if stop["route_key"] == route["source_key"]}
        if any(key not in actual_stop_keys for key in route["stop_keys"]):
            _issue(issues, "error", route["source_path"], route["source_id"], "stop_keys", "Route references an unknown stop.")
        actual_segment_keys = [segment["source_key"] for segment in segments if segment["route_key"] == route["source_key"]]
        if route["segment_keys"] != actual_segment_keys:
            _issue(issues, "error", route["source_path"], route["source_id"], "segment_keys", "Route segment references are missing, out of order, or unresolved.")

    for stop in stops:
        if stop["route_key"] not in route_keys:
            _issue(issues, "error", stop["source_path"], stop["source_id"], "route_key", "Stop references an unknown route.")
        if not _valid_point(stop):
            _issue(issues, "error", stop["source_path"], stop["source_id"], "coordinates", "Stop coordinate is outside valid latitude/longitude bounds.")
        if stop["crs_datum"] != "unknown":
            _issue(issues, "error", stop["source_path"], stop["source_id"], "crs_datum", "Source CRS/datum is not documented and must remain unknown.")

    previous_by_route: dict[str, dict[str, Any]] = {}
    ordinals_by_route: dict[str, list[int]] = {}
    for segment in segments:
        if segment["route_key"] not in route_keys:
            _issue(issues, "error", segment["source_path"], segment["source_key"], "route_key", "Segment references an unknown route.")
        start = stops_by_key.get(segment["from_stop_key"])
        end = stops_by_key.get(segment["to_stop_key"])
        if start is None or end is None:
            _issue(issues, "error", segment["source_path"], segment["source_key"], "stop_refs", "Segment endpoint references an unknown stop.")
        geometry = segment["geometry"]
        if len(geometry) < 2:
            _issue(issues, "error", segment["source_path"], segment["source_key"], "geometry", "Segment needs at least two geometry points.")
        if any(not _valid_point(point) for point in geometry):
            _issue(issues, "error", segment["source_path"], segment["source_key"], "geometry", "Geometry point is outside valid latitude/longitude bounds.")
        if start and geometry:
            if any(abs(geometry[0][axis] - start[axis]) > 1e-6 for axis in ("latitude", "longitude")):
                _issue(issues, "error", segment["source_path"], segment["source_key"], "geometry_start", "First geometry point does not match the referenced from-stop.")
        if end and geometry:
            if any(abs(geometry[-1][axis] - end[axis]) > 1e-6 for axis in ("latitude", "longitude")):
                _issue(issues, "error", segment["source_path"], segment["source_key"], "geometry_end", "Last geometry point does not match the referenced to-stop.")
        previous = previous_by_route.get(segment["route_key"])
        if previous and (previous["ordinal"] + 1 == segment["ordinal"]):
            if previous["to_stop_key"] != segment["from_stop_key"]:
                _issue(issues, "error", segment["source_path"], segment["source_key"], "continuity", "Adjacent ordered segments do not share the same stop.")
        previous_by_route[segment["route_key"]] = segment
        ordinals_by_route.setdefault(segment["route_key"], []).append(segment["ordinal"])

    for route_key, ordinals in ordinals_by_route.items():
        if ordinals != list(range(1, len(ordinals) + 1)):
            _issue(issues, "error", source_path, route_key, "ordinal", "Segment ordinals must be contiguous and start at one.")

    for segment in segments:
        comparison = segment["csv_comparison"]
        if comparison and not comparison["matches_json_endpoints"]:
            _issue(
                issues, "warning", comparison["csv_path"], str(comparison["row_number"]),
                "geometry_endpoints", "Comparison CSV endpoint geometry differs from canonical JSON; JSON remains canonical.",
            )

    counts = Counter(issue["severity"] for issue in issues)
    manifest["summary"] = {
        "routes": len(routes),
        "stops": len(stops),
        "segments": len(segments),
        "source_files": len(manifest["source_files"]),
        "accepted_source_files": sum(1 for item in manifest["source_files"] if item["accepted_count"] > 0),
        "excluded_source_files": sum(1 for item in manifest["source_files"] if item["accepted_count"] == 0),
        "errors": counts.get("error", 0),
        "warnings": counts.get("warning", 0),
    }
    for source in manifest["source_files"]:
        source["issues"] = [issue.copy() for issue in issues if issue["source_path"] == source["path"]]
    return manifest
