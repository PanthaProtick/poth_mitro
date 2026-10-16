# Backend implementation plan

- Local implementation uses persistent SQLite and Alembic; Clerk, Neon, and Render are deferred.
- The service binds to loopback and is intended for one local operator without authentication.
- Module B validates approximate map sources; Module C persists them with provenance.
- The demo trip/report are explicitly synthetic; repeat seeding preserves user edits.
- Modules A–H are complete for the local-first backend slice. Module H ran contract, disposable SQLite, and live-loopback API verification; hosted deployment and visual UI acceptance remain outside this backend handoff.

## Module B — map-data normalization and validation (complete, 2026-10-16)

**Quick summary:** Module B added a read-only CLI that builds and validates a deterministic normalized map manifest. It keeps JSON canonical, uses the two bus CSVs only as comparison evidence, and inventories Metro/Road CSVs as excluded. Module C later added the separate explicit SQLite import command.

Implemented under `backend/app/services/map_data/` and `backend/app/scripts/map_data.py`. Run from `backend/` with `python -m app.scripts.map_data validate`; add `--summary-only` for compact output or `--output PATH` to save the full manifest. The command exits nonzero when validation finds errors.

**Verification:** `python -m app.scripts.map_data validate --summary-only` completed on the checked-in data with 0 errors and 21 warnings: 13 Bikolpo CSV and 7 Uttara CSV endpoint mismatches, plus one unresolved combined label. The summary contains 3 routes, 54 stops, 36 segments, and 5 inventoried source files (3 accepted, 2 excluded). JSON remains canonical; these warnings do not claim the CSV geometry is accurate. `uv` could not run because the configured Python 3.12 runtime/cache was unavailable, so the standard-library CLI was run directly with the available Python 3.14. No database file was created or modified.

- Build and run the DhakaPath MVP locally first as a FastAPI service backed by local SQLite.
- Defer Clerk, Neon, and Render; they are not prerequisites or targets for this implementation phase.
- Use local SQLite migrations and explicit database transactions for report writes and history; retain idempotency where supported by the local workflow.
- Use the existing `Map Data/` files as the MVP's approximate route/station reference input; normalize and validate them before persistence.
- Implement only the backend routes needed for the bounded Trip Brief workflow; keep relevance and freshness rules deterministic.
- Treat old Clerk, Neon, and Render instructions in linked planning documents as superseded for this phase. Reconcile those docs before any hosted deployment phase.

## 1. Goal, boundaries, and source of truth

**Quick summary:** This plan implements a local single-operator workflow with persistent trips/reports and a bounded graph search over the checked-in approximate route/station catalog. Clerk, shared multi-user access, Neon, Render, citywide validated routing, fare calculation, chat, and AI inference remain deferred. The graph search is a local prototype and preserves the source's uncertainty.

Use these documents as the coordinated product and contract sources:

- [`../docs/mvp.md`](../docs/mvp.md) defines the product slice and acceptance baseline.
- [`../docs/api_contracts.md`](../docs/api_contracts.md) defines API paths, payloads, response envelopes, authorization semantics, and database write guarantees.
- [`../docs/architecture.md`](../docs/architecture.md) defines the service/data flow, Neon branch policy, and provider boundaries.
- [`../docs/deployment_setup.md`](../docs/deployment_setup.md) defines runtime configuration and Render deployment constraints.
- [`../tasks/implementation_plan.md`](../tasks/implementation_plan.md) defines current repository observations, ownership, schedule gates, and shared acceptance checks.

## Pre-Module A — implementation decisions and artifacts

**Quick summary:** The user changed the implementation direction on 2026-10-16: deliver a locally runnable, persistent first version without Clerk or Neon. SQLite is selected for this local phase; hosted authentication, database, and deployment choices are deferred. This explicitly supersedes the prior provider-gated plan.

### Locked decisions

| Topic | Decision before Module A | Reason / boundary |
|---|---|---|
| Runtime target | Local FastAPI + React development workflow; no Render deployment in this phase. | Make the first working product runnable on the project machine without provider accounts. |
| Persistence | Local SQLite file at `backend/data/dhakapath.db`, overridable through `DATABASE_PATH`; ignore `backend/data/` in Git. | User canceled Neon and asked to implement locally first. The default stays inside the backend working directory and outside source data; tests/import validation use a separate disposable file. |
| Authentication | No Clerk integration in this phase; local single-operator access only. | Clerk was explicitly canceled. Do not claim multi-user identity, roles, or shared workspace isolation. |
| Network binding | Bind the local API to `127.0.0.1` by default; do not bind to `0.0.0.0`. | There is no authentication in this phase, so keep service exposure on the local machine. |
| API and health paths | Keep product API under `/api/v1`; use `/health/live` and `/health/ready` outside that prefix. | Stable contract for local frontend proxy; readiness uses a bounded SQLite probe. |
| Local environment | `DATABASE_PATH` optional with documented default; `CORS_ORIGINS` limited to local Vite origins; no Clerk, Neon, or Gemini keys required. | Explicit local setup without credentials or silent in-memory fallback. |
| Future hosted path | Undecided; revisit provider/database/auth choices only in a separate deployment phase. | Do not preserve hidden Neon/Clerk assumptions in business logic. |
| Product data source | Import the checked-in JSON's 16 MRT-6 station points and two bus route geometries for reference and prepared demo trip grounding. | This is the best-structured existing data in `Map Data/`; it is explicitly approximate and not live or fare-verified. |
| Bus CSVs | Use the Bikolpo/Uttara CSVs only as comparison evidence; never use them to replace canonical JSON geometry or label imported records as verified. | Counts match (17/17 and 19/19), but endpoint geometry differs on 13/17 Bikolpo and 7/19 Uttara rows at a `1e-6` degree comparison tolerance. One Uttara row has a single combined text label. Preserve these discrepancies as warnings; they do not block JSON-only import. |
| Metro CSV | Exclude its geometry from the imported connected network for this MVP. Keep the 16 JSON station points as point references only. | The CSV has 14 rows while JSON has 16 stations and no metro segments. No mapping can be assumed. This is a deliberate scope decision, not an unanswered importer choice. |
| Road CSV | Do not parse or import `Roadmap-Dhaka.csv` in this MVP. | Its 49,869 variable-width rows have no colocated schema/provenance description; parsing or using it for routing would require guesses. |
| Coordinate handling | Normalize to named numeric `latitude` and `longitude`; convert CSV longitude/latitude explicitly. Keep source CRS/datum `unknown` unless source metadata later verifies it. | Numeric Dhaka-like ranges are only a sanity check, not proof of a CRS or positional accuracy. |
| Catalog storage | Use reference `TransitRoute`, `TransitStop`, and `RouteSegment` records, separate from locally stored prepared `Trip` and `TripSegment` demo records. Store ordered geometry in a portable JSON text column with named coordinate fields. | SQLite has no PostgreSQL JSONB type; keep values portable for possible later migration. |
| Trip traceability | `TripSegment.route_segment_id` is nullable; when present it references a known imported segment. Unsupported connections remain null/unknown and must not be invented by proximity. | The current editor needs the linked route ID to make new reports discoverable through trip context; expose only that ID, with no geometry. |
| Provenance | Store source file, source dataset/version, source key, checksum, import time, original route status, and `data_quality=approximate` for these map references. `is_synthetic` remains reserved for illustrative demo trips/reports, not a substitute for map source provenance. | Distinguishes assignment-reference map data from synthetic examples and from independently verified/live information. |
| Identity entity | Omit `LocalUser` and Clerk identity tables from this phase. | No account or shared-role requirement is implemented in the local single-operator version. |
| Health paths | Keep `/health/live`; make `/health/ready` report local database readiness. | Preserve simple health semantics while removing the Neon probe and Render-specific target. |
| API scope | Keep current trip response shape and route set. Do not expose map geometry or add a route-search endpoint in this MVP. | Map import supports grounded demo data; it does not imply the organizer's full routing feature is implemented. |

### Normalized import manifest contract

**Quick summary:** The importer validates source files into a deterministic manifest before any database write. Validation is pure/read-only; importing is a separate explicit command that runs only after local migrations are available and the selected local database path is confirmed.

The validation output must contain:

- `manifest_version` and the source JSON `version` (`basic-1`).
- For every input file: relative path, SHA-256 checksum, bytes, source format, declared or inferred coordinate order, CRS/datum status, parsed record count (or null when excluded/unparsed), accepted count, and issue list.
- `routes[]`: stable `source_key`, source ID/name, mode, original `status`, source path, data-quality label, ordered stop keys, and ordered route-segment keys.
- `stops[]`: stable source key, original ID/name, route/source aliases, normalized latitude/longitude, source path, and source coordinate-order annotation.
- `segments[]`: stable source key, route key, one-based ordinal, from/to stop keys, ordered `geometry[]` points with named latitude/longitude, and source CSV row/comparison result when available. CSV comparisons are diagnostic only and cannot overwrite JSON.
- `issues[]`: severity (`error` or `warning`), source path, row/record identifier, field, and plain-language reason. Errors block import; warnings preserve data but prevent unsupported confidence claims.
- Excluded files carry `accepted_count=0` and a clear exclusion reason; they must not be treated as malformed import attempts. Hashing/inventory does not mean their record contents are parsed.

Stable source keys use the dataset/source identifier plus route, stop, or segment identity and ordinal. The importer must not deduplicate different named stops merely because their coordinates are close. It may normalize whitespace for alias comparison while retaining the original label.

### Planned backend file boundaries

**Quick summary:** Keep parsing/validation independent from FastAPI routes and database sessions so source-file issues can be diagnosed without a database connection.

| Path | Responsibility |
|---|---|
| `backend/app/services/map_data/types.py` | Internal typed records for manifest, route, stop, segment, point, and validation issue. |
| `backend/app/services/map_data/loader.py` | Parse canonical JSON and the two bus CSVs as comparison evidence; inventory excluded metro/road files with explicit reasons; never mutate source files. The road CSV is not parsed as records. |
| `backend/app/services/map_data/normalize.py` | Convert source coordinate order, labels, IDs, and route geometry into normalized records. |
| `backend/app/services/map_data/validate.py` | Validate schema, row shape, coordinate bounds, refs, continuity, geometry endpoints, CSV/JSON comparisons, and manifest consistency. |
| `backend/app/scripts/map_data.py` | CLI entry point for read-only `validate`, explicit migrated-DB `import`, and idempotent `seed-demo` commands. |
| `backend/app/db/models/entities.py` | SQLAlchemy transit reference, import provenance, trip, report, and report-event models. |

### Decisions and artifacts ready for local implementation

| Preflight input | Status for local implementation | Evidence / next action |
|---|---|---|
| Map source inventory and import policy | Complete | `Map Data/` was inspected; canonical JSON, CSV comparison-only handling, coordinate normalization, and metro/road exclusions are recorded below. |
| Database entity and traceability boundary | Complete as a design decision | Use the reference catalog plus locally stored prepared trips; finalize table details with migrations in Module C. |
| Health endpoint contract | Revised for local persistence | `/health/live` is process-only; `/health/ready` probes SQLite. Reconcile other docs before implementation. |
| Clerk identity and roles | Deferred by user | No auth in the local single-operator phase; do not represent it as multi-user or production-secure. |
| Neon isolation and connectivity | Canceled for this phase | Use local SQLite; do not require provider configuration. |
| Render readiness | Deferred | Do not deploy or claim hosting readiness in the local phase. |

**Pre-Module-A completion:** The current direction, persistence technology/path, auth boundary, local network exposure, API prefix, health semantics, and provider deferrals are explicit. Former hosted docs and team cards are marked superseded, and `backend/data/` is gitignored. Module A will turn the local API shapes, setup commands, and ownership notes into a final executable contract; it needs no provider access. This work stops before Module A begins.

- `map-data-policy.md` is not needed as a separate artifact; the table and manifest contract in this plan are the source for the importer.
- Contract/design synchronization completed: `docs/api_contracts.md` specifies `/health/live` and `/health/ready`; `docs/architecture.md` records the reference transit catalog and nullable internal `TripSegment.route_segment_id`. A later frontend integration addendum exposes nullable `route_id` to support contextual report writes; it exposes no geometry.
- No map geometry fields are added to `TripSegmentView`; this change does not imply a route planner.
- The prior provider-gated Module A assessment below is superseded by the local-first decision. No Clerk, Neon, or Render verification is required to begin this plan.

**Current code facts recorded in the project plan:** the starter has FastAPI and SQLAlchemy/asyncpg wiring, an in-memory demo item route, and a DB-optional standby path. DhakaPath routes, production Clerk verification, Alembic migrations, and real shared report writes are not yet implemented. Recheck source before making delivery claims.

**Out of scope:** Clerk auth, shared multi-user access, Neon, Render, model calls, generated route advice, full transit routing, fare rules, chat history, admin route editing, hard deletion, and offline write queues. The local single-operator mode is an explicit product scope, not an anonymous fallback. Synthetic trip/report records must be clearly labelled demo seed data.

### Map data inspected for this plan

**Quick summary:** `Map Data/` contains useful route references, but the files use different coordinate orders and CSV layouts. Treat them as import inputs with explicit provenance, not as a ready-to-load database or verified live network.

| File | Observed structure | Plan treatment |
|---|---|---|
| `Map Data/json/transit-data.json` | Version `basic-1`; declares `coordinateOrder: latitude, longitude`; has 16 MRT-6 station points and two bus routes (`bikolpo`, `uttara_bus`) with 18/20 stops and 17/19 geometry segments. Within this JSON, both bus routes' segment references, ordering, continuity, and geometry endpoints were structurally consistent. | Canonical input for the available normalized station, stop, and bus-route reference records. Preserve the file version and per-route status/source. |
| `Map Data/csv/Routemap-BikolpoBus.csv` | 17 headerless rows; variable-length longitude/latitude coordinate pairs followed by endpoint labels. Same row count as the 17 Bikolpo JSON segments; 13 rows have start/end coordinate differences greater than `1e-6` degrees. | Comparison evidence only. Report mismatches, retain raw labels/checksum, and never substitute this geometry for JSON. |
| `Map Data/csv/Routemap-UttaraBus.csv` | 19 headerless rows; variable-length longitude/latitude pairs followed by text labels. Same row count as the 19 Uttara JSON segments; 7 rows have endpoint differences greater than `1e-6` degrees; one row has a single combined label rather than two endpoint labels. | Comparison evidence only. Parse the numeric prefix into pairs; preserve any trailing labels verbatim; report mismatches and never substitute this geometry for JSON. |
| `Map Data/csv/Routemap-DhakaMetroRail.csv` | 14 headerless geometry rows with variable-length longitude/latitude pairs and endpoint labels. The JSON has 16 metro station points but no corresponding metro route segments. | Exclude its geometry from this MVP's connected route catalog. Inventory its checksum and exclusion reason only; reopen if source documentation or a human-reviewed station mapping is provided. |
| `Map Data/csv/Roadmap-Dhaka.csv` | 49,869 headerless rows with variable-width geometry/path fields and trailing values; no schema or provenance metadata was found alongside this file. | Exclude from parsing/import/routing in this MVP. Inventory file size/checksum and exclusion reason only; no row interpretation until schema, coordinate order, units, source, and intended use are documented. |

The JSON explicitly describes its references as approximate, not live service or verified fares, and labels the bus data `assignment-reference`. The route CSV samples and road CSV use longitude/latitude ordering while the JSON uses latitude/longitude. An endpoint comparison of the bus CSVs against corresponding JSON segments found the mismatches listed above. Observed coordinates fall in plausible Dhaka ranges, but this check establishes only numeric plausibility—not positional accuracy, current service, or field verification.

**Decision for implementation:** Use the JSON bus geometry and station points to create clearly labelled reference records and to ground prepared demo trip segments. Metro geometry from the 14-row CSV is excluded and not cross-checked into a connected network; the 16 JSON stations remain point references. The road CSV is excluded from parsing and import. Do not derive live/fare claims or expose a route-finding API from these files in this MVP. The map UI and exposing geometry through the trip-context API remain out of scope unless the API contract and frontend plan are updated first.

## 2. Module overview and dependencies

**Quick summary:** Work in dependency order: freeze the local contract, normalize map inputs, establish SQLite persistence, implement domain reads and writes, then verify the local workflow. Authentication, shared access, and deployment are deferred phases.

| Module | Purpose | Main dependency | Completion evidence |
|---|---|---|---|
| A. Local contract and setup | Freeze local-only scope, contracts, database path, and commands | None | Local configuration documented; no provider gates |
| B. Map-source normalization | Parse/validate available station and bus data; retain source lineage; exclude ambiguous road data | A | Deterministic import report and valid normalized records |
| C. Local runtime and SQLite foundation | Required local config, SQLAlchemy session, migrations, schema, map/trip seed | A, B | Migration/import/seed and restart persistence locally |
| D. Local access boundary | Document and enforce local single-operator boundary; no identity/role claims | A, C | Local-only exposure documented; no cross-user security claims |
| E. Domain services and read APIs | Load map-grounded prepared trips/reports and compute deterministic relevance/freshness | B–D | Contract-shaped responses backed by SQLite |
| F. Report mutation APIs | Create/update reports with event history, version checks, and idempotency | C, D | Write then fresh API read; persistence survives restart |
| G. Local health and startup | Same local app startup, documented config and data path | C, D, F | Local readiness and API smoke evidence |
| H. Local backend acceptance and handoff | Run map, persistence, and end-to-end checks | B–G | Recorded actual results, blockers, and commands |

Modules can overlap only where ownership and interfaces are already agreed. Map normalization should produce a reviewed manifest before the database owner finalizes schema and seed behavior. Migration/model changes belong to the database owner; API and product-rule code belongs to the API owner. Coordinate shared files such as `backend/app/main.py` before editing.

## 3. Module A — local contract and setup

**Quick summary:** Module A freezes the local-first implementation contract and setup. Clerk/Neon are canceled for this phase; Render is deferred. This module changes planning documents only and does not implement endpoints, migrations, or runtime behavior.

### Work

1. Freeze local-only product scope: a single local operator, no sign-in, no shared workspace or multi-user isolation claim.
2. Set `DATABASE_PATH` default and ignored data directory; never put the runtime file under checked-in source inputs.
3. Select SQLite with SQLAlchemy and Alembic migrations; use portable schema types and explicit transactions.
4. Freeze exact product and health API routes, payloads, errors, units, nulls, IDs, and producer/consumer boundaries in `docs/api_contracts.md`.
5. Specify local env shape and runnable backend/frontend commands in `docs/deployment_setup.md`; record current starter mismatches without changing application code.
6. Update current architecture, MVP scope, integration schedule, and team ownership to remove the canceled hosted assumptions. Render is deferred; do not inspect or require provider credentials.

### Exit criteria

- Local operator scope and absence of authentication are explicit in the UI/API and documentation.
- Local SQLite path, ignore rule, and migration approach are specified.
- Exact local API contract and environment/setup commands are recorded.
- Current architecture, MVP, README, schedule, and member cards do not direct work toward Clerk/Neon/Render.
- No runtime path depends on Clerk, Neon, or Render configuration.
- Local liveness/readiness semantics are specified; readiness does not imply deployment readiness.

### Module A completion record (2026-10-16)

| Item | Result | Evidence |
|---|---|---|
| Local scope and access boundary | Complete | Single local operator, no auth/workspace, loopback-only binding, and explicit future-hosting gate recorded in this plan and architecture. |
| SQLite configuration and persistence contract | Complete | `DATABASE_PATH=data/dhakapath.db`, default `backend/data/dhakapath.db`, gitignore path, migration/transaction expectations recorded. |
| API and health contract | Complete | Current local routes, payloads, limits, error envelope, time semantics, and health paths frozen at the start of `docs/api_contracts.md`. |
| Setup commands | Complete as target instructions | Backend and frontend commands/config are recorded in `docs/deployment_setup.md`; migrations become runnable in Module C after Alembic is added. |
| Document and team handoff cleanup | Complete | Old hosted MVP/API/architecture/deployment docs, root README, four-hour schedule, and three member cards carry supersession notices. Current local architecture and MVP summaries were added. |
| Runtime implementation | Not part of Module A | Current `/api/health`, `/api` prefix, broad Vite bind, in-memory item writes, optional DB standby, and missing Alembic remain implementation work. No app code was changed. |

**Module A status: complete.** No provider checks were needed under the user's revised scope. No Module B work has started; wait for the user's confirmation before beginning it.

### Superseded provider assessment (2026-10-16)

| Check | Result | Evidence / blocker |
|---|---|---|
| API prefix and proposed endpoint set | Contract decision confirmed; starter mismatch recorded | Contracts specify `/api/v1`, with health outside the prefix. Current `backend/app/core/config.py` sets `/api`; `backend/app/api/routes.py` exposes only `/api/health`. |
| Clerk claims, roles, SDK, and test users | Blocked / unverified | No Clerk SDK dependency, auth verifier, Clerk environment configuration, or local `.env` was found. The intended `org:member` read / `org:admin` write policy remains a design decision, not a verified claim shape. |
| Neon development/test/deployment branches | Blocked / unverified | No `DATABASE_URL` or `MIGRATION_DATABASE_URL` is configured in the inspected process environment; no local backend `.env` was present. Repository settings permit an empty DB URL and standby mode. No branch inventory or live Neon connection can be established from repository evidence. |
| Render plan, service, and migration method | Blocked / unverified | No `render.yaml` or deployment service configuration is present. Account/plan access cannot be inferred from the repository. |
| Health behavior | Not implemented; contract remains synchronized in docs | Starter provides only `/api/health`, reports whether a URL string contains `neon`, and does not probe the database. `/health/live` and bounded DB-backed `/health/ready` are not implemented. |
| Schema/migration boundary | Design decision recorded; starter mismatch documented | Proposed `TransitRoute`, `TransitStop`, `RouteSegment`, `LocalUser`, and workspace entities are not implemented; no Alembic configuration or migrations are present. Existing DB code yields `None` if configuration is missing, contrary to the required fail-closed product path. |

**Disposition:** The earlier provider-gated assessment has historical value only. The user's 2026-10-16 direction cancels Clerk and Neon for this phase and defers Render, so those findings no longer block Modules B–H. Current implementation will not use their secrets or services.

### Map-data handoff

- Apply the locked source, coordinate, storage, provenance, and API-boundary decisions in **Pre-Module A**; do not reopen them without new source evidence or an explicit scope change.
- The metro CSV and road CSV are excluded from connected-network import for this MVP. Their unresolved source questions do not block implementation of the two JSON bus routes and station points.

## 4. Module B — map-source normalization and import manifest

**Quick summary:** Convert the usable map references into a deterministic, reviewable manifest before writing database seeds. Preserve source lineage and coordinate order; reject malformed rows instead of guessing.

### Work

1. Treat `Map Data/json/transit-data.json` version `basic-1` as the canonical source for current MVP station points and the Bikolpo/Uttara bus stop-and-segment geometry.
2. Build a small importer/validator that reads the project-relative files without changing them. It should emit normalized internal records plus an import summary (source file/version, accepted/rejected counts, and validation issues); it must not log environment secrets.
3. Normalize every coordinate to one internal convention: named `latitude` and `longitude` numeric fields. JSON input order is latitude/longitude; route CSV input order is longitude/latitude. The files do not declare a CRS/datum, so preserve that as unknown until source metadata confirms it; never carry anonymous coordinate pairs across the boundary.
4. Parse the route CSV rows as variable length. After the dataset label, read the numeric prefix as longitude/latitude pairs until the first nonnumeric cell; preserve the remaining one or two label cells verbatim. Require at least two points and an even number of coordinate cells. Do not assume every row has two endpoint labels; a single label is unresolved text, not a value to split heuristically. These CSV geometries are comparison evidence, not catalog import sources.
5. Cross-check Bikolpo and Uttara CSV row counts against JSON segment counts and compare each row's first/last coordinate to the corresponding JSON segment after explicit coordinate-order conversion. Use a documented `1e-6` degree threshold for this exact endpoint check; report differences as warnings, do not silently replace geometry or stop labels, and do not reject canonical JSON records solely because a comparison CSV differs.
6. Validate JSON route segment references, ordered continuity, unique IDs, point ranges, nonempty geometry, and first/last geometry points against the referenced stop coordinates. The current JSON passes these structural checks for both bus routes.
7. Record that the metro CSV has 14 rows while the JSON lists 16 MRT-6 stations and no metro geometry segments. Keep it unimported as a connected metro route until a human-reviewed mapping/source explanation resolves the discrepancy.
8. Exclude `Roadmap-Dhaka.csv` from ingestion. It has 49,869 variable-width rows and trailing values without a colocated schema/provenance note; do not infer its fields, units, coordinate convention, or that it is routable.
9. Generate stable source keys from dataset version, route ID, segment ordinal, and stop ID. Keep an import checksum/version so rerunning the same source is idempotent and changed source files produce a reviewable diff rather than destructive replacement.

### Exit criteria

- All accepted coordinates have explicit named latitude/longitude fields; CRS/datum remains marked unknown until the source confirms it.
- Bikolpo/Uttara normalized route geometry passes reference, continuity, bounds, and endpoint checks.
- CSV/JSON cross-check results and unresolved metro/road issues are visible in the import summary.
- No data is silently labeled live, field-verified, or fare-verified.
- Importing the same files twice produces the same normalized manifest and stable source keys.

## 5. Module C — local runtime, SQLite, and migrations

**Quick summary:** Use an explicitly configured local SQLite database with versioned schema changes. There is no remote database connection or in-memory persistence fallback in this phase.

**Status: complete (2026-10-16).** The backend now uses synchronous SQLAlchemy with a local persistent SQLite file, Alembic revision `20261016_01`, strict readiness checks, and no in-memory standby. The migration defines the transit catalog, source import/file provenance, trips, trip segments, incident reports, and append-only incident events. `map_data import` stores only an error-free validated manifest and is repeat-safe by manifest hash; `seed-demo` inserts fixed-ID synthetic examples and skips existing rows without overwriting edits. The local API exposes `/health/live`, migration/database-backed `/health/ready`, and a read-only `/api/v1/map-data/summary` for persisted inventory. It runs on loopback by default. Trip/report workflow endpoints and frontend persistence integration remain later work.

**Verification evidence:** In a disposable, ignored SQLite file, two consecutive `alembic upgrade head` calls completed at `20261016_01`; map import returned `imported` then `already_imported`; demo seed returned `seeded` then `already_seeded`. Final row counts were 3 routes, 54 stops, 36 route segments, 1 trip with 1 segment, 1 incident, 1 event, 1 import record, and 5 source-file records. Editing the seeded incident title and running the seed again preserved the edit and counts. A direct SQLite update against an incident event was rejected by the append-only trigger. From a fresh process, the API returned 200 for live, ready, and `GET /api/v1/map-data/summary`; the summary returned source `basic-1`, `approximate` quality, and counts 3/54/36/5. The disposable file was removed after verification. Verification used Python 3.14 because the configured 3.12 interpreter was unavailable on this machine; dependencies were locked and installed with `uv` into the ignored local environment.

### Work

1. Require a configured local database path; missing or invalid configuration must fail startup clearly.
2. Remove the DB standby behavior and `None` session path. Mutation services own explicit transactions.
3. Use SQLite-compatible SQLAlchemy settings and bounded operations; ensure only one local app process writes to the local file unless concurrency behavior is deliberately tested.
4. Add Alembic configuration and migrations under the backend project. Do not use ORM `create_all()` as a substitute.
5. Implement the contract entities and constraints. Expected minimum set:
   - Normalized reference catalog: `TransitRoute`, `TransitStop`, and ordered `RouteSegment` records with stable source keys, source/version/status metadata, and geometry stored as JSON text with named latitude/longitude points.
   - `Trip` and ordered `TripSegment`, with unique `(trip_id, ordinal)` and nullable source `route_segment_id` where grounded in imported catalog data.
   - `IncidentReport`, with provenance, nullable `observed_at`, lifecycle status, positive version, and local actor label/timestamps; do not describe local actor labels as verified identities.
   - Append-only `IncidentEvent` tied to the report; retain mutation receipt only if local retry semantics require it.
6. Add foreign keys, required-field and allowed-value checks, indexes for local trip/report lookups, and SQLite-compatible uniqueness rules. Do not carry forward workspace keys from the canceled multi-user scope.
7. Add a deterministic map import/seed command for versioned source records and an idempotent demo seed for trips/reports. Seed only seed-owned rows; never truncate or overwrite user-authored reports. Persist source path, source dataset/version, import timestamp, route status, and explicit synthetic/approximate provenance. Prepared synthetic records must have `is_synthetic=true` and reports must use `source_type=synthetic_example`.
8. Run migration and repeat-seed checks against a disposable local database file; document how to back it up/reset without deleting unrelated user files.

### Exit criteria

- Missing database path prevents startup/readiness; no in-memory standby fallback exists.
- Migrations and repeatable seeding succeed against a disposable SQLite file.
- Running the seed twice adds no duplicates and does not overwrite a changed user report.
- Map import is repeatable for the same source version, preserves provenance, and never turns approximate references into verified/live claims.
- A newly started API can read committed data after the prior process is stopped.

## 6. Module D — local access boundary

**Quick summary:** This phase has one local operator and no login. Keep the service bound to localhost by default and make no identity, role, or multi-user isolation claims. Revisit auth before exposing it to a network or deploying it.

**Status: complete (2026-10-16).** FastAPI and the default `uvicorn` entry point use `127.0.0.1`; Vite now binds to `127.0.0.1` instead of all interfaces. The visible Trip Brief screen labels the app as local access on this device and explains that there is no sign-in/shared workspace and the trip/report workflows are not connected yet. The synthetic design preview uses a clearly named local preview identifier. No users, roles, fake auth, or client authority fields were introduced.

**Verification:** `npm run build` succeeded. Source/config inspection confirms the backend entry point and Vite default bind use `127.0.0.1`; the visible screen copy explicitly states local-only use, no login/shared workspace, and that trip/report screens are not connected. Browser visual inspection could not be completed: the computer-use helper timed out capturing Chrome and then returned `GetCursorPos failed: Access is denied (0x80070005)`. Visual acceptance at desktop/narrow-mobile widths remains unverified. The temporary Vite preview responded on `127.0.0.1`; no LAN listener was created intentionally.

### Work

1. Bind Uvicorn to `127.0.0.1` by default; document that access is limited to this local machine.
2. Do not create fake users, role claims, or a pretend authorization layer. API requests operate on the local database and local-only product scope.
3. If a future phase exposes the service beyond localhost or introduces multiple operators, pause and add real authentication/authorization before enabling network access.

### Exit criteria

- Backend binds to localhost by default.
- UI and documentation clearly state the single-operator local scope.
- No client-provided identity or role is represented as verified authority.

## 7. Module E — deterministic domain service and read APIs

**Quick summary:** Keep rules in backend services and keep route handlers thin. Return known stored data and explicit uncertainty; a missing report or a non-match never means that a route is safe.

### Routes in the backend MVP

| Route | Behavior |
|---|---|
| `GET /api/v1/trips` | List locally stored prepared trips in stable order; return empty array when none exist. |
| `GET /api/v1/trips/{trip_id}/context` | Return ordered segments, relevant evidence, report freshness, relevance state/reason, and server `as_of`. |

**Map-data boundary:** Trip context returns prepared trip legs grounded in imported stops/routes. It includes nullable `route_id` only so the report editor can link a new report to one of the selected trip's stored routes. It returns no coordinates or geometry; do not claim a rendered route map. If map visualization becomes part of the UI, revise `docs/api_contracts.md` first with exact coordinate order/CRS, nullable geometry rules, source/provenance fields, and payload-size limits.

Do not implement every endpoint in the wider contract automatically. Incident collection-list and event-list routes are out of this screen's minimum; report detail read-back is added in Module F for write confirmation. Event and receipt tables remain required for safe writes.

### Service rules

1. Scope lookups by requested local resource IDs; workspace scoping is deferred because this phase has no shared users/workspaces.
2. Keep API Pydantic models in the contract-designated module and reject extra mutation fields. Nullable properties appear explicitly as `null` in response/request examples where required.
3. Compute relevance from all eligible reports, not only the paginated evidence shown to the client.
4. Use exactly `affects_trip`, `not_affected`, or `unknown`; lifecycle status remains separate from derived freshness.
5. Missing, stale, future-dated, disputed, conflicting, or incomplete evidence (including blank location or missing mode) must preserve uncertainty per the contract. A no-match response is described as “No match found in available reports,” never “safe.”
6. Centralize the documented 30/120-minute freshness cutoffs. They are assumptions, not validated thresholds; keep them configurable in one server-side policy and do not imply safety.
7. Use server timestamps for `as_of` and age calculations. Normalize API datetimes to UTC with `Z`.
8. Use keyset pagination and opaque cursors only where the selected endpoint contract requires it; validate malformed cursors with the stable error envelope.
9. Do not invent a route path by joining nearby stations or road vertices. Prepared trip connections must reference a known imported route/segment or remain explicitly unknown.

### Exit criteria

- Trip picker and context are read from SQLite rather than fixtures or process memory.
- Relevant, nonmatching, unknown/missing, stale, disputed/conflicting, and empty-report cases match the contract.
- API responses conform to the documented models and error envelope.
- Relevance uses all qualifying stored reports even when evidence is displayed in pages.
- A prepared demo trip's known bus/MRT locations match normalized reference records; any unsupported transfer/path is shown as absent/unknown, not fabricated from the road CSV.

### Module E completion record (2026-10-16)

Implemented `GET /api/v1/trips` and `GET /api/v1/trips/{trip_id}/context` over SQLite. The service uses stable keyset pagination, Pydantic response models, UTC `as_of`/report timestamps, route-linked report evidence, centralized 30/120-minute freshness cutoffs, and conservative relevance states. Stale, missing-time, future-dated, disputed, or incomplete route evidence does not become a clear/safe result. No geometry is exposed. The frontend now calls these local endpoints and describes the trip/report view as database-backed.

**Verification status:** Module H later exercised the runtime API scenarios on a disposable SQLite database. Rendered-screen inspection remains unverified; the existing UI preview still uses a clearly synthetic fixture only when explicitly opened in development preview mode.

## 8. Module F — report creation, correction, and transaction safety

**Quick summary:** A report write is complete only when the report, its evidence-history event, and idempotency receipt commit together. Retries and concurrent edits must have explicit, safe outcomes.

### Create route

`POST /api/v1/incidents`

- No Clerk role check in local-only phase; keep request validation and idempotency behavior where useful.
- Validate the strict `IncidentCreate` contract; clients cannot choose actor, status, version, synthetic flag, or ownership.
- Set initial status/version/provenance on the server (`reported`, version 1, `is_synthetic=false`).
- In one explicit transaction, insert the report, initial event, and mutation receipt.
- Same idempotency key plus same canonical payload replays the original outcome; same key with a different fingerprint returns `409 IDEMPOTENCY_KEY_REUSED`.

### Update route

`PATCH /api/v1/incidents/{incident_id}`

- Require an idempotency key for retry-safe updates where the client can retry.
- Require `expected_version`, a nonempty reason, and at least one allowed field change.
- Perform a compare-and-swap update filtered by report ID and expected version; increment the version.
- Append a before/after event and write the request receipt in the same transaction.
- On a version race, make no report/history change; return `409 VERSION_CONFLICT` with safe current-version metadata and persist the definitive rejected receipt as specified.
- Preserve synthetic provenance; the update endpoint cannot relabel synthetic seed data as a real report or vice versa.

### Unknown outcomes

- Do not claim success after a timeout or lost connection.
- Let the client repeat the identical operation with the same key and canonical payload; local request receipts may be used if needed to resolve retry outcomes.
- A `404` receipt lookup does not prove a concurrent original request rolled back; do not create a new key for an unresolved operation.
- Never blindly replay a create with a new key.

### Exit criteria

- A local report create is committed and visible to a fresh API read.
- Repeating the same operation/key does not duplicate a report or event.
- Reusing a key with different content is rejected.
- Concurrent updates with the same expected version produce one success and one explicit conflict.
- Failed or unknown writes never return a fabricated success.

### Module F completion record (2026-10-16)

Implemented strict local report create/update request schemas, `POST /api/v1/incidents`, `PATCH /api/v1/incidents/{incident_id}`, and `GET /api/v1/incidents/{incident_id}` for fresh read-back. Migration `20261016_02` adds mode, direction, confirmation note, submitted source label, and mutation receipts using additive SQLite changes so existing report and append-only event rows are not rebuilt. Each successful mutation writes the report, event snapshot, and idempotency receipt in one transaction. Updates use `BEGIN IMMEDIATE` plus a version-filtered compare-and-swap; stale-version and update-not-found outcomes are receipted and return structured errors. Replays return the original status/body; key reuse with a changed method/path/payload returns `409`.

**Verification status:** Module H later exercised the live API write, retry, rollback, and concurrent update scenarios on a disposable SQLite database. The frontend still has no report create/correction form. Module G is complete.

## 9. Module G — local health and startup

**Quick summary:** Start the API locally against the configured SQLite file. Render packaging, hosted branches, and deployment migration strategy are deferred.

### Work

1. Implement `GET /health/live` as a bounded process liveness response.
2. Implement `GET /health/ready` as required local configuration plus a bounded SQLite `SELECT 1`; return `503` if the local database path is unavailable.
3. Keep API paths and health paths explicit; Render health-check configuration is deferred.
4. Document local startup, migration, seed, and data-file location commands. Keep unknown `/api/...` requests as JSON 404s.
5. Bind to `127.0.0.1` by default. A future hosted phase must deliberately revise bind and authentication settings.

### Exit criteria

- Local API starts using the documented SQLite file and fails clearly with invalid required configuration.
- Migration failure prevents readiness; successful migration and bounded SQLite probe permit readiness.
- Live, ready, and unknown API behavior are verified locally before calling the local workflow complete.

### Module G completion record (2026-10-16)

The API now starts even when its SQLite schema is not yet migrated, keeping `/health/live` available while `/health/ready` returns a structured `503 DATABASE_UNAVAILABLE`. Readiness runs `SELECT 1` and checks for migration `20261016_02` on one SQLite connection; SQLite connect/busy timeouts bound the probe. Invalid `DATABASE_PATH` values still fail configuration, and unknown API paths return the shared JSON 404 envelope. Local runbooks now document migration/seed/start order and health semantics.

**Verification evidence:** On a disposable `backend/data/module-g-validation.db`, the server returned liveness `200` and readiness `503` before migration, then readiness `200` after `alembic upgrade head`. Unknown `/api/not-a-route` returned JSON `404 RESOURCE_NOT_FOUND`. The disposable file was removed.

## 10. Module H — backend verification and handoff

**Quick summary:** Verify contract behavior, local persistence, migration safety, and the end-to-end local workflow. No hosted-provider checks are part of this phase.

### Required checks

- Schema/model validation: unknown fields, nullability, enum values, lengths, timestamp timezone, and required keys.
- Access boundary: service defaults to localhost; no multi-user/auth guarantees are claimed.
- Domain rules: relevant report, no match, missing location/time/mode, stale/future observation, disputed or conflicting evidence, empty report set.
- Map import: JSON schema/version checks; latitude/longitude range checks; CSV variable-width row parsing; CSV-to-JSON segment-count and endpoint comparison; segment ordering/reference continuity; duplicate IDs; explicit metro mismatch handling; road CSV remains excluded until schema/provenance are confirmed.
- Writes: atomic report/event/receipt; same-key retry; changed-payload same key; unknown outcome reconciliation; optimistic version conflict.
- Persistence and migrations: clean migration on a disposable local SQLite file; repeated seed; data survives new request/process restart; no user data overwrite.
- Deployment: deferred; do not claim hosted readiness.

No mock tokens are needed in the single-operator local phase. Keep destructive/reset checks isolated to a disposable local SQLite file; never point reset commands at the user's active database path.

### Commands

Run from `backend/` unless noted:

```powershell
uv sync --locked
uv run alembic upgrade head
uv run python -m app.scripts.map_data validate --summary-only
uv run python -m app.scripts.map_data import
uv run python -m app.scripts.map_data seed-demo
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The default database file is `backend/data/dhakapath.db`; set `DATABASE_PATH` in `backend/.env` to choose another persistent file. Relative values resolve from `backend/`. Do not run reset or deletion commands against a user database; use an explicitly named disposable file when checking migrations or seeds. No broad automated test suite exists yet.

### Handoff record

Record:

- Changed backend files and migration revision.
- Exact commands run and whether each is a unit, contract, or local SQLite check.
- Local database file location class (active or disposable test file), never contents or credentials.
- Real API request path and observed response/error category, without private incident data.
- Actual health/read/write and restart-persistence checks; hosted deployment remains deferred.
- Remaining contract mismatches, unverified thresholds, and known omissions.

### Module H completion record (2026-10-16)

**Status: complete for the local backend handoff.** Verification used only `backend/data/module-h-validation.db`, an explicitly named disposable SQLite file. No Clerk, Neon, Render, hosted database, or test credentials were used. The temporary server bound to `127.0.0.1:8765`; temporary logs and the disposable database were removed after checks.

**Checks performed:**

- Ran `python -m alembic upgrade head` twice and confirmed revision `20261016_02`; validated the checked-in map manifest (3 routes, 54 stops, 36 segments, 0 errors, 21 known warnings); ran map import twice and demo seed twice.
- Checked strict Pydantic create validation for extra fields, missing required source label, invalid enum, overlength/blank required text, and timezone-naive timestamp; an offset timestamp normalized to UTC. Checked empty update, extra client authority field, missing/invalid idempotency key.
- Exercised live HTTP health, trip list/context, report create/detail/update, unknown API path, exact same-key retries, changed-payload key reuse (`409 IDEMPOTENCY_KEY_REUSED`), stale version (`409 VERSION_CONFLICT`), and structured validation/error responses.
- Forced a database event insert failure with a temporary trigger. The API did not report success and left neither report nor receipt behind. After removing the trigger, the identical key succeeded exactly once. This verifies transaction rollback and retry reconciliation; an actual lost network response was not simulated.
- Ran two concurrent update requests against the same expected version; observed one `200` update and one `409 VERSION_CONFLICT`. Restarted the local API in a fresh process and read the committed version back.
- Exercised trip-context evidence states for fresh match, no match, empty evidence set, missing mode/location/time, stale and future times, disputed evidence, and conflicting evidence. Missing report mode remains null rather than being inferred from the linked route.
- Ran Python compilation, frontend production build, frontend lint, and `git diff --check`. Build passed. Lint exited successfully with nine unused-variable/import warnings in `src/services/api.js`, `src/components/TeamRoster.jsx`, and `src/components/Header.jsx`.

**Fixes from verification:** The trip-context response declared segment IDs as strings although the database returns integer IDs; the response schema now uses integer IDs, preventing a runtime `500`. Missing report mode is no longer inferred from a route, and active reports with missing mode/location or observation time preserve `unknown` relevance.

**Limits:** This was a manual disposable-database verification pass, not a committed automated test suite. Freshness cutoffs remain unvalidated assumptions. Existing map data is approximate with 21 known warnings. Desktop/narrow-mobile visual acceptance remains unverified; the computer-use screenshot/input attempt was blocked by the local UI helper. The UI still has no report create/correction form. Full citywide routing, fares, chat, AI, multi-user/auth, and hosted deployment are not delivered by these backend modules.

### Frontend/backend integration follow-up (2026-10-16)

The active UI and adapter now preserve the existing 20-row trip and report cursors and provide append controls with ID deduplication. The server relevance result remains authoritative across evidence pages. Successful context pages are assembled and saved to a scope/trip-keyed IndexedDB store (schema 1, 30-day expiry) with client cache time, original server `as_of`, loaded count, completeness, and next cursor. A restored cache remains stale and read-only; writes are never queued. API reachability and database-backed readiness are separate UI states; browser online state is informational and does not prevent a local request. Mutations retain their key/body after unknown outcomes in memory and a tab-session recovery record so a reload cannot silently replace the retry identity; the record is manual-recovery-only and is never replayed automatically. Conflict recovery requires refresh plus an explicit version-review action.

**Static verification on 2026-10-16:** Frontend production build passed; lint exited successfully with four unused-variable/import warnings in inactive starter files; Python source compilation and `git diff --check` passed. The locked backend environment could not start: `uv run --locked` failed opening the configured uv cache with `Access is denied`, and the existing `.venv` does not contain Alembic. No backend migration or database was run. Browser review inspected only the real local-service-unavailable screen at 1280×800 and 360×800; mobile document width was 345 px at a 360 px viewport. API-backed write/read, >20-row pagination, persistent-cache reload, and all other state acceptance remain unverified.

### Dynamic planner integration follow-up (2026-10-16)

The restored welcome page now opens a live local graph planner. `GET /api/v1/map-data/network` serves the imported catalog and `GET /api/v1/journeys/search` returns approximate paths, distances, inferred transfers, and reports linked to each path's routes. The same Trip Brief API remains the write path for creating/correcting reports. The map renders catalog geometry and the selected result; synthetic seeded reports stay labeled as synthetic.

The catalog importer now derives approximate straight-line MRT-6 edges from ordered station references. Direction is treated bidirectionally and transfers are inferred within 250 m. The source has no timetable or fare table, so duration and fare remain null/unknown. Live browser review confirmed a Mirpur 10–Shahbagh query returning three options after a repeat-safe catalog import; the existing trip/report rows were not changed. Frontend build/lint, Python source compilation, and `git diff --check` pass. Dynamic planner desktop/mobile review and write/restart/conflict/pagination/cache acceptance remain open.

## 11. Ownership and stop conditions

**Quick summary:** Keep DB schema/auth/deployment ownership separate from endpoint/business-rule ownership. Stop and resolve a contract disagreement rather than adding a second schema or response format to make the code compile.

Based on the current team work cards:

- **Pantha Protick:** runtime configuration, local SQLite session, SQLAlchemy models, migrations, constraints/transactions, startup/health.
- **Tanvir Hasan Ratul:** API routes and service rules, request/response models integration, endpoints, and integration with the local frontend contract.
- **Yousha Shahid:** frontend is outside this backend plan, but backend/UI contract mismatches should be sent to the integration owner before a screen workaround is introduced.

Stop and report a blocker if local persistence or migration behavior cannot be made reliable, the SQLite schema conflicts with the API, or local scope is presented as multi-user/hosted security. Do not add hidden in-memory fallback or claim Clerk, Neon, or Render behavior is implemented.

## 12. Open implementation checks

**Quick summary:** Local implementation scope is set. Hosted authentication, shared multi-user access, Postgres migration compatibility, and deployment are intentionally outside this phase.

- **Local identity:** No identity table in this phase. A future hosted/shared phase must select real authentication and roles before network exposure.
- **Read endpoint breadth:** The API contract includes incident list/detail/history endpoints beyond this MVP screen. Implement them only when a committed UI path needs them; retain write-side event persistence and request lookup.
- **Freshness thresholds:** 30/120-minute boundaries are assumptions; do not describe them as empirically validated.
- **Future hosting:** If hosting becomes necessary, decide database/auth provider and cross-database migration constraints before adding deployment configuration.

**Status:** Modules A–H backend work remains implemented and locally verified for the bounded single-operator SQLite workflow. A later integration update connects the current frontend to trip reads and incident create/update. See the dated integration record below for changed behavior and the current verification boundary. Clerk, Neon, Render, shared-user security, and hosted readiness are deferred.

### Earlier frontend integration addendum (2026-10-16; superseded by the integration follow-up above)

The active trip brief now uses the same-origin Vite `/api` proxy to read trip/context data and write incident reports. The UI supports creating route-linked reports and correcting visible non-synthetic reports with reason, status, confirmation note, optimistic version, and idempotency key. `TripSegmentView` exposes nullable `route_id` as a contextual write field; the UI requires a stored route so new reports remain visible to the trip-context read. The obsolete generic frontend API helper, its unused base-URL example, and unreferenced starter components that depended on removed endpoints were removed.

At this earlier checkpoint, frontend production build, lint, Python compilation, and whitespace checks passed. The UI displayed only the first 20 trips and reports. The follow-up above adds cursor navigation and the offline context cache, and supersedes those status statements. The live backend/API loop remains blocked by uv cache access denial and missing Alembic in the existing virtual environment; only the API-unavailable screen has been inspected at desktop and narrow-mobile sizes.
