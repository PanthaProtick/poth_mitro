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
