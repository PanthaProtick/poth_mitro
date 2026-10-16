# DhakaPath API contracts

- The current runtime is a single-operator local service without login.
- SQLite persistence, migrations, map import, and database readiness are implemented.
- `/api/v1/map-data/summary` reports only approximate source inventory and counts.
- Trip list/context reads, incident detail read-back, and idempotent report create/update endpoints are implemented; the incident collection list remains future work.
- Do not expose the unauthenticated service beyond loopback.

> **Contract status (2026-10-16):** The current local contract is specified below. The prior hosted Clerk/workspace/Neon contract is retained only as historical reference.

## Current local API contract

**Quick summary:** The current product is a local, single-operator service with persistent SQLite state. There is no login, workspace, client role, Neon, or Render path. Bind both development servers to loopback.

**Implementation status (2026-10-16):** Modules C, E, F, G, and H implement and locally verify SQLite configuration/schema/migrations, map import, demo seed, health and map-summary reads, trip list/context reads, and transactional incident create/update writes. Manual live-loopback checks covered write retries/conflicts, atomic rollback, migration/seed repeatability, and process-restart persistence on a disposable database. Rendered-browser acceptance remains unverified; no report-writing UI is connected yet.

### Runtime and identity boundary

- Browser requests use relative `/api/v1/...`; Vite proxies `/api` to FastAPI at `http://127.0.0.1:8000` and binds to `127.0.0.1:5173`.
- FastAPI binds to `127.0.0.1:8000`. Vite binds to `127.0.0.1:5173`.
- `DATABASE_PATH` selects the SQLite file; default `backend/data/dhakapath.db`. Missing configuration uses this documented default; connection/migration failure prevents readiness. No memory/standby write mode.
- No authentication or user/workspace entity exists in this phase. Treat the operator actor label as constant `local_operator`; never accept identity or role fields from clients. Do not expose the app to a LAN or internet.
- Local database fields use UUIDv4 strings for IDs, RFC 3339 UTC timestamps, nullable values as explicit JSON `null`, BDT whole-taka integers if ever added, and `snake_case` JSON. Unknown mutation properties are rejected.

### Routes

| Method and path | Contract |
|---|---|
| `GET /health/live` | `200 {"status":"live","environment":"development"}` when process is responsive. No DB claim. |
| `GET /health/ready` | `200 {"status":"ready","database":"sqlite","scope":"local_single_operator"}` only after expected migration and bounded SQLite probe succeed; otherwise `503` with the standard error envelope and `error.code="DATABASE_UNAVAILABLE"`. |
| `GET /api/v1/map-data/summary` | Read-only import status, source version/time, approximate quality label, and route/stop/segment/source-file counts. It returns no coordinates or geometry. Empty database returns `status:"empty"`. |
| `GET /api/v1/trips?limit=20&cursor=...` | Local trip list ordered by `(origin,destination,id)` and displayed as `origin to destination`; `limit` integer 1–50, optional opaque cursor. Response `{items:[TripSummary],next_cursor:string|null}`; an empty list returns `items:[]`. |
| `GET /api/v1/trips/{trip_id}/context?report_limit=20&report_cursor=...` | Trip, ordered segments (each has `route_reference_available` and nullable `route_data_quality`), paged reports linked to its stored route references, `as_of`, `evidence_total`, `reports_next_cursor`, and deterministic relevance. Missing trip is `404`; malformed cursors are `400`; limits outside 1–50 are `422`. This API returns no geometry. |
| `GET /api/v1/incidents?status=...&limit=20&cursor=...` | Planned, not implemented: local report list, optional lifecycle status filter, ordered by `(created_at DESC,id DESC)`. |
| `GET /api/v1/incidents/{incident_id}` | Implemented. Read back one locally stored report; missing ID returns `404 RESOURCE_NOT_FOUND`. |
| `POST /api/v1/incidents` | Implemented. Create a report; returns `201` with persisted report data. Requires an `Idempotency-Key` UUIDv4 header. |
| `PATCH /api/v1/incidents/{incident_id}` | Implemented. Update report with required `expected_version`, non-empty `reason`, and at least one allowed field; requires `Idempotency-Key` UUIDv4. Stale version returns `409 VERSION_CONFLICT`. |

`TripSummary` fields: `id`, `name`, `is_synthetic`. Trip context includes `trip: {id,name,is_synthetic,segments:[{id,ordinal,mode,origin,destination,route_reference_available,route_data_quality}]}`; segment `id` is an integer, and segments are ordered one-based. `route_reference_available=false` explicitly means the leg is not checked against route-linked reports; `route_data_quality` is null or `approximate` for this imported source. Incident response fields include `id,kind,title,description,location,route_id,mode,direction,observed_at,age_minutes,freshness,source_type,status,is_synthetic,version,created_at,updated_at,actor_label,confirmation_note`. `route_id` is nullable; incident `mode` and `direction` may be null in evidence responses; `actor_label` is always `local_operator`, not a verified identity. Create requires `kind` (1–80), `title` (1–160), `location` (1–200), `mode` (1–80), `source_type` (`traveller_report|operator_notice|staff_observation`), and optionally `description` (max 2000), `direction` (max 120), `route_id` (existing local route), and `observed_at` (RFC 3339 with timezone). The client cannot set ID, status, version, actor, or synthetic provenance. The server sets status=`reported`, version=1, `is_synthetic=false`, timestamps, and actor label. The API preserves the submitted source label in `report_source`; the storage `source_type` remains `rider_report` for nonsynthetic user/operator reports. Update accepts `expected_version`, a non-empty `reason`, and at least one field among `kind,title,description,location,mode,direction,route_id,observed_at,status,confirmation_note`; identity and synthetic provenance cannot change. Status is `reported|confirmed|disputed|resolved`; freshness is `current` 0–30m, `aging` 31–120m, `stale` >120m, or `unknown`. Missing time, mode, or location, future/stale time, disputed/conflicting evidence, or incomplete route references preserve `unknown` relevance. These time thresholds remain assumptions, not validated evidence.

### Error, write, and persistence rules

- Errors use `{error:{code,message,fields},request_id,meta}`. Write errors include `400 IDEMPOTENCY_KEY_REQUIRED|INVALID_IDEMPOTENCY_KEY`; `404 RESOURCE_NOT_FOUND`; `409 VERSION_CONFLICT|IDEMPOTENCY_KEY_REUSED`; and `422 VALIDATION_ERROR`. A version conflict places `current_version` in `meta`. No auth errors exist in local scope.
- A report mutation, its `IncidentEvent`, and its `MutationReceipt` commit in one transaction. Event rows are append-only. Repeating an idempotency key with the same method/path/canonical payload returns the original status and body; a different request with the same key returns `409 IDEMPOTENCY_KEY_REUSED`. Definitive update-not-found and version-conflict responses are receipted too.
- SQLite is the source of truth. Seed trips/map catalog idempotently; never overwrite operator reports on reseed. Preserve provenance and `is_synthetic` labels.
- Relevance is deterministic and conservative: `affects_trip|not_affected|unknown`; missing mode/location/time, stale/future time, disputed/conflicting evidence, and incomplete route references preserve uncertainty. A no-match is phrased “No match found in available reports,” never “safe.”

### Setup contract and known starter gaps

```text
# backend/.env (local, ignored)
DATABASE_PATH=data/dhakapath.db
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

Backend commands from repository root: `cd backend`; `uv sync --locked`; `uv run alembic upgrade head`; `uv run python -m app.scripts.map_data import`; `uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`. Frontend commands from repository root: `cd frontend`; `npm ci`; `npm run dev -- --host 127.0.0.1`. Keep the API base relative in Vite; do not put secrets in frontend env values. Local API behavior was manually exercised against a disposable database; report form/UI integration remains later work.

**Implementation status:** Module C added Alembic, SQLite readiness, and `/api/v1/map-data/summary`; Module E added database-backed trip reads; Module F added report detail read-back, transactional create/update APIs, and the `20261016_02` migration; Module H verified the local runtime writes, retries, conflicts, atomic rollback, and restart persistence. Rendered-browser acceptance remains unverified; the frontend has no report creation/correction form.

## Historical remote contract (not current)

- **Purpose:** Freeze the browser–API–database contracts before backend implementation.
- **Authentication:** Send a real Clerk session token as `Authorization: Bearer`; FastAPI verifies it and derives the active organization and role.
- **Access:** Members read trips and reports; only workspace admins create or update reports; all queries are workspace-scoped.
- **Writes:** A request key makes retries safe; version checks prevent one editor from silently overwriting another; report and history changes commit together.
- **Status:** These are proposed implementation contracts. The current starter does not yet implement these routes, Pydantic models, migrations, or real Clerk verification.

## 1. Human overview and decisions

**Quick summary:** The UI loads a page of trips, reads one trip's current report context, and lets an authorized editor create or correct a shared report. Successful writes are visible to another authorized member after refresh; browser state is never the source of truth.

**DECISION — scope:** Contracts cover the shared trip/report workflow in `docs/mvp.md`, the read-only representative screen in `docs/frontend_design.md`, and the one-service architecture in `docs/architecture.md`. They do not add citywide route search, chat, maps, or pharmacy entities. “Workspace” means a Clerk Organization.

**DECISION — contract version:** All routes start with `/api/v1`. JSON uses `snake_case`, UTF-8, and `application/json`. Unknown properties in mutation requests are rejected. Response objects may add optional fields only in a compatible version; removing or changing a field's meaning requires a version change.

**DECISION — errors:** Every API error uses the same `ErrorEnvelope`. `request_id` is safe to show to support staff; it is not an identity token. Validation details identify fields without echoing secrets.

**FACT — implementation status:** The current React adapter and screen are preliminary. The backend still has no database-backed trip/report routes, migrations, Clerk verification, or persistent report write path. Nothing in this document claims that those contracts have been live-tested.

## 2. Shared data rules and identity

**Quick summary:** The server obtains identity and authority from the verified Clerk token, never from form fields. Local UUIDs identify DhakaPath rows; the active Clerk Organization ID scopes each shared row.

### IDs, timestamps, units, and nulls

| Value | Contract |
|---|---|
| `workspace_id` | Clerk Organization ID string, such as `org_2abc`; comes from the verified active-org claim. A path value is only a requested scope and must match that claim. |
| `user_id` / `actor_id` | Local UUID for a `LocalUser` row. The unique external identity is `(issuer, subject)`, where `issuer` is the configured Clerk instance issuer and `subject` is the verified Clerk `sub` (Clerk user ID). Store the subject for audit; never use an email address as identity. |
| `trip_id`, `segment_id`, `incident_id`, `event_id` | UUIDv4 strings generated by the server or migration seed. Clients treat IDs as opaque and never choose another user's row by guessing an ID. |
| `request_key` | Client-generated UUIDv4, reused for every retry of the same mutation. It identifies an attempted write, not a person or authorization grant. |
| Timestamps | RFC 3339 date-time with an explicit offset in requests; server responses normalize to UTC with `Z`, e.g. `2026-10-16T02:30:00Z`. Precision is microseconds or less. `observed_at` may be null if unknown. |
| Money | BDT as integer whole taka (`fare_bdt`) if later added. No money field is part of the trip-context response in this MVP contract. |
| Pagination | `limit` is an integer 1–50. Cursor is opaque URL-safe text, optional on first page. Empty collections are `[]`, never null. |
| Optional text | Response fields defined as nullable are always present and use JSON `null` when unknown. Required text cannot be empty after trimming. Never invent missing evidence. |
| `is_synthetic` | Required boolean on trips and reports. `true` means illustrative seeded content, not a real or verified Dhaka observation. |

### Identity mapping and session verification

**DECISION:** The React client asks Clerk for a current session token and sends it as a bearer token on each API request:

```http
Authorization: Bearer eyJ...<short-lived Clerk session token>
```

Do not send a Clerk secret, publishable key, role, `user_id`, or authoritative organization ID in a JSON body. The publishable key may be used by the browser SDK configuration; it is not the backend credential. The FastAPI service uses the official Clerk Python backend SDK with `accepts_token=["session_token"]`, a configured supported verification key/secret, and an explicit allowed-origin/authorized-party list. It verifies signature, issuer, expiry, authorized party, and signed-in state before reading claims. It fails closed if verification is unavailable or invalid. It must not decode an unverified JWT and trust its claims.

On the first authenticated request, resolve or create a local `LocalUser` row under a unique `(issuer, subject)` constraint. Display name/email may be refreshed as non-authoritative profile data; neither grants access. Organization membership and role come from the verified token's active organization claims (`org_id`/`org_role`, or their documented compact equivalents as decoded by the SDK version). The server maps `org:member` to read and `org:admin` to read/write. Other or missing roles have no implied access.

**Provisioning:** Create the demo Organization and add test users in Clerk Dashboard before using the app. Give editors the supported `org:admin` role and travellers `org:member`. No public self-registration automatically creates a workspace, membership, or editor role. A Clerk admin/authorized organization workflow provisions changes. Refresh the session after role or membership changes; because claims can be briefly stale, sensitive actions must be tested after refresh. Do not maintain a second locally editable membership table as an authority.

**401/403/404 boundary:** No/invalid/expired token is `401`. A valid signed-in user with no active workspace claim receives `403 WORKSPACE_ACCESS_REQUIRED`. A valid member requesting a path workspace that differs from the token's active workspace receives `404 RESOURCE_NOT_FOUND`, as does a missing or cross-workspace resource; this avoids confirming that another workspace's row exists. A member attempting an admin-only mutation receives `403 ROLE_REQUIRED`. A matching active workspace and authorized role proceeds to resource validation.

The user selects or switches organizations through Clerk's organization UI/SDK. That action changes Clerk's active organization and produces a token with the new active-org claims. React clears prior workspace data and pending forms, obtains the new token, then reloads. It does not send the role as authority; the API derives it again from the verified token.

**Identity fields clients must never supply as authority:** `sub`, `user_id`, `actor_id`, `issuer`, `org_id`, `workspace_id` (except as requested path scope), `org_role`, `role`, membership, ownership, creator/updater IDs, or any `is_admin`/`is_editor` flag. The API ignores or rejects these in request bodies.

Clerk reference: [session token claims](https://clerk.com/docs/guides/sessions/session-tokens), [authenticateRequest](https://clerk.com/docs/reference/backend/authenticate-request), and [manual JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification). The SDK must be pinned and its Python option names confirmed during implementation.

### Entity access matrix

| Entity | Owner/scope | Read | Create/update | Delete |
|---|---|---|---|---|
| Workspace | Clerk Organization | Active members, through verified active-org claim | Provisioned through Clerk | Out of MVP scope |
| LocalUser | One external Clerk subject | Own identity response; admin may see actor ID in history | Server upsert after verified authentication | Out of MVP scope |
| Trip / TripSegment | One workspace | Active `org:member` or `org:admin` | Admin-managed seed process only in this MVP; no public trip-edit route | Out of scope |
| IncidentReport | One workspace | Active member/admin | `org:admin` only | No hard delete; lifecycle status changes preserve evidence |
| IncidentEvent | Same workspace as report | Active member/admin for that report | Server only, in same transaction as a report mutation | Append-only; no API delete |
| MutationReceipt | Workspace + verified actor + request key | Same actor only via status lookup | Server only | Retention cleanup is a later policy; do not expose another actor's receipt |

## 3. HTTP behavior, errors, and time limits

**Quick summary:** Every protected endpoint requires the same Clerk bearer session and verified workspace membership. Errors are predictable, writes have finite timeouts, and an interrupted write is treated as unknown until checked.

### Common response and error shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": [{"name": "observed_at", "issue": "must include a timezone offset"}]
  },
  "request_id": "req_01J...",
  "meta": null
}
```

`error.fields` is nullable and contains `{name: string, issue: string}` entries for field errors. `meta` is null except for safe conflict metadata such as `{"current_version":2}`. `request_id` is a server-generated opaque string. Do not return SQL, stack traces, provider secrets, or private data belonging to another workspace.

| HTTP | Codes | Meaning and recovery |
|---|---|---|
| `400` | `INVALID_CURSOR`, `IDEMPOTENCY_KEY_REQUIRED`, `INVALID_IDEMPOTENCY_KEY` | Correct the cursor or send a valid UUIDv4 mutation key. |
| `401` | `AUTHENTICATION_REQUIRED`, `SESSION_INVALID` | Missing, expired, invalid, or wrong-type credential. Obtain a fresh Clerk session, then retry a read. Do not retry a mutation with a new key until its old key is inspected. |
| `403` | `WORKSPACE_ACCESS_REQUIRED`, `ROLE_REQUIRED` | Valid identity lacks membership or the required editor role. Do not reveal whether a hidden workspace row exists. Refresh session after authorized provisioning. |
| `404` | `RESOURCE_NOT_FOUND`, `REQUEST_NOT_FOUND` | Resource is absent from the caller's authorized workspace, or actor-owned request key is unknown. Cross-workspace records also return `404`. |
| `409` | `VERSION_CONFLICT`, `IDEMPOTENCY_KEY_REUSED` | Current entity has changed or same key was used with different content. Fetch current state; preserve user's draft and reconcile. |
| `422` | `VALIDATION_ERROR` | Invalid body, field value, date, or enum. Keep user input and show field errors. |
| `503` | `DATABASE_UNAVAILABLE`, `AUTH_PROVIDER_UNAVAILABLE`, `SERVICE_UNAVAILABLE` | Dependency failed or timed out. For a read, retry manually and keep clearly stale last-loaded content. For a write, inspect the original `request_key`; never assume rollback. |
| `504` | `REQUEST_DEADLINE_EXCEEDED` | API deadline reached. A GET can be retried. A write has unknown outcome and must be reconciled by its original key. |

**Timeout policy (DECISION):** Browser abort deadline is 8 seconds. API request budget is 6 seconds. Database pool acquisition is bounded to 1 second and all SQL work shares a maximum 4-second budget. Clerk verification uses supported local/cached verification where configured; if key retrieval is needed, it must fit within the remaining API budget or fail with `503`. No write is automatically replayed after timeout. These are initial contract budgets; measure and tune them before release without exceeding the browser's 8-second deadline. Return `503/504` with a request ID and log dependency timing, not credentials or full bearer tokens.

### List and detail refresh rules

Lists use keyset pagination, not offset pagination. Sort trips by `(name ASC, id ASC)` and reports/events by `(created_at DESC, id DESC)`. A cursor is opaque URL-safe base64 encoding of a versioned last-seen sort key and ID, such as `eyJ2IjoxLCJuYW1lIjoiTWlycHVyIDEwIiwiaWQiOiIyZDI1NDU3Ny0zMTc5LTQyZTUtODJhMy0yZjFjOGVhMTUwZWYifQ`; clients must not decode or edit it. A cursor is not an authorization grant. Every page rechecks the active workspace and membership. Inserts before a report cursor do not reorder or duplicate already-read rows. The client may refresh from page one to see new items. Manual refresh is sufficient; no polling or event stream is required.

Detail routes are addressed by opaque resource UUIDs under a workspace route. The server scopes the query by both `workspace_id` and resource ID. A detail in another workspace is `404`, never a successful empty object. After workspace switch/sign-out, the client cancels pending work and clears protected data before loading the new workspace.

## 4. Endpoint contracts

**Quick summary:** These routes cover identity, trip selection/context, report lists/details, and editor writes/history. Each request's path workspace is checked against the verified active Clerk organization before data is queried.

All endpoints use HTTPS in deployment and same-origin `/api` locally. JSON bodies are UTF-8. Protected endpoints reject absent authentication before accessing workspace data.

### `GET /api/v1/me`

**Producer:** FastAPI identity resolver. **Consumer:** React account/workspace shell.

Request: no body; bearer token required. The client supplies no identity or role query parameters.

Response `200`:

```json
{
  "user": {"id": "5bb2a74e-cc45-4f75-a149-56fd224c1211", "display_name": "Asha Rahman"},
  "active_workspace": {"id": "org_demo123", "name": "DhakaPath Demo", "role": "org:member"}
}
```

`user.id` is local UUID; `display_name` is nullable presentation text. Workspace name may be null if not available from a trusted configured source; the UI can use a neutral label. `role` is one of `org:member`, `org:admin`. No active organization returns `403 WORKSPACE_ACCESS_REQUIRED` for this shared-workspace product. `401` for missing/invalid session. FastAPI does not fetch organization profile on every request; `name` can be configured or served from a local display cache, never used for authorization.

### `GET /api/v1/workspaces/{workspace_id}/trips`

**Producer:** workspace-scoped trip query. **Consumer:** Trip picker. Authenticated active member or admin may read.

Query: `limit` defaults to `20`, integer 1–50; `cursor` optional opaque keyset cursor. Unknown query parameters are ignored only if harmless; malformed cursors return `400 INVALID_CURSOR`.

Response `200`:

```json
{
  "items": [
    {"id": "2d254577-3179-42e5-82a3-2f1c8ea150ef", "name": "Mirpur 10 to Shahbagh", "is_synthetic": true}
  ],
  "next_cursor": null
}
```

All fields shown are required. `items` may be `[]`; `next_cursor` is null on the last page. `id` is UUID; name is 1–120 trimmed characters; `is_synthetic` is boolean. Trips sort by name then ID. The returned page is from the requested workspace only. `401`, `403`, `503` as defined above.

### `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context`

**Producer:** FastAPI joins a trip, its ordered segments, and relevant active reports, then applies the deterministic matching rule. **Consumer:** Trip Brief. Read allowed to members/admins.

Request: no body. `trip_id` is UUID. `report_limit` defaults to 20, integer 1–50; `report_cursor` is optional. Server checks membership, then finds the trip by both IDs. Return `404 RESOURCE_NOT_FOUND` if missing or outside the workspace. Relevance is computed across all eligible reports for this trip, independent of the evidence page. Returned evidence uses stable keyset order `(created_at DESC, id DESC)`; `evidence_total` reports the total count and `reports_next_cursor` points to the next page. Refresh restarts at the first page and obtains a new `as_of`; pages from different refresh times must not be presented as one snapshot.

Response `200`:

```json
{
  "as_of": "2026-10-16T02:30:00Z",
  "relevance": {
    "state": "affects_trip",
    "reason": "A report matches the Farmgate segment and the trip's road mode; its direction is unknown."
  },
  "trip": {
    "id": "2d254577-3179-42e5-82a3-2f1c8ea150ef",
    "name": "Mirpur 10 to Shahbagh",
    "is_synthetic": true,
    "segments": [
      {"id": "bc24d501-8e9b-48b4-871d-cb848a808caa", "ordinal": 1, "mode": "MRT-6", "origin": "Mirpur 10", "destination": "Farmgate"},
      {"id": "c34da1ca-e1ac-48ac-9433-03e3819b8cbe", "ordinal": 2, "mode": "Bus", "origin": "Farmgate", "destination": "Shahbagh"}
    ]
  },
  "evidence_total": 1,
  "reports": [
    {
      "id": "08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b",
      "title": "Waterlogging reported near Farmgate",
      "location": "Farmgate",
      "mode": "Road traffic",
      "direction": null,
      "observed_at": "2026-10-16T02:15:00Z",
      "age_minutes": 15,
      "freshness": "current",
      "source_type": "synthetic_example",
      "status": "reported",
      "description": "Water reported beside the north entrance.",
      "confirmation_note": null,
      "is_synthetic": true,
      "version": 1
    }
  ],
  "reports_next_cursor": null
}
```

`as_of` is the UTC time the server assembled this response. `relevance.state` is exactly `affects_trip`, `not_affected`, or `unknown`. Precedence is conservative: any matching `reported` item with `freshness=current|aging` yields `affects_trip`; otherwise a potentially matching `disputed`, stale, or incomplete item yields `unknown`; return `not_affected` only when no report matches and every relevant candidate has enough location/mode information to compare. Missing direction alone does not erase a known location/mode match. A stale item remains visible evidence and is not treated as resolved. `reason` is required plain English, max 500 characters. The UI must label `not_affected` as “No match found in available reports,” not “safe.” `segments` are ordered by positive one-based `ordinal`; mode/origin/destination are nullable. `evidence_total` is the total number of report rows in the context evidence set. `reports` is one page and may be empty. `reports_next_cursor` is null on the last page. `observed_at`, `direction`, `title`, `location`, `mode`, `description`, `confirmation_note` may be null. `age_minutes` is the floored non-negative number of minutes between `observed_at` and `as_of`, or null when observation time is missing or later than `as_of`. `freshness` is `current` for 0–30 minutes, `aging` for 31–120 minutes, `stale` for over 120 minutes, and `unknown` when observation time is missing or later than `as_of`. These thresholds are an explicit **ASSUMPTION** for the prototype, not validated transit evidence; keep them in one server setting and test with users before relying on them. `source_type` is `traveller_report`, `operator_notice`, `staff_observation`, or `synthetic_example`. `status` is `reported`, `disputed`, or `resolved`. Resolved reports are excluded from active matching. `version` is positive integer. No database IDs of unrelated workspaces are returned.

### `GET /api/v1/workspaces/{workspace_id}/incidents`

**Producer:** workspace-scoped report list. **Consumer:** editor list and report lookup. Active members/admins may read. Query: `status` optional enum; `limit` default 20/max 50; `cursor` optional. Sort by `(created_at DESC, id DESC)`. The response's `as_of` sets the reference time for each item's age/freshness fields. Response example:

```json
{
  "as_of": "2026-10-16T02:30:00Z",
  "items": [
    {"id": "08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b", "title": "Waterlogging reported near Farmgate", "location": "Farmgate", "mode": "Road traffic", "direction": null, "observed_at": "2026-10-16T02:15:00Z", "age_minutes": 15, "freshness": "current", "source_type": "synthetic_example", "status": "reported", "is_synthetic": true, "version": 1, "updated_at": "2026-10-16T02:20:00Z"}
  ],
  "next_cursor": null
}
```

Response list fields are required; nullable details are explicit nulls. Query invalid enum or limit returns `422`. Workspace member/admin read is allowed. Cross-workspace data is never included.

### `GET /api/v1/workspaces/{workspace_id}/incidents/{incident_id}`

**Producer:** report detail query. **Consumer:** editor form or reconciliation after an uncertain write. Any workspace member may read; ID must be UUID and be in the verified workspace. Response `200`:

```json
{"as_of":"2026-10-16T02:30:00Z","id":"08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b","title":"Waterlogging reported near Farmgate","location":"Farmgate","mode":"Road traffic","direction":null,"observed_at":"2026-10-16T02:15:00Z","age_minutes":15,"freshness":"current","source_type":"traveller_report","status":"reported","description":"Water reported beside the north entrance.","confirmation_note":null,"is_synthetic":false,"version":1,"created_at":"2026-10-16T02:20:00Z","updated_at":"2026-10-16T02:20:00Z","created_by":"5bb2a74e-cc45-4f75-a149-56fd224c1211","updated_by":"5bb2a74e-cc45-4f75-a149-56fd224c1211"}
```

This is `IncidentDetail`; nullable evidence is explicit null. Missing/cross-workspace is `404`. This GET is the reconciliation read; use it only after authorization.

### `POST /api/v1/workspaces/{workspace_id}/incidents`

**Producer:** authorized report editor. **Consumer:** FastAPI validates and transactionally inserts report, first event, and mutation receipt. Requires `org:admin`.

Headers: bearer session and `Idempotency-Key: 2a6ec7a4-57b8-4f51-9859-e22b284c3147` (UUIDv4). The same key and same canonical validated payload by the same actor/workspace return the original result; JSON property order and insignificant whitespace do not matter. The same key with a different canonical payload returns `409 IDEMPOTENCY_KEY_REUSED`. A different actor's key is not visible.

Request example:

```json
{
  "title": "Waterlogging reported near Farmgate",
  "location": "Farmgate",
  "mode": "Road traffic",
  "direction": null,
  "observed_at": "2026-10-16T08:15:00+06:00",
  "source_type": "traveller_report",
  "description": "Water reported beside the north entrance."
}
```

All keys are required; nullable values must be explicit null. `title` 1–160 chars, `location` 1–200, `mode` 1–80, `direction` max 120 or null, `observed_at` timestamp or null, `source_type` from the enum above, and `description` max 2,000 or null. The user cannot set `status`, `version`, `is_synthetic`, IDs, workspace, owner, creator/updater, or confirmation note. New report status is server-set `reported`, version 1, and `is_synthetic=false`. Only the controlled seed process may create synthetic rows, which must be visibly disclosed.

First response `201 Created`:

```json
{
  "request_key": "2a6ec7a4-57b8-4f51-9859-e22b284c3147",
  "replayed": false,
  "incident": {
    "as_of": "2026-10-16T02:30:00Z",
    "id": "08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b",
    "title": "Waterlogging reported near Farmgate",
    "location": "Farmgate",
    "mode": "Road traffic",
    "direction": null,
    "observed_at": "2026-10-16T02:15:00Z",
    "age_minutes": 15,
    "freshness": "current",
    "source_type": "traveller_report",
    "status": "reported",
    "description": "Water reported beside the north entrance.",
    "confirmation_note": null,
    "is_synthetic": false,
    "version": 1,
    "created_at": "2026-10-16T02:20:00Z",
    "updated_at": "2026-10-16T02:20:00Z",
    "created_by": "5bb2a74e-cc45-4f75-a149-56fd224c1211",
    "updated_by": "5bb2a74e-cc45-4f75-a149-56fd224c1211"
  }
}
```

Successful retry with the same key and payload returns `200 OK`, the same incident and request key, with `replayed: true`. The browser treats both as confirmed success. `401`, `403`, `422`, `503`, or `504` behave as in the common table. After timeout, call request-status lookup below with the original key; do not send a second create with a new key.

### `PATCH /api/v1/workspaces/{workspace_id}/incidents/{incident_id}`

**Producer:** authorized editor correcting an existing report. **Consumer:** FastAPI performs compare-and-swap update, appends an event, and records the idempotency receipt in one database transaction. Requires `org:admin`.

Headers: bearer session, `Idempotency-Key` UUIDv4. Request example:

```json
{
  "expected_version": 1,
  "status": "disputed",
  "reason": "A second traveller reported that this entrance is dry.",
  "description": "The first report remains on record; a later observation disputes it.",
  "confirmation_note": "One conflicting report; no independent verification."
}
```

`expected_version` and `reason` are required. Editable fields (`status`, `title`, `location`, `mode`, `direction`, `observed_at`, `source_type`, `description`, `confirmation_note`) are optional. An omitted field remains unchanged; an included nullable field set to `null` clears it. Non-null field bounds/enums match create. At least one editable field must be supplied. `reason` is 1–500 characters and becomes the event reason. `is_synthetic` cannot be changed by this endpoint; original provenance stays stable. Clients cannot supply workspace, actor, version-after-update, event IDs, or timestamps.

Response `200` uses the mutation response envelope with `replayed: false` and `incident.version = expected_version + 1`. If current version differs, response `409` is `{"error":{"code":"VERSION_CONFLICT","message":"This report changed. Reload it before saving.","fields":null},"request_id":"req_01J...","meta":{"current_version":2}}`; the client then GETs the incident and asks the editor to compare. No field update or history event is committed on conflict. A rejected mutation receipt stores the key/fingerprint and rejection so the same key cannot later mean a different update. After refreshing and changing `expected_version` or body, the client starts a new deliberate attempt with a new key.

### `GET /api/v1/workspaces/{workspace_id}/incidents/{incident_id}/events`

**Producer:** append-only event query. **Consumer:** member/editor report history. Workspace members may read. Query uses same `limit`/cursor contract; order `(created_at DESC, id DESC)`. Response example:

```json
{
  "items": [
    {"id": "c708a623-0206-43ac-a91a-b26a671c62fb", "incident_id": "08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b", "actor_type": "user", "actor_id": "5bb2a74e-cc45-4f75-a149-56fd224c1211", "kind": "status_changed", "old_status": "reported", "new_status": "disputed", "reason": "A second traveller reported that this entrance is dry.", "before": {"location":"Farmgate","description":"Water reported beside the north entrance."}, "after": {"location":"Farmgate","description":"The first report remains on record; a later observation disputes it."}, "created_at": "2026-10-16T02:24:00Z"}
  ],
  "next_cursor": null
}
```

Events are immutable. For `actor_type=user`, `actor_id` is a local UUID, not a credential; for `actor_type=seed`, it is null. Older descriptions/fields are retained in event snapshots or field-change data so a correction never erases the original evidence. Do not expose the actor's email or other profile details in this response.

### `GET /api/v1/workspaces/{workspace_id}/requests/{request_key}`

**Producer:** mutation-receipt query. **Consumer:** client resolving a timeout or lost response. Only the verified actor who created the scoped key may inspect it; a key belonging to another actor returns `404 REQUEST_NOT_FOUND`.

Response `200` when the write committed:

```json
{"request_key":"2a6ec7a4-57b8-4f51-9859-e22b284c3147","state":"committed","resource_type":"incident","resource_id":"08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b","completed_at":"2026-10-16T02:20:00Z","error_code":null}
```

Response `200` for a definitive rejected version conflict is `{"request_key":"...","state":"rejected","resource_type":"incident","resource_id":"08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b","completed_at":"2026-10-16T02:24:00Z","error_code":"VERSION_CONFLICT"}`. There is no externally visible `pending` state: success receipt and data change commit atomically; a rejected receipt commits only the rejection outcome. `404` means no completed receipt exists for this actor/workspace/key at query time. The original request could still be running; wait briefly, query again, or safely repeat the exact same POST/PATCH with the same key and canonical operation fingerprint. A unique database constraint makes that retry either return the completed outcome or perform the write once after rollback. Never generate a new key for the uncertain operation.

### `GET /health/live` and `GET /health/ready`

**Producer:** FastAPI service. **Consumer:** Render health monitor and deployment tooling. No session required. `GET /health/live` reports only that the process is running and returns `200 {"status":"ok"}`; it does not prove database readiness. `GET /health/ready` returns `200 {"status":"ok"}` only when required runtime configuration is present and a bounded database probe succeeds; otherwise it returns `503` without exposing secrets or provider details. Configure Render's health check to `/health/ready`. Migration/configuration failure must prevent readiness; never let a health probe wait indefinitely on Neon.

## 5. Pydantic models

**Quick summary:** Request models reject extra fields and validate lengths, enums, IDs, and timestamps. Response models make nullable evidence explicit so React fixtures and live JSON use the same shape.

The following is the exact target schema for Python 3.12 and Pydantic v2. Put these definitions in `backend/app/models/contracts.py`; route code may add database logic but must not reshape the JSON ad hoc. The example `UUID`/`datetime` values serialize to strings in JSON. `model_config` rejects unrecognized request fields.

```python
from datetime import datetime, timezone
from enum import StrEnum
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints, field_serializer, model_validator

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


def normalize_aware_datetime(value: datetime) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError("timestamp must include a timezone offset")
    return value.astimezone(timezone.utc)


UTCDateTime = Annotated[datetime, AfterValidator(normalize_aware_datetime)]


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @field_serializer("*", when_used="json")
    def serialize_utc_datetimes(self, value):
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        return value


class StrictRequest(ContractModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Role(StrEnum):
    MEMBER = "org:member"
    ADMIN = "org:admin"


class RelevanceState(StrEnum):
    AFFECTS_TRIP = "affects_trip"
    NOT_AFFECTED = "not_affected"
    UNKNOWN = "unknown"


class IncidentStatus(StrEnum):
    REPORTED = "reported"
    DISPUTED = "disputed"
    RESOLVED = "resolved"


class FreshnessState(StrEnum):
    CURRENT = "current"
    AGING = "aging"
    STALE = "stale"
    UNKNOWN = "unknown"


class SourceType(StrEnum):
    TRAVELLER_REPORT = "traveller_report"
    OPERATOR_NOTICE = "operator_notice"
    STAFF_OBSERVATION = "staff_observation"
    SYNTHETIC_EXAMPLE = "synthetic_example"


class UserSourceType(StrEnum):
    TRAVELLER_REPORT = "traveller_report"
    OPERATOR_NOTICE = "operator_notice"
    STAFF_OBSERVATION = "staff_observation"


class EventKind(StrEnum):
    CREATED = "created"
    CORRECTED = "corrected"
    STATUS_CHANGED = "status_changed"


class ActorType(StrEnum):
    USER = "user"
    SEED = "seed"


class UserView(ContractModel):
    id: UUID
    display_name: str | None


class WorkspaceView(ContractModel):
    id: str = Field(pattern=r"^org_[A-Za-z0-9]+$")
    name: str | None
    role: Role


class MeResponse(ContractModel):
    user: UserView
    active_workspace: WorkspaceView


class TripListItem(ContractModel):
    id: UUID
    name: str = Field(min_length=1, max_length=120)
    is_synthetic: bool


class TripListResponse(ContractModel):
    items: list[TripListItem]
    next_cursor: str | None


class TripSegmentView(ContractModel):
    id: UUID
    ordinal: int = Field(ge=1)
    mode: str | None = Field(max_length=80)
    origin: str | None = Field(max_length=200)
    destination: str | None = Field(max_length=200)


class TripView(ContractModel):
    id: UUID
    name: str = Field(min_length=1, max_length=120)
    is_synthetic: bool
    segments: list[TripSegmentView]


class ReportView(ContractModel):
    id: UUID
    title: str | None = Field(max_length=160)
    location: str | None = Field(max_length=200)
    mode: str | None = Field(max_length=80)
    direction: str | None = Field(max_length=120)
    observed_at: UTCDateTime | None
    age_minutes: int | None = Field(ge=0)
    freshness: FreshnessState
    source_type: SourceType
    status: IncidentStatus
    description: str | None = Field(max_length=2000)
    confirmation_note: str | None = Field(max_length=500)
    is_synthetic: bool
    version: int = Field(ge=1)


class RelevanceView(ContractModel):
    state: RelevanceState
    reason: str = Field(min_length=1, max_length=500)


class TripContextResponse(ContractModel):
    as_of: UTCDateTime
    relevance: RelevanceView
    trip: TripView
    evidence_total: int = Field(ge=0)
    reports: list[ReportView]
    reports_next_cursor: str | None


class IncidentCreate(StrictRequest):
    title: Annotated[ShortText, Field(max_length=160)]
    location: Annotated[ShortText, Field(max_length=200)]
    mode: Annotated[ShortText, Field(max_length=80)]
    direction: str | None = Field(max_length=120)
    observed_at: UTCDateTime | None
    source_type: UserSourceType
    description: str | None = Field(max_length=2000)


class IncidentUpdate(StrictRequest):
    expected_version: int = Field(ge=1)
    reason: Annotated[ShortText, Field(max_length=500)]
    status: IncidentStatus | None = None
    title: Annotated[ShortText, Field(max_length=160)] | None = None
    location: Annotated[ShortText, Field(max_length=200)] | None = None
    mode: Annotated[ShortText, Field(max_length=80)] | None = None
    direction: str | None = Field(default=None, max_length=120)
    observed_at: UTCDateTime | None = None
    source_type: UserSourceType | None = None
    description: str | None = Field(default=None, max_length=2000)
    confirmation_note: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def require_change(self):
        changed = self.model_fields_set - {"expected_version", "reason"}
        if not changed:
            raise ValueError("at least one editable field is required")
        for name in ("status", "title", "location", "mode", "source_type"):
            if name in self.model_fields_set and getattr(self, name) is None:
                raise ValueError(f"{name} cannot be cleared")
        return self


class EventView(ContractModel):
    id: UUID
    incident_id: UUID
    actor_type: ActorType
    actor_id: UUID | None
    kind: EventKind
    old_status: IncidentStatus | None
    new_status: IncidentStatus
    reason: str = Field(max_length=500)
    before: dict[str, str | None] | None
    after: dict[str, str | None]
    created_at: UTCDateTime


class EventPage(ContractModel):
    items: list[EventView]
    next_cursor: str | None


class FieldIssue(ContractModel):
    name: str
    issue: str


class ApiError(ContractModel):
    code: str
    message: str
    fields: list[FieldIssue] | None = None


class ErrorEnvelope(ContractModel):
    error: ApiError
    request_id: str
    meta: dict[str, str | int | None] | None = None
```

### Concrete response models

```python
class IncidentDetail(ReportView):
    as_of: UTCDateTime
    created_at: UTCDateTime
    updated_at: UTCDateTime
    created_by: UUID | None
    updated_by: UUID | None


class IncidentMutationResponse(ContractModel):
    request_key: UUID
    replayed: bool
    incident: IncidentDetail


class IncidentSummary(ContractModel):
    id: UUID
    title: str | None
    location: str | None
    mode: str | None
    direction: str | None
    observed_at: UTCDateTime | None
    age_minutes: int | None = Field(ge=0)
    freshness: FreshnessState
    source_type: SourceType
    status: IncidentStatus
    is_synthetic: bool
    version: int = Field(ge=1)
    updated_at: UTCDateTime


class IncidentPage(ContractModel):
    as_of: UTCDateTime
    items: list[IncidentSummary]
    next_cursor: str | None


class MutationReceiptState(StrEnum):
    COMMITTED = "committed"
    REJECTED = "rejected"


class MutationReceiptView(ContractModel):
    request_key: UUID
    state: MutationReceiptState
    resource_type: Literal["incident"]
    resource_id: UUID
    completed_at: UTCDateTime
    error_code: str | None
    error_code: str | None
```

## 6. Persistence, idempotency, and evidence history

**Quick summary:** A report change and its history record are one all-or-nothing transaction. Database constraints protect workspace ownership and request uniqueness even when requests race.

### Minimum constraints

- `local_users`: primary key UUID; unique `(issuer, subject)`; subject and issuer non-empty.
- `workspaces`: Clerk Organization ID primary key, matching `org_...` format. It is a local reference/cache, not a source of membership authority.
- `trips`: primary key UUID; foreign key workspace; non-empty bounded name; `is_synthetic NOT NULL`.
- `trip_segments`: primary key UUID; FK `(workspace_id, trip_id)` to trip; `ordinal > 0`; unique `(trip_id, ordinal)`; segment order is stable.
- `incident_reports`: primary key UUID; workspace FK; valid status/source enums; `version > 0`; nullable `observed_at`; creator/updater FKs to local user; `is_synthetic NOT NULL`.
- `incident_events`: primary key UUID; FK to report and workspace; `actor_type=user|seed`; user events require a local actor FK, seed events require null actor ID and may be created only by the controlled seed process. Keep immutable old/new evidence snapshots; no update/delete endpoint. Unique event order can use `(incident_id, sequence)`.
- `mutation_receipts`: primary key UUID; unique `(workspace_id, actor_id, request_key)`; fingerprint includes HTTP method, canonical path, and normalized validated payload; state is `committed|rejected`; committed rows include resource reference and completion time atomically with report/event; rejected version conflicts include `error_code` and no changed report/event. Do not make the fingerprint a client authority.
- Use composite foreign keys or equivalent constraints to ensure a report/trip/event's workspace matches its parent workspace.

### Create transaction

1. Verify token and role; validate request and idempotency key.
2. Start transaction and attempt to insert/lock the receipt unique key.
3. If the key exists with a different operation fingerprint, return `409 IDEMPOTENCY_KEY_REUSED`; with the same fingerprint, return the previously committed or rejected outcome.
4. Insert incident with server-generated UUID, creator/updater local user, `status=reported`, `version=1`.
5. Insert `created` event and commit receipt as `committed` with the resource ID.
6. Commit once. Only then send `201`.

If any step fails before commit, rollback all three records. If the network fails after commit, status lookup discovers the committed receipt. If the server dies while the transaction is open, PostgreSQL rolls it back; a retry with the same key can safely create once. Concurrent requests on the same key serialize on the unique constraint/row lock.

### Update transaction and history

Update only where `(workspace_id, incident_id, version=expected_version)` matches. Lock or conditionally update the row, set only fields listed in `model_fields_set`, increment version by exactly one, update `updated_at` and `updated_by`, insert one append-only event containing old/new status, the correction reason, and before/after snapshots of changed evidence fields, and complete the mutation receipt in the same transaction. If no row matches, read only the authorized row's current version: return `404` if absent in workspace, otherwise `409 VERSION_CONFLICT`; commit a rejected receipt with the request fingerprint and safe current-version metadata, but no report change or event. Two concurrent updates from the same version allow at most one to commit.

Never hard-delete a report to “correct” it. Mark it `disputed` or `resolved` with a reason and preserve prior values/events. A status change is not proof of independent verification. Synthetic provenance is immutable through ordinary updates.

## 7. Frontend fixtures, environment, and provider failures

**Quick summary:** The fixture must satisfy the same Pydantic response contract and remain a test/visual aid only. Missing provider configuration or an outage must stop or fail the real application clearly; it must never switch to fixture or local-database mode.

### Contract-matching fixtures

Fixtures live in a test-only module and use the same `TripListResponse` and `TripContextResponse` shapes as production. These three examples test match, uncertainty, and empty results:

```json
{
  "trip_page": {
    "items": [
      {"id":"2d254577-3179-42e5-82a3-2f1c8ea150ef","name":"Mirpur 10 to Shahbagh","is_synthetic":true}
    ],
    "next_cursor": null
  },
  "contexts": [
    {
      "as_of":"2026-10-16T02:30:00Z",
      "relevance":{"state":"affects_trip","reason":"A report matches the Farmgate segment and the trip's road mode; its direction is unknown."},
      "trip":{"id":"2d254577-3179-42e5-82a3-2f1c8ea150ef","name":"Mirpur 10 to Shahbagh","is_synthetic":true,"segments":[{"id":"bc24d501-8e9b-48b4-871d-cb848a808caa","ordinal":1,"mode":"MRT-6","origin":"Mirpur 10","destination":"Farmgate"}]},
      "evidence_total":1,
      "reports":[{"id":"08356da9-7c9f-4f14-bfff-4c7e8c6f4f7b","title":"Waterlogging reported near Farmgate","location":"Farmgate","mode":"Road traffic","direction":null,"observed_at":"2026-10-16T02:15:00Z","age_minutes":15,"freshness":"current","source_type":"synthetic_example","status":"reported","description":"Synthetic example only.","confirmation_note":null,"is_synthetic":true,"version":1}],
      "reports_next_cursor":null
    },
    {
      "as_of":"2026-10-16T02:30:00Z",
      "relevance":{"state":"unknown","reason":"The report has no direction or observation time, so the available information cannot support a reliable comparison."},
      "trip":{"id":"c7de29aa-a5e5-4e0a-b07b-8f7491ce9f2a","name":"Uttara North to Farmgate","is_synthetic":true,"segments":[{"id":"9b00f4f1-c24f-48af-a8e4-682f9f6bb284","ordinal":1,"mode":"MRT-6","origin":"Uttara North","destination":"Farmgate"}]},
      "evidence_total":1,
      "reports":[{"id":"3e506dca-3ea1-4b18-9092-4b2617c2f050","title":"Road closure direction not recorded","location":"Fictional junction","mode":"Road traffic","direction":null,"observed_at":null,"age_minutes":null,"freshness":"unknown","source_type":"synthetic_example","status":"disputed","description":"Long synthetic example text to test wrapping.","confirmation_note":null,"is_synthetic":true,"version":2}],
      "reports_next_cursor":null
    },
    {
      "as_of":"2026-10-16T02:30:00Z",
      "relevance":{"state":"not_affected","reason":"No available report matched the known trip details. This does not confirm that the trip is clear."},
      "trip":{"id":"0d29ca0f-3eec-4db4-b010-f4de81f66e3f","name":"Example with no matching reports","is_synthetic":true,"segments":[]},
      "evidence_total":0,
      "reports":[],
      "reports_next_cursor":null
    }
  ]
}
```

Fixtures must not contain an invented user token, local role bypass, or false “saved” response. The local visual adapter returns the same normalized frontend service interface as the real API adapter (the real adapter unwraps `TripListResponse.items`); its context records use the contract fields and UUID IDs. It is not an HTTP server and does not mock Clerk or writes. Contract tests must validate raw request/response JSON against these Pydantic models, including write and error cases. A fixture adapter must never be selected by a deployed code path.

### Environment variables and provider behavior

| Variable | Used by | Secret? | Required behavior |
|---|---|---:|---|
| `DATABASE_URL` | FastAPI/SQLAlchemy | Yes | Remote Neon connection string for the specific environment. Missing value fails startup. Local development, deployment, and isolated test each use separate Neon branches. |
| `CLERK_PUBLISHABLE_KEY` | FastAPI verifier and/or server-rendered SDK configuration | No | Must match the configured Clerk instance and allowed origins. Browser key may be exposed only as the documented public Vite value. |
| `CLERK_SECRET_KEY` or `CLERK_JWT_KEY` | FastAPI verifier | `CLERK_SECRET_KEY` is secret; `CLERK_JWT_KEY` is a public verification key | Configure the exact verifier mode supported by the pinned Python SDK. At least one valid supported verification method is required; startup fails if absent/invalid. Never put either value in Vite variables. |
| `CLERK_AUTHORIZED_PARTIES` | FastAPI verifier | No | Comma-separated exact local and deployed origins. Do not accept arbitrary origins or wildcards for production. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Browser bundle | No | Public Clerk instance key for real Clerk React SDK. It is build-time and may be visible in JS. Never put a Clerk secret or DB URL in any `VITE_` variable. |
| `PORT` | Render/FastAPI server | No | Bind `0.0.0.0:$PORT`; local may use a documented default. |
| `APP_ENV` | FastAPI | No | `development`, `test`, or `production`; changes logging/security config only, never data path or auth policy. |

`DATABASE_URL` must target remote Neon in all environments. No SQLite, local PostgreSQL fallback, anonymous mode, fabricated token, or fixture fallback. Run versioned Alembic migrations before accepting traffic; use deployment-specific credentials and test a disposable Neon branch. Clerk development and production instances have separate keys, users, organizations, and allowed origins. If Clerk/JWKS is unavailable and the token cannot be safely verified with configured key material, return `503 AUTH_PROVIDER_UNAVAILABLE`; do not accept an unverified token. If Neon is unavailable, return a bounded `503 DATABASE_UNAVAILABLE`; do not serve stale data from the server as current. React may keep only its already-loaded page response in memory and mark it stale.

## 8. Implementation gates and unresolved checks

**Quick summary:** These contracts are ready for implementation only after the proposed schemas are accepted and contract tests are added. They are not proof of a working persistent flow; the next meaningful verification is one editor write and a second member's fresh read against a disposable Neon branch.

**Must be verified before implementation:**

1. Confirm the Clerk Python SDK version and exact `authenticate_request` options, accepted session-token type, claim decoder, and allowed-party configuration.
2. Confirm the Clerk app has Organizations, the `org:admin`/`org:member` roles, local/deployed instances, and test users.
3. Implement the response schema and add tests that validate raw frontend requests/responses against these models; keep the visual fixture and API adapter on the same normalized interface.
4. Update the Trip Brief to send the Clerk bearer token, handle `reports_next_cursor` with a “load more” action, and reset to the first evidence page on refresh. The current representative screen has not wired Clerk or report pagination.
5. Add Alembic tables/constraints and use a disposable remote Neon test branch for migrations, cross-workspace access, idempotent retries, lost response reconciliation, and two-editor version races.
6. Run full workflow with two real test accounts: editor creates/corrects report; member reads it after refresh; wrong workspace gets no data; unknown write is reconciled by the same request key.
7. Record actual provider and browser checks separately from unit/contract tests. Do not report a local fixture as proof of Clerk, Neon persistence, deployment, or multi-user isolation.

**Open question:** This contract maps write permission to Clerk's built-in organization admin role for the minimum. If using a separate custom editor role is required, verify Clerk plan support and change the role enum/map before implementation; do not silently broaden write access.
