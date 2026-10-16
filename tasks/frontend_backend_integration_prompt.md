# Coding Agent Prompt: Complete Frontend–Backend Integration (Prior Scope)

> **Scope supersession (2026-10-16):** This prompt originally bounded work to trip/report integration and explicitly excluded routing. The user later requested that the whole journey flow be connected and dynamic. That direct request supersedes the old routing exclusions. Use the current planner contracts in `docs/api_contracts.md`; preserve the local-only boundary and never invent fares, timetables, or validated route accuracy.

Copy the prompt below into the coding agent that will work in this repository.

---

## Role and working rules

Act as a careful integration engineer and skeptical reviewer. Inspect the repository before editing. Trace the active browser flow through the API and into SQLite, then back to the rendered UI. Do not assume that a successful frontend build proves the integration works.

Follow the repository's `AGENTS.md` instructions and current local-first scope. Before changing code:

1. Read `AGENTS.md`, `docs/api_contracts.md`, `docs/frontend_design.md`, `backend/implementation_plan.md`, the root `README.md`, and the frontend/backend setup notes.
2. Run `git status --short` and preserve pre-existing user changes. Do not revert or overwrite them.
3. Inspect the current versions of the frontend screen, API adapter, report editor, FastAPI routes, Pydantic schemas, trip/report services, database configuration, migrations, Vite proxy, and fixtures. Treat this prompt's repository observations as a starting point; verify them against the files you find.
4. Label claims in your final report as verified, inferred, or still unknown. Do not claim live integration, browser acceptance, or persistence unless you observed it during this task.

Make the smallest coherent set of changes that completes the bounded local workflow. Do not expand into the full Dhaka transit product.

## Objective

Complete and verify the local single-operator flow from selecting a prepared trip, through reading all paginated report evidence, creating or correcting a route-linked report, persisting that write in SQLite, and showing the updated context. Make the last successfully loaded trip context available after a page reload when the local API is unavailable, while clearly labeling it as cached and stale. Review the actual UI at desktop and narrow-mobile sizes.

The whole flow must work with the frontend and backend on the same computer, bound to loopback. It must not require Clerk, Neon, Render, an AI provider, paid maps, or internet connectivity for normal local API requests.

## Verified repository baseline to recheck

The current implementation has the following known shape and gaps:

- Backend: FastAPI, SQLAlchemy, SQLite, and Alembic. The runtime uses `/health/live`, `/health/ready`, and `/api/v1/...`. The documented default SQLite file is `backend/data/dhakapath.db`.
- Frontend: React/Vite; the Vite dev server binds to `127.0.0.1` and proxies `/api` to `http://127.0.0.1:8000`. The active page is `frontend/src/features/trips/TripBriefScreen.jsx`; its HTTP adapter is `frontend/src/services/tripBriefApi.js`.
- Read routes implemented by the backend:
  - `GET /api/v1/trips?limit=20&cursor=...` returns `{items, next_cursor}`.
  - `GET /api/v1/trips/{trip_id}/context?report_limit=20&report_cursor=...` returns trip segments, the current report page, `as_of`, `evidence_total`, `reports_next_cursor`, and deterministic relevance.
- Each trip segment includes integer `id`, `ordinal`, `mode`, `origin`, `destination`, `route_reference_available`, nullable `route_data_quality`, and nullable integer `route_id`. `route_id` is exposed only so the local editor can link a report to a stored route used by the selected trip; it is not route geometry or a routing result.
- Write routes implemented by the backend:
  - `POST /api/v1/incidents` requires an `Idempotency-Key` UUIDv4 and the create fields in `docs/api_contracts.md` / `backend/app/models/schemas.py`.
  - `PATCH /api/v1/incidents/{incident_id}` requires `Idempotency-Key`, `expected_version`, a non-empty `reason`, and at least one allowed changed field. Version conflicts return `409`.
  - Writes, append-only event history, and idempotency receipts are transactional in the backend.
- Current frontend report creation requires a route option from the selected trip so the resulting report appears again in that trip's context. Editing is offered only for visible non-synthetic reports. A trip with no stored route reference cannot create a discoverable report from this screen.
- The frontend currently ignores trip-list and report-context cursors, so it only exposes the first page (normally 20 items) even though the API paginates.
- Offline handling currently depends on `navigator.onLine` and React component state. The last context is lost on reload. The UI can block a request because the browser says “offline” even when loopback FastAPI is reachable; conversely, browser “online” does not prove FastAPI is reachable.
- Mutation retry safety needs review: preserve the same idempotency key for an identical retry, including after a timeout or lost response. Do not silently mint a new key and submit a changed create payload while the outcome of the prior create is unknown; that can create a duplicate. Reconcile by refreshing the relevant context before allowing a new create attempt.
- The previous integration pass passed `npm run build`, `npm run lint`, Python source compilation, and `git diff --check`. Lint had four unused-variable/import warnings in inactive starter files. These checks do not prove live browser-to-database behavior.
- A previous live API attempt could not start migrations in this environment: system Python did not have Alembic; the configured `uv` cache was access-denied; a task-local cache could not download packages because network access was restricted. Do not work around this by installing into system Python or weakening the lockfile. Try the project's locked `uv` environment first; if it remains unavailable, report the exact blocker and finish independent code review/build work.
- Post-integration desktop/mobile browser acceptance has not been completed. An older visual review at 764 px was a synthetic preview before the report editor was integrated; it is not evidence for this flow.
- `Map Data/json/transit-data.json` is the frontend's current JSON import location. CSVs are not loaded by the active Trip Brief. Keep map data approximate and do not invent new routes or fares.

Some older sections of the design and API docs still describe the prior hosted/read-only workflow. Reconcile contradictory current-status text as part of this task. Keep historical decisions clearly labeled instead of deleting useful history.

## Original report-integration scope boundaries (superseded for journey planning)

Keep all of these boundaries:

- Single local operator, no login, no user/role fields from the browser, no multi-user or hosted-security claims.
- Backend and Vite remain bound to `127.0.0.1`. Do not expose them on a LAN or internet.
- SQLite remains the source of truth. Use a clearly disposable database for integration verification; never migrate, seed, or mutate the user's active database for a smoke test.
- Do not queue offline report writes or replay them later. Offline mode is read-only.
- Synthetic examples must remain labeled synthetic. Do not introduce fake live evidence, fares, route accuracy, or provider behavior.
- Do not add citywide route search, routing algorithms, fare calculation, chat/AI, external providers, authentication, hosting, or new data sources.
- Do not change API semantics casually. If the code and contract disagree, inspect the implementation and migration history, choose the least disruptive correction, update the contract and examples, and explain the decision.

## Required work

### 1. Close the live local API loop

Inspect the Vite proxy, relative frontend URLs, FastAPI prefix, request/response models, and error envelope. Confirm the browser sends the existing contract exactly; do not create a second API shape or silently fall back to fixture data.

Run the backend from its locked `uv` environment using an explicitly named disposable SQLite database. Apply migrations, validate/import the checked-in map data, and seed the synthetic demo data using documented commands. Start FastAPI on loopback and verify readiness. Start Vite on loopback and verify the actual browser requests reach the expected backend routes.

Exercise this end-to-end sequence through the UI where possible:

1. Load trip list and a trip context whose segment has a stored route ID.
2. Create a route-linked report with a valid observation time and source type.
3. Confirm that the API response is treated as success only after a successful HTTP response; reload the context and find the created report with the expected route, source, freshness, and version.
4. Correct the report, including status and correction reason; reload and confirm the new fields and incremented version.
5. Restart FastAPI and confirm the report remains in SQLite.
6. Exercise a stale-version conflict and confirm the draft is not silently discarded. Refresh server state and require deliberate review before resubmitting.
7. Simulate an ambiguous create result if practical. Retry an identical mutation with the same idempotency key and confirm there is one report, not two. If the browser cannot simulate a dropped response safely, verify the same-key retry at the API boundary and clearly report the untested network-loss case.

Handle standard backend error envelopes and validation-field details. A timeout or connection reset after a write is an **unknown outcome**, not proof of failure. Preserve the key and exact request for an identical retry. Before changing payload or starting a new create after an unknown outcome, refresh the trip context and reconcile whether the report was committed. Never auto-retry with a new key or show a fabricated “saved” confirmation.

### 2. Implement cursor pagination end to end

Use the existing backend cursors; do not raise page sizes without bounds or fetch every page automatically into memory.

- Change the trip adapter to return both `items` and `next_cursor`, rather than discarding the cursor. Add an accessible “Load more trips” action with loading, error, retry, and terminal states.
- Keep already loaded trips when loading the next page. Deduplicate by trip ID. Reset the cursor and loaded results only when starting a fresh list/reload, not when appending.
- Add a report-page read path using `report_cursor` on the existing trip-context endpoint. Add an accessible “Load more reports” action showing the number loaded versus `evidence_total` when available.
- Append reports and deduplicate by report ID. Preserve the server's relevance result; relevance is computed from all eligible route-linked reports and must not be recomputed from only the visible page.
- Reset report pagination when the selected trip changes or a successful mutation refreshes context. Abort or ignore late responses when the trip changes. Do not append a page from an old trip to the newly selected trip.
- Keep server limits within 1–50 and handle malformed/expired cursors with a clear reload path.
- Verify lists with more than 20 rows, exact page boundaries, empty final pages, duplicate-safe append, trip changes during a pending request, and refresh after a mutation.

### 3. Correct availability detection and implement offline context cache

Separate three states in the frontend: browser network hint, local API readiness/reachability, and age/validity of cached trip context. `navigator.onLine` may update explanatory UI, but it must not be the authority for whether loopback API calls are attempted. Probe/use the actual local API; if FastAPI is reachable while the browser reports offline, normal reads and writes should still work. If FastAPI is unavailable while the browser reports online, show the local-service failure accurately.

Use IndexedDB (or another justified persistent browser store) to cache the last successful response for each trip. Define and document a cache record with at least:

- a cache schema version;
- local scope and trip ID as the key;
- the complete server response needed to render trip segments, report pages, relevance, and server `as_of`;
- a client `cached_at` timestamp and enough metadata to indicate whether all report pages were loaded.

Required behavior:

- On API success, update the cache without delaying or falsely changing server response semantics.
- After reload with the API unavailable, restore cached context and any already loaded report pages. Clearly say it is cached, show the local cache time and original server check time, and treat it as stale. Do not upgrade its freshness or relevance based on the client clock.
- Do not present a partial report cache as the complete evidence set. Show loaded count and whether more server pages were available at the last fetch.
- Keep cached mode read-only. Disable create/update while the local API is unavailable; do not queue requests.
- On reconnect or API recovery, offer/perform an explicit refresh and replace cached context only after a successful response. Keep the old cached copy visible with a stale warning if refresh fails.
- Set a clear retention/expiry policy, document it, and handle expired records, corrupt data, IndexedDB unavailable/quota errors, and cache schema changes gracefully. Do not add sensitive credentials to the cache. Provide a reasonable way to clear local cached trip data if appropriate.
- Keep all offline claims limited to data actually cached. Do not claim offline routing or complete citywide coverage.

Do not assume browser `online`/`offline` events are delivered perfectly. Reconcile API request success/failure with the browser hint and never discard the last successful context on a transient error.

### 4. Review and improve the connected report UI

Keep the editor within the selected trip context and aligned with `backend/app/models/schemas.py` and `docs/api_contracts.md`.

- Create requires valid kind, title, location, mode, source type, observation time as collected by the UI, and a route from the selected trip. Preserve backend support for nullable fields where the UI intentionally allows them.
- Update sends the current `expected_version`, a non-empty reason, and only supported report fields. Keep synthetic reports read-only. Keep route IDs numeric/null at the API boundary and do not allow arbitrary IDs typed into the browser.
- Show field-level errors from the standard API envelope. Keep draft values on validation errors and version conflicts. A stale-version conflict must prompt a refresh/review; do not silently rebase or overwrite the latest server version.
- Disable writes when the API is unreachable, not merely when `navigator.onLine` is false.
- If the selected trip has no route references, explain why route-linked report creation is unavailable. Do not create an unlinked report that the current UI cannot rediscover or edit.
- Preserve synthetic-preview isolation: it must never write to the real API or database.
- Keep freshness and approximate-data disclosures visible. A report is evidence, not independently verified truth; “no match” is not “safe.”

### 5. Browser and responsive acceptance

Inspect the real app connected to the disposable local API, not only the synthetic design preview. Review at approximately 1280×800 desktop and 360×800 narrow mobile (or the closest available sizes). Check:

- trip selection, check, refresh, pagination, and report evidence;
- create, correction, validation, save confirmation, API failure, timeout/unknown outcome, and version-conflict states;
- cached reload while API is unavailable, stale warning, API recovery, and explicit refresh;
- keyboard-only traversal, visible focus, labels and error announcements, no clipped controls, and no horizontal page overflow;
- loading/empty/error states and trips with no route reference.

Do not claim a screen was visually verified unless you inspected it. If the browser or backend dependency environment is unavailable, complete code/build checks, record the exact limitation, and do not claim full acceptance.

### 6. Keep docs and contracts synchronized

Update current-status documentation that still says the app is read-only or that no report editor exists. Reconcile `AGENTS.md`, `docs/api_contracts.md`, `docs/frontend_design.md`, backend/frontend setup notes, and README as needed. Keep historical hosted Clerk/Neon material clearly superseded rather than treating it as current.

Document:

- actual adapter methods and paths;
- cursor behavior and page limits;
- cache key, schema version, retention policy, timestamps, and read-only offline boundary;
- how local API availability is determined;
- mutation ambiguity/idempotency recovery;
- exact checks performed and checks still unavailable.

Do not add a test suite dependency just for appearance. Reuse available tools; if adding tests is needed to cover an integration guarantee, keep them targeted and explain why.

## Acceptance gates

Do not mark the work complete until each gate is either passed or clearly marked blocked with concrete evidence.

### Gate A — static/code checks

- `npm run build` passes.
- `npm run lint` exits successfully; report remaining warnings rather than hiding them.
- Python modules compile/import in the locked backend environment.
- `git diff --check` passes.
- No active frontend import references removed starter endpoints or an old root-level `json/`/`csv/` directory.

### Gate B — disposable backend/API flow

- Migrations, map validation/import, and synthetic seeding succeed against the disposable DB.
- Health readiness, trip list/context, create, update, conflict, and persistence after restart are observed over loopback HTTP.
- Same-key identical retry does not duplicate a report; changed payload under the same key is rejected as specified.
- No user database or provider is used.

### Gate C — pagination and offline behavior

- More than 20 trips and reports can be browsed through cursor controls without duplicates or cross-trip state leakage.
- Cached context survives page reload, shows stale/partial status correctly, and stays read-only while FastAPI is unavailable.
- A reachable local FastAPI service is still attempted even if `navigator.onLine` says false; browser online status does not mask an unavailable FastAPI service.

### Gate D — browser review

- Real API flow inspected at desktop and narrow-mobile widths.
- Keyboard/focus, labels, errors, no-route state, stale/cache state, and horizontal overflow reviewed.
- Report exactly which viewports and interaction states were actually observed.

## Final report format

Return a concise but specific implementation report with:

1. Files changed and behavior added.
2. The exact data flow from browser request through FastAPI/SQLite back to refreshed UI.
3. Commands/checks run and observed outcomes.
4. Browser viewport/interaction evidence, if actually obtained.
5. Remaining issues, blockers, and any gates not passed.
6. Explicit confirmation that the app remains local single-operator, does not queue offline writes, and does not claim hosted or multi-user security.

Do not hide blocked checks behind “works locally,” and do not call a build a full integration test.

---
