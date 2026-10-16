# Pantha Protick — implementation work card

- **Time:** 4 hours; provider preflight immediately, backend/data/auth first.
- **Goal:** Provide remote Neon persistence, real server-side Clerk authorization, safe migrations, and a deployable service foundation.
- **Owns:** Backend identity/database/migrations and deployment files only; see the central plan for exact boundaries.
- **Gate:** Help prove the first real authenticated report write/read by minute 60.
- **Do not substitute:** No in-memory store, SQLite, anonymous identity, mock token, or unverified deployment claim.

## Work sequence

**Quick summary:** Build the persistence and identity foundation first, then keep deployment moving alongside it. Publish the verified user/workspace dependency and migration names early so API work can integrate without guessing.

1. **00:00–00:15 — preflight.** Check separate Neon development, isolated test, and deployment branches; Clerk test organization/admin/member roles and allowed origins; Render account and plan. Do not print or commit secrets.
2. **00:15–00:45 — persistence and auth.** Own `backend/app/core/auth.py`, `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/db/**`, `backend/alembic.ini`, and `backend/alembic/**`. Implement startup fail-fast, verified Clerk identity, organization/role checks, report/event schema, constraints, and transactional session support. Coordinate `backend/app/main.py` edits with Tanvir before touching it.
3. **00:15–01:30 — deployment path.** Own `Dockerfile`, `render.yaml`, health/startup config. Build migration-before-traffic behavior appropriate to the selected Render plan. Keep secrets out of image build arguments and browser assets.
4. **00:45–01:00 — integration gate.** Pair with Tanvir on the real Clerk-to-Neon write and second-user read. Fix only blockers to this path.
5. **02:20–03:10 — verification.** Use the isolated Neon branch for migration, constraints, duplicate write, concurrent update, seed-safety and startup-config checks. Help validate the deployment branch is distinct.
6. **03:40–04:00 — release handoff.** Give Tanvir exact setup variable names/commands and report actual Render/Neon/Clerk verification status.

## Inputs, outputs, and handoffs

**Quick summary:** The backend boundary consumes a verified Clerk token and validated API request; it returns a workspace-scoped result only after a database commit. Tanvir owns route handlers and cross-module integration.

- **Input:** `docs/api_contracts.md`, `docs/architecture.md`, user-provisioned Clerk users, Neon branch URLs, and selected Render plan.
- **Output:** Alembic migrations, DB constraints/session, verified actor/workspace/role dependency, fail-fast configuration, health/migration/deploy assets.
- **Handoff to Tanvir:** Exact function/dependency for verified actor and active workspace, role check result, table names and transaction interface. Agree these before routes are wired.
- **Handoff to Yousha:** Only user-facing authorization outcomes (`401`, `403`, hidden cross-workspace resource `404`, provider `503`); do not ask the UI to decide roles.
- **Acceptance/checks:** Real member reads; admin-only report write succeeds; member write is `403`; invalid session is `401`; cross-workspace resource is not disclosed; migration passes on isolated remote test branch; DB/auth missing config cannot start a product fallback.
- **Visible result:** Users can trust that shared reports are persisted and only workspace-authorized people can access or change them.

## Risk and cut rule

**Quick summary:** Clerk SDK verification details and Render migration support depend on the configured providers and plan. Verify the pinned SDK mechanism and current plan behavior instead of assuming the draft docs are implementation evidence.

- If auth or Neon is not usable by minute 15, alert the team immediately; continue building the real integration but do not create a bypass.
- If Gate 1 slips, stop deployment polish and optional schema work; pair on the real write/read.
- If Render is not available, finish the valid Docker/Blueprint/config path and label live deploy acceptance blocked.
- Keep schema limited to trips/segments, workspace-scoped reports, append-only report events, and mutation receipts needed for idempotency/reconciliation.
