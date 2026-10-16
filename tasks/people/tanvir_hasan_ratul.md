# Tanvir Hasan Ratul — implementation work card

- **Time:** 4 hours; integration owner for the first real request and final app.
- **Goal:** Connect real Clerk sessions, FastAPI contracts, Neon-backed report actions, and the React workflow.
- **Owns:** API routes/services, frontend app/auth/API bootstrap, integration tests, merges, and README setup.
- **Gate:** Prove a real authorized editor write and another member's fresh read by minute 60.
- **Do not substitute:** No fixture-backed production route, mock token, client-side role authority, or silent write retry.

## Work sequence

**Quick summary:** Use the existing API contract as the shared boundary and integrate continuously. Keep one end-to-end smoke request runnable before the full UI is finished.

1. **00:00–00:15 — interface check.** Confirm route/request/response names in `docs/api_contracts.md`; agree UI props with Yousha; inspect existing `App.jsx`, service adapters, and current tests. Keep root app/auth/service files under your ownership.
2. **00:15–00:45 — first workflow.** Own `backend/app/api/**`, `backend/app/services/**`, `backend/tests/**`, `frontend/src/App.jsx`, `frontend/src/main.jsx`, `frontend/src/services/**`, `frontend/package.json`/lockfile, and `frontend/vite.config.js`. Add create/read route path and browser token transport using Pantha's verified-actor dependency. Make first smoke script/test exercise remote Neon, not fixtures.
3. **00:45–01:00 — Gate 1.** Run one Clerk admin report create and a second member's fresh read; confirm persistence via new request. Capture failure request IDs and coordinate fixes immediately.
4. **01:00–01:30 — Render integration.** Build the production React bundle into the FastAPI image with Pantha's deployment files; run local image then deploy as soon as Gate 1 works. Test a real authenticated deployed call if origins are ready.
5. **01:30–02:20 — workflow.** Implement trip/context API and deterministic relevance; connect Yousha's components to actual reads/writes; implement refresh, stale-state handling, report correction with request key and expected version.
6. **02:20–03:10 — integration checks.** Own contract tests for role failures, tenant/workspace isolation, duplicate requests, version conflicts, timeout reconciliation and missing config. Coordinate test folder boundaries with Pantha.
7. **03:10–04:00 — release.** Integrate fixes, run local/deployed smoke, own concise `README.md` setup/migration instructions, and lead the final demo rehearsal.

## Interfaces and handoffs

**Quick summary:** The server owns validation, matching, authorization outcomes, and persisted truth; React displays those results and never invents a successful save. Yousha supplies components with explicit props and callbacks rather than editing auth or API plumbing.

- **Input:** Exact endpoint models/errors in `docs/api_contracts.md`; Pantha's verified actor dependency and schema; Yousha's UI component prop request.
- **Output:** Contract-conforming API routes, React Clerk bearer-token adapter, request/response states, integration tests, integrated release checklist.
- **Handoff from Pantha:** Verified user subject mapped to local identity, active Clerk organization, role enum, and DB transaction/session API. Do not accept role/actor fields from client JSON.
- **Handoff to Yousha:** A small stable interface for trips/context/report mutation plus `loading`, `error`, `stale`, `saved`, and conflict state. Tell Yousha when endpoints are live; do not ask for temporary fixture hacks.
- **Acceptance/checks:** Report POST/PATCH is committed to Neon and returned on GET; unknown write checks the same request key; no automatic new-key retry; same app build serves React/API; API errors remain JSON and include safe request IDs.
- **Visible result:** The user can sign in, load a trip, submit a report change, get a truthful result, and refresh as another authorized user to see it.

## Integration and cut rule

**Quick summary:** Merge frequently and freeze contracts after minute 10 unless a real implementation defect forces a documented change. Keep the first E2E smoke green as new work lands.

- Be the only person who edits `App.jsx`, root auth bootstrap, shared API adapters, and final README.
- Before staging, inspect changed files and exclude `.env`, secrets, generated files, and unrelated starter cleanup.
- If Gate 1 slips, stop adding context/history features and debug the full request path with Pantha.
- If Gate 2 slips, stop product additions and preserve deployment diagnostics; report the live deployment check as blocked.
