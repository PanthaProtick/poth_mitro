# Yousha Shahid — detailed implementation work order

> **Old work order superseded (2026-10-16):** This card targets the canceled Clerk + Neon + Render phase. Use the current local-first SQLite/localhost handoff in [`../implementation_plan.md`](../implementation_plan.md); confirm scope for your module before starting. The old goals below are historical.

- **Role:** Trip Brief and editor UI, responsive/accessibility quality, and actual browser acceptance.
- **Time box:** 4 hours; agree API props in the first 15 minutes; inspect actual browser at desktop and narrow mobile before release.
- **Success:** A traveller understands trip relevance, evidence and age; an admin can submit a report change and sees only server-confirmed outcomes.
- **Primary handoff:** Tanvir owns `App.jsx`, Clerk integration, service calls, and auth state; you own feature UI and scoped styles.
- **Never do:** fake success, show stale data as current, treat “no match” as “safe,” or let visual fixtures replace live acceptance.

## 1. Read first and current UI facts

**Quick summary:** The existing screen is an inspected but read-only representative design. Extend it into the scoped workflow without inventing backend data or duplicating API/auth logic.

Read `tasks/implementation_plan.md` sections 6–11; `docs/frontend_design.md`; `docs/api_contracts.md`; `docs/mvp.md`; `docs/architecture.md`.

Observed:

- `frontend/src/features/trips/TripBriefScreen.jsx` displays trip context, relevance, reports, freshness, loading/empty/error/stale states and synthetic labels. It calls `api.listTrips`/`api.getContext` only; no editor exists.
- `frontend/src/App.jsx` passes `workspaceId=null` in normal mode. The fixture is enabled only for local `DEV` plus `?design-preview=1`.
- Existing CSS lives in `frontend/src/App.css` and `frontend/src/index.css`; current preview was inspected at 764 px. A 1280 px desktop and 360 px mobile check remain unverified in the existing note.
- The screen currently shows read-only context. Report editing and real persistence still need implementation.

## 2. Owned files and interface lock

**Quick summary:** Keep feature code and styling inside your ownership area. Tanvir owns app shell, Clerk token lifecycle, and HTTP adapter so auth has one implementation.

**You own:** `frontend/src/features/trips/**` and styles/components under that directory. You may propose changes to `frontend/src/App.css` or `frontend/src/index.css`, but coordinate first because root CSS is shared. Do not edit `App.jsx`, `main.jsx`, service adapters, package files, backend, migrations, Docker, or README.

At minute 10 agree exact props/callbacks with Tanvir. The central plan's proposed shape is a discussion starting point, not an existing API. Specify:

- auth loading/signed-out/active-workspace state;
- active workspace `{id, name}` and role label from `/me`;
- trip list/context result and refresh callback;
- create/update callbacks carrying exact contract bodies, idempotency key and expected version;
- status for loading, validation, saved, conflict, unknown outcome, forbidden, offline, and stale;
- sign-in or re-auth callback where required.

Do not implement permissions as a feature-level security boundary. Hide/disable editor controls for members only as guidance; handle server `403` too.

## 3. Screen work order

**Quick summary:** Build one screen that completes one journey: choose a prepared trip, check saved report context, create/update a report as admin, and let another member refresh to see it. No dashboard or decorative content.

1. Preserve the hierarchy from `docs/frontend_design.md`: active workspace/account; trip selector; primary check action; result + uncertainty; trip legs; evidence/provenance; observed/fetched time; small editor action.
2. Add a compact editor in this task context. Create fields follow `IncidentCreate`: `title`, `location`, `mode`, nullable `direction`, nullable UTC `observed_at`, `source_type`, nullable `description`. The request requires explicit nulls for nullable keys. Use `traveller_report` only when that truthfully describes the source; never label user input synthetic.
3. For edit, include `expected_version` and required `reason`, then only changed editable fields. Preserve draft after `422` and `409`. On conflict show latest server values and ask for deliberate review before resubmit.
4. Submit only through Tanvir's callback. Disable duplicate submit while pending. Show “Saved” only after confirmed API response. For timeout/unknown result, explain that it may have saved, retain the same request key for status check, and do not suggest a fresh create until reconciled.
5. Preserve result meanings: `affects_trip` → “May affect this trip”; `not_affected` → “No match found in available reports”; `unknown` → “Not enough information.” Never say “safe.”
6. Show `observed_at`, source type, lifecycle status, freshness and server `as_of` near the report. Missing fields say “Not provided” or “Unknown.” Label synthetic trip/report content in context.
7. On confirmed write, render the canonical server response or call the agreed refresh/read method. Do not optimistically mutate shared truth before confirmation.
8. On `401`, remove protected content and show sign-in/session path; on `403`, show access/view-only reason; on `409`, preserve draft and show latest version; on `422`, map field errors; on `503`/offline, preserve only the last successful in-memory view and mark it stale. Never queue offline writes.

## 4. Account changes and race handling

**Quick summary:** Data from one account/workspace must never appear under another. Tanvir owns auth state; clear this screen on identity/workspace changes and ignore stale callbacks.

- Use workspace and trip IDs as state scope. When either changes, clear context, last-loaded time, stale banner, invalid selected trip, editor draft, pending-save message, and old field errors.
- Abort or ignore responses belonging to an old request/workspace. The screen can own its local read `AbortController`; Tanvir owns the API adapter and token behavior. Avoid duplicate requests in effects.
- `navigator.onLine` is only a hint. Actual request results determine whether data refreshed. If the browser reports online but API fails, show the stale/error state anyway.
- `lastFetchedAt` is when this browser received the data; `context.as_of` is when the server assembled it. Do not confuse them.
- The second member sees a change only after manual refresh. Do not imply push or automatic updates.

## 5. Accessibility and visual acceptance

**Quick summary:** The page must work at narrow width and with keyboard-only input. Perform actual browser checks; a successful build or screenshot fixture is not acceptance.

1. Preserve semantic landmarks and one `h1`; use `h2` for sections. Every input/select has a visible label and every button a clear action name.
2. Keep visible `:focus-visible` styles. Tab order follows reading order. Use alert/status live regions for blocking errors and save/refresh messages. Do not move focus on routine refresh.
3. Follow design tokens: warm light background, deep ink text, teal action, amber stale, red disruption/error, slate unknown. Use text/icon as well as color. Measure contrast rather than assuming the palette passes.
4. Inspect real app at desktop (around 1280 px) and narrow mobile (360 px). Check no horizontal overflow, long locations wrap, controls stay reachable, and primary task remains above supporting details.
5. Test keyboard path: sign-in state if available, trip selector, check, refresh, report fields, submit, error correction. Record blockers if account/browser capability prevents a real check.
6. Test long text, null evidence, no reports, loading, server error, `401`, `403`, `409`, timeout/unknown write, and offline-after-success. Do not claim a test you did not perform.
7. Show synthetic disclosure beside synthetic trip/report and in demo. No fixture data in normal app.

## 6. Test and handoff checklist

**Quick summary:** You own visible state and browser review; Tanvir owns API adapters and Pantha owns database/provider checks. Send actionable defects with a click path and observed response.

- **Minute 15:** give Tanvir the agreed component props and unresolved fields. Do not wait for full UI implementation before fixing the boundary.
- **Gate 1:** connect the editor to a real report action. Confirm failure does not show success and the second account can see canonical saved state after refresh.
- **Minute 150:** exercise one two-user path: admin creates/updates; member refreshes; member view is read-only; API denial is rendered if tested in the authorized setup.
- **Minute 190:** finish 1280/360 browser review, keyboard path, and error states; record viewport and actual observations.
- **Final handoff to Tanvir:** list changed files; component prop contract; states tested with live API; fixtures used only in preview; browser interactions/viewport checked; remaining visual/API gaps.

**Cut rule:** If time slips, cut extra prose, second trip, and history presentation. Keep real create/update callbacks, truthful saved/unknown states, focus/labels, mobile layout, freshness/provenance, and two-user refresh.
