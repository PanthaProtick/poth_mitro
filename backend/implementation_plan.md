# Backend implementation plan

- Build the DhakaPath MVP backend as a real FastAPI service backed by remote Neon PostgreSQL.
- Keep Clerk session verification and workspace/role checks on the server; never trust client-supplied identity or permissions.
- Use Alembic migrations and explicit database transactions for shared report writes, history, and idempotency receipts.
- Use the existing `Map Data/` files as the MVP's approximate route/station reference input; normalize and validate them before persistence.
- Implement only the backend routes needed for the bounded Trip Brief workflow; keep relevance and freshness rules deterministic.
- Treat all Clerk, Neon, Render, health-route, and schema details below as implementation requirements or unresolved gates—not proof that providers are configured or integrations work.

## 1. Goal, boundaries, and source of truth

**Quick summary:** This plan implements the backend side of the selected MVP: authenticated members read a prepared trip and its report context; an authorized editor creates or updates a report; another member can read the saved change. It uses the checked-in map files as approximate route/station source material, but does not build a map UI, citywide routing, fare calculation, chat, or AI inference.

Use these documents as the coordinated product and contract sources:

- [`../docs/mvp.md`](../docs/mvp.md) defines the product slice and acceptance baseline.
- [`../docs/api_contracts.md`](../docs/api_contracts.md) defines API paths, payloads, response envelopes, authorization semantics, and database write guarantees.
- [`../docs/architecture.md`](../docs/architecture.md) defines the service/data flow, Neon branch policy, and provider boundaries.
- [`../docs/deployment_setup.md`](../docs/deployment_setup.md) defines runtime configuration and Render deployment constraints.
- [`../tasks/implementation_plan.md`](../tasks/implementation_plan.md) defines current repository observations, ownership, schedule gates, and shared acceptance checks.

**Current code facts recorded in the project plan:** the starter has FastAPI and SQLAlchemy/asyncpg wiring, an in-memory demo item route, and a DB-optional standby path. DhakaPath routes, production Clerk verification, Alembic migrations, and real shared report writes are not yet implemented. Recheck source before making delivery claims.

**Out of scope:** model calls, generated route advice, full transit routing, fare rules, chat history, admin route editing, hard deletion, offline write queues, and any mock/anonymous/in-memory product fallback. Synthetic trip and report records are permitted only as clearly labelled demo seed data.

### Map data inspected for this plan

**Quick summary:** `Map Data/` contains useful route references, but the files use different coordinate orders and CSV layouts. Treat them as import inputs with explicit provenance, not as a ready-to-load database or verified live network.

| File | Observed structure | Plan treatment |
|---|---|---|
| `Map Data/json/transit-data.json` | Version `basic-1`; declares `coordinateOrder: latitude, longitude`; has 16 MRT-6 station points and two bus routes (`bikolpo`, `uttara_bus`) with 18/20 stops and 17/19 geometry segments. Both bus routes' segment references, ordering, and geometry endpoints were structurally consistent. | Canonical input for the available normalized station, stop, and bus-route reference records. Preserve the file version and per-route status/source. |
| `Map Data/csv/Routemap-BikolpoBus.csv` | 17 headerless rows; variable-length longitude/latitude coordinate pairs followed by endpoint labels. Matches the 17 Bikolpo segments in JSON by count. | Retain as source/lineage and cross-check against the JSON route geometry; do not parse using a fixed number of coordinate pairs. |
| `Map Data/csv/Routemap-UttaraBus.csv` | 19 headerless rows; variable-length longitude/latitude pairs followed by endpoint labels. Matches the 19 Uttara bus segments in JSON by count. | Retain as source/lineage and cross-check against the JSON geometry; normalize endpoint labels before comparison without silently merging distinct stops. |
| `Map Data/csv/Routemap-DhakaMetroRail.csv` | 14 headerless geometry rows with variable-length longitude/latitude pairs and endpoint labels. The JSON has 16 metro station points but no corresponding metro route segments. | Candidate source to reconcile metro geometry; do not silently infer a one-to-one station/segment mapping. Compare names and endpoints and record unresolved differences. |
| `Map Data/csv/Roadmap-Dhaka.csv` | 49,869 headerless rows with variable-width geometry/path fields and trailing values; no schema or provenance metadata was found alongside this file. | Keep out of the MVP import and routing path until its field schema, coordinate order, units, source, and intended use are established. It is too large and ambiguous to import by guessing. |

The JSON explicitly describes its references as approximate, not live service or verified fares, and labels the bus data `assignment-reference`. The route CSV samples and road CSV use longitude/latitude ordering while the JSON uses latitude/longitude. Observed coordinates fall in plausible Dhaka ranges, but this check establishes only numeric plausibility—not positional accuracy, current service, or field verification.

**Decision for implementation:** Use the JSON bus geometry and station points to create clearly labelled reference records and to ground prepared demo trip segments. Keep the 14-row metro CSV as an unresolved cross-check until confirmed. Do not import the road CSV, derive live/fare claims, or expose a route-finding API from these files in this MVP. The map UI and exposing geometry through the trip-context API remain out of scope unless the API contract and frontend plan are updated first.

## 2. Module overview and dependencies

**Quick summary:** Work in dependency order: freeze contracts, normalize the map inputs, establish fail-closed persistence, add identity/authorization, implement domain reads and writes, then verify and deploy. Do not begin dependent endpoint work while the relevant contract or data ownership is unresolved.

| Module | Purpose | Main dependency | Completion evidence |
|---|---|---|---|
| A. Contract and preflight | Reconcile schemas, route names, roles, and provider readiness | None | Written decisions and a no-secret readiness checklist |
| B. Map-source normalization | Parse/validate available station and bus data; retain source lineage; exclude ambiguous road data | A | Deterministic import report and valid normalized records |
| C. Runtime and database foundation | Required configuration, SQLAlchemy session, Alembic, schema, safe map/trip seed | A, B | Migration/import/seed behavior on a disposable remote Neon branch |
| D. Clerk identity and access | Verify session tokens and enforce workspace/read/write policy | A, C | Real test users pass/deny the expected requests |
| E. Domain services and read APIs | Load map-grounded prepared trips/reports and compute deterministic relevance/freshness | B–D | Contract-shaped responses backed by Neon |
| F. Report mutation APIs | Create/update reports with event history, version checks, and idempotency | C, D | Real editor write and another member's fresh read |
| G. Health, packaging, and Render startup | Same application runtime locally and hosted | C, D, F | Render readiness and authenticated deployed smoke evidence |
| H. Backend acceptance and handoff | Run data, security, persistence, and end-to-end checks | B–G | Recorded actual results, blockers, and commands |

Modules can overlap only where ownership and interfaces are already agreed. Map normalization should produce a reviewed manifest before the database owner finalizes schema and seed behavior. Migration/model changes belong to the database owner; API and product-rule code belongs to the API owner. Coordinate shared files such as `backend/app/main.py` before editing.

## 3. Module A — contract and provider preflight

**Quick summary:** Resolve ambiguities before building around them. Provider setup is user-reported or documented as planned; it is not verified until a real connection or request succeeds.

### Work

1. Read the current API contract and freeze the MVP endpoint set listed in Module E.
2. Confirm the active Clerk claim names and role values using the installed supported SDK and actual development test users. The intended policy is `org:member` read and `org:admin` write.
3. Confirm the Neon development, isolated test, and deployment branches. Never print or commit connection strings.
4. Confirm Render account/plan availability and which migration execution method that plan supports. Do not assume a paid upgrade.
5. Reconcile the health route conflict before implementation:
   - `docs/api_contracts.md` currently specifies `GET /healthz`.
   - `docs/deployment_setup.md` and the implementation plan specify `GET /health/live` and `GET /health/ready`, with readiness configured for Render.
   - **Plan decision for this backend:** implement `/health/live` and `/health/ready`; use `/health/ready` in Render. Update `docs/api_contracts.md` to match before considering the contract synchronized.
6. Reconcile schema names and fields against the Pydantic models before Alembic migrations are authored. Do not silently resolve contradictions in code.

### Exit criteria

- API prefix is exactly `/api/v1`; health paths are outside the API prefix.
- Clerk role/claim shape is documented from the actual configured instance and SDK.
- Three Neon branch targets are identifiable without secrets appearing in logs or docs.
- Render plan and migration method are recorded as verified, unavailable, or blocked.
- Contract/schema/health disagreements are resolved in the source docs or explicitly left as blockers.

### Map-data gate

- Confirm that `Map Data/json/transit-data.json` is the canonical input for the initial station and two bus-route reference set.
- Implement the shared `TransitRoute`/`TransitStop`/`RouteSegment` reference catalog described in Module C. The current trip API exposes origin/destination/mode but no geometry; do not return geometry without a contract revision.
- Decide whether the metro CSV is intended to represent an MRT-6 route path and resolve its 14 geometry rows against the 16 JSON stations. No mapping is assumed by this plan.
- Keep the `Roadmap-Dhaka.csv` out until a source/schema note documents columns, CRS/coordinate order, units, licensing/provenance, and whether it is intended as road graph data.

## 4. Module B — map-source normalization and import manifest

**Quick summary:** Convert the usable map references into a deterministic, reviewable manifest before writing database seeds. Preserve source lineage and coordinate order; reject malformed rows instead of guessing.

### Work

1. Treat `Map Data/json/transit-data.json` version `basic-1` as the canonical source for current MVP station points and the Bikolpo/Uttara bus stop-and-segment geometry.
2. Build a small importer/validator that reads the project-relative files without changing them. It should emit normalized internal records plus an import summary (source file/version, accepted/rejected counts, and validation issues); it must not log environment secrets.
3. Normalize every coordinate to one internal convention: named `latitude` and `longitude` numeric fields. JSON input order is latitude/longitude; route CSV input order is longitude/latitude. The files do not declare a CRS/datum, so preserve that as unknown until source metadata confirms it; never carry anonymous coordinate pairs across the boundary.
4. Parse the route CSV rows as variable length. Based on observed samples, the final two values are endpoint names and the preceding values are longitude/latitude pairs; verify the row has at least two points, an even number of coordinate tokens, numeric values, and plausible Dhaka bounds before accepting it. Keep labels as source aliases and preserve original text for traceability.
5. Cross-check Bikolpo and Uttara CSV row counts against JSON segment counts and compare each row's endpoints to the corresponding JSON segment after explicit coordinate-order conversion. Report discrepancies; do not silently replace geometry or stop labels.
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

## 5. Module C — backend runtime, Neon, and migrations

**Quick summary:** Make the remote database mandatory and versioned. The API must fail clearly when required configuration is missing or Neon is unavailable; it must never switch to memory or a local database.

### Work

1. Validate required environment settings at startup. At minimum include `DATABASE_URL`, the selected Clerk verification configuration, and the exact authorized origins/parties required by the SDK. Keep secrets server-side.
2. Remove the database standby behavior and `None` session path. Remove implicit transaction commits on dependency teardown for product writes; mutation services own explicit transactions.
3. Configure a finite SQLAlchemy async connection pool and bounded acquisition/query timeouts. Tune to verified Neon plan limits rather than guessed limits.
4. Add Alembic configuration and migrations under the backend project. Do not use ORM `create_all()` as a substitute.
5. Implement the contract entities and constraints. Expected minimum set:
   - `Workspace`, keyed by the Clerk Organization ID.
   - Local identity mapping keyed uniquely by `(issuer, subject)` if needed for stable local actor UUIDs.
   - Normalized reference catalog: `TransitRoute`, `TransitStop`, and ordered `RouteSegment` records with stable source keys, source/version/status metadata, and geometry stored as an ordered JSONB array of named latitude/longitude points. Keep workspace-owned demo trips separate from the shared/reference map catalog.
   - `Trip` and ordered `TripSegment`, scoped to workspace, with unique `(trip_id, ordinal)`; include a nullable source `route_segment_id` foreign key where a demo segment is grounded in the imported catalog. Keep API fields unchanged unless the contract is deliberately revised.
   - `IncidentReport`, with workspace scope, provenance, nullable `observed_at`, lifecycle status, positive version, and actor/timestamps.
   - Append-only `IncidentEvent`, tied to the same report and workspace.
   - `MutationReceipt`, unique for the verified actor/workspace/request key and carrying a canonical operation fingerprint and outcome.
6. Add foreign keys, required-field and allowed-value checks, indexes for workspace lookups, and uniqueness rules from `docs/api_contracts.md`.
7. Add a deterministic map import/seed command for versioned source records and an idempotent demo seed for trips/reports. Seed only seed-owned rows; never truncate or overwrite user-authored reports. Persist source path, source dataset/version, import timestamp, route status, and explicit synthetic/approximate provenance. Prepared synthetic records must have `is_synthetic=true` and reports must use `source_type=synthetic_example`.
8. Run migration and repeat-seed checks only on a disposable remote Neon test branch. Development and deployment branches use the same migration chain but are not disposable test targets.

### Exit criteria

- Missing `DATABASE_URL` prevents startup/readiness; no SQLite, local DB, or in-memory fallback exists in the product path.
- `uv run alembic upgrade head` succeeds on a disposable remote Neon test branch.
- Running the seed twice adds no duplicates and does not overwrite a changed user report.
- Map import is repeatable for the same source version, preserves provenance, and never turns approximate references into verified/live claims.
- A newly started API can read committed data after the prior process is stopped.

## 6. Module D — Clerk verification and workspace authorization

**Quick summary:** The backend authenticates real Clerk session tokens and derives the active user, organization, and role from verified claims. It rejects requests that lack proof or cross workspace boundaries.

### Work

1. Pin and configure the supported Clerk Python backend SDK; confirm its installed API/options against official docs and actual version.
2. Accept session tokens only. Verify signature, issuer, expiry, signed-in state, and authorized party/origin using supported SDK verification; do not decode an unverified JWT and trust claims.
3. Create one reusable dependency that returns a verified actor structure (issuer, subject, active organization ID, active organization role). Route handlers must not parse tokens themselves.
4. Resolve/upsert local identity using verified `(issuer, subject)` only. Email/display name are presentation data, not authorization keys.
5. Enforce policy on every protected route:
   - active `org:member` and `org:admin` can read within their active workspace;
   - only `org:admin` can create or update reports;
   - requested `{workspace_id}` must match the verified active organization;
   - another workspace's resources and receipts return the contract's non-disclosing `404` behavior.
6. Return the documented stable error envelope for missing/invalid token (`401`), missing workspace or insufficient role (`403`), and cross-workspace/missing resource (`404`). Fail closed if Clerk verification cannot be completed; never allow a dev bypass or fabricated token.

### Exit criteria

- A real member token reads the active workspace and is denied report writes.
- A real admin token can reach an authorized write path.
- Missing/invalid token is denied before workspace data is queried.
- Wrong workspace and cross-workspace resource lookups do not disclose record existence.
- No client body or header role/user field can grant access.

## 7. Module E — deterministic domain service and read APIs

**Quick summary:** Keep rules in backend services and keep route handlers thin. Return known stored data and explicit uncertainty; a missing report or a non-match never means that a route is safe.

### Routes in the backend MVP

| Route | Behavior |
|---|---|
| `GET /api/v1/me` | Return verified local user and active workspace/role using the contract response. |
| `GET /api/v1/workspaces/{workspace_id}/trips` | List only workspace trips from Neon in stable order; return an empty array when none exist. |
| `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context` | Return ordered segments, relevant evidence, report freshness, relevance state/reason, and server `as_of`. |
| `GET /api/v1/workspaces/{workspace_id}/requests/{request_key}` | Resolve only the current verified actor's mutation receipt after an uncertain write. |

**Map-data boundary:** These endpoints may return prepared trip legs grounded in imported stops/routes, but current `TripSegmentView` has no coordinates, route ID, or geometry field. For now, the API returns only its contracted `mode`, `origin`, and `destination` fields. Do not send raw polylines or claim a rendered route map. If map visualization becomes part of the UI, revise `docs/api_contracts.md` first with exact coordinate order/CRS, nullable geometry rules, source/provenance fields, and payload-size limits.

Do not implement every endpoint in the wider contract automatically. Incident list/detail and event-list routes are out of this screen's minimum unless the agreed UI actually calls them; the event and receipt tables remain required for safe writes.

### Service rules

1. Scope every query by verified workspace ID, including nested report, trip, segment, and receipt lookups.
2. Keep API Pydantic models in the contract-designated module and reject extra mutation fields. Nullable properties appear explicitly as `null` in response/request examples where required.
3. Compute relevance from all eligible reports, not only the paginated evidence shown to the client.
4. Use exactly `affects_trip`, `not_affected`, or `unknown`; lifecycle status remains separate from derived freshness.
5. Missing, stale, future-dated, disputed, conflicting, or insufficiently located evidence must preserve uncertainty per the contract. A no-match response is described as “No match found in available reports,” never “safe.”
6. Centralize the documented 30/120-minute freshness cutoffs. They are assumptions, not validated thresholds; keep them configurable in one server-side policy and do not imply safety.
7. Use server timestamps for `as_of` and age calculations. Normalize API datetimes to UTC with `Z`.
8. Use keyset pagination and opaque cursors only where the selected endpoint contract requires it; validate malformed cursors with the stable error envelope.
9. Do not invent a route path by joining nearby stations or road vertices. Prepared trip connections must reference a known imported route/segment or remain explicitly unknown.

### Exit criteria

- Trip picker and context are read from Neon rather than fixtures or process memory.
- Relevant, nonmatching, unknown/missing, stale, disputed/conflicting, and empty-report cases match the contract.
- API responses conform to the documented models and error envelope.
- Relevance uses all qualifying stored reports even when evidence is displayed in pages.
- A prepared demo trip's known bus/MRT locations match normalized reference records; any unsupported transfer/path is shown as absent/unknown, not fabricated from the road CSV.

## 8. Module F — report creation, correction, and transaction safety

**Quick summary:** A report write is complete only when the report, its evidence-history event, and idempotency receipt commit together. Retries and concurrent edits must have explicit, safe outcomes.

### Create route

`POST /api/v1/workspaces/{workspace_id}/incidents`

- Require a verified `org:admin` and valid UUIDv4 `Idempotency-Key`.
- Validate the strict `IncidentCreate` contract; clients cannot choose workspace, actor, status, version, synthetic flag, or ownership.
- Set initial status/version/provenance on the server (`reported`, version 1, `is_synthetic=false`).
- In one explicit transaction, insert the report, initial event, and mutation receipt.
- Same actor/workspace/key plus same canonical payload replays the original outcome; same key with a different fingerprint returns `409 IDEMPOTENCY_KEY_REUSED`.

### Update route

`PATCH /api/v1/workspaces/{workspace_id}/incidents/{incident_id}`

- Require the same verified editor policy and an idempotency key.
- Require `expected_version`, a nonempty reason, and at least one allowed field change.
- Perform a compare-and-swap update filtered by workspace, report ID, and expected version; increment the version.
- Append a before/after event and write the request receipt in the same transaction.
- On a version race, make no report/history change; return `409 VERSION_CONFLICT` with safe current-version metadata and persist the definitive rejected receipt as specified.
- Preserve synthetic provenance; the update endpoint cannot relabel synthetic seed data as a real report or vice versa.

### Unknown outcomes

- Do not claim success after a timeout or lost connection.
- Let the client inspect the same actor/workspace/request-key receipt or repeat the identical operation with the same key and canonical payload.
- A `404` receipt lookup does not prove a concurrent original request rolled back; do not create a new key for an unresolved operation.
- Never blindly replay a create with a new key.

### Exit criteria

- One real editor create is committed remotely and visible to a fresh read from a second authorized member.
- Repeating the same operation/key does not duplicate a report or event.
- Reusing a key with different content is rejected.
- Concurrent updates with the same expected version produce one success and one explicit conflict.
- Failed or unknown writes never return a fabricated success.

## 9. Module G — health, startup, and Render packaging

**Quick summary:** Local development and Render run the same backend behavior with different configuration and Neon branches. Migrations must complete before the new service accepts traffic under the selected Render plan's supported method.

### Work

1. Implement `GET /health/live` as a bounded process liveness response.
2. Implement `GET /health/ready` as required-config plus bounded Neon connectivity check (`SELECT 1`). Return `503` when the critical database path is unavailable; do not expose secrets/provider internals.
3. Align `render.yaml` health path with `/health/ready`. First update `docs/api_contracts.md` from its current `/healthz` statement so the public contract and deployment plan agree.
4. Add Docker/static serving/startup assets per `docs/deployment_setup.md`. Keep unknown `/api/...` requests as JSON 404s rather than serving the React app fallback.
5. Bind to `0.0.0.0` and Render's runtime `PORT`; do not hardcode the production port into application configuration.
6. Run Alembic using the method supported by the verified Render plan: paid pre-deploy when available, or the documented single-instance startup migration trade-off for a Free demo. Never migrate in the Docker build and never have multiple scaled instances race migrations.
7. Keep local development pointed to the remote Neon development branch and Render pointed to a distinct deployment branch. Same source/schema/migrations; configuration only.

### Exit criteria

- Local API starts using the development branch and fails clearly with missing required configuration.
- Render serves the same API/application code using the deployment branch.
- Migration failure prevents readiness; successful migration and a bounded DB probe permit readiness.
- Live, ready, and unknown `/api` behavior are verified on the actual deployed service before claiming deployment.

## 10. Module H — backend verification and handoff

**Quick summary:** Verify contract behavior, authorization, migration safety, and actual remote persistence. Automated tests and live provider checks are separate evidence and must be reported separately.

### Required checks

- Schema/model validation: unknown fields, nullability, enum values, lengths, timestamp timezone, and required keys.
- Auth/access: missing/invalid session, member read, member write denial, admin write, wrong workspace, hidden cross-workspace resource.
- Domain rules: relevant report, no match, missing location/time/mode, stale/future observation, disputed or conflicting evidence, empty report set.
- Map import: JSON schema/version checks; latitude/longitude range checks; CSV variable-width row parsing; CSV-to-JSON segment-count and endpoint comparison; segment ordering/reference continuity; duplicate IDs; explicit metro mismatch handling; road CSV remains excluded until schema/provenance are confirmed.
- Writes: atomic report/event/receipt; same-key retry; changed-payload same key; unknown outcome reconciliation; optimistic version conflict.
- Persistence and migrations: clean forward migration on disposable remote Neon test branch; repeated seed; data survives new request/process restart; no user data overwrite.
- Deployment: exact health checks, API route smoke, one Clerk-authenticated deployed read/write if provider access permits.

Do not substitute mocked tokens or SQLite for live authorization/persistence acceptance. Unit tests may use dependency overrides for isolated logic, but label those results as unit/contract tests. Keep destructive/reset tests isolated to the disposable Neon branch.

### Commands

Run from `backend/` unless noted:

```powershell
uv sync --locked
uv run alembic upgrade head
uv run pytest -q
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`pytest` is a valid command only after the project adds and locks the test dependencies and test files. The local application still uses remote Neon; do not set up a local database to make tests pass.

### Handoff record

Record:

- Changed backend files and migration revision.
- Exact commands run and whether each is a unit, contract, remote Neon, Clerk, or deployed check.
- Neon branch class used (development, disposable test, or deployment), without branch credentials.
- Clerk role/account type used, without emails or tokens.
- Real API request path and observed response/error category, without secrets or private incident data.
- Render plan/migration method and actual health/read/write checks, or exact blocker.
- Remaining contract mismatches, unverified thresholds, and known omissions.

## 11. Ownership and stop conditions

**Quick summary:** Keep DB schema/auth/deployment ownership separate from endpoint/business-rule ownership. Stop and resolve a contract disagreement rather than adding a second schema or response format to make the code compile.

Based on the current team work cards:

- **Pantha Protick:** runtime configuration, DB session, SQLAlchemy models, Alembic, constraints/transactions, Clerk token verification/access dependency, startup/health, Docker/Render assets.
- **Tanvir Hasan Ratul:** API routes and service rules, request/response models integration, endpoints, API-level tests, and integration with the Clerk client/API contract.
- **Yousha Shahid:** frontend is outside this backend plan, but backend/UI contract mismatches should be sent to the integration owner before a screen workaround is introduced.

Stop and report a blocker if Clerk session/organization claims cannot be verified, Neon branches are not isolated, the selected Render plan cannot meet deployment requirements, or migration/schema/API documents disagree. Do not replace blocked baselines with mock auth, a local database, anonymous access, in-memory persistence, fabricated success, or a second hosted/local code path.

## 12. Unresolved contract decisions

**Quick summary:** These items must be closed deliberately because they affect route behavior, schema, or operations. The plan provides the intended direction but does not claim the source documents or providers are already aligned.

- **Health route mismatch:** This plan selects `/health/live` and `/health/ready`; `docs/api_contracts.md` still says `/healthz`. Update that contract and any implementation plan references before coding.
- **Entity naming:** Architecture calls the identity entity `LocalUser`; the implementation plan also uses `UserIdentity`. Choose one model name while reconciling the schema, without changing external API fields.
- **Read endpoint breadth:** The API contract includes incident list/detail/history endpoints beyond this MVP screen. Implement them only when a committed UI path needs them; retain write-side event persistence and request lookup.
- **Freshness thresholds:** 30/120-minute boundaries are assumptions; do not describe them as empirically validated.
- **Clerk SDK/version and claims:** Confirm `authenticate_request` options, accepted token types, organization claims, authorized-party behavior, and available roles for the actual installed version and account.
- **Neon and Render configuration:** Branch URLs, pooling support, connection limits, Render account/plan, and migration command support are provider-specific and remain unverified until preflight.

**Status:** This plan is an implementation guide. It is not evidence that backend code, Clerk, Neon, migrations, or Render deployment have been completed or verified.
