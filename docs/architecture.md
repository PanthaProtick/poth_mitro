# DhakaPath MVP architecture

- **One deployable application:** React builds to static files served by FastAPI; the browser uses `/api` on the same origin.
- **One real data path:** FastAPI validates, authorizes, and applies deterministic rules before reading or writing remote Neon PostgreSQL.
- **Accounts are required:** A traveller and a report editor share workspace data, so both use real Clerk accounts and verified membership.
- **Two Neon environments plus an isolated test branch:** Local development and Render deployment never share a database branch.
- **No fallback product mode:** Missing credentials or unavailable providers produce clear errors; synthetic trip/report examples are labeled as synthetic.

## 1. Scope and architecture decisions

**Quick summary:** This design implements the narrow journey in `docs/mvp.md`: an authorized traveller reads trip-related disruption context, an authorized editor saves a report change, and another member sees it after refresh. The offline slice is read-only memory for the open page; it does not provide fresh data, offline writes, or persistence across reloads.

**DECISION:** Use one Render Docker web service for the React build and FastAPI API. Keep business rules in FastAPI and shared data in Neon. Use the same source code and API locally and when deployed; change environment values and provider instances only.

**FACT — current workspace inspection:** The starter has a Vite React frontend and a FastAPI backend with SQLAlchemy/asyncpg dependencies. Its current routes still contain an in-memory item list and a database “standby” path when `DATABASE_URL` is absent. The frontend has no Clerk dependency, and no migrations or Render Blueprint were found. Those are starter-code facts, not the proposed architecture; they must be removed or replaced before acceptance.

**DECISION:** Do not put the supplied AI API key in the critical path. The MVP’s relevance result is deterministic and must remain explainable; an AI provider adds latency and another failure mode without being required for the proposition.

## 2. Components, responsibilities, flow, and entities

**Quick summary:** React presents trips and reports; FastAPI owns validation, access checks, and trip/report rules; Neon stores shared state. The browser never connects directly to Neon and never decides whether a user may edit.

| Component | Responsibility | Runs where |
|---|---|---|
| React + Clerk frontend SDK | Sign in, show the shared trip/report workflow, call `/api`, retain the last successful page response in memory, and label it stale after a network failure | Browser; Vite dev server locally, FastAPI static files in deployment |
| FastAPI | Verify Clerk session, derive the active organization, enforce roles and workspace scope, validate inputs, run deterministic relevance/freshness rules, coordinate transactions, and return stable errors | Same application process in both environments |
| SQLAlchemy + asyncpg | Map Python operations to PostgreSQL using bounded async connections | FastAPI process |
| Neon PostgreSQL | Source of truth for prepared trips, shared reports, and report-change history | Remote Neon development, deployment, or isolated test branch |
| Alembic | Apply ordered, versioned schema changes before the new app serves traffic | Developer command or Render deploy/start step |

**Request path:** Browser → FastAPI → verified Clerk session claims → role/workspace check → Neon transaction → response → React. A read uses the same identity and workspace checks as a write. For a change, FastAPI validates the report, performs a version-checked update, writes its history record in the same transaction, commits, then responds.

**Entities (proposed; finalize exact columns in API contracts and migrations):**

| Entity | Minimum purpose and key rules |
|---|---|
| `Workspace` | One row per shared Clerk organization; its stable ID is the Clerk `org_id` string. |
| `Trip` | A prepared demo journey owned by one workspace. |
| `TripSegment` | Ordered part of a trip; foreign key to `Trip`, unique `(trip_id, ordinal)`. |
| `IncidentReport` | Workspace-scoped disruption with known place/mode/direction, `observed_at` nullable, source type, lifecycle status, creator/updater Clerk IDs, integer `version`, and timestamps. |
| `IncidentEvent` | Append-only change record with report/workspace IDs, actor Clerk ID, old/new state, reason, and event time. Insert it in the same transaction as the report update. |

Do not store passwords, Clerk secret keys, or a duplicate local credential system. Synthetic trip and incident content may be seeded, but it must be visibly labeled synthetic. A synthetic seed must not overwrite a user edit.

**API contract:** [api_contracts.md](api_contracts.md) defines the list/detail/read/write routes, exact models, Clerk bearer verification, workspace/role checks, pagination, errors, and persistence rules. The server compares every supplied `workspace_id` with the verified active organization; a mismatch is denied. Never trust a role or workspace ID merely because the browser sent it. These routes remain proposed until implemented and verified.

## 3. Data ownership, sharing, and anonymous access

**Quick summary:** Clerk proves who the person is and which active organization they belong to; FastAPI checks what that role may do. Anonymous users cannot read or write the MVP’s shared reports.

**DECISION:** Require sign-in and membership in the one demo workspace. Travellers may read trip context and reports. Report editors may also create and update reports. The server derives access from verified claims and rejects absent or invalid sessions with `401`, valid users without the organization with `403`, and editors’ invalid writes with `403` or `422` as appropriate.

**Ownership and sharing rules:**

- Every trip and incident belongs to a `Workspace`; all reads and writes filter by the verified Clerk organization ID.
- Every report change records the verified Clerk user ID as its actor.
- A user's organization switch changes the data scope. A request containing the previous workspace ID must fail after the switch.
- No anonymous fallback, shared hard-coded account, client-side role flag, or direct database access from React is allowed.
- The UI may hide an edit button for a traveller, but that is only convenience. FastAPI performs the real authorization check on every request.

**FACT — Clerk role options:** Clerk Organizations issue active-organization claims such as `org_id` and `org_role`; its default roles include `org:admin` and `org:member`. Clerk also supports custom organization roles, but production custom-role availability can depend on the account's plan. **DECISION:** For a minimum demo, map the Clerk admin role to report editing and member role to reading, or use a custom editor role only after confirming the Clerk plan supports it. Do not assume the existing Clerk app already has Organizations, roles, or membership enforcement enabled.

## 4. Neon environments, migrations, and database safety

**Quick summary:** Use distinct remote Neon branches for local development and Render deployment, plus a disposable remote test branch. Apply the same Alembic migration chain to each; never point destructive tests at the deployment branch.

| Target | `DATABASE_URL` source | Use |
|---|---|---|
| Local development | Neon `development` branch, preferably its pooled connection URI | Run the real application during local development. No local database. |
| Render deployment | Separate Neon `deployment` branch, preferably its pooled URI | Shared live demo data. Restrict its credentials and access. |
| Isolated integration/concurrency tests | Disposable Neon `test` branch cloned from development schema or a known seed revision | Run migrations, reset data, test cross-workspace access and concurrent writes, then discard/reset this branch only. |

Neon supports creating branches for separate test environments and provides pooled connection URIs. Keep a short inventory of branch names, endpoints, and owners, but never commit connection strings. See [Neon branch/testing use cases](https://api-docs.neon.tech/reference/use-cases) and [Neon connection URI options](https://api-docs.neon.tech/reference/getconnectionuri).

**Migration policy:** Add Alembic and commit each migration revision with the code that needs it. Run `uv run alembic upgrade head` against the intended branch before serving a release. Keep schema changes backward-compatible during a rollout: add new nullable columns/tables first, deploy code that can use them, and only remove old structures in a later migration. This matters when an older app instance may still be serving requests.

**Database rules:** Use primary keys, foreign keys, `NOT NULL` for required values, `CHECK` constraints for allowed status values and positive versions, and a unique `(trip_id, ordinal)` constraint. Index workspace IDs and common report/trip lookup fields. Keep `observed_at` nullable because the MVP explicitly allows unknown observation times. Enforce workspace scope in every query, not just in the frontend.

**Transactions and concurrent edits:** A report update includes `expected_version`. Update only where both `id` and `version` match; increment the version and insert the `IncidentEvent` in one transaction. If no row matched, return `409 VERSION_CONFLICT` and let the editor refresh. Never allow a late writer to silently replace a newer edit.

**Idempotency and unknown write outcomes:** Give each create request a client-generated request UUID and enforce uniqueness within its workspace/actor scope. If a timeout occurs after a write, the server may have committed even though the browser did not receive the answer. The UI must say the result is unknown, read the request/report state back, and must not blindly repeat a non-idempotent create.

**Connection limits:** Use a finite small SQLAlchemy pool per Render instance (for example, begin with `pool_size=2`, `max_overflow=0`, and a short `pool_timeout`; tune after checking the Neon plan). Total possible app connections are approximately `instance count × pool capacity`, plus migration/admin connections. Use Neon's pooled endpoint for web traffic if supported by the selected driver and operations; use a direct endpoint for migrations if the Neon configuration or migration operation requires it. Verify with the project's own Neon connection details. Do not copy a guessed provider connection limit into code.

**Seed safety:** A command such as `uv run python -m app.scripts.seed_demo --upsert` must use stable IDs/source keys and update only rows explicitly marked as seed-owned. It must not delete all rows or overwrite edited reports. Run it only against development/test, or through an explicit deployment seed approval if demo data is needed in deployment.

## 5. Clerk verification and local identity/role assignment

**Quick summary:** React obtains a real Clerk session; FastAPI verifies it with Clerk's supported Python backend SDK and accepts only session tokens. Local development uses Clerk's development instance and real test users, not fake tokens or a bypass.

**Request flow:** Clerk's React SDK signs the user in and supplies the session cookie on same-origin requests, or a bearer session token where needed. FastAPI calls `authenticate_request()` from the official `clerk-backend-api` SDK, checks `state.is_signed_in`, then uses the verified `sub`, `org_id`, and `org_role` claims. Set the Clerk authorized-party/origin allowlist for the exact local and production origins.

**Security detail:** The current Python SDK's `AuthenticateRequestOptions.accepts_token` default can be broader than session tokens. Set `accepts_token=["session_token"]` explicitly. Configure `CLERK_JWT_KEY` (public PEM signing key) for local signature verification where supported, or the Clerk secret key required by the chosen SDK path; do not write JWT decoding/signature checks from scratch. Verify the installed SDK version and option names against Clerk's [Python backend integration guidance](https://clerk.com/articles/how-to-add-authentication-to-a-python-backend) and [session-token verification guide](https://clerk.com/docs/guides/sessions/manual-jwt-verification). The Clerk guide recommends setting `authorized_parties` explicitly to reduce cross-site request risks.

**Role and membership assignment:**

- Use the Clerk development instance locally and production instance on Render; each has its own keys and users.
- Create a demo organization in each instance and add separate traveller and editor test accounts.
- Assign role through Clerk Dashboard or a properly authorized Clerk organization-management flow. Never accept `role=editor` from a browser field.
- Use the verified role claim in the token for server-side permission checks. A membership change may not affect an already-issued token until Clerk refreshes it; after role changes, refresh the session and test that access is removed.
- Store Clerk `sub` as the audit actor ID. If a local display name is needed, fetch/record it as non-authoritative profile data; do not make it an authorization key.

**Unknown to verify before implementation:** The existing Clerk app's React SDK setup, enabled Organizations, organization membership requirement, selected role set, test/production instances, allowed origins, and custom-role plan entitlement have not been verified in this workspace.

## 6. Frontend state, stale reads, and workspace switches

**Quick summary:** Neon-backed API responses are the source of truth. React can retain a successful response in memory for the current page during network loss, but it must mark the data stale and disable writes.

- Each context response includes an `as_of` or `fetched_at` timestamp. Show it on screen and show an obvious “connection lost; showing last loaded information” state after a read fails.
- Do not claim a stale report is current, queue an offline edit, or show a write as saved until FastAPI confirms it.
- A manual refresh is enough for the MVP. WebSockets or polling are not justified by the proposition's current evidence.
- Scope frontend data keys by `org_id` and trip ID. On sign-out or organization switch, cancel in-flight requests, clear old workspace responses and form state, then fetch the new workspace. Do not keep the prior workspace visible during a transition.
- Use `AbortController` for canceled fetches and ignore responses whose request/workspace key no longer matches the active session. This prevents a slow response from the previous account context from appearing after a switch.
- A `401` triggers the real sign-in/session refresh flow; `403` explains missing workspace/role access; `409` asks the editor to refresh; `422` identifies invalid fields; `503` or network errors show a retry action without inventing success.

## 7. Timeouts, outages, and failure behavior

**Quick summary:** Provider calls add internet latency and availability risk. Failures must be visible and recoverable; the system never falls back to fake users, in-memory application records, or a local database.

| Failure | Required behavior |
|---|---|
| Missing `DATABASE_URL`, Clerk keys, signing key, or authorized origins | Fail startup/config validation with the missing variable named. No standby mode, SQLite, guest account, or fake token. |
| Neon cold start, unavailable endpoint, or pool exhaustion | Bound connection acquisition/query time; return a stable `503 DATABASE_UNAVAILABLE`; keep any last-loaded page clearly stale. Log the correlation/request ID, not the connection string. |
| Clerk network/key retrieval unavailable | Prefer locally verifiable session JWTs using a configured Clerk public key when supported; when verification cannot be completed, fail closed with `401/503`, never trust an unverified token. |
| Read timeout | Show stale cached context and a retry control; preserve its `as_of` time. |
| Write timeout / lost response | Mark outcome “unknown”; check the idempotency/request key or fetch the report before any retry. Do not claim success or automatically replay a create. |
| Two editors change one report | Version check allows one update; the other receives `409` and must reload/reconcile. |
| Browser goes offline | Keep the current page's last successful context in memory, mark it stale, disable submit/update, and recover by refreshing when online. It will not survive reload or a closed tab. |
| Render free service asleep | First request may wait for service startup; clearly show loading/retry. Render documents that free web services spin down after 15 minutes idle and may take about a minute to wake. |

Use practical finite request/database timeouts that fit within the platform's health-check window (Render documents a five-second HTTP health-check response window). Set concrete values during implementation after measuring Neon behavior; do not let a DB wait hold a browser request indefinitely. External services also require internet access and are subject to the provider's plan limits and maintenance.

## 8. Team fit and open implementation gates

**Quick summary:** The documented skills cover this small architecture if roles stay narrow. Pantha owns backend/data/auth/deployment, Tanvir owns the vertical API-to-UI workflow and integration, and Yousha owns the responsive interface and browser review.

| Person (Partha excluded) | Suggested responsibility based on `docs/team_skills.md` |
|---|---|
| Pantha Protick | System/data design, FastAPI, Neon branch/migrations, Clerk backend verification, Render deployment |
| Tanvir Hasan Ratul | API contract integration, end-to-end workflow, React-to-API state and error handling |
| Yousha Shahid | Responsive React UI, stale/offline presentation, accessibility and actual browser-screen review |

**UNRESOLVED before implementation:** Confirm exact Neon development/deployment branch URLs; confirm Clerk Organizations, roles, and dev/prod origins; confirm Render account/plan and domain; finalize migration fields and error contract; check whether Render paid pre-deploy is available before choosing the migration command; agree the isolated test branch and synthetic seed ownership.

**Evidence and provider references**

- Render pre-deploy behavior and plan support: [Deploying on Render](https://render.com/docs/deploys) and [Blueprint YAML reference](https://render.com/docs/blueprint-spec).
- Render free-instance limitations: [Deploy for Free](https://render.com/docs/free).
- Render health checks and ports: [Health Checks](https://render.com/docs/health-checks) and [Web Services](https://render.com/docs/web-services).
- Clerk session verification: [Clerk Python backend guidance](https://clerk.com/articles/how-to-add-authentication-to-a-python-backend) and [manual session JWT verification](https://clerk.com/docs/guides/sessions/manual-jwt-verification).
- Clerk organization roles and token claims: [Roles and permissions](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions) and [session tokens](https://clerk.com/docs/guides/sessions/session-tokens).
- Neon branches and pooled URI: [Neon testing use cases](https://api-docs.neon.tech/reference/use-cases) and [connection URI options](https://api-docs.neon.tech/reference/getconnectionuri).
