"""Apply explicitly illustrative research estimates to their exact demo paths."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

def _research_snapshot() -> dict[str, Any] | None:
    project_root = Path(__file__).resolve().parents[3]
    path = project_root / "Map Data" / "research" / "fare_time_estimates.json"
    try:
        with path.open(encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Skipping fare/time demo overlay because its snapshot could not be read: %s", exc)
        return None
    if data.get("schema_version") != 1 or data.get("status") != "demo_overlay_for_exact_corridor":
        logger.warning("Skipping fare/time demo overlay because the snapshot schema or status is unsupported.")
        return None
    return data


def _key(value: str | None) -> str:
    return " ".join((value or "").casefold().split())


def _mode_key(mode: str) -> str:
    return "metro" if mode == "rail" else mode


def _matches_leg(step: dict[str, Any], leg: dict[str, Any]) -> bool:
    if _mode_key(step["mode"]) != leg["mode"]:
        return False
    if _key(step["from_stop"]["name"]) != _key(leg["from"]):
        return False
    if _key(step["to_stop"]["name"]) != _key(leg["to"]):
        return False
    if leg.get("route") and _key(step.get("route_name")) != _key(leg["route"]):
        return False
    expected_distance = leg.get("graph_distance_km")
    if expected_distance is not None and abs(step["distance_km"] - expected_distance) > 0.025:
        return False
    return True


def annotate_demo_estimates(
    options: list[dict[str, Any]], origin_name: str, destination_name: str
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Attach research-derived demo values only when corridor and every leg match."""
    snapshot = _research_snapshot()
    if snapshot is None:
        return options, []
    scope = snapshot["scope"]
    if (_key(origin_name), _key(destination_name)) != (
        _key(scope["origin"]), _key(scope["destination"])
    ):
        return options, []

    source_index = {source["id"]: source for source in snapshot["sources"]}
    used_source_ids: list[str] = []
    for option in options:
        option["demo_estimate"] = None
        for example in snapshot["paths"]:
            expected_legs = example["legs"]
            steps = option["steps"]
            if len(steps) != len(expected_legs) or not all(
                _matches_leg(step, leg) for step, leg in zip(steps, expected_legs)
            ):
                continue

            fare = 0
            duration_min = 0
            duration_max = 0
            statuses: set[str] = set()
            sources: list[str] = []
            for step, leg in zip(steps, expected_legs):
                source_ids = leg.get("source_ids", [])
                if not source_ids:
                    if leg["mode"] == "metro":
                        source_ids = ["dmtcl_runtime", "metrodhaka_fares"]
                    elif leg["mode"] == "bus":
                        source_ids = ["bdnews24_bus_fare", "iccesd_bus_speed", "jica_dhaka_speed"]
                    else:
                        source_ids = []
                fare += int(leg["fare_bdt"])
                duration_min += int(leg["duration_minutes"]["min"])
                duration_max += int(leg["duration_minutes"]["max"])
                statuses.add(leg["fare_status"])
                sources.extend(source_ids)
                step["demo_estimate"] = {
                    "fare_bdt": int(leg["fare_bdt"]),
                    "fare_status": leg["fare_status"],
                    "duration_min_minutes": int(leg["duration_minutes"]["min"]),
                    "duration_max_minutes": int(leg["duration_minutes"]["max"]),
                    "duration_status": leg["duration_status"],
                }

            unique_source_ids = list(dict.fromkeys(sources))
            used_source_ids.extend(unique_source_ids)
            has_conditional_bus_fare = "synthetic_conditional_diesel_minimum" in statuses
            option["demo_estimate"] = {
                "fare_bdt": fare,
                "fare_status": "conditional_bus_assumption" if has_conditional_bus_fare else "researched_reference",
                "duration_min_minutes": duration_min,
                "duration_max_minutes": duration_max,
                "duration_status": "mixed_derived_and_synthetic_estimate",
                "is_demo": True,
                "source_ids": unique_source_ids,
                "time_scope_note": "Moving time only; waiting, boarding, station access, and disruptions are excluded.",
            }
            break
        else:
            for step in option["steps"]:
                step["demo_estimate"] = None

    sources = [source_index[source_id] for source_id in dict.fromkeys(used_source_ids) if source_id in source_index]
    return options, sources
