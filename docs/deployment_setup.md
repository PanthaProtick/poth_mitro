# DhakaPath MVP deployment setup

- Current setup is local; hosted deployment and provider accounts are deferred.
- Configure a persistent SQLite file with `DATABASE_PATH`.
- Apply Alembic migrations before starting FastAPI.
- Import the validated approximate map references and optional synthetic seed.
- Bind FastAPI and Vite to loopback; no login or shared-user boundary exists.

> **Status update (2026-10-16):** Deployment setup is deferred. The user canceled Clerk and Neon for the current phase and directed local-first implementation. Use [`../backend/implementation_plan.md`](../backend/implementation_plan.md) for local SQLite and localhost setup. Nothing in this guide is a current setup requirement; do not configure provider secrets or Render for this phase.

## Current local setup (authoritative)

**Quick summary:** Run FastAPI and Vite in separate local terminals. Both listen only on loopback. No provider keys or database service are needed.

1. Create `backend/.env` from the local example below; this file is ignored by Git. The SQLite file is created under `backend/data/` by the implemented local database setup.
2. Backend terminal, from repository root:

   ```powershell
   Set-Location backend
   uv sync --locked
   uv run alembic upgrade head
   uv run python -m app.scripts.map_data import
   uv run python -m app.scripts.map_data seed-demo
   uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

3. Frontend terminal, from repository root:

   ```powershell
   Set-Location frontend
   npm ci
   npm run dev -- --host 127.0.0.1
   ```

4. Open `http://127.0.0.1:5173`. Check `/health/live` and `/health/ready` on port 8000. Liveness is process-only; readiness returns `503 DATABASE_UNAVAILABLE` until the expected migration and bounded SQLite probe succeed.

Local `backend/.env` shape:

```dotenv
DATABASE_PATH=data/dhakapath.db
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

The local migrations, persistence, health endpoints, catalog summary, and Vite loopback bind are implemented. Do not bind to `0.0.0.0` or use this unauthenticated local configuration on a network-facing host.

**Current frontend integration contract (2026-10-16):** The browser uses relative `/api/v1/trips?limit=20&cursor=...` and `/api/v1/trips/{id}/context?report_limit=20&report_cursor=...` URLs; the Vite `/api` proxy forwards to loopback FastAPI. The UI appends cursor pages without fetching all rows, deduplicates by trip/report ID, and keeps relevance from the server response. It caches assembled per-trip context in IndexedDB under the local scope/trip key for 30 days. Cache records include schema version, `cached_at`, original server `as_of`, loaded-report count, completeness, and any next cursor. Restored records are stale and read-only. The UI separates API reachability from database-backed readiness; the browser online hint does not prevent requests. A timed-out/lost write retains the exact body/key in a tab-session recovery record without automatic replay; refresh and explicit review are required before changing an uncertain attempt. The API, browser flow, and responsive screens must be verified against a disposable database before claiming end-to-end acceptance.

## Historical hosted deployment setup (not current)

- **One Render web service serves both React and FastAPI** from one origin; local Vite proxies `/api` to the same FastAPI routes.
- **Both local and deployed apps use remote Neon PostgreSQL.** Use separate development and deployment branches, plus an isolated test branch.
- **Real Clerk sign-in and server-side organization/role checks are required** for the shared traveller/editor workflow.
- **Secrets stay in backend or provider settings.** Only the Clerk publishable key may be built into the browser bundle.
- **Migration timing depends on the Render compute plan:** paid web services support a pre-deploy command; Free web services do not.

## 1. Read this before setup

**Quick summary:** This is a setup plan for one shared application, not a second local product. The repository currently lacks verified Clerk integration, migrations, static frontend serving, a Dockerfile, and a Render Blueprint, so completing this guide requires adding those assets and verifying the real provider accounts.

**FACT — user-reported setup:** A Clerk app, AI API key, and Neon project exist; Render can be set up later. Their credentials, roles, branches, and live connections have not been verified. Do not put secrets in this document or Git.

**DECISION:** The AI key is not required for this MVP workflow. Do not configure or call an AI provider unless the proposition and MVP scope change.

## 2. Required provider setup

**Quick summary:** Configure the providers before implementation reaches the first end-to-end test. Use a separate environment/branch for each purpose and keep the configuration values out of source control.

### Neon

1. In the existing Neon project, create or identify `development`, `deployment`, and a disposable `test` branch. The deployment branch must not be the local development branch.
2. Use the Neon connection details for the exact branch, database, and role. Set TLS/SSL as shown in the provider URI.
3. For the app's `DATABASE_URL`, prefer the Neon pooled endpoint if it works with the selected SQLAlchemy/asyncpg settings. Keep the pool small and finite.
4. For migrations, use a direct endpoint in `MIGRATION_DATABASE_URL` where required by the Neon setup. Both values must point to the same intended branch for that environment.
5. Run schema migrations and destructive/concurrency tests only against the isolated test branch. Do not reset or truncate development/deployment data as a test shortcut.
6. Keep a brief branch inventory (purpose, branch name, owner) without credentials. Neon documents pooled URI selection and isolated branch test environments in its [connection URI reference](https://api-docs.neon.tech/reference/getconnectionuri) and [testing use cases](https://api-docs.neon.tech/reference/use-cases).

Example shape only; never commit real values:

```dotenv
# Local .env in backend/; use the remote Neon development branch.
DATABASE_URL=postgresql+asyncpg://APP_ROLE:REDACTED@DEV_HOST-pooler/APP_DB?sslmode=require
MIGRATION_DATABASE_URL=postgresql+asyncpg://APP_ROLE:REDACTED@DEV_HOST/APP_DB?sslmode=require
```

### Clerk

1. Enable Clerk Organizations and make membership required for the workflow. Create one shared demo organization in the development instance and one in production.
2. Create at least two real test accounts: one traveller/member and one report editor/admin. Assign their roles in the Clerk Dashboard or through an authorized Clerk organization-management flow.
3. Add exact origins/redirect destinations for `http://localhost:5173` and the eventual Render service URL. Add a custom domain only if one is configured; then complete the DNS checks shown by Render/Clerk before using it.
4. Configure FastAPI to verify only session tokens with the official `clerk-backend-api` SDK. Set `accepts_token=["session_token"]` explicitly and set `authorized_parties` to the exact allowed frontend origins.
5. Use a test/dev Clerk publishable key locally and a production publishable key for the deployed frontend build. Configure a matching Clerk JWT public key for backend verification in each environment. A Clerk secret key is not needed for local JWT verification when the configured SDK path uses the public JWT key; only add a secret key if the backend actually calls Clerk's Backend API.

**Origin terms:** An *origin* is the scheme, host, and port shown by the browser, such as `http://localhost:5173`. An *authorized party* is the origin Clerk permits for a session token. A *redirect URL* is where Clerk may send a user after sign-in or sign-up. Keep each exact and environment-specific. Same-origin production requests avoid a separate API CORS allowlist, but Clerk still needs its origin/redirect configuration.

Official setup references: [Clerk session verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification), [Clerk organization roles](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions), and [Clerk session claims](https://clerk.com/docs/guides/sessions/session-tokens).

### Render

1. Connect the Git repository and create one Docker-based **Web Service** from the repository root.
2. Add the Blueprint and Dockerfile described below. Confirm the selected compute plan in the Render Dashboard before syncing it.
3. Set the production service's Neon deployment-branch URL and production Clerk settings as runtime/build values described in section 6.
4. If a custom application domain is required, add it to Render, complete its DNS/TLS verification, then add the final HTTPS origin and redirect destination to Clerk. Do not guess DNS records: use the exact values in the provider dashboards.

## 3. Local start/build commands and same-origin behavior

**Quick summary:** Run FastAPI and Vite as two development processes, but expose one API path: `/api`. Vite proxies that path to FastAPI locally; in deployment, FastAPI serves the built React files and the API itself.

**Backend local commands** (from `backend/`):

```powershell
uv sync --locked
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend local commands** (from `frontend/` in a second terminal):

```powershell
npm ci
npm run dev -- --host 0.0.0.0
```

The frontend should use relative URLs such as `fetch('/api/v1/...')`. Vite's `vite.config.js` should proxy `/api` to `http://127.0.0.1:8000`. Do not configure a different API base URL for local versus deployment. The proxy is a development-server setting only; it is not a second API implementation.

**Production build path:** A multi-stage `Dockerfile` builds the Vite frontend, installs the locked Python backend dependencies with `uv`, copies `frontend/dist` into a backend static directory, and starts FastAPI. Set the final image working directory to `/app/backend` (or adjust the commands consistently) so Alembic and `app.main:app` resolve. FastAPI mounts static assets and serves `index.html` for frontend routes. It must return normal JSON 404 responses for unknown `/api/...` paths rather than returning the React page.

Use a shell entry point so the runtime `PORT` value is expanded:

```dockerfile
CMD ["sh", "-c", "exec uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
```

FastAPI mounts the SPA fallback after API and health routes. Add immutable caching for hashed build assets; keep `index.html` short-lived so a deployment does not leave the browser pointing at removed asset names.

## 4. Migration execution and current Render plan support

**Quick summary:** The safest Render path runs Alembic before the new application receives traffic. As of the official Render documentation reviewed on **2026-10-16**, `preDeployCommand` is available for paid web services, private services, and background workers, but not Free web services.

**VERIFIED FACT:** Render says its pre-deploy command runs after build and before deployment, is recommended for database migrations, and is available only for paid web services, private services, and background workers. Free services also have significant limits and Render says not to use them for production applications. See [Render deploy commands](https://render.com/docs/deploys) and [Free plan limitations](https://render.com/docs/free).

### Preferred when using a paid Render web-service plan

Set a Blueprint `preDeployCommand` to `uv run alembic upgrade head`. It runs before the new app is deployed. The command must use the same image/code and `MIGRATION_DATABASE_URL` for the deployment Neon branch. If it fails, stop the release and inspect the migration/logs; do not start the new app against an unknown schema.

### Free-plan demo path

Free web services do not support `preDeployCommand`. For a single-instance hackathon demo, run `uv run alembic upgrade head` in the service start wrapper before starting Uvicorn. This ensures the new process does not listen before its migration command succeeds. It is not equivalent to a separate pre-deploy phase: the old revision may still be serving while the new process migrates. Keep migrations backward-compatible and use a single Render instance. Do not use this as a zero-downtime production migration strategy.

Do not run production migrations in the Docker build command. A build can succeed or fail independently of a deployment, and build-time migration changes the database before the new code is ready. Do not run migrations independently in every scaled worker. Do not rely on ORM `create_all()` at startup.

**Blueprint example for a Free single-instance demo:**

```yaml
# render.yaml — confirm current Blueprint syntax/plan options before syncing.
services:
  - type: web
    name: dhakapath-demo
    runtime: docker
    plan: free
    dockerfilePath: ./Dockerfile
    dockerContext: .
    dockerCommand: >-
      sh -c 'uv run alembic upgrade head &&
      exec uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}'
    healthCheckPath: /health/ready
    autoDeployTrigger: checksPass
    envVars:
      - key: ENV
        value: production
      - key: DEBUG
        value: "false"
      - key: DATABASE_URL
        sync: false
      - key: MIGRATION_DATABASE_URL
        sync: false
      - key: CLERK_JWT_KEY
        sync: false
      - key: CLERK_AUTHORIZED_PARTIES
        sync: false
      - key: VITE_CLERK_PUBLISHABLE_KEY
        sync: false
```

For a paid plan, replace `plan: free` with the exact plan identifier shown in Render, remove the migration from `dockerCommand`, and add:

```yaml
    preDeployCommand: uv run alembic upgrade head
    dockerCommand: >-
      sh -c 'exec uv run uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}"'
```

The official [Blueprint reference](https://render.com/docs/blueprint-spec) documents `preDeployCommand`, Docker commands, `healthCheckPath`, and plan fields. Recheck that reference at setup time because Render changes its plans and feature support.

## 5. PORT binding and health checks

**Quick summary:** Render assigns `PORT`; the server must bind to `0.0.0.0` and that assigned port. Use health checks that tell the truth about whether this application can serve its critical database-backed workflow.

**Required production command:**

```sh
uv run uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-10000}"
```

`PORT` is runtime configuration, not a value to bake into the JavaScript bundle. Render documents `0.0.0.0` binding and the default port `10000` in [Web Services](https://render.com/docs/web-services).

Implement:

- `GET /health/live`: process responds; this checks that the server loop is alive.
- `GET /health/ready`: validates required startup configuration and runs a bounded `SELECT 1` against Neon; return `200` only when the critical database path is usable, else `503`.

Use `/health/ready` as the Blueprint `healthCheckPath` so Render does not route to a process that cannot use its required database. Bound the check so it responds within Render's documented five-second HTTP check window. During a Neon outage, Render may consider the instance unhealthy; application requests must still return a clear `503`, not stale success. Review [Render health checks](https://render.com/docs/health-checks) and tune timeouts against observed Neon latency.

## 6. Required configuration values and secret boundaries

**Quick summary:** Backend and provider configuration is supplied at runtime; the Clerk publishable key is the only Clerk value that belongs in the browser build. Render's Docker build can receive configured environment values as build arguments, so the Dockerfile must never reference secret values in a build stage.

| Name | Local development | Render deployment | Build/runtime and visibility |
|---|---|---|---|
| `DATABASE_URL` | Required pooled Neon development branch | Required pooled Neon deployment branch | Backend runtime secret; never `VITE_` or copied into static files |
| `MIGRATION_DATABASE_URL` | Direct development branch URL, or same value if no separate direct URI is needed | Direct deployment branch URL | Used only by migration command; secret |
| `ENV` | `development` | `production` | Backend runtime; non-secret |
| `DEBUG` | `true` if needed for local diagnostics | `false` | Backend runtime; non-secret; must not expose secrets or debug pages |
| `CLERK_JWT_KEY` | Development instance public signing key | Production instance public signing key | Backend runtime verification config; not a database credential; never required in browser bundle |
| `CLERK_AUTHORIZED_PARTIES` | `http://localhost:5173` | Exact Render HTTPS origin and any final custom HTTPS origin | Backend runtime allowlist; non-secret |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk test/dev publishable key | Clerk production publishable key | Build-time and intentionally public in browser bundle; do not put a secret in this variable |
| `CLERK_SECRET_KEY` | Omit unless code calls Clerk Backend API | Omit unless code calls Clerk Backend API | Secret runtime only; never a `VITE_` variable and never referenced in Docker build |
| `PORT` | Local development ports are explicit (`8000` API, `5173` Vite) | Assigned by Render | Runtime only; server binds `0.0.0.0:$PORT` |

Example local `backend/.env` (ignore it in Git):

```dotenv
ENV=development
DEBUG=true
DATABASE_URL=postgresql+asyncpg://APP_ROLE:REDACTED@DEV_POOLER_HOST/APP_DB?sslmode=require
MIGRATION_DATABASE_URL=postgresql+asyncpg://APP_ROLE:REDACTED@DEV_DIRECT_HOST/APP_DB?sslmode=require
CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----\nREDACTED\n-----END PUBLIC KEY-----"
CLERK_AUTHORIZED_PARTIES=http://localhost:5173
```

Example `frontend/.env.local` (also ignored by Git):

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_CLERK_DEV_PUBLISHABLE_KEY
```

The publishable key is public by design. Even so, use the correct Clerk instance and allowed domains. Never expose `DATABASE_URL`, `MIGRATION_DATABASE_URL`, a Clerk secret key, or any AI API key through a `VITE_` variable, HTML, JavaScript bundle, source map, or Git commit. Render warns that Docker service environment variables can become build arguments; never reference secrets with Docker `ARG` or `ENV` instructions. See [Render Docker environment guidance](https://render.com/docs/docker).

**Fail-fast rule:** Validate all required configuration during application startup. If a value is absent or malformed, exit with a clear variable name. Do not create a temporary SQLite database, use in-memory reports, skip authentication, or return fabricated AI responses.

## 7. Provider latency, availability, and limits

**Quick summary:** Every remote provider depends on internet access and its own availability, quotas, and plan limits. The application reports outages rather than trying a different data/authentication mode.

- Neon adds network latency to database reads/writes, may pause or resume compute depending on its configuration, and limits available connections/resources by plan. Keep queries bounded and pool sizes small.
- Clerk sign-in depends on the browser reaching Clerk. Backend session verification can be local when a valid signing key is configured, but expired/invalid sessions still fail closed. Membership/role changes may not appear until a refreshed token contains the new active organization/role.
- Render Free web services sleep after inactivity and may take about a minute to wake. Their filesystem is ephemeral, they cannot scale beyond one instance, and Render says they are intended for tests/hobby projects rather than production. Persist all product data in Neon.
- Render's paid pre-deploy command consumes build pipeline minutes and requires a paid web-service compute plan. Check the current plan and cost in the account before selecting it; this document does not assume a budget or authorize a purchase.
- When one provider is down, return stable errors and preserve only the open page's clearly marked last-loaded snapshot. Do not interpret an outage as “no disruption reports.”

## 8. Small deployment acceptance checklist

**Quick summary:** A green build alone is not acceptance. Verify the real browser workflow against the deployed service and the intended remote branch.

- [ ] Local app uses Neon `development`; deployed app uses a distinct Neon `deployment` branch; integration tests use isolated Neon `test`.
- [ ] A clean test branch can be migrated forward with Alembic; seed upsert does not overwrite edited data.
- [ ] Missing `DATABASE_URL` or required Clerk config causes clear startup failure; no SQLite, guest, mock-product, or in-memory write fallback appears.
- [ ] Two real Clerk users can sign in; the editor can create/update; the traveller can read after manual refresh; a non-member cannot read; a reader cannot write.
- [ ] A stale client update receives `409`; a timeout does not produce a false success or duplicate report.
- [ ] React and `/api` share the same Render origin; unknown `/api` paths return JSON errors rather than `index.html`.
- [ ] Render binds to its assigned `PORT`, health checks pass, and migration completes before the new process serves traffic under the selected plan's documented method.
- [ ] Inspect real desktop and mobile browser screens, including offline/stale, 401, 403, 409, 422, and 503 states.
- [ ] Confirm synthetic routes/reports are labeled in the UI and demo.

## 9. Current implementation gaps

**Quick summary:** This file describes the target setup; it does not claim that the target has been built or deployed. The starter configuration must be hardened before any live acceptance claim.

**Observed in this workspace on 2026-10-16:** `backend/app/core/database.py` permits a missing-DB standby path, `backend/app/api/routes.py` returns an in-memory item list, there is no Alembic dependency or migration folder in the reviewed starter, the frontend package has no Clerk SDK, `frontend/vite.config.js` has no `/api` proxy, and no Dockerfile or Render Blueprint was found. Remove the fallback behavior and implement the real workflow and setup assets before describing the app as persistent, authenticated, or deployed.

**External verification still required:** Confirm Neon branch endpoints and selected plan limits; test Clerk development and production organizations/roles/origins; confirm the Render account and compute plan; deploy and inspect the actual desktop/mobile screens. The user-reported existence of provider accounts does not verify any live integration.
