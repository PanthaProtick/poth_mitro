# Four-hour implementation plan

- **Scope:** one signed-in traveller reads a prepared trip and its disruption context; an authorized editor saves a report; another member sees the saved change after refresh.
- **First gate:** by minute 60, prove one real Clerk-authenticated write to remote Neon and a fresh authorized read; no mock, SQLite, or in-memory product path.
- **Team:** Pantha owns data, server auth, and deploy foundations; Tanvir owns API integration and end-to-end coordination; Yousha owns the representative UI and browser review.
- **Time rule:** start Render configuration at the beginning and attempt a live deploy as soon as the first vertical slice works; do not postpone deployment until polish.
- **Cut line:** if time slips, remove optional UI and offline refinements; preserve Neon, migrations, Clerk authorization, the shared write/read, deploy path, and acceptance checks.

## 1. Scope and feasibility

**Quick summary:** Four hours is a tight target because the current starter lacks the product API, migrations, Clerk wiring, and Render assets. The plan can only fit by finishing one shared report workflow and treating all other improvements as cuts.

**DECISION — smallest coherent workflow:**

1. A Clerk member opens the app and selects one prepared, clearly synthetic trip.
2. The app loads trip segments and available report context from FastAPI and Neon, then shows a rule-based result with uncertainty and observation time.
3. A Clerk organization admin creates or updates one disruption report. FastAPI checks the role and saves the report plus its history in one Neon transaction.
4. A second authorized member refreshes and sees the saved change. The UI labels last-loaded data as stale if a request fails; it does not accept offline writes.

**FACT — current starting point:** The reviewed starter already has a Vite/React frontend, a FastAPI backend, SQLAlchemy/asyncpg dependencies, and a Trip Brief screen/fixture. It does not yet have the real report endpoints, Clerk SDK/verification, Alembic migrations, or Render build assets. The screen fixture is not the product path.

**ASSUMPTION — provider readiness:** The user reported having Clerk and Neon set up. Branch URLs, test users and roles, allowed origins, credentials, and a working Render account have not been verified in this plan. The first 15 minutes are a readiness gate, not a guarantee that account setup will fit the remaining time.

**FEASIBILITY — best-case plan, not a delivery promise:** The repository starts without the persistent report API, Clerk wiring, migrations, or Render assets. Four hours is viable only if Clerk users/organization, three Neon branches, and Render access are ready before coding begins, and the team does not spend the event creating provider accounts or resolving DNS. If any precondition is missing, required baselines may not fit; report the conflict and the exact unmet checks rather than claiming completion. The last 30 minutes remain reserved for actual browser and release checks.

**DECISION — product cuts:** Do not build route search, fare calculations, chat, map visualization, AI inference, alert polling, offline writes, offline-after-reload storage, a full history screen, or multiple prepared trips. Keep only a minimal report history in the database because each correction must remain traceable. The offline slice is an unvalidated proposition assumption; limit it to showing the already-loaded page as stale.

**Scope conflict:** The four-hour proposition MVP does not satisfy the organizer's full route-search/fare/chat requirements recorded in `AGENTS.md`. This plan does not hide that conflict. Its purpose is to prove the selected proposition and required baseline, not to claim full challenge coverage.

## 2. Team ownership and integration interfaces

**Quick summary:** Each person owns distinct files so parallel work does not collide. Tanvir is the integration owner and alone decides when a shared build is ready to merge or deploy.

| Person | Primary ownership | Handoff/interface |
|---|---|---|
| **Pantha Protick** | Neon schema, Alembic migrations, database constraints/transactions, Clerk token verification and server-side workspace/role dependency, health/startup configuration, Dockerfile and `render.yaml` | Publish exact migration/table names and verified-user/workspace dependency for Tanvir before endpoint integration. Tell Tanvir the deployed URL, migration result, and any provider blocker. |
| **Tanvir Hasan Ratul** | Report/context API handlers and business rules, React-to-API integration, Clerk React provider/token transport, end-to-end and contract tests, integration branch/build coordination | Consume the exact Pydantic contracts in `docs/api_contracts.md`; expose a stable typed-by-convention component contract to Yousha: trips/context/report data, loading/error/stale flags, and callbacks. Own final cross-module merges and smoke run. |
| **Yousha Shahid** | Trip Brief/editor UI components and styles, responsive and keyboard behavior, desktop/mobile browser review, user-visible error/empty/success states | Own `frontend/src/features/trips/**` and its scoped styles. Do not edit `App.jsx`, auth bootstrap, API adapters, or backend. Send Tanvir the required component props and report any contract mismatch before adding UI workarounds. |

**Shared interface lock (minute 10):** Follow `docs/api_contracts.md`: `Authorization: Bearer <Clerk session token>`; server-verified active Clerk organization; `org:member` can read; `org:admin` can write; workspace scope is checked server-side. Use the contract's incident create/update requests, request key, expected version, and error envelope. No client-supplied user, actor, membership, or role is authority.

**Contract issue to resolve before coding:** `docs/api_contracts.md` names `GET /healthz`, while `docs/deployment_setup.md` configures Render to check `GET /health/ready` and also describes `/health/live`. At minute 10, choose and document the exact paths/responses across both files before Pantha implements them. The Render readiness check must match the deployable configuration; do not ship two conflicting health-check assumptions.

**File boundaries:**

- Pantha: `backend/app/core/auth.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/db/**`, `backend/alembic.ini`, `backend/alembic/**`, `Dockerfile`, `render.yaml`, backend startup/health wiring. Coordinate any overlap with existing `backend/app/main.py` before editing.
- Tanvir: `backend/app/api/**`, `backend/app/services/**` for product rules, `backend/tests/**` (coordinate test subfolders with Pantha), `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/services/**`, `frontend/package.json` and lockfile, `frontend/vite.config.js`.
- Yousha: `frontend/src/features/trips/**`, `frontend/src/index.css`, and any new scoped component/style files under `frontend/src/features/trips/`.
- Integration owner checks `git status` before staging. Do not stage `.env`, provider credentials, or unrelated starter cleanup.

## 3. Four-hour schedule and decision gates

**Quick summary:** Prove the real data/auth path first, attempt the deployed path early, then finish the one workflow and test it in parallel. Time-box provider troubleshooting so it cannot consume the entire build.

| Elapsed time | Shared outcome | Pantha | Tanvir | Yousha |
|---|---|---|---|---|
| **00:00–00:15** | Readiness and interface lock | Verify Neon dev/test/deploy branch availability, Clerk verifier config and roles, Render account/plan; create deployment skeleton | Check current app entry points and API contract; define response-to-screen props with Yousha | Confirm screen states and file boundary; prepare Trip Brief/editor components around agreed props |
| **00:15–00:45** | First vertical slice in progress | Implement first migration, constraints, DB session, Clerk verification and role dependency; start Docker/Blueprint | Implement report create/read handlers and transaction path; wire Clerk React token to API adapter; add first E2E smoke script | Implement working form and result states using the agreed component props; no production fixture fallback |
| **00:45–01:00** | **Gate 1: real end-to-end request** | Fix database/auth integration defects only | Run real signed-in editor write to Neon, then member read; capture exact result and request ID | Connect the screen to the real API and verify success/error rendering |
| **01:00–01:30** | **Gate 2: build/deploy path** | Finish Render startup/migration/health config; inspect selected plan behavior | Build same-origin frontend/API image; deploy as soon as the vertical slice is buildable; smoke-test deployed route | Check deployed page layout and sign-in flow; fix only blockers to using the primary task |
| **01:30–02:20** | Complete bounded product workflow | Add trip/report schema constraints, safe seed, history/event transaction support | Implement trip list/context and deterministic relevance result; connect report create/update and refresh | Complete Trip Brief, small editor, timestamps/provenance, unknown/conflict and stale states |
| **02:20–03:10** | Core verification while coding | Migration forward-run on isolated Neon test branch; verify startup fail-fast and DB readiness | Test contract, duplicate request, unknown-write reconciliation, optimistic conflict, and cross-workspace responses; integrate fixes | Test keyboard path, narrow mobile, long/empty/error content; run two real users through shared change |
| **03:10–03:40** | Browser and multi-user acceptance | Verify deployed migration/health and branch separation | Run final local + Render API smoke; resolve integration defects | Inspect actual desktop and narrow mobile browser screens; fix overflow, focus, labels, and feedback |
| **03:40–04:00** | Freeze, setup notes, demo path | Confirm deployed environment uses deployment Neon branch; record provider/migration status | Own README setup and final integrated checklist; rehearse one clean create/update/refresh journey | Confirm screen tells users whether data is synthetic, fresh, stale, saved, or failed |

**Gate 1 at minute 60:** Pass only if a real Clerk session is verified by FastAPI, an authorized editor's report write commits to the remote Neon development branch, and a fresh read returns the saved report. A fixture or mocked token does not pass.

**Gate 2 at minute 90:** Pass only if the same app image can build and Render serves the real API/UI path with configured Clerk and the separate deployment Neon branch. If Render account/plan setup is unavailable, mark deployment **BLOCKED**; keep working on the deployable assets and report the baseline as unmet. Do not claim a deployment based on a local build.

**Stop rule:** If Gate 1 misses by more than 15 minutes, freeze product UI additions and assign all three people to the missing auth/database/write path. If Gate 2 misses, no new product features; spend remaining time on deployment diagnosis and required tests. Do not replace a blocked integration with fake auth, in-memory persistence, or a local database.

## 4. Implementation modules

**Quick summary:** Every module below has a bounded output and a visible pass condition. The first three establish the required vertical slice; later modules extend only the agreed trip/report workflow.

### Module A — Provider preflight and contract lock (00:00–00:15)

**Quick summary:** Confirm the credentials, branches, accounts, and contract boundary before the team starts parallel implementation.

- **Goal:** Confirm the team can reach the right remote branches and use real Clerk identities; freeze one API/UI boundary.
- **Files owned:** No app files. Keep secrets in ignored environment files or provider dashboards; never copy them into Markdown or Git.
- **Inputs → outputs:** Provider account/branch/origin availability and `docs/api_contracts.md` → written checklist of ready/missing values and agreed component props.
- **Dependencies:** None.
- **Acceptance criteria:** Identify separate Neon development, isolated test, and deployment branches; identify the Clerk organization and one `org:admin` plus one `org:member` test user; know Render service/plan readiness; confirm the exact contract path, UI prop shape, and aligned health-check paths.
- **Checks:** Pantha checks branch/origin/plan availability without printing credentials; Tanvir checks route/payload names; Yousha checks required UI states against the screen design.
- **User-visible result:** No new behavior; the team knows what real setup is ready and what may block the first request.

### Module B — Remote persistence, Clerk authorization, and first interaction (00:15–01:00)

**Quick summary:** Complete the first real, shared write/read path before spending time on the rest of the screen.

- **Goal:** Create a report through the real authenticated application and read the committed result from remote Neon.
- **Files owned:** Pantha owns migrations, DB/session, auth verification, access dependency and constraints. Tanvir owns API route/service integration, client token transport, and end-to-end smoke. Yousha owns the form/result component using the shared props.
- **Inputs → outputs:** Verified Clerk bearer token + contract-shaped report request + remote Neon dev branch → transactionally saved report and first history event; fresh authorized read response.
- **Dependencies:** Module A pass; Clerk test users and Neon development credentials; exact request schema and role rules from `api_contracts.md`.
- **Acceptance criteria:** Missing Clerk or DB config fails clearly; `org:member` can read but cannot write; `org:admin` can create; report and first event commit together; retry with the same request key does not duplicate; another authorized member reads the new row; no anonymous/fixture/SQLite product mode exists.
- **Checks:** One real editor POST, one member GET, wrong-role write returns `403`, missing/invalid session returns `401`, and DB row persists after a new API request. Run the check while coding, not at the end.
- **User-visible result:** An editor can save a report and sees a confirmed result; a traveller can see the saved report after a fresh read.

### Module C — Same-origin build and early Render deployment (00:15–01:30)

**Quick summary:** Prove that the application can be packaged and deployed with the same API and business logic used locally.

- **Goal:** Make one reproducible application image serve React and FastAPI locally and on Render; migrate before the new instance serves traffic according to the selected Render plan.
- **Files owned:** Pantha owns `Dockerfile`, `render.yaml`, startup/health config and migration execution. Tanvir owns frontend production build integration and runs the image/deploy smoke. Yousha checks the deployed visual route after availability.
- **Inputs → outputs:** Existing Vite/FastAPI packages + required runtime/build config → one image, Render service config, live health endpoint and real API/UI smoke result.
- **Dependencies:** Module A provider checks; Module B backend route is ready before meaningful authenticated smoke.
- **Acceptance criteria:** `PORT` is honored and binds `0.0.0.0`; frontend and API share an origin; missing required secrets/config fail; database and Clerk secrets are runtime-only; migrations run before accepting traffic under the verified plan method; health check reflects readiness; no build-time database migration.
- **Checks:** Local frontend build; container build/start; the agreed readiness endpoint (currently `/health/ready` in `deployment_setup.md`); unknown `/api` path returns JSON error; Render deploy log and health status; one authenticated deployed API request when Clerk origin config is ready.
- **User-visible result:** The same sign-in page and report interaction open from the Render URL.

### Module D — Trip context, relevance result, and report correction (01:30–02:20)

**Quick summary:** Extend the proven write path into the single trip-and-report task the user needs to complete.

- **Goal:** Complete one coherent trip-to-report workflow using actual API data and deterministic rules.
- **Files owned:** Tanvir owns trip/context routes and rule-based service plus refresh state. Pantha owns any required schema/seed adjustment and DB constraints. Yousha owns Trip Brief/editor presentation and scoped styling.
- **Inputs → outputs:** One prepared synthetic trip, ordered segments, saved reports and their timestamps → trip context with `affects_trip`, `not_affected`, or `unknown` plus reason/provenance; admin update creates a new version/event.
- **Dependencies:** Module B passes; schema/API names remain aligned with `api_contracts.md`; synthetic content is labeled in the screen.
- **Acceptance criteria:** Rule result is based only on known fields; missing/conflicting evidence returns unknown; lifecycle status is separate from freshness; update uses expected version and request key; stale/failed refresh never presents old data as current; another member sees updated state after manual refresh.
- **Checks:** Contract tests for relevant, non-matching, missing, stale, and conflicting inputs; update success; duplicate request; stale version conflict; empty report list; actual UI fetch and refresh.
- **User-visible result:** A traveller sees whether a report may affect the chosen trip, why, and how old the information is; an editor can correct the shared report.

### Module E — Integrated risk and two-user checks (02:20–03:10)

**Quick summary:** Exercise security, persistence, and concurrent changes with real identities while there is still time to fix failures.

- **Goal:** Catch authorization, duplicate-write, migration, and concurrency failures while fixes can still be made.
- **Files owned:** Tanvir owns API/contract integration tests and triage. Pantha owns migration/database/auth tests and test branch. Yousha owns two-user UI flow and visible error-state review.
- **Inputs → outputs:** Real app, two Clerk users, isolated Neon test branch and contract examples → pass/fail record with reproducible request IDs and defects.
- **Dependencies:** Modules B–D; disposable Neon test branch; both accounts provisioned in the same organization and a second workspace if available.
- **Acceptance criteria:** Two accounts show shared committed state; cross-workspace rows cannot be read or changed; wrong role is denied server-side; concurrent updates produce one success and one explicit conflict; lost response can be checked using the original request key; forward migration succeeds on isolated branch; seed does not overwrite edited data.
- **Checks:** Run critical auth, isolation, idempotency, version-conflict, transaction, migration, and API/UI tests. If a second workspace/account is unavailable, mark that test unverified rather than weakening authorization.
- **User-visible result:** Users see saved, denied, conflict, or unavailable states clearly; no misleading success is shown after an unknown write.

### Module F — Browser acceptance, README setup, and release check (03:10–04:00)

**Quick summary:** Inspect the real app in a browser and leave a setup path another teammate can follow safely.

- **Goal:** Verify the real workflow visually and leave a reproducible configuration-only setup guide.
- **Files owned:** Yousha owns UI fixes in her feature files and browser notes. Tanvir owns `README.md`, final integration checklist and smoke report. Pantha owns any deployment/migration blocker and records the actual deployment branch/plan behavior.
- **Inputs → outputs:** Deployed or explicitly blocked service + real test accounts + current app → desktop/mobile acceptance, concise setup instructions, final verified/unverified checklist.
- **Dependencies:** Modules B–E; a browser and Render URL for live deployed review.
- **Acceptance criteria:** Primary action is obvious; keyboard focus and labels work; no horizontal overflow at narrow mobile; loading/empty/invalid/unauthorized/offline/stale/success states are understandable; one editor-to-traveller journey succeeds; README uses remote Neon dev branch locally and a separate deployment branch, includes migrations and provider origins, and contains no secrets.
- **Checks:** Inspect actual desktop and narrow mobile browser sizes; test keyboard-only path; run deployed health and authenticated read/write/refresh; verify environment names and setup commands against code. Clearly record unavailable checks.
- **User-visible result:** A user can complete the shared report flow on desktop/mobile and understand the evidence age and result. A teammate can configure and run the same app without a hidden local-only mode.

## 5. Acceptance checklist and scope cuts

**Quick summary:** Acceptance requires a real, shared, deployed workflow, not a successful compile. The team must report unmet checks openly and must not substitute synthetic behavior for a baseline.

- [ ] Local requests use the remote Neon development branch; tests use an isolated Neon test branch; Render uses a separate deployment branch with the same migrations.
- [ ] Versioned migration applies forward; database constraints protect workspace scope, idempotency, and report-history relationships; seed is safe to re-run.
- [ ] Clerk session is verified by FastAPI; backend enforces active organization and role on every protected route.
- [ ] One authorized editor saves a report; another authorized member fetches the persisted change after refresh.
- [ ] Duplicate request, concurrent update conflict, unauthorized access, database outage, and unknown write result have explicit behavior.
- [ ] React screens use actual API reads/writes and show realistic loading, empty, error, stale, and success states.
- [ ] Render serves the same app with secrets configured at runtime, migrations run by the selected plan's supported method, and health checks pass.
- [ ] Desktop, narrow mobile, and keyboard paths are inspected in a browser; unverified checks are named.
- [ ] README documents setup and migration commands using configuration only; no secrets are committed.

**Cut order if behind:** (1) remove bilingual polish and extra explanatory copy, (2) show only one prepared trip and one report page, (3) remove the full history viewer while retaining transactional history writes, (4) remove any offline refinement beyond in-memory stale labeling. Do not cut remote Neon, real Clerk checks, persistence, migrations, deployment assets, ownership checks, real API reads/writes, or two-user acceptance.

**Final scope warning:** If Gate 1 or Gate 2 fails because provider setup is unavailable, the MVP is not complete. Preserve the evidence, finish deploy/setup files and checks that can run, and report the remaining baseline as blocked; do not claim that the four-hour result met acceptance.

## 6. How coding agents must use this plan

**Quick summary:** This plan is an implementation boundary, not permission to fill gaps with invented provider behavior. When source documents disagree or a required provider detail is unknown, stop at that boundary, verify it, and report the decision before coding beyond it.

1. Read this plan, the assigned work card, and the referenced source documents before editing.
2. Treat `docs/api_contracts.md` as the source for HTTP names, JSON fields, IDs, null handling, errors, idempotency, and ownership. Treat `docs/architecture.md` as the source for entities and data flow. Treat `docs/deployment_setup.md` as the source for environments and Render constraints. Treat `docs/frontend_design.md` as the source for user-visible behavior and visual acceptance. Treat `docs/mvp.md` as the product cut line.
3. Use repository inspection as the source for current code behavior. A proposed doc is not proof that code already implements it.
4. When code and docs differ, record the exact path/name and proposed resolution in the shared handoff note. Tanvir coordinates changes to contracts; do not quietly make the browser, API, and database disagree.
5. Do not invent Clerk SDK calls, JWT claim names, Render plan capability, Neon URLs, test credentials, or user roles. Verify provider-specific API details against installed package documentation or the provider dashboard. If they remain unknown, label the integration blocked or unverified.
6. Keep the AI key out of this workflow. The selected relevance result is deterministic; no inference endpoint belongs in the first release.
7. Do not add a second product mode to make progress. A fixture is acceptable only in the isolated `?design-preview=1` development path or test code; it must not be reachable as fallback when Clerk, Neon, or the API fails.
8. Do not edit another person's owned files without coordinating first. One shared main checkout cannot safely accept three simultaneous edits to the same root file. If each person works in a separate worktree, Tanvir integrates the commits in dependency order and re-runs the shared checks.
9. Before finishing a work block, report: files changed; commands run and outcome; provider branches/instances touched (names only); checks not run; unresolved contract mismatch; next owner and exact handoff.

## 7. Repository facts that change the implementation

**Quick summary:** The current repository is a starter plus a frontend design preview, not the authenticated transit application. These observed mismatches must be removed deliberately; do not copy starter fallbacks into the new workflow.

| Observed file or state | Verified current behavior | Required plan action |
|---|---|---|
| `backend/app/main.py` | Includes one router under `settings.API_PREFIX`; config currently defaults to `/api`. CORS can fall back to `*` when the configured value is not a list. | Mount the contract's versioned API at `/api/v1`; keep health routes outside that prefix. Replace permissive CORS behavior with the exact local origin list. In production same-origin serving should not need wildcard CORS. |
| `backend/app/core/database.py` | Creates an engine at import time only if `DATABASE_URL` is truthy; otherwise logs standby. `get_db()` yields `None` when not configured and automatically commits after a successful dependency scope. | Remove standby behavior and fail startup clearly if required remote DB config is missing. Use finite pool settings. Do not rely on dependency teardown to commit product writes; each mutation service owns an explicit transaction with report, event, and receipt committed together. |
| `backend/app/core/config.py` | `DATABASE_URL` defaults to an empty string; `.env` is loaded relative to process working directory; `API_PREFIX` defaults to `/api`; Gemini is configured in the starter. | Add required deployment/runtime settings and validate them. Keep local commands running from `backend/` as documented so `.env` resolution is predictable. Do not expose secrets through Vite variables. Remove Gemini from the required startup path; do not add a mock response. |
| `backend/app/api/routes.py` | Existing routes are `/health`, `/chat`, `/generate-idea`, `/items`, `/team` under `/api`; item list/write use a module-level in-memory list. | Implement the DhakaPath contract routes. Remove or retire starter demo routes/fallbacks from the shipped workflow. Do not claim the existing `/items` POST proves persistence. |
| `backend/app/models/schemas.py` | Contains starter-only health/chat/item models; it does not contain the proposed trip/report models. | Add the exact Pydantic v2 models from the contracts, with strict extra-field handling for mutation requests and explicit nullable fields. Avoid inventing a second response shape. |
| `backend/app/services/gemini.py` | Returns synthetic/mock responses when the key is absent and contains fallback behavior. | Leave this service outside the selected product path; do not call it from relevance or report handling. If retained for unrelated starter endpoints, it must not affect the MVP and should not be represented as live functionality without configuration. |
| `frontend/package.json` | React/Vite/Lucide only; no Clerk SDK or test runner is currently declared. | Add the supported real Clerk React package and update `package-lock.json`; verify its current token/org API from official package docs before choosing calls. Do not write guessed SDK usage. |
| `frontend/src/App.jsx` | Passes `workspaceId={null}` in the normal app. The synthetic fixture is dynamically imported only for `import.meta.env.DEV` plus `?design-preview=1`. | Add real Clerk sign-in and active organization state. Normal production must never receive a fixture. Preserve the fixture guard only for design preview and confirm it is absent from the production bundle. |
| `frontend/src/services/tripBriefApi.js` | Has only trip-list and context GET methods, relative `/api/v1` paths, timeout/abort support, and no Authorization bearer header. It expects an error body with `detail`, unlike the contract's `error/message` envelope. | Add current Clerk session-token transport and the minimum write/reconciliation calls. Parse the documented error envelope; preserve request IDs and `409` metadata. Use no client-supplied role as authority. |
| `frontend/vite.config.js` | Proxies `/api` to local FastAPI at `127.0.0.1:8000`; it does not change API semantics. | Keep the `/api` proxy. Ensure FastAPI's final routes have exactly one `/api/v1` prefix; do not create `/api/api/v1` or point the browser at a second implementation. |
| `frontend/src/features/trips/TripBriefScreen.jsx` | Implements the representative read-only screen and in-memory stale view; it expects trip/context props and has no editor. | Extend the screen with the bounded report form and permission/result states. Clear old workspace state and abort in-flight requests on account/org switch. Keep the current stale page read-only. |
| Tests/deployment assets | No backend test tree, Alembic config/migrations, Dockerfile, Render Blueprint, or configured frontend test runner was found. | Add Alembic and test dependencies through `uv` and lock them. Use a disposable remote Neon test branch for DB tests. Build with Docker/Render assets; use actual browser checks for the UI. Do not claim a nonexistent test command has passed. |

**Commands grounded in current layout:** From `backend/`, the documented start path is `uv sync --locked`, then after migrations exist `uv run alembic upgrade head`, then `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`. From `frontend/`, use `npm ci`, `npm run dev -- --host 0.0.0.0`, `npm run lint`, and `npm run build`. `uv run pytest -q` becomes valid only after the team adds and locks `pytest` and `httpx` as development dependencies and creates tests. Never run migration or destructive tests on the deployment branch.

## 8. Frozen product/API slice for this four-hour build

**Quick summary:** The full contract is broader than the time budget. Implement only the endpoints required for sign-in, one trip context, one report create/update, and safe reconciliation; leave unrelated contract endpoints unimplemented and say so.

### Required request path

**Quick summary:** Every protected request carries the user's live session token; the server derives identity and permissions before reading or changing shared data.

`Clerk sign-in → browser obtains current session token → Authorization: Bearer <token> → FastAPI verifies token → server derives (issuer, sub, active org_id, org_role) → workspace-scoped Neon query/transaction → contract response → React updates state.`

- The local user identity key is the verified `(issuer, sub)` pair. Actor IDs in report history come from this verified mapping. Never accept `user_id`, `actor_id`, `role`, `org_role`, `org_id`, membership, or ownership from a body as authority.
- The app uses one shared Clerk Organization for the demo. `org:member` reads; `org:admin` creates and updates. Provision these users in the Clerk dashboard; no public signup path auto-creates an organization or admin.
- Read an active organization from the verified token/session. Verify the installed Clerk SDK and actual organization claim shape before coding. A valid user without active membership is a `403`; a path workspace that differs from the active org is hidden as `404`; a wrong-role write is `403`.
- Use local, deployment, and test Neon branches separately. A branch name/URL is configured outside source code. Never write provider URLs, user emails, or secrets into plan files, fixtures, logs, or commits.

### Routes this MVP calls

**Quick summary:** Implement the route set required for the selected screen; do not mistake every contract route for a four-hour feature requirement.

| Route | Why required | Owner | Minimum verification |
|---|---|---|---|
| `GET /api/v1/me` | Resolve signed-in user and active workspace for the app shell | Tanvir (route), Pantha (identity dependency) | Valid member returns local user/workspace/role; missing/invalid token `401`; no active workspace `403`. |
| `GET /api/v1/workspaces/{workspace_id}/trips` | Populate the real trip selector from Neon | Tanvir | Empty and seeded lists; only active workspace rows; stable `limit/cursor` behavior if pagination is returned. |
| `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context` | Show ordered trip legs, matching reports, relevance result, freshness, and `as_of` | Tanvir | Relevant, no-match, missing/conflicting, stale, empty report cases. Compute relevance over all eligible reports, not only the returned evidence page. |
| `POST /api/v1/workspaces/{workspace_id}/incidents` | First persistent product interaction | Tanvir (route/service), Pantha (transaction/schema) | Admin-only; same idempotency key and same payload cannot create a duplicate; report + first event + receipt commit atomically. |
| `PATCH /api/v1/workspaces/{workspace_id}/incidents/{incident_id}` | Correct/update a shared report in the same editor flow | Tanvir/Pantha | Requires `expected_version` and reason; compare-and-swap update; one success and one `409 VERSION_CONFLICT` under concurrent update; append event in same transaction. |
| `GET /api/v1/workspaces/{workspace_id}/requests/{request_key}` | Safely inspect a write whose response was lost | Tanvir | Same verified actor only; committed/rejected receipt; missing receipt is not proof the original request rolled back. |
| `GET /health/ready` and optionally `/health/live` | Render health checks and service readiness | Pantha | Align routes with deployment docs before implementation; readiness check has bounded Neon probe; response meets Render's documented window. |

`GET /incidents`, report detail, history-event list, and cursor navigation for evidence are defined in `api_contracts.md` but are not automatically in the four-hour UI scope. Add an endpoint only if the selected UI flow actually calls it. Keep the event write and request receipt because the write contract depends on them. If safe unknown-save reconciliation cannot be completed, keep writes disabled after an uncertain outcome and disclose the incomplete acceptance; never blind-retry with a new key.

### Database work required for the slice

**Quick summary:** Schema constraints and one transaction protect the shared report when requests retry or race.

- Implement the contract entities: `Workspace`, `UserIdentity` (if needed for local `(issuer, sub)` mapping), `Trip`, `TripSegment`, `IncidentReport`, `IncidentEvent`, and `MutationReceipt`. Check `architecture.md` and `api_contracts.md` before finalizing names/columns; if those documents disagree, pause and make one coordinated correction.
- At minimum enforce workspace ownership through foreign keys; unique `(trip_id, ordinal)` for ordered trip segments; unique `(workspace_id, actor_id, request_key)` or the contract-equivalent receipt key; unique issuer/subject identity mapping; report version positive; event references the same workspace/report; timestamps are timezone-aware UTC in API serialization.
- Use a single transaction for report mutation, event snapshot, and receipt. Do not use `create_all()` as migration. Do not delete report history when a report is corrected or resolved.
- Create one seed command for synthetic trip/segment/report data. It must be idempotent and must not overwrite report content changed by a user. Clearly set `is_synthetic=true` and `source_type=synthetic_example`; real user submissions use server-set `is_synthetic=false`.
- The 30/120 minute freshness cutoffs in `api_contracts.md` are **ASSUMPTIONS**, not measured truth. Keep these values in one server-side rule and label the data's freshness as approximate; do not promote them to a safety guarantee.

## 9. Detailed integration/test matrix

**Quick summary:** Test the failure cases that can mislead a commuter or expose another workspace. A passing frontend build is only a build check and cannot stand in for these cases.

| Case | Setup/action | Required result | Owner/checkpoint |
|---|---|---|---|
| Missing DB config | Start API without `DATABASE_URL` | Fail clearly during startup; no in-memory or SQLite path | Pantha, Module B |
| Missing/invalid Clerk config | Start API with required verifier config absent/invalid | Fail clearly; do not accept unsigned/unverified token | Pantha, Module B |
| No/expired session | Call protected route without valid bearer | `401` contract error; no protected data | Tanvir + Pantha, Module B |
| Member reads/admin writes | Sign in with each role; GET context, then POST | Member GET succeeds; member POST `403`; admin POST commits | All, Gate 1 |
| Different organization | Use workspace path that does not match active org | Return hidden `404`/contract result; do not query or reveal other workspace data | Pantha/Tanvir, Module E |
| Duplicate POST | Repeat identical request with same key/actor/workspace | Same resource returned as replay; one row, one first event | Tanvir/Pantha, Module E |
| Reused key with changed payload | Send same key with different canonical payload | `409 IDEMPOTENCY_KEY_REUSED`; original row unchanged | Tanvir, Module E |
| Two concurrent PATCH requests | Both use same `expected_version` | One increments version; other gets `409`; no lost update or extra success event | Tanvir/Pantha, Module E |
| Lost write response | Drop/timeout response after sending; query same request key | UI does not claim save; receipt/refetch determines outcome; no new key retry | Tanvir/Yousha, Module E |
| Trip context no reports | Seed trip only | `not_affected` wording is “No match found…”; never “safe” | Tanvir/Yousha, Module D |
| Missing/conflicting/stale evidence | Use contract test data | `unknown` when evidence is insufficient; show observation age and source | Tanvir/Yousha, Module D |
| Account/workspace switch during request | Delay request, switch Clerk org or sign out | Abort/ignore old response; clear trip, data, editor draft and stale cache before new workspace view | Tanvir/Yousha, Module E |
| Neon unavailable | Break only isolated test branch connectivity | Bounded `503`; stale browser copy is marked stale; no server memory response | Pantha/Tanvir/Yousha, Module E |
| Safe seed rerun | Edit a report, run seed again | New missing static rows may be added; edited report remains unchanged | Pantha, Module E |
| Migration failure | Deliberately test on disposable Neon branch | New service does not report ready; deployment log shows migration failure; no hidden `create_all()` | Pantha, Module E |
| Production asset boundary | Build production frontend | Synthetic design fixture is not part of reachable production workflow; no DB/auth secret in bundle | Tanvir, Module C |
| Browser acceptance | Real users, actual API, desktop + narrow mobile + keyboard | Main task clear; focus/labels/readable errors; no overflow; writes persist and second user sees after refresh | Yousha, Module F |

**Test tooling rule:** The backend currently has no test directory or declared `pytest`/`httpx` dependency; the frontend has no test runner. Add and lock backend test dependencies if automated API contract tests are written. Do not spend this sprint installing a full browser automation stack. The actual visual and two-user browser checks remain manual and must be recorded as observed, not inferred from unit tests.

## 10. Commands, environment, and release evidence

**Quick summary:** Commands are run from their owning folders and use remote Neon only. Environment values are provider configuration; these documents and Git must never contain actual credentials.

### Local development

**Quick summary:** Local React and FastAPI share the same API contract and use the remote development branch; only the Vite proxy differs from deployment.

1. Configure `backend/.env` using the remote Neon **development** branch and Clerk **development** instance. Use the exact variable names in `deployment_setup.md`; do not paste secret values into this plan or messages.
2. Backend terminal, from `backend/`: `uv sync --locked`; after Alembic exists, `uv run alembic upgrade head`; then `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
3. Frontend terminal, from `frontend/`: `npm ci`; `npm run dev -- --host 0.0.0.0`. The Vite proxy forwards `/api` to FastAPI. Browser code uses relative `/api/v1/...` paths and real bearer tokens.
4. Check `npm run lint` and `npm run build` after UI/API integration. From `backend/`, run `uv run pytest -q` only after test dependencies and tests exist.
5. Never point local development at the deployment branch; never create local product data as fallback.

### Render and release

**Quick summary:** Render runs the same code with a separate Neon branch and runtime configuration; a local image build is only a preparatory check.

1. Build one Docker image with the frontend bundle and backend. FastAPI serves `/api` and the static React app from the same origin. Unknown API routes return JSON 404, not `index.html`.
2. Keep build-time public config limited to `VITE_CLERK_PUBLISHABLE_KEY`. `DATABASE_URL`, `MIGRATION_DATABASE_URL`, and any Clerk secret/private signing material are runtime secrets; never put them in `VITE_*`, Docker `ARG`, JavaScript, source maps, or Git. Confirm the exact supported Clerk verifier setting rather than assuming the example key name is accepted by the selected SDK.
3. Use a separate Neon **deployment** branch with the same Alembic revisions as development. The Render service must not point to the development or isolated test branch.
4. Check the actual Render plan in the account before selecting migration timing. Paid pre-deploy support and Free startup-migration behavior are described in `deployment_setup.md`; no paid plan or purchase is assumed. If using Free, record that startup migration is a single-instance demo trade-off.
5. Confirm `PORT` binding, exact health paths, static fallback order, readiness probe, migration log, Clerk allowed origin/redirect, and one authenticated deployed read/write.
6. Record evidence as: command or browser action; target environment/branch name (never URL or password); expected outcome; observed outcome; pass/fail/unverified; request ID if relevant. Do not report a successful live deploy based only on a local Docker build.

### End-of-sprint handoff template

**Quick summary:** Every owner reports evidence, failures, and unresolved dependencies in the same short format.

```text
Owner:
Files changed:
Contract decisions made (link/section):
Commands run and results:
Environment checked (dev/test/deploy only):
Browser/users checked:
Known limitations or failing checks:
Provider or contract blockers:
Next owner and exact next action:
```

## 11. Unresolved items agents must not guess

**Quick summary:** The project docs intentionally preserve several unknowns. A coding agent should resolve only what is needed for the slice, write the decision back to the contract/setup docs, and keep remaining unknowns visible.

- **Health route:** API contract currently describes `/healthz`; deployment guide configures `/health/ready` and documents `/health/live`. Resolve the exact public health behavior in both docs and Blueprint before implementation.
- **Clerk verification:** Confirm a currently supported Python verification method and required claims for the configured Clerk instance. The docs discuss `CLERK_JWT_KEY`/`CLERK_SECRET_KEY`; do not assume either is correct without matching the actual installed SDK/middleware behavior.
- **Role claims:** Confirm the actual organization role values available in the selected Clerk plan and test accounts. The planned roles are `org:member` and `org:admin`; if unavailable, report the blocker and update the contract deliberately, never default every user to admin.
- **Render plan:** Confirm account access and current plan; do not trigger a paid upgrade. The plan-specific migration method must match the chosen plan.
- **Test branch:** Confirm an isolated Neon branch can be created and migrated. If unavailable, do not run destructive or concurrency tests on development/deployment data; mark those acceptance items unverified.
- **Provider configuration:** User previously reported Clerk and Neon setup, but branch separation, allowed domains, test users, production instance and credentials were not verified during planning. Render was expected to be arranged later. Re-run the preflight rather than treating prior setup as proof.
- **Organizer coverage:** This build does not deliver broad route search, fare calculation, chat, or rerouting from the full challenge. Do not pitch it as satisfying those organizer requirements.
- **Offline rationale:** The stale last-loaded view has no direct validated need in `needs.md`. Keep it as a bounded proposition test only; do not let it displace the persistent shared report workflow.
