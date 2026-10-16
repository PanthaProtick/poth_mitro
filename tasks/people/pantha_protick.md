# Pantha Protick — detailed implementation work order

> **Old work order superseded (2026-10-16):** This card targets the canceled Clerk + Neon + Render phase. Use the current local-first SQLite/localhost handoff in [`../implementation_plan.md`](../implementation_plan.md); confirm scope for your module before starting. The old goals below are historical.

- **Role:** data, backend identity, migrations, runtime configuration, and deployment foundation.
- **Time box:** 4 hours; first working slice must support the minute-60 real write/read gate.
- **Success:** FastAPI verifies a real Clerk session, role-scopes a mutation, commits report + history + receipt to remote Neon, and serves a deployable image.
- **Primary handoff:** Tanvir needs a stable verified-actor dependency and transaction/session interface by minute 30.
- **Never do:** add SQLite, memory fallback, `create_all()`, unauthenticated product access, or guess Clerk claims/SDK calls.

## 1. Read first and establish facts

**Quick summary:** Use the central plan for scope and inspect the existing files before editing. The starter currently treats the database as optional, so the first safety change is to remove that behavior.

Read: `tasks/implementation_plan.md` sections 6–11; `docs/architecture.md`; `docs/api_contracts.md`; `docs/deployment_setup.md`; `docs/mvp.md`; `docs/team_skills.md` (Partha is excluded).

Observed starting files:

- `backend/app/core/database.py` creates an engine only when `DATABASE_URL` is set, otherwise yields `None`; its dependency automatically commits after the route returns.
- `backend/app/core/config.py` has `DATABASE_URL=""` and `API_PREFIX="/api"`; `.env` resolves relative to the process working directory.
- `backend/app/main.py` includes the router under that prefix and can fall back to wildcard CORS.
- `backend/app/api/routes.py` has the starter `/health`, `/chat`, `/items`, and other demo routes; item writes modify a module-level list.
- `backend/pyproject.toml` has FastAPI, SQLAlchemy, asyncpg, settings, and Gemini; it does not declare Alembic, Clerk verification, pytest, or httpx. There is no Alembic folder/config or backend tests directory.

These observations describe the current checkout, not the target architecture. Do not use any starter route as proof of persistence or authorization.

## 2. Owned files and explicit boundaries

**Quick summary:** Own DB/auth/migration/runtime and deploy files. Tanvir owns product route/service code and final integration; coordinate any shared startup file before changing it.

**You own:**

- `backend/app/core/config.py` — required settings and validation.
- `backend/app/core/database.py` — engine, pool bounds, session creation, explicit transaction helpers.
- New `backend/app/core/auth.py` (or one agreed auth module) — provider verification and verified actor/workspace/role dependency.
- New `backend/app/db/models.py` and `backend/app/db/**` — SQLAlchemy entities and narrowly scoped repositories if needed.
- `backend/alembic.ini`, `backend/alembic/**`, backend dependency declarations/`uv.lock` for Alembic and test tools.
- `Dockerfile`, `render.yaml`, and only the required `backend/app/main.py` lifespan/static/health wiring after coordinating with Tanvir.
- Database/auth tests under a Pantha-owned folder such as `backend/tests/test_auth_db.py`; agree this path before Tanvir adds route tests.

**Do not own/edit without agreement:** `backend/app/api/**`, `backend/app/services/**`, `frontend/**`, `README.md`. Do not create `backend/app/main.py` changes that conflict with Tanvir's router changes; share the proposed exact diff first.

## 3. Minute 0–15 provider preflight

**Quick summary:** Verify access without copying secrets into chat, Markdown, Git, or logs. A project/account existing is not evidence that its required branches, roles, or origins are ready.

1. Confirm separate Neon development, isolated test, and deployment branches can be accessed. Confirm which values are pooled runtime URL and direct migration URL; never print them.
2. Confirm a Clerk development instance with one real `org:admin` and one `org:member` in the same organization. Check the active-organization flow and exact allowed local/deployed origins.
3. Verify the provider-supported Python token-verification method and installed version's expected issuer/subject/organization/role claims. Check official package/provider documentation. The plan does not preselect an unverified SDK call.
4. Confirm Render account and current service plan. Do not upgrade or incur cost without explicit authorization. Capture plan capability, not credentials.
5. Resolve the health-path mismatch before implementing health: API contract says `/healthz`; deployment guide says `/health/ready` and `/health/live`. Ask Tanvir to align the contract/setup docs at minute 10, then use the agreed names.

**Preflight handoff:** send Tanvir a compact status: `Neon dev/test/deploy ready: yes/no`; `Clerk dev org and roles: yes/no`; `verifier mechanism/version confirmed: yes/no`; `Render plan: confirmed/not confirmed`; `health path decision: <path>`; blocker and next step. Do not include URLs, emails, tokens, or keys.

## 4. Database and migration work order

**Quick summary:** Add only tables needed for trips, shared reports, identity mapping, history, and safe mutation retry. Every change must be applied by Alembic; user edits must survive seed reruns.

1. Add Alembic to `backend/pyproject.toml` and update `backend/uv.lock`. Add `pytest` and `httpx` as development dependencies if implementing FastAPI contract tests. Do not claim tests exist until files are written.
2. Make settings fail clearly when `DATABASE_URL` or required auth config is absent/malformed. Keep `DATABASE_URL` and `MIGRATION_DATABASE_URL` separate per environment; never default to local SQLite or an empty database.
3. Configure a small finite async SQLAlchemy pool and finite connect/statement/request budgets consistent with `api_contracts.md`. Do not copy unknown numeric defaults from memory; use the documented proposed limits and measure Neon behavior.
4. Replace implicit commit-on-dependency-exit behavior with explicit transaction ownership in the mutation service. Reads can use a read session. A create/update must commit report state, append-only `IncidentEvent`, and `MutationReceipt` atomically; any exception rolls all three back.
5. Model the entities/columns from `docs/architecture.md` and `docs/api_contracts.md`; resolve naming disagreement before making migrations. At minimum enforce workspace-scoped foreign keys, unique trip segment ordinals, unique actor/workspace/request key, unique issuer/subject identity, positive report version, event/report workspace consistency, and indexes used by workspace list/context queries.
6. Use Alembic revision files only. Never call `Base.metadata.create_all()` in startup or deployment. Test forward upgrade on isolated Neon test branch; do not reset, truncate, or run concurrency tests against development/deployment branches.
7. Implement one idempotent synthetic seed operation for the shared demo organization and prepared trips. It may insert missing synthetic rows but must not overwrite reports edited by users. Mark synthetic rows `is_synthetic=true` and `source_type=synthetic_example`. The API must never accept client-supplied `is_synthetic`.
8. Ensure report updates append a before/after event with actor and reason; there is no hard-delete route and no event-delete cascade.

**Minimum entities:** `Workspace` keyed by Clerk organization ID; local `UserIdentity` if needed to map `(issuer, sub)` to a local UUID; `Trip`; ordered `TripSegment`; `IncidentReport`; append-only `IncidentEvent`; `MutationReceipt`. Final names and columns must follow contract/schema coordination, not this shorthand list.

## 5. Clerk identity and authorization work order

**Quick summary:** The verified token supplies identity and active organization; FastAPI enforces read/write roles. A button hidden in React is not authorization.

1. Verify token signature/issuer/audience/authorized party/expiry by the provider-supported mechanism. Cache key material only according to the supported SDK behavior; if secure verification cannot complete, fail closed with the contract's `503` or `401` as appropriate.
2. Map verified `(issuer, sub)` to local user identity. Derive organization ID and role only from verified session context. Never accept actor ID, user ID, role, workspace owner, or membership in mutation JSON.
3. Use the agreed policy: active `org:member` and `org:admin` may read; only `org:admin` writes. If actual Clerk claims or plan cannot provide these values, stop, report, and coordinate a contract change. Never make all signed-in users admins.
4. Return `401` for absent/invalid identity; `403` for valid identity with no required workspace or wrong role; `404` for a path workspace/resource that would reveal another workspace's existence. Follow the exact error envelope and request ID contract.
5. Keep route handlers consuming one verified-actor dependency. Tanvir should not parse tokens or duplicate role rules in route functions.

**Auth acceptance:** real admin can write; member can read; member write is denied; missing token is denied; wrong workspace path does not reveal data; changing organization invalidates scope; no test uses a fabricated signed token as a substitute for the real end-to-end acceptance.

## 6. Render/runtime work order

**Quick summary:** Build the same React + FastAPI application used locally. Runtime secrets stay in Render runtime configuration; deployment database is a separate Neon branch.

1. Add the root `Dockerfile` and `render.yaml` using the structure in `docs/deployment_setup.md`. Confirm paths match repository root and the final Python working directory is `backend/` or commands are adjusted consistently.
2. Do not use secret values in Docker `ARG`, frontend build, source maps, or static files. Only the Clerk publishable key may be exposed as the documented public Vite value; all backend credentials stay runtime-only.
3. Configure FastAPI to serve built React files only after API and health routes; unknown `/api/...` must return JSON 404, not React HTML. Vite's existing `/api` proxy remains local transport configuration.
4. Render Free does not support a pre-deploy command according to the setup doc. If the selected account uses Free, the documented single-instance start-wrapper migration method is a demo trade-off; if paid is selected, use the supported pre-deploy migration command. Confirm actual plan before choosing; do not spend money.
5. Ensure the new process does not listen if the migration fails. Bind to `0.0.0.0:$PORT`; health response must be bounded to Render's documented check time.
6. Report render.yaml created vs deployed separately. A local Docker build is not a live deployment check.

## 7. Commands, tests, and handoff

**Quick summary:** Run only the remote test branch for destructive/integration work. Give Tanvir exact names and observed results so he can connect product routes without guessing.

From `backend/`:

```powershell
uv sync --locked
uv run alembic upgrade head
uv run pytest -q
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

`pytest` is valid only after tests and locked dev dependencies are added. Run migrations on development for local app use and on the isolated test branch for test verification; never run test resets on deployment. Render migration execution is controlled by the actual plan path.

Before handoff, report:

- migration revision ID and whether upgrade passed on dev/test/deployment branches (branch labels only);
- table/column names and constraints Tanvir should use;
- exact Python dependency function/interface for verified actor, workspace, role, and DB session;
- real Clerk token test outcome and role matrix;
- Docker/build/Render status, selected plan and migration method;
- unverified cases, blockers, and request IDs. Never include secrets.

**Cut rule:** If auth/Neon access is not ready at minute 15, stop optional schema/deployment polishing and pair with Tanvir on the first real request. If Gate 1 is missed, do not fabricate a successful flow. If Render is unavailable, finish assets and clearly mark deployed acceptance blocked.
