# Yousha Shahid — implementation work card

- **Time:** 4 hours; own the representative trip and report workflow UI.
- **Goal:** Make the real trip context and report editor clear, usable, responsive, and honest about freshness and uncertainty.
- **Owns:** `frontend/src/features/trips/**`, scoped UI components/styles, and browser review notes.
- **Gate:** Connect to Tanvir's real API interface early; a fixture may help isolated visual tests only, never the shipped workflow.
- **Do not substitute:** No decorative dashboard, fake metrics, non-working buttons, or visual-only success state.

## Work sequence

**Quick summary:** Reuse the existing Trip Brief direction and extend it into one task-focused screen. Prioritize the report result, evidence time, edit action, and clear error states over extra screens.

1. **00:00–00:15 — interface agreement.** Review `docs/frontend_design.md` and `docs/api_contracts.md`; list the props/callbacks needed by the Trip Brief and editor. Confirm Tanvir owns root app/auth/API files.
2. **00:15–00:45 — interactive screen.** Own `frontend/src/features/trips/**` and scoped styles. Implement the trip selector, context, visible result/reason/time, small editor, and loading/empty/invalid/unauthorized/offline/stale/success states using agreed component props.
3. **00:45–01:00 — Gate 1 hookup.** Connect the form to Tanvir's real endpoint as soon as it is available. Verify success appears only after server confirmation and a failed/unknown write does not show “saved.”
4. **01:00–01:30 — deployed UI check.** Open the Render URL when Tanvir deploys; fix primary-task blockers only. Do not use local fixture preview to claim the deployed flow works.
5. **01:30–02:20 — finish task UI.** Show affects/no-match/unknown clearly; keep status separate from freshness; allow report edits only when server permissions allow; show manual refresh and last-loaded time.
6. **02:20–03:10 — two-user and accessibility checks.** Use the actual traveller and editor accounts; check denied role, empty reports, long/missing values, stale data, keyboard labels/focus, and narrow layout.
7. **03:10–03:40 — visual acceptance.** Inspect real desktop and narrow-mobile browser sizes; fix overflow, focus visibility, reading order, and status cues. Send Tanvir concrete integration defects with steps to reproduce.
8. **03:40–04:00 — final screen check.** Confirm synthetic data is labeled, user can distinguish fresh from stale, and saving/error/conflict feedback matches server responses.

## Interfaces and handoffs

**Quick summary:** Screen components receive contract-shaped data and callbacks from Tanvir's app layer. They do not make access decisions or own server truth.

- **Input:** Trip/context/report response models, error envelope, role/access state and design rules.
- **Output:** Trip Brief/editor components and scoped styles with all primary actions connected to real callbacks.
- **Handoff from Tanvir:** Component contract for loading trip list/context, submitting create/update, refreshing, and reporting request key/version conflict. Ask for exact data shapes early; do not create parallel API logic.
- **Handoff to Tanvir:** Required props, endpoint mismatch, and any state the API adapter must expose. Keep feedback concise and tied to an interaction.
- **Acceptance/checks:** Primary task obvious; keyboard focus visible and labels announced; mobile stacks the same task; long/empty/error content remains readable; synthetic rows are disclosed; no success before API commit; another member's refreshed response appears in the same component.
- **Visible result:** Traveller sees a comprehensible trip-relative report result and an authorized editor can submit a correction without being misled about stale or failed state.

## Cut rule

**Quick summary:** Keep the screen one column of work, not a broad dashboard. Browser checks are part of completion, not optional polish.

- If APIs are late, finish state containers and clear loading/error layouts, but do not ship fixture mode.
- If schedule slips, cut extra copy and history presentation; retain real task actions, labels, focus, mobile layout, and truthful status/freshness cues.
- If actual browser access is unavailable, record viewport and checks as unverified instead of claiming visual acceptance.
