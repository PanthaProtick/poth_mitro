# Tanvir Hasan Ratul — detailed implementation work order

> **Old work order superseded (2026-10-16):** This card targets the canceled Clerk + Neon + Render phase. Use the current local-first SQLite/localhost handoff in [`../implementation_plan.md`](../implementation_plan.md); confirm scope for your module before starting. The old goals below are historical.

- **Role:** product API, deterministic logic, browser/API integration, tests, and integration lead.
- **Time box:** 4 hours; keep the first request executable by minute 45 and proven by minute 60.
- **Success:** A real Clerk member reads a trip, an admin saves a report to Neon, and a second member sees the change after refresh.
- **Primary handoff:** Agree API service and UI component interfaces with Pantha and Yousha before implementation diverges.
- **Never do:** trust client roles, switch to fixtures on API failure, auto-retry unknown writes with a new key, or claim local build equals Render acceptance.

## 1. Read first and repository facts

**Quick summary:** Own route and frontend integration boundaries. Several existing components are visual scaffolding; the contracts, not their current assumptions, define the real path.

Read `tasks/implementation_plan.md` sections 6–11; `docs/api_contracts.md`; `docs/architecture.md`; `docs/mvp.md`; `docs/frontend_design.md`; `docs/deployment_setup.md`.

Observed starting points:

- `backend/app/api/routes.py` has starter routes plus in-memory `/items`; no DhakaPath routes exist.
- `backend/app/models/schemas.py` contains only starter item/chat/health schemas.
- `frontend/src/App.jsx` normally passes a null workspace. Only the `DEV` + `?design-preview=1` branch loads the fixture.
- `frontend/src/services/tripBriefApi.js` calls only trip list/context, already uses relative `/api/v1` paths, has timeout/abort logic, does not attach Clerk token, and parses the wrong error shape (`detail` instead of the contract envelope).
- `frontend/src/features/trips/TripBriefScreen.jsx` is a read-only screen; no report editor or write methods are present.
- Vite proxies `/api` to local FastAPI. Keep that proxy; FastAPI currently mounts under `/api`, while the target routes are `/api/v1`, so coordinate the one-prefix change with Pantha.
- Frontend has no Clerk package and no automated test runner. Build/lint commands exist; browser acceptance is manual.

## 2. Owned files and collision rules

**Quick summary:** Own root app/auth wiring, API adapters, route/service code, integration tests, and README. Yousha owns screen components/styles; Pantha owns persistence/auth-verification/deploy infrastructure.

**You own:** `backend/app/api/**`; `backend/app/services/**` for trip matching and report operations; your agreed backend test folder; `frontend/src/App.jsx`; `frontend/src/main.jsx`; `frontend/src/services/**`; `frontend/package.json` and lockfile; `frontend/vite.config.js`; `README.md`.

Coordinate before editing `backend/app/main.py` with Pantha because both router registration and static/health order affect it. Do not edit `frontend/src/features/trips/**` or scoped styles owned by Yousha. Do not edit DB models/migrations owned by Pantha; request schema changes through a contract discussion first.

Use one shared component/service boundary. Proposed boundary for minute-10 agreement:

```text
TripBriefScreen props:
  api, activeWorkspace { id, name }, currentUser, role, authState, demo=false

api methods:
  getMe({ signal })
  listTrips(workspaceId, { signal, cursor? })
  getContext(workspaceId, tripId, { signal, cursor? })
  createIncident(workspaceId, payload, { idempotencyKey, signal })
  updateIncident(workspaceId, incidentId, payload, { idempotencyKey, signal })
  getRequest(workspaceId, requestKey, { signal })
```

This is a coordination proposal, not an existing interface. Agree exact names and types with Yousha, then write them in one shared note or API module. Do not let both components implement fetch logic.

## 3. Minute 0–15: lock contracts and SDK assumptions

**Quick summary:** The API must use one versioned prefix, one Clerk token mechanism, and one error envelope. Verify the provider SDK API rather than inventing auth calls from memory.

1. Review exact Pydantic names/fields and status codes. Writes use `Idempotency-Key`; PATCH includes `expected_version` and user explanation `reason`.
2. Confirm Pantha's token-verification dependency signature and actor shape. Route functions depend on it and must not re-parse token claims.
3. Confirm the React Clerk SDK package and token retrieval API from current official docs/version. Add it through npm and update `package-lock.json`; never put Clerk secrets into `VITE_*`.
4. Resolve the health route mismatch in docs before changing route prefixes.
5. Agree exact TripBrief props with Yousha and define role/read/write visibility behavior. The server still enforces permissions.

## 4. API and product service work order

**Quick summary:** Start with one `POST` that persists a report, then add only the reads and update logic required for the selected flow. Keep service logic deterministic and independent of Gemini.

### Route set in scope

**Quick summary:** These six routes support login context, one trip read, one report mutation, and safe write reconciliation.

- `GET /api/v1/me`: verified local identity + active workspace + role for the app shell.
- `GET /api/v1/workspaces/{workspace_id}/trips`: real Neon trip picker; stable order and cursor semantics from contract.
- `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context`: ordered segments, evidence page, `as_of`, relevance state/reason.
- `POST /api/v1/workspaces/{workspace_id}/incidents`: admin-only create; route passes the same idempotency key to service.
- `PATCH /api/v1/workspaces/{workspace_id}/incidents/{incident_id}`: admin-only version-checked update with `expected_version` and `reason`.
- `GET /api/v1/workspaces/{workspace_id}/requests/{request_key}`: safe resolution for an unknown write outcome.

Do not implement `GET /events` or a full history screen only because those contracts exist. Implement `GET /incidents/{id}` only if the editor/reconciliation flow needs it. Do not create delete routes.

### Route/service boundaries

**Quick summary:** Keep HTTP parsing, product decisions, and SQL transaction ownership separate so each layer has one responsibility.

1. Route layer: parse path/query/body, apply Pantha's verified-actor dependency, call service, map domain outcomes to exact `ErrorEnvelope` and HTTP status.
2. Service layer: workspace-scoped lookup, deterministic comparison, explicit transaction call, event/receipt creation, and version-conflict result.
3. Repository/SQL layer is Pantha-owned. Request DB functions/query changes through the agreed interface; do not write raw transactions in route handlers.
4. Never catch every exception and return fabricated success. Log a safe request ID and dependency class, never bearer token/database URL.

### Business rules not to alter silently

**Quick summary:** Matching must preserve uncertainty and data age; missing evidence never becomes a safety guarantee.

- Relevance states are exactly `affects_trip`, `not_affected`, `unknown`.
- Matching current/aging `reported` evidence can yield `affects_trip`; disputed/stale/incomplete potentially matching evidence yields `unknown`; `not_affected` requires comparable relevant fields and no match.
- Do not say “safe.” Use “No match found in available reports.”
- Freshness cutoffs 0–30 current, 31–120 aging, over 120 stale, missing/future timestamp unknown are documented **assumptions**. Centralize them in one server rule; do not invent evidence to validate them.
- Compute relevance over all eligible reports; page-limited evidence is only the displayed list.
- `observed_at` is UTC-normalized ISO timestamp or explicit null; `age_minutes` is floored non-negative; use API freshness, not the browser clock.

## 5. Frontend auth/API integration order

**Quick summary:** Clerk supplies signed-in session and active org; the server remains authority. A workspace switch must clear old data before the next workspace is shown.

1. Add the documented Clerk React provider at `frontend/src/main.jsx`/`App.jsx`. Represent loading, signed-out, signed-in-without-org, active-member and forbidden states. Do not show `workspaceId=null` as a ready screen.
2. Resolve `/api/v1/me` after valid auth. Use the active organization ID only as requested path scope; FastAPI compares it to verified claims.
3. Attach current Clerk token as `Authorization: Bearer ...` on protected API calls using provider-supported token refresh. Do not store tokens in localStorage or fabricate them.
4. Update `tripBriefApi.js` to parse `error.code`, `error.message`, `request_id` and optional `fields`/`meta`; expose status/code/request ID to UI. Preserve 8-second browser abort. Distinguish user cancellation from timeout.
5. Generate one UUIDv4 idempotency key per deliberate write. Keep that key when reconciling the same operation. After timeout, query the same request key; do not claim success or automatically create a new key. A conflict retry is a new deliberate action with refreshed expected version and a new key.
6. On sign-out, org switch, or `401`, abort pending requests and clear workspace cache, selected trip, response, report draft and write state. Ignore late responses from an old workspace/request generation.
7. Extend the screen only through agreed props. Do not add Clerk hooks into Yousha's component without agreement. Hiding a button is not the access check.
8. Keep design preview behind `import.meta.env.DEV` and `?design-preview=1`. Production always uses Clerk + API and has no fixture fallback.

## 6. Tests, commands, and owner handoffs

**Quick summary:** Add contract tests for security and writes early. Do not wait until the last 30 minutes or claim coverage for a test package that does not exist yet.

Backend test setup is absent. Coordinate with Pantha to add/lock `pytest` and `httpx`. Use dependency overrides for unit/contract tests, then a separate real Neon test-branch run for transaction, uniqueness, and concurrency acceptance. A mock verifier is acceptable only in isolated unit tests, never as Clerk acceptance.

Minimum tests:

- each protected read without token is `401`;
- member read succeeds, member write is `403`, admin write succeeds;
- workspace/resource mismatch is hidden as contract `404`;
- request models reject authority fields and invalid bounds/enums;
- create + first event + receipt commit together; duplicate same-key request creates one report;
- same key with changed payload is `409`;
- concurrent PATCHes with same expected version produce one version increment and one `409`;
- request status is current-actor-only; no receipt does not prove rollback;
- context covers affected/no-match/unknown and stable evidence pagination;
- DB tests use disposable remote Neon branch only; never use a local database.

Commands:

```powershell
# From backend/
uv sync --locked
uv run alembic upgrade head
uv run pytest -q

# From frontend/
npm ci
npm run lint
npm run build
npm run dev -- --host 0.0.0.0
```

`pytest` is valid only after tests and dev dependencies are added. A unit test cannot replace the real Clerk + remote Neon end-to-end check.

**Handoff to Yousha:** Stable props and live methods; field-error map; `saved` only on confirmed response; unknown-request state; `409` current version; `403` view-only mode. Use contract examples rather than fake data in the app adapter.

**Final integration ownership:** Inspect changed paths before merge/deploy. Exclude `.env`, `node_modules`, `dist`, credentials, and unrelated starter cleanup. Report exact commands/results and live services checked.

## 7. Cut line and escalation

**Quick summary:** Preserve the real write/read path and its error semantics. Cut convenience work before auth, persistence, tests, or deployment.

- If Pantha's identity/transaction interface is not ready at minute 30, pair and settle the minimal function signatures; do not build a parallel path.
- If Gate 1 misses by minute 60, stop context polish, pagination UI and bilingual labels; focus on auth → Neon POST → fresh GET.
- If deploy is blocked by missing account/origin/plan, finish image/Blueprint assets and write the blocker. Do not say “deployed.”
- If full organizer route/fare/chat requirements are raised, state that this proposition slice does not cover them; do not add them to this four-hour path.
