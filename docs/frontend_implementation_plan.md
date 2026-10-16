# DhakaPath Frontend Implementation Plan

## Quick summary

- Implement the frontend as a real authenticated Trip Brief workflow, not a fixture-driven demo.
- Keep authentication, API calls, request retries, and workspace isolation in the application shell/service layer.
- Keep trip presentation, report editing, freshness, uncertainty, and accessibility inside the trip feature module.
- Treat the server response as the source of truth; never show optimistic success for a write.
- Preserve the MVP boundary: trip context, disruption relevance, report create/update, freshness, and last-known offline viewing.

## 1. Frontend scope and non-goals

### In scope

1. Clerk-backed sign-in/session state.
2. Active workspace selection and workspace-scoped data isolation.
3. Trip list and selected-trip context loading.
4. Relevance result with clear uncertainty language.
5. Evidence/report list with freshness and provenance.
6. Admin report creation and version-checked editing.
7. Error, timeout, stale-data, forbidden, conflict, and unknown-write states.
8. Responsive desktop/mobile layout and keyboard accessibility.
9. Development-only design preview with clearly synthetic data.

### Out of scope for this frontend slice

- Transit graph authoring or database work.
- Backend authentication or authorization implementation.
- Route calculation, fare calculation, or disruption-matching algorithms.
- Full city map, live GPS, chat assistant, notification system, or history dashboard.
- Offline write queueing or background synchronization.

## 2. Frontend module structure

```text
frontend/src/
├── App.jsx                         # Application shell and authenticated states
├── main.jsx                        # React/provider bootstrap
├── services/
│   ├── api.js                      # Shared HTTP client and error normalization
│   └── tripBriefApi.js             # Typed trip/workspace/report API methods
├── features/trips/
│   ├── TripBriefScreen.jsx         # Feature orchestrator and screen state
│   ├── components/
│   │   ├── TripSelector.jsx
│   │   ├── RelevanceBanner.jsx
│   │   ├── TripLegList.jsx
│   │   ├── EvidenceList.jsx
│   │   ├── IncidentEditor.jsx
│   │   ├── FreshnessBadge.jsx
│   │   └── StateMessage.jsx
│   ├── hooks/
│   │   ├── useTripContext.js
│   │   └── useIncidentEditor.js
│   ├── tripBriefFormatters.js      # Labels, dates, freshness, field messages
│   └── tripBrief.css                # Feature-scoped styling
├── components/
│   ├── Header.jsx
│   ├── TeamRoster.jsx
│   ├── DataExplorer.jsx
│   ├── GeminiPlayground.jsx
│   └── TechStackBar.jsx
├── App.css
└── index.css
```

The existing files may be retained where useful, but production data access should be centralized in `services/`. Feature components must not implement their own `fetch` calls or authentication logic.

## 3. Module A — application bootstrap and authentication

### Responsibilities

- Configure the Clerk provider in `main.jsx`.
- Obtain the current session token through the supported Clerk React API.
- Represent these states explicitly:
  - loading session;
  - signed out;
  - signed in without an active organization/workspace;
  - signed in with an active workspace;
  - authenticated but forbidden by the server.
- Resolve `/api/v1/me` after a valid session is available.
- Pass only authenticated identity/workspace information into the trip feature.

### Rules

- Never place Clerk secrets in `VITE_*` variables.
- Never store bearer tokens in `localStorage`.
- Do not render a ready Trip Brief with `workspaceId = null`.
- The backend remains the authority for membership and role checks.
- A hidden or disabled editor button is only a usability decision, not security.

### Suggested application state

```js
{
  authState: 'loading' | 'signed_out' | 'no_workspace' | 'ready' | 'forbidden',
  currentUser: { id, name, email } | null,
  activeWorkspace: { id, name } | null,
  role: 'member' | 'admin' | null,
  authError: { code, message, requestId } | null
}
```

## 4. Module B — shared HTTP client

### Responsibilities

- Add the current Clerk bearer token to protected requests.
- Use one API base path: `/api/v1`.
- Apply an 8-second request timeout using `AbortController`.
- Preserve caller-provided abort signals.
- Parse the standard error envelope:

```js
{
  error: {
    code,
    message,
    fields,
    meta
  },
  request_id
}
```

- Expose status, error code, message, fields, metadata, and request ID to the UI.

### Error categories

| HTTP status | Frontend meaning | Required behavior |
|---|---|---|
| 401 | Session invalid/expired | Clear protected state and show sign-in/session action |
| 403 | Authenticated but not allowed | Show view-only or forbidden explanation |
| 404 | Resource/workspace not available | Do not reveal cross-workspace existence |
| 409 | Version or idempotency conflict | Preserve draft and show current server state |
| 422 | Invalid request | Map field errors without clearing the draft |
| 429 | Rate limited | Show retry guidance; do not duplicate writes automatically |
| 5xx/network | Service unavailable | Preserve last successful read and mark it stale |
| timeout | Outcome unknown for writes | Reconcile with the same request key |

## 5. Module C — Trip Brief API adapter

Implement these methods in `frontend/src/services/tripBriefApi.js`:

```js
getMe({ signal })
listTrips(workspaceId, { cursor, signal })
getContext(workspaceId, tripId, { cursor, signal })
createIncident(workspaceId, payload, { idempotencyKey, signal })
updateIncident(workspaceId, incidentId, payload, { idempotencyKey, signal })
getRequest(workspaceId, requestKey, { signal })
```

### Adapter rules

- All workspace IDs must come from authenticated application state.
- Use `Authorization: Bearer <token>` for protected requests.
- Use `Idempotency-Key` for every deliberate create/update.
- A timeout must retain the same key for `getRequest` reconciliation.
- Do not automatically create a second report after a timeout.
- A conflict retry gets a refreshed version and a new deliberate idempotency key.
- Keep response normalization in the adapter, not inside presentational components.

## 6. Module D — workspace and request lifecycle state

The application must clear or invalidate data when any of these changes:

- user signs out;
- active organization changes;
- server returns `401`;
- selected workspace changes;
- selected trip becomes invalid.

Clear the workspace-scoped trip list, selected trip, context, report draft, field errors, pending write state, and stale banner. Use a request-generation counter or equivalent guard so late responses from an old workspace cannot update the current screen.

## 7. Module E — Trip Brief screen

### Screen hierarchy

1. Header with product identity, active workspace, account/session action.
2. Trip selector with visible label and loading/empty state.
3. Primary “Check trip” or refresh action.
4. Relevance result and uncertainty explanation.
5. Trip legs with mode, origin, destination, duration, and fare when supplied.
6. Evidence/report list with source, observed time, lifecycle state, and freshness.
7. Admin-only report editor.
8. Last fetched time, server `as_of`, stale status, and retry action.

### Result language

Use these exact user-facing meanings:

- `affects_trip`: “May affect this trip.”
- `not_affected`: “No match found in available reports.”
- `unknown`: “Not enough information.”

Never label a trip “safe” based only on the absence of a matching report.

## 8. Module F — trip selector and context loading

### Trip selector

- Load trips only after the workspace is ready.
- Keep selection scoped to the active workspace.
- Show a useful empty state when no prepared trips exist.
- Do not preserve a selected trip from a previous workspace.

### Context loading

- Abort the previous context request when the selected trip changes.
- Show loading without replacing valid previous data until the new request succeeds.
- Distinguish browser receipt time (`lastFetchedAt`) from server assembly time (`context.as_of`).
- Preserve the last successful context as stale after network/service failure.
- Treat pagination as evidence-list pagination only; relevance must represent all eligible reports returned by the server calculation.

## 9. Module G — relevance, freshness, and evidence presentation

Display:

- relevance state and reason;
- report title/location/mode;
- source type;
- `observed_at` or “Not provided”;
- lifecycle status;
- age/freshness label;
- server `as_of` timestamp;
- synthetic disclosure when fixture data is shown.

Use server-provided freshness values. Do not calculate authoritative freshness from the browser clock.

The documented freshness labels are current (0–30 minutes), aging (31–120), stale (over 120), and unknown for missing/future timestamps. These are product assumptions and should remain presentation rules only; the server remains authoritative.

## 10. Module H — incident editor

### Create fields

The create form follows `IncidentCreate`:

- `title` — required;
- `location` — required;
- `mode` — required;
- `direction` — nullable;
- `observed_at` — nullable UTC timestamp;
- `source_type` — required;
- `description` — nullable.

Send explicit `null` values for nullable fields.

### Update fields

- Send only changed editable fields.
- Include `expected_version`.
- Include the required human explanation `reason`.
- Preserve the draft after validation or conflict errors.

### Submission behavior

- Disable duplicate submission while pending.
- Generate one UUIDv4 idempotency key per deliberate submit.
- Show “Saved” only after a confirmed canonical server response.
- On timeout, say the result is unknown and offer reconciliation.
- On `409`, show the latest server version and require deliberate review before resubmission.
- On `403`, switch to a clear view-only state.
- Never queue writes while offline.

## 11. Module I — offline and stale-read behavior

The frontend supports last-known read visibility only:

- preserve the last successful context in memory;
- mark it visibly as stale when refresh fails;
- show when it was fetched;
- provide a retry action;
- never imply that stale data is current;
- do not persist sensitive workspace data to browser storage unless explicitly approved;
- do not accept or queue report writes offline.

`navigator.onLine` is only a hint. The actual request result determines whether the view is stale or refreshed.

## 12. Module J — component and styling rules

- Use semantic landmarks and exactly one page-level `h1`.
- Use `h2` headings for major sections.
- Every form control has a visible label.
- Every button names its action.
- Use text and icons in addition to color for relevance, stale, error, and unknown states.
- Preserve visible `:focus-visible` styles.
- Use `aria-live="polite"` for refresh/save status and `role="alert"` for blocking errors.
- Keep feature styles scoped under `features/trips/`; coordinate changes to shared root CSS.
- Support approximately 1280px desktop and 360px mobile widths without horizontal overflow.
- Allow long locations, titles, and descriptions to wrap.

## 13. Module K — development preview and fixtures

- Keep the design preview available only when `import.meta.env.DEV` is true and `?design-preview=1` is present.
- Clearly label every synthetic trip/report.
- Keep fixture response shapes identical to production API contracts.
- Never use fixtures as a silent fallback when authentication, API, or credentials are missing.
- Production mode must use Clerk and the live API path.

## 14. Module L — testing and acceptance

### Automated checks

- API adapter tests for headers, timeout, abort, success, and error-envelope parsing.
- Request-state tests for workspace switching and late-response protection.
- Form tests for required fields, nullable values, field errors, and duplicate-submit prevention.
- Reconciliation tests confirming the same idempotency key is reused after timeout.
- Accessibility checks for labels, headings, keyboard focus, and live regions.
- Fixture contract tests against the documented response examples.

### Manual browser checks

At approximately 1280px and 360px:

- signed-out and signed-in states;
- no active workspace;
- trip loading, empty, success, and stale states;
- affected, no-match, and unknown relevance;
- long text and missing/null evidence;
- admin create/update;
- member read-only behavior;
- `401`, `403`, `409`, `422`, timeout, offline-after-success;
- keyboard navigation from trip selection through report submission;
- no horizontal scrolling or unreachable controls.

Record what was actually tested. A successful build is not browser acceptance.

## 15. Recommended implementation order

1. Confirm API response/request examples and exact frontend types.
2. Refactor `api.js` into a shared authenticated HTTP client with normalized errors.
3. Implement Clerk bootstrap and explicit application auth states.
4. Implement `getMe`, workspace state, and workspace-change cleanup.
5. Implement trip list and context adapter methods.
6. Refactor `TripBriefScreen` to consume live adapter methods through props.
7. Add relevance, freshness, evidence, loading, empty, stale, and error states.
8. Add the admin incident editor and idempotent write lifecycle.
9. Add conflict and unknown-outcome reconciliation UI.
10. Move fixture preview behind the development-only gate.
11. Add automated adapter/state/form tests.
12. Run desktop/mobile, keyboard, and two-user acceptance checks.
13. Update the frontend README with exact setup, environment boundaries, commands, and verified limitations.

## 16. Frontend completion checklist

- [ ] No production fixture fallback.
- [ ] Clerk session token is attached through the supported provider API.
- [ ] `/api/v1` is the only production API prefix.
- [ ] Workspace changes clear old data and prevent late-response contamination.
- [ ] Trip list and context use the documented contracts.
- [ ] Relevance wording never claims safety.
- [ ] Freshness and provenance are visible.
- [ ] Admin create/update uses idempotency and version checks.
- [ ] Saved state appears only after confirmed server response.
- [ ] Timeout/unknown writes retain the request key for reconciliation.
- [ ] `401`, `403`, `409`, `422`, network, timeout, and stale states are represented.
- [ ] Offline mode never queues writes.
- [ ] The UI works at desktop and narrow mobile widths.
- [ ] Keyboard and screen-reader fundamentals are verified.
- [ ] Automated checks and manual acceptance results are recorded.
