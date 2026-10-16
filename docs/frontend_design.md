# DhakaPath frontend design

- **Current user scope:** One operator on one local machine; no sign-in, shared workspace, roles, or network access.
- **Current screen:** The default page loads locally prepared trips and their stored report context. The development-only preview remains explicitly synthetic.
- **Current API connection:** Module E connects the Trip Brief to local SQLite-backed trip list/context read endpoints. Module F adds report create/update API endpoints, but the UI does not yet expose those writes.
- **Trust cues:** Map references are approximate; synthetic demo values are labeled and are not shown as live reports.
- **Design boundary:** Do not present the old hosted multi-user workflow below as current behavior. Visual acceptance remains pending because the computer-use screenshot/input helper failed during Module D.

> **Scope update (2026-10-16):** The detailed user journeys below were written for the superseded Clerk/Neon shared-workspace design. The user canceled Clerk and Neon and directed local-first implementation. Module D changed the active screen and Vite bind to local-only; Module E connected trip/report reads and Module F added backend report writes. The UI remains read-only. Keep older hosted-flow details in the earlier sections as historical design context, not current product claims. Rendered-screen visual acceptance remains unverified.

## 1. Concrete user story and design decision

**Quick summary:** Imagine Rafi, a Dhaka commuter travelling an unfamiliar route while mobile data may drop. He opens the app before boarding, checks one saved trip against a reported disruption, then keeps the last loaded information visible if the connection disappears.

**ASSUMPTION — illustrative person and trip:** Rafi and the example route are fictional. They are a way to explain the proposed journey, not evidence that commuters with this exact trip or need have been interviewed.

**First action:** After signing in and entering the shared workspace, Rafi selects a prepared trip and presses **Check this trip**. The app reads the trip context from FastAPI, which applies the rule to its saved trip and report data. The screen then shows one of three results: **May affect this trip**, **No match found in available reports**, or **Not enough information**. It never turns a missing report into a “safe” result.

**Resulting change:** The trip selection and latest returned context change on screen. The traveller screen is read-only; it does not pretend to save a report. In the editor journey, an authorized editor submits a change and sees it as saved only after FastAPI confirms the Neon transaction; another authorized member sees it after a fresh read. That write flow belongs to the separate MVP editor journey and is not represented as complete by this design screen.

**DECISION — visual direction:** Use a calm, high-contrast “transit field note” style: warm paper background, dark ink, teal for navigation and primary actions, and amber/red only for explicit uncertainty or disruption. The urban-transit context needs fast scanning and clear evidence; glowing gradients and dense dashboards would compete with that task. No supplied visual reference was found in the reviewed frontend files, so this is a reasoned design choice.

## 2. Journeys and minimum screens

**Quick summary:** The whole MVP needs a sign-in gate, a trip brief, and a small report editor. The representative screen built first is the trip brief because it directly tests the traveller proposition; no separate analytics or admin dashboard is needed.

| Journey/screen | User goal | Primary action | Expected result |
|---|---|---|---|
| Sign-in and workspace entry | Enter the shared workspace with a real account | Sign in, then choose or confirm the active organization | Clerk session is active; the app fetches a verified API identity/role. No anonymous access to shared data. |
| **Trip brief — representative screen** | Decide whether a saved disruption report is relevant to the selected trip | Select a prepared trip, then **Check this trip**; use **Refresh** to request current server state | Ordered trip legs, report context, relevance state, source/observation time, and last-fetch time are shown. |
| Report editor — inline panel or dialog | Add a report or correct its lifecycle status and reason | **Save update** | FastAPI validates, authorizes, and writes the report plus history in one transaction; the new version appears only after the server confirms it. |
| Workspace switch | Move to another authorized shared workspace | Choose a different active organization | Clear prior workspace data and pending forms before loading the new organization's trips. |

**Trip brief hierarchy:** (1) active workspace and signed-in user, (2) page title and trip selector, (3) primary “Check this trip” action, (4) relevance result and uncertainty text, (5) ordered trip legs, (6) report evidence/provenance, (7) last refresh/stale warning. A disruption result must not be hidden below the trip details.

**Editor hierarchy:** (1) report being edited and current version, (2) required context fields, (3) status and reason, (4) source/observation time, (5) validation or conflict message, (6) primary “Save update” action. Keep the editor in the trip brief context so users can understand which report they are changing.

## 3. Layout, type, color, and reusable parts

**Quick summary:** Give the main task one clear column and reserve side-by-side space for supporting details on desktop. On mobile, stack the same hierarchy without hiding the result, source, timestamp, or actions.

### Layout and spacing

- Use a centered content column capped at about **1,120 px**, with a 12-column grid only above 960 px. Keep the trip selector/result in the main 7–8 columns and a compact “Report details” panel in the remaining width if it improves scanning.
- At widths below 720 px, use one column, 16 px side padding, and full-width primary actions. Below 380 px, reduce only outer padding to 12 px; let text wrap naturally and avoid horizontal scrolling.
- Use an 8 px spacing base: 4 px for icon/text alignment, 8 px between tight controls, 16 px within a group, 24 px between cards, and 32–40 px between page sections.
- Do not make the top bar sticky if it would consume the small mobile viewport. Keep the trip title and stale state visible near the content they describe.
- Each panel uses a simple border and subtle surface shift; avoid nested cards, blur, animation, and shadows that make the page look like a generic analytics dashboard.

### Type and color

| Use | Specification |
|---|---|
| Body and controls | System sans-serif stack; 16 px base, 1.5 line height. Avoid a font download dependency. |
| Page title | 28–32 px desktop, 24–28 px mobile, weight 700. |
| Section heading | 18–20 px, weight 650–700. |
| Supporting text | 14–16 px; never use low-contrast small uppercase labels for important facts. |
| Metadata | 13–14 px minimum, with normal case and readable line height. |
| Page background / surface | Warm near-white `#F7F5F0`; white surface `#FFFFFF`. |
| Main text | Deep ink `#17212B`; secondary text `#4A5965`; borders `#D5D9D8`. |
| Primary/action color | Deep teal `#075E5A`; hover/focus can use `#064E4A`. Use white button text. |
| Caution / stale | Dark amber `#7A4B00` on pale amber `#FFF1CC`, with an icon and text label. |
| Confirmed disruption / error | Dark red `#8A2626` on pale red `#FCE8E6`, with words and an icon; never rely on color alone. |
| Unknown / neutral | Dark slate `#344454` on pale blue-gray `#EAF0F3`. |

**Contrast rule:** Normal-size text must meet at least 4.5:1 contrast against its background; large text and meaningful icons must meet at least 3:1. Validate actual rendered colors with a contrast checker before acceptance. Do not use teal, amber, or red as the only indication of state.

### Reusable components

- `AppHeader`: DhakaPath wordmark, active workspace label/switcher, signed-in account control.
- `WorkspaceGate`: loading, no membership, expired session, and forbidden-workspace states.
- `TripPicker`: labeled native/select-like control with a visible selected trip and keyboard operation.
- `TripLegList`: ordered segments with mode text, from/to landmarks, and optional known time/fare only when present in the API contract.
- `RelevanceBanner`: one of the three explicit results and a short plain-language explanation.
- `IncidentEvidence`: observed time, place, mode, direction, source type, lifecycle state, freshness, and missing-field notes.
- `FreshnessNotice`: last successful fetch time; a prominent stale/offline label when the request fails.
- `ReportEditor`: role-gated form that submits a versioned request and only shows success after a confirmed API response.
- `StatusMessage`: shared loading, empty, validation, unauthorized, conflict, and service-error presentation using accessible live regions.

## 4. Loading, empty, error, offline, and write states

**Quick summary:** Every state explains what the app knows and what the person can do next. During connection loss, the page may show its last successful in-memory response but must label it old and disable writes.

| State | Screen behavior and message | Next action |
|---|---|---|
| Initial loading | Keep the page structure visible with a short text label such as “Loading trips…” and a restrained skeleton; do not show a fabricated result | Wait; do not allow duplicate submission |
| Empty trips | “No prepared trips are available in this workspace yet.” | A workspace editor/administrator must add or seed supported trip data; no false map or sample card |
| Empty reports | “No matching reports were returned for this trip as of [time]. This does not confirm that the trip is clear.” | Refresh or continue using the trip details; do not display a green “all clear” state |
| Success | Show result, explanation, report context, and `as_of`/last fetched time | User can inspect the result or manually refresh |
| Invalid input (`422`) | Keep entered values, mark invalid fields, show a plain error summary, associate text with fields | Correct the named values; focus the first invalid field |
| Unauthorized (`401`) | Replace shared data with a sign-in/session-expired message; clear protected cached data | Sign in again; retry after a valid session exists |
| Not a member / wrong role (`403`) | Explain that this account lacks workspace or editing permission; do not show other workspace records | Ask a workspace administrator to grant the correct membership/role |
| Concurrent edit (`409`) | Keep the draft, show “This report changed while you were editing,” and show the latest server version after reload | Review latest content and submit a new deliberate change |
| Service unavailable (`503`) | Show “Could not reach trip information. No new result is available.” | Retry manually; do not treat missing data as no disruption |
| Offline after successful read | Retain the current page's last successful response in memory; show “Offline — showing information loaded at [time]”; disable refresh and all writes | Reconnect and choose **Refresh**; this view does not survive reload/closing the tab |
| Write outcome unknown | Do not show success. Explain that the request may have saved and check the same idempotency key/report ID before enabling another attempt | Reconcile with a read; never blindly resend a create |

## 5. Account, role, and workspace behavior

**Quick summary:** The server, not the screen, decides permissions. The interface reflects verified Clerk state for clarity but never treats hidden controls as security.

- Require a real Clerk session for shared trip/report reads. No anonymous access to this MVP workspace.
- The traveller/member sees trip context and report evidence. The report editor/admin sees the same context plus the editor form. FastAPI checks every endpoint against the verified active `org_id` and `org_role`.
- On sign-out or workspace switch, clear the trip selection, response cache, stale banner, report draft, and in-flight requests before displaying the next workspace. Include the workspace in every query/cache key.
- If a request returns after a switch, discard it if its workspace key no longer matches the active verified organization.
- If Clerk membership/role changes while the screen is open, a server `403` takes precedence over any previously visible editor controls. Clear or disable the form and refresh session/authorization state.
- A traveller never sees an enabled editor button that only fails after click. The current representative traveller screen is read-only; an editor view is a separately specified journey.

## 6. Mobile, keyboard, and readable content

**Quick summary:** The same task must work at 360 px wide, with a keyboard, and with screen-reading software. Controls stay native and labeled; status is communicated with text, not color alone.

- Use semantic landmarks and headings in order (`header`, one `h1`, then section `h2`s, `main`, and a concise footer only if needed).
- Every select, input, and button has an explicit accessible name. Use visible field labels; placeholders are examples, not labels.
- Preserve a strong `:focus-visible` outline (at least 2 px and offset); do not remove browser focus rings. Tab order follows the reading order; Escape closes a dialog; Enter/Space activates controls.
- Use a real button for actions and a real select/listbox only when its keyboard behavior is implemented. Do not make a clickable `div`.
- Announce load completion and API errors with `role="status"` or `aria-live="polite"`; use `role="alert"` for blocking errors. Move focus to the error summary only for a failed form submission, not routine refreshes.
- Keep tap targets near 44×44 CSS px. On mobile, stack trip legs vertically and allow long locations/source labels to wrap; do not truncate the only evidence or timestamp.
- Ensure dynamic text zoom to 200% and narrow viewport do not hide primary controls or force horizontal scrolling.
- For long or empty values, show “Not provided” / “Unknown” in context. Preserve user-entered form text after validation or conflict errors.

## 7. Provenance, uncertainty, and displayed data

**Quick summary:** The interface must distinguish saved facts from rule-based interpretation and from missing evidence. It must show the origin and age of each disruption claim near the claim itself.

| Displayed value | Source | UI treatment |
|---|---|---|
| Trip name, ordered segments, mode, origin/destination | `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context` backed by Neon `Trip` and `TripSegment` rows | Show the exact stored values; preserve segment order; indicate unknown fields instead of inventing them |
| Report location, affected mode/direction, `observed_at`, source type, lifecycle status, version | Same FastAPI context response backed by Neon `IncidentReport`/`IncidentEvent` rows | Show source type and observation time; distinguish “reported,” “disputed,” “resolved,” and age/freshness |
| Trip-relative status (`affects_trip`, `not_affected`, `unknown`) and explanation | FastAPI deterministic matching rule using known report and trip fields | Label as a system comparison, include why; `not_affected` must read “No match found in available reports,” not “safe” |
| `as_of` / last fetched time | FastAPI response time and browser's successful-fetch time | Show when the response was generated and when this browser loaded it; stale warning refers to the last successful fetch |
| Identity, active workspace, role | Verified Clerk session claims; FastAPI authorization response | Use only to label/switch current context; access is still enforced server-side |
| Example trips, reports, map/landmark names, observation times | Synthetic Neon seed rows, if used | Clearly label “Synthetic demo data” beside the trip/report and in the demo. Never imply a real-time Dhaka source or real verification |

**DECISION — API source of truth:** The complete request/response, Pydantic, auth, pagination, error, and write definitions now live in [api_contracts.md](api_contracts.md). This screen consumes its `GET /api/v1/workspaces/{workspace_id}/trips` and `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context` response models. That contract is proposed and the backend is not implemented.

**FACT — current starter:** These endpoints, Pydantic models, migrations, real Clerk session handoff, and database-backed reads do not exist yet. The current component's API adapter and the exact proposed view contract above are design scaffolding, not a claim of live integration. The `?design-preview=1` fixture is available only in local development and its synthetic data is visibly labeled.

## 8. Representative screen implementation and visual review

**Quick summary:** Build the traveller Trip Brief as the one representative screen and use the documented API contract. A fixture may be used only in a test/visual-review harness; the deployed app must have no fallback to fixture data.

**Representative screen scope:** Trip picker, “Check this trip” action, three-state relevance result, ordered trip legs, evidence/provenance, last-refresh time, and loading/empty/error/stale states. Do not include a decorative map, live counters, charts, citywide search, an AI chat box, or a write button without a working persistent API contract.

**Data contract:** Follow [api_contracts.md](api_contracts.md) for exact list/context models, including stable evidence pagination. Send the real Clerk session token and have FastAPI compare `{workspace_id}` with the verified active organization. The server must enforce membership for both reads. No production fallback to fixtures is allowed.

**Visual-review evidence:** Inspected the local development preview in Codex In-app Browser at 764 px wide. The first viewport showed the page title, synthetic-preview label, prepared-trip selector, and primary action; a prior interaction loaded an affected-trip result, synthetic report, and ordered legs. The keyboard check reached the skip link and brand link with Tab. The fixture includes a long/missing-field example and an empty-report example. These checks use isolated synthetic fixtures, not a live API. A 1280 px desktop viewport and a 360 px narrow-mobile viewport could not be set in the available browser, so those visual checks, 200% zoom, contrast measurement, and horizontal-overflow check remain unverified. API failure states are implemented in the screen but were not all exercised in the browser.

**Acceptance boundary:** The representative screen is a read-only trip brief. Selecting a trip and pressing Check changes only the displayed selection/result; it does not change persistent application state. There is no implemented editor or write endpoint in the current starter, so the acceptance requirement that user actions persist and another authorized member sees the change is **NOT SATISFIED / UNVERIFIED**. Do not describe this preview as a complete MVP. A real persistent editor flow requires the database-backed API, Clerk authorization, migrations, and a two-account verification.
