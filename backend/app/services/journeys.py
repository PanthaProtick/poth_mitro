"""Graph-backed journey search over the imported approximate SQLite catalog."""

from __future__ import annotations

import hashlib
import heapq
import json
import math
import re
from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import IncidentReport, MapDataImport, RouteSegment, TransitRoute, TransitStop
from app.services.journey_estimates import annotate_demo_estimates

TRANSFER_RADIUS_M = 250
MAX_SEARCH_STATES = 30_000
MAX_PATHS_PER_RANKING = 20
ASSUMPTIONS = [
    "All transit segments are traversable in both directions because the source does not provide service direction.",
    "MRT-6 edges join adjacent stations in the source list with straight-line geometry; the source has no rail polylines.",
    "Transfers are inferred between stops on different routes within 250 m; actual pedestrian paths are not available.",
    "Distances use approximate source geometry. The imported catalog has no general fare table or timetable; path-specific demo estimates are attached only when the researched sample matches exactly.",
    "A separate demo estimate is attached only to exact Mirpur 10 → Shahbagh paths matching the reviewed research snapshot; bus fares are conditional and time estimates exclude waiting/access.",
    "Reports are linked to whole routes; their route association does not prove a precise location or blockage on this path.",
]


def _haversine_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1 = map(math.radians, a)
    lon2, lat2 = map(math.radians, b)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    value = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 6_371_000 * 2 * math.asin(math.sqrt(value))


def _geometry_length_m(points: list[tuple[float, float]]) -> float:
    return sum(_haversine_m(left, right) for left, right in zip(points, points[1:]))


def _place_key(name: str, cluster_number: int) -> str:
    normalized = " ".join(name.casefold().split())
    digest = hashlib.sha1(f"{normalized}:{cluster_number}".encode("utf-8")).hexdigest()[:8]
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")[:48] or "place"
    return f"{slug}-{digest}"


def _catalog(session: Session):
    routes = list(session.scalars(select(TransitRoute).order_by(TransitRoute.id)))
    stops = list(session.scalars(select(TransitStop).order_by(TransitStop.route_id, TransitStop.id)))
    segments = list(session.scalars(select(RouteSegment).order_by(RouteSegment.route_id, RouteSegment.ordinal, RouteSegment.id)))
    latest_import = session.scalar(select(MapDataImport).order_by(MapDataImport.id.desc()).limit(1))
    routes_by_id = {route.id: route for route in routes}
    stops_by_id = {stop.id: stop for stop in stops}

    by_name: dict[str, list[TransitStop]] = defaultdict(list)
    for stop in stops:
        by_name[" ".join(stop.name.casefold().split())].append(stop)

    places = []
    stop_place: dict[int, dict] = {}
    for normalized, same_name in sorted(by_name.items()):
        clusters: list[list[TransitStop]] = []
        for stop in same_name:
            coordinates = (stop.longitude, stop.latitude)
            cluster = next((item for item in clusters if _haversine_m(
                coordinates,
                (sum(row.longitude for row in item) / len(item), sum(row.latitude for row in item) / len(item)),
            ) <= TRANSFER_RADIUS_M), None)
            if cluster is None:
                clusters.append([stop])
            else:
                cluster.append(stop)
        for cluster_number, cluster in enumerate(clusters, start=1):
            coordinates = (
                sum(row.longitude for row in cluster) / len(cluster),
                sum(row.latitude for row in cluster) / len(cluster),
            )
            place = {
                "id": _place_key(cluster[0].name, cluster_number),
                "name": cluster[0].name,
                "coordinates": coordinates,
                "stop_ids": sorted(row.id for row in cluster),
                "route_names": sorted({routes_by_id[row.route_id].name for row in cluster if row.route_id in routes_by_id}),
            }
            places.append(place)
            for stop in cluster:
                stop_place[stop.id] = place

    route_segments: dict[int, list[dict]] = defaultdict(list)
    route_lines = []
    for segment in segments:
        geometry = json.loads(segment.geometry_json)
        coordinates = [(float(point["longitude"]), float(point["latitude"])) for point in geometry]
        if len(coordinates) < 2:
            continue
        route_segments[segment.route_id].append({
            "id": segment.id,
            "from_stop_id": segment.from_stop_id,
            "to_stop_id": segment.to_stop_id,
            "coordinates": coordinates,
            "distance_m": _geometry_length_m(coordinates),
            "data_quality": segment.data_quality,
        })
        route_lines.append({"route_id": segment.route_id, "coordinates": coordinates})

    network_routes = [
        {
            "id": route.id,
            "name": route.name,
            "mode": route.mode,
            "original_status": route.original_status,
            "data_quality": route.data_quality,
            "segments": route_segments.get(route.id, []),
        }
        for route in routes
    ]
    network_places = [
        {"id": place["id"], "name": place["name"], "coordinates": place["coordinates"], "stop_ids": place["stop_ids"], "route_names": place["route_names"]}
        for place in sorted(places, key=lambda item: (item["name"].casefold(), item["id"]))
    ]
    return routes_by_id, stops_by_id, segments, places, stop_place, network_places, network_routes, route_lines, latest_import


def get_network(session: Session) -> dict:
    _routes, _stops, _segments, _places, _stop_place, places, routes, _lines, latest_import = _catalog(session)
    return {
        "source_version": latest_import.source_version if latest_import else None,
        "data_quality": "approximate",
        "places": places,
        "routes": routes,
        "transfer_radius_m": TRANSFER_RADIUS_M,
        "assumptions": ASSUMPTIONS,
    }


def report_age(report: IncidentReport, as_of: datetime) -> tuple[int | None, str]:
    if not report.observed_at:
        return None, "unknown"
    try:
        observed = datetime.fromisoformat(report.observed_at.replace("Z", "+00:00"))
    except ValueError:
        return None, "unknown"
    if observed.tzinfo is None:
        return None, "unknown"
    age = int((as_of - observed.astimezone(timezone.utc)).total_seconds() / 60)
    if age < 0:
        return age, "unknown"
    return age, "current" if age <= 30 else "aging" if age <= 120 else "stale"


def _edges(stops: list[TransitStop], segments: list[RouteSegment], routes_by_id: dict[int, TransitRoute], blocked: set[int]):
    adjacency: dict[int, list[dict]] = defaultdict(list)
    stop_by_id = {stop.id: stop for stop in stops}
    for segment in segments:
        if segment.route_id in blocked:
            continue
        start, end = stop_by_id.get(segment.from_stop_id), stop_by_id.get(segment.to_stop_id)
        route = routes_by_id.get(segment.route_id)
        if not start or not end or not route:
            continue
        raw = json.loads(segment.geometry_json)
        points = [(float(point["longitude"]), float(point["latitude"])) for point in raw]
        if len(points) < 2:
            continue
        common = {
            "kind": "transit", "route_id": route.id, "route_name": route.name,
            "mode": route.mode, "distance_m": _geometry_length_m(points),
            "data_quality": segment.data_quality,
        }
        adjacency[start.id].append({**common, "from": start.id, "to": end.id, "coordinates": points})
        adjacency[end.id].append({**common, "from": end.id, "to": start.id, "coordinates": list(reversed(points))})

    available = [stop for stop in stops if stop.route_id not in blocked]
    for index, left in enumerate(available):
        for right in available[index + 1:]:
            if left.route_id == right.route_id:
                continue
            a, b = (left.longitude, left.latitude), (right.longitude, right.latitude)
            distance = _haversine_m(a, b)
            if distance <= TRANSFER_RADIUS_M:
                common = {
                    "kind": "walk", "route_id": None, "route_name": None,
                    "mode": "walk", "distance_m": distance, "data_quality": "approximate",
                }
                adjacency[left.id].append({**common, "from": left.id, "to": right.id, "coordinates": [a, b]})
                adjacency[right.id].append({**common, "from": right.id, "to": left.id, "coordinates": [b, a]})
    for items in adjacency.values():
        items.sort(key=lambda edge: (edge["to"], edge["route_id"] or 0, edge["kind"]))
    return adjacency, stop_by_id


def _find_paths(
    adjacency, starts: set[int], destinations: set[int], *, prioritize_transfers: bool,
    max_paths: int, max_transfers: int | None = None, excluded_nodes: set[int] | None = None,
):
    excluded_nodes = excluded_nodes or set()
    heap = []
    sequence = 0
    for node in sorted(starts):
        heapq.heappush(heap, ((0, 0.0) if prioritize_transfers else (0.0,), sequence, node, frozenset({node}), tuple(), 0.0))
        sequence += 1
    found = []
    expansions = 0
    while heap and len(found) < max_paths and expansions < MAX_SEARCH_STATES:
        score, _sequence, node, visited, path, distance_m = heapq.heappop(heap)
        expansions += 1
        if node in destinations and path:
            found.append({"edges": path, "distance_m": distance_m, "score": score})
            continue
        if len(path) >= 90:
            continue
        for edge in adjacency.get(node, []):
            if edge["to"] in visited:
                continue
            if edge["to"] in excluded_nodes:
                continue
            if edge["kind"] == "walk" and max_transfers is not None:
                if sum(item["kind"] == "walk" for item in path) >= max_transfers:
                    continue
            edge_km = edge["distance_m"] / 1000
            edge_score = (
                (score[0] + (1 if edge["kind"] == "walk" else 0), score[1] + edge_km)
                if prioritize_transfers else (score[0] + edge_km,)
            )
            heapq.heappush(heap, (
                score + edge_score, sequence, edge["to"], visited | {edge["to"]},
                path + (edge,), distance_m + edge["distance_m"],
            ))
            sequence += 1
    return found


def _stop_view(stop: TransitStop) -> dict:
    return {"id": str(stop.id), "name": stop.name, "coordinates": (stop.longitude, stop.latitude)}


def _journey_steps(path: dict, stop_by_id: dict[int, TransitStop]) -> list[dict]:
    result: list[dict] = []
    for edge in path["edges"]:
        step = {
            "kind": edge["kind"], "mode": edge["mode"], "route_id": edge["route_id"],
            "route_name": edge["route_name"], "from_stop": _stop_view(stop_by_id[edge["from"]]),
            "to_stop": _stop_view(stop_by_id[edge["to"]]), "distance_km": edge["distance_m"] / 1000,
            "coordinates": edge["coordinates"], "data_quality": edge["data_quality"],
        }
        previous = result[-1] if result else None
        if (edge["kind"] == "transit" and previous and previous["kind"] == "transit"
                and previous["route_id"] == edge["route_id"] and previous["to_stop"]["id"] == str(edge["from"])):
            previous["to_stop"] = step["to_stop"]
            previous["distance_km"] += step["distance_km"]
            previous["coordinates"].extend(step["coordinates"][1:])
        else:
            result.append(step)
    return result


def search_journeys(
    session: Session, origin_id: str, destination_id: str, avoid_reported_routes: bool,
    *, avoid_place_ids: set[str] | None = None, avoid_modes: set[str] | None = None,
    max_transfers: int | None = None, preferred_modes: set[str] | None = None,
) -> dict | None:
    routes_by_id, stops_by_id, segments, _places, stop_place, network_places, _network_routes, _lines, latest_import = _catalog(session)
    place_by_id = {place["id"]: place for place in network_places}
    origin, destination = place_by_id.get(origin_id), place_by_id.get(destination_id)
    if origin is None or destination is None:
        return None
    if origin_id == destination_id:
        raise ValueError("Origin and destination must be different places.")

    as_of = datetime.now(timezone.utc)
    reports = list(session.scalars(select(IncidentReport).where(IncidentReport.route_id.is_not(None))))
    alerts_by_route: dict[int, list[dict]] = defaultdict(list)
    blocked: set[int] = set()
    for report in reports:
        route_id = report.route_id
        if route_id not in routes_by_id:
            continue
        age, freshness = report_age(report, as_of)
        alerts_by_route[route_id].append({
            "id": report.id, "title": report.title, "location": report.location, "route_id": route_id,
            "mode": report.mode, "observed_at": report.observed_at, "age_minutes": age,
            "freshness": freshness, "status": report.status,
            "source_type": report.report_source or report.source_type, "is_synthetic": report.is_synthetic,
        })
        if (not report.is_synthetic and report.status in {"reported", "confirmed"}
                and freshness in {"current", "aging"}):
            blocked.add(route_id)

    excluded = sorted(blocked) if avoid_reported_routes else []
    adjacency, stop_by_id = _edges(list(stops_by_id.values()), segments, routes_by_id, set(excluded))
    avoid_place_ids = avoid_place_ids or set()
    avoid_modes = avoid_modes or set()
    preferred_modes = preferred_modes or set()
    starts = {stop_id for stop_id, place in stop_place.items() if place["id"] == origin_id and stop_id in adjacency}
    destinations = {stop_id for stop_id, place in stop_place.items() if place["id"] == destination_id and stop_id in adjacency}
    excluded_nodes = {stop_id for stop_id, place in stop_place.items() if place["id"] in avoid_place_ids}
    if origin_id in avoid_place_ids or destination_id in avoid_place_ids:
        raise ValueError("An avoided place cannot also be the origin or destination.")
    if avoid_modes:
        for node in list(adjacency):
            adjacency[node] = [edge for edge in adjacency[node] if edge["mode"] not in avoid_modes]
    if preferred_modes:
        # A preference is a soft filter: try preferred transit modes plus walking,
        # then fall back to the complete network if that subgraph has no path.
        all_adjacency = adjacency
        preferred_adjacency = {
            node: [edge for edge in edges if edge["mode"] == "walk" or edge["mode"] in preferred_modes]
            for node, edges in adjacency.items()
        }
        adjacency = preferred_adjacency
    fewest, shortest = [], []
    if not starts or not destinations:
        found = []
    else:
        fewest = _find_paths(adjacency, starts, destinations, prioritize_transfers=True, max_paths=MAX_PATHS_PER_RANKING, max_transfers=max_transfers, excluded_nodes=excluded_nodes)
        shortest = _find_paths(adjacency, starts, destinations, prioritize_transfers=False, max_paths=MAX_PATHS_PER_RANKING, max_transfers=max_transfers, excluded_nodes=excluded_nodes)
        if preferred_modes and not fewest and not shortest:
            adjacency = all_adjacency
            fewest = _find_paths(adjacency, starts, destinations, prioritize_transfers=True, max_paths=MAX_PATHS_PER_RANKING, max_transfers=max_transfers, excluded_nodes=excluded_nodes)
            shortest = _find_paths(adjacency, starts, destinations, prioritize_transfers=False, max_paths=MAX_PATHS_PER_RANKING, max_transfers=max_transfers, excluded_nodes=excluded_nodes)

    def signature(path):
        return tuple((edge["kind"], edge["route_id"], edge["from"], edge["to"]) for edge in path["edges"])

    ranked_paths: list[tuple[dict, str]] = []
    if fewest and shortest:
        fewest_path, shortest_path = fewest[0], shortest[0]
        same_best_path = signature(fewest_path) == signature(shortest_path)
        if same_best_path:
            ranked_paths.append((shortest_path, "Shortest distance · fewest transfers"))
            used = {signature(shortest_path)}
        else:
            ranked_paths.extend([
                (fewest_path, "Fewest inferred transfers"),
                (shortest_path, "Shortest approximate distance"),
            ])
            used = {signature(fewest_path), signature(shortest_path)}
        next_shortest = next((path for path in shortest if signature(path) not in used), None)
        if next_shortest:
            ranked_paths.append((next_shortest, "Next-shortest approximate distance" if same_best_path else "Alternative network path"))
            used.add(signature(next_shortest))
        if same_best_path:
            alternative = next((path for path in shortest if signature(path) not in used), None)
            if alternative:
                ranked_paths.append((alternative, "Alternative network path"))
    elif fewest:
        ranked_paths.append((fewest[0], "Fewest inferred transfers"))
    elif shortest:
        ranked_paths.append((shortest[0], "Shortest approximate distance"))

    options = []
    for index, (path, ranking) in enumerate(ranked_paths):
        steps = _journey_steps(path, stop_by_id)
        route_ids = list(dict.fromkeys(step["route_id"] for step in steps if step["route_id"] is not None))
        alerts = [alert for route_id in route_ids for alert in alerts_by_route.get(route_id, [])]
        alerts.sort(key=lambda alert: (alert["age_minutes"] is None, alert["age_minutes"] or 0, alert["id"]))
        options.append({
            "id": f"path-{index + 1}", "ranking": ranking,
            "distance_km": path["distance_m"] / 1000,
            "transfer_count": sum(step["kind"] == "walk" for step in steps),
            "fare_bdt": None, "duration_minutes": None, "demo_estimate": None,
            "route_ids": route_ids, "steps": steps, "alerts": alerts,
        })

    for option in options:
        fingerprint_material = {
            "catalog_version": latest_import.manifest_sha256 if latest_import else None,
            "origin_id": origin_id,
            "destination_id": destination_id,
            "edges": [
                [edge["kind"], edge["route_id"], edge["from_stop"]["id"], edge["to_stop"]["id"]]
                for edge in option["steps"]
            ],
        }
        option["path_fingerprint"] = hashlib.sha256(
            json.dumps(fingerprint_material, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()

    options, estimate_sources = annotate_demo_estimates(options, origin["name"], destination["name"])

    return {
        "source_version": latest_import.source_version if latest_import else None,
        "catalog_version": latest_import.manifest_sha256 if latest_import else None,
        "data_quality": "approximate",
        "origin": origin,
        "destination": destination,
        "options": options,
        "demo_estimate_sources": estimate_sources,
        "excluded_route_ids": excluded,
        "applied_constraints": {
            "avoid_place_ids": sorted(avoid_place_ids), "avoid_modes": sorted(avoid_modes),
            "max_transfers": max_transfers, "preferred_modes": sorted(preferred_modes),
            "preference_fallback": bool(preferred_modes and 'all_adjacency' in locals() and adjacency is all_adjacency),
        },
        "assumptions": ASSUMPTIONS,
    }
