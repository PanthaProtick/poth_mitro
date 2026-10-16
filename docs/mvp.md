# Four-hour MVP plan

- **Smallest coherent workflow:** An authorized traveller selects one prepared Dhaka trip, checks whether a shared disruption report applies, and can still read the last-loaded trip and report context if connectivity drops.
- **Keep Opportunities 1 and 5 together only in this bounded form:** They use the same trip and report data; offline means the already-loaded page remains readable, not fresh alerts or offline edits.
- **Core decision:** Use transparent rules to return “affects this trip,” “does not appear to affect this trip,” or “not enough information.” Never guess that a route is safe.
- **Baseline remains mandatory:** Remote Neon, migrations and constraints, real Clerk authorization, shared access, Render deployment, real API reads/writes, responsive UI, and critical tests are not product-feature cuts.
- **Schedule risk:** The current starter has no transit workflow, migration setup, or Clerk integration confirmed, and no Render deployment asset was found. Four hours is feasible only if external accounts and deployment access work at the first checkpoint; otherwise report the baseline conflict openly.

## 1. Decision and scope

**Quick summary:** The MVP demonstrates one journey, not a citywide transit planner. It connects a trip to a disruption report, keeps the shared report state in Neon, and preserves only the last-loaded view during a temporary connection loss.

**Decision:** Keep Opportunity 1 (judge a disruption's relevance and freshness) and Opportunity 5 (retain current trip context during connectivity loss) because they apply to the same traveller, same trip, and same fetched context. The second opportunity adds value only when the connection drops after the context has loaded. It cannot provide new reports while offline.

**Product workflow:** A signed-in traveller chooses one prepared trip and reads a report's time, location, direction, mode, source type, and status. The system compares the report with the trip and presents a supported status or “not enough information.” A report editor in the same shared workspace creates or updates a report. The editor's change is saved in Neon. Another authorized traveller refreshes and sees the changed state. If the first traveller loses connectivity, the open page keeps showing its last successful response and clearly marks it as old; writes are disabled until the server is reachable.

**Data disclosure:** Route and incident examples may be synthetic for the demo. Label each clearly in the interface and demo. Do not imply they are live Dhaka reports or verified real-world routes.

**UNJUSTIFIED need trace:** The chosen proposition includes offline trip context, but `docs/needs.md` has no direct connectivity-loss need. N11 concerns repeated explanation and is not an adequate substitute. Keep the offline slice only as an explicitly unvalidated proposition test; add a validated need or revise the proposition before treating it as a proven product requirement.

## 2. Opportunity combination check

**Quick summary:** The opportunities join at the selected trip context. The incremental offline effort can stay small if it is a read-only last-loaded view in the open page, not a separate offline product mode.

| Check | Opportunity 1: disruption relevance/freshness | Opportunity 5: context during connection loss |
|---|---|---|
| Need addressed | N8: determine whether a report applies; N9: distinguish current from old or repeated claims | **Need gap:** preserve usable trip context during network loss; this is not directly represented in N1–N11 |
| Join in journey | Traveller chooses a trip and assesses a report against it | The same trip and report context stays visible if the connection then drops |
| Shared data/state | Trip segments; report location, mode, direction, observation time, source type, status, and version | The last successful context response and `fetched_at` time in the currently open page |
| Additional effort | Deterministic matching rules, explicit unknown/conflict handling, report editor and tests | Keep the API response in page memory; detect/display offline state; mark the copy stale and prevent writes |
| If Opportunity 5 is removed | Opportunity 1 still works online and remains the stronger, evidence-backed workflow; offline continuity is no longer claimed | — |
| If Opportunity 1 is removed | — | The page can show a saved trip, but without trip-specific alert relevance it has weak value and overlaps more with existing offline references |

**Decision:** Retain both only for the narrow, same-page flow above. A bounded in-memory view avoids a local database and avoids offline writes. It does not survive reload or a closed tab. If testing shows that travellers need offline access after reload, that is a larger requirement and does not fit this cut without more time.

**Automatic updates:** Manual refresh is enough for this proposition because it tests a traveller's decision from a dated snapshot; there is no evidence or service guarantee requiring second-by-second updates. Show the last refresh time and stale state. Automatic polling or push becomes necessary only if research establishes that a traveller must receive a change while waiting and that delay creates material harm. Do not add WebSockets or background polling for the current demo.

## 3. Product feature ranking

**Quick summary:** These are product features, ranked separately from deployment, persistence, authorization, UI quality, and test baselines. Every row traces back to a capability, need, documented limitation, and original problem.

**Trace labels:** P1 = fragmented multimodal Dhaka travel information; P3 = waterlogging/blockades can change route usability; P4 = scattered, aging, potentially inaccurate or contradictory reports; P6 = organizer-required English/Banglish interaction and visual interface. F1–F10 and N1–N11 refer to `docs/needs.md`.

| Product feature | Rank | Trace: feature → capability → need → limitation → original problem | Reason / boundary |
|---|---|---|---|
| Select one prepared trip and inspect its ordered segments | **MUST HAVE** | trip selection → C1 represent trip → N1 compare journeys / N6 practical connections → F1 fragmented options / F6 disconnected legs → P1 fragmented multimodal travel | One trip is enough to demonstrate relevance; do not build citywide search here. |
| Read a report with its observed time, affected segment/place, mode, direction, source type, and status | **MUST HAVE** | report context → C2/C5/C6 → N8 relevance / N9 freshness → F8 vague area / F9 old claims appear current → P4 scattered and fast-aging reports | Missing values stay visibly unknown. |
| Show a deterministic trip-relative state: affects, does not appear to affect, or unknown/conflicting | **MUST HAVE — DIFFERENTIATING** | relevance result → C3/C7 → N8/N10 → F8 unclear relevance / F10 conflicting advice → P3/P4 disruptions and uncertain reports | No AI judgment. A no-match is not a safety claim. |
| Allow an authorized report editor to create a report and update its status with a short reason | **MUST HAVE** | shared report change → C10 accept corrections → N9/N10 → F9 stale claims / F10 disagreement → P4 reports become old or conflict | Another member must see the saved change after a fresh API read. An update is not automatically independent confirmation. |
| Keep the last successful trip/report response visible during a connection loss, with a stale warning and no offline writes | **MUST HAVE to demonstrate the selected proposition; UNJUSTIFIED by current needs list** | offline snapshot → C4 → no direct N1–N11 need (N11 is only a partial mismatch) → no connectivity failure in F1–F10 → P6 offline briefing is only a bonus | Bound to the open page; do not claim offline reload, fresh alerts, or offline editing. Validate or revise the need. |
| Show a short reason for the relevance result, based on the same comparison rule | **SHOULD HAVE** | explanation → C9 → N8/N10 → F8/F10 → P4 unclear or conflicting reports | Helps people challenge a result; keep it rule-based and brief. |
| Preserve report changes as a linked history and let the traveller inspect earlier statuses | **SHOULD HAVE** (history view may be cut) | correction history → C5/C10 → N9/N10 → F9/F10 → P4 aging and contradictory claims | Save who changed what in the baseline audit trail; a full history panel is lower priority. |
| Present fixed status labels and explanations in English and Banglish | **SHOULD HAVE for this proposition; organizer language requirement is not met by labels alone** | bilingual status → C8 → N11 communication barrier (partial) → F1/F8 repeated or unclear communication → P1/P6 fragmented information and required English/Banglish interaction | Add a small reviewed label set if time allows. Full free-form conversational search remains outside this minimum and creates the explicit scope conflict below. |
| Run English/Banglish conversational trip search, contextual follow-ups, full multimodal ranking, fare calculations, and disruption rerouting | **DO NOT BUILD in this four-hour proposition slice; organizer scope conflict** | broad chat/router → C1/C13 → N1/N3/N6/N7/N11 → F1/F3/F6/F7 → P1/P2/P3 and P6 | These are larger organizer requirements, not needed to test this proposition. Omitting them means this MVP does not satisfy the full challenge brief. |
| Forecast incident duration/spread or automatically decide report truth from text/images | **DO NOT BUILD — HIGH-RISK EXPERIMENTAL** | prediction/automatic verification → C11/C12 → N7/N9/N10 → F7/F9/F10 → P3/P4/P5 | No verified labeled Dhaka dataset or accuracy target is available. These can create false confidence. |

**Rank interpretation:** MUST HAVE features demonstrate the selected proposition. SHOULD HAVE features improve clarity or auditability but may be removed if the 4-hour schedule slips. COULD HAVE is intentionally empty for the event slice: do not add convenience work before the required flow and baselines pass. DO NOT BUILD items either exceed this proposition or carry evidence risk; some are still required by the wider organizer brief, so their omission is disclosed as a scope conflict.

## 4. Actors, state, and information flow

**Quick summary:** A commuter reads shared state; a report editor writes shared state. The backend checks the Clerk identity and workspace role, saves the change in Neon, and another authorized user sees it after manual refresh.

### Actors and access

- **Traveller:** A real Clerk account with membership in the shared project workspace and read permission. The traveller can select a prepared trip, read shared reports, and refresh.
- **Report editor:** A real Clerk account in the same workspace with report-write permission. This person can create a report and submit a status update or correction.
- **Backend:** Verifies the real Clerk token and checks workspace membership and role on every protected read or write. A client-supplied `workspace_id` or role is never trusted by itself.
- **Shared workspace:** One Clerk organization/workspace for the demo. Each incident row is scoped to its workspace. Members in another workspace cannot read or alter it.

**Account decision:** Accounts and roles are needed because one person changes a shared report and another authorized person must see it. Use real Clerk accounts for both roles. If organization membership or required role claims are not ready, report the access-control baseline as blocked; do not substitute a shared secret or fabricated token.

### Input → processing → decision → output → user value

**Quick summary:** The online path reads and writes real PostgreSQL state. The offline path displays only the last successfully loaded response and clearly says it cannot be current.

| Stage | What happens | Actor / saved state |
|---|---|---|
| **INPUT** | Traveller selects a prepared trip; editor enters or updates a report, including the observed time and known affected place/mode/direction | Clerk-authenticated member; new or changed report submitted with expected version |
| **PROCESSING** | API validates input, checks workspace role, reads trip segments and current reports, compares known fields using explicit rules, and saves report changes plus audit event to Neon | Backend; remote Neon development branch locally, separate deployment branch on Render |
| **DECISION** | Return `affects_trip`, `not_affected`, or `unknown`; keep lifecycle status (`reported`, `confirmed`, `disputed`, `resolved`) separate from a freshness state derived from observation time | Deterministic backend logic; unknown/missing evidence is not promoted to confirmed |
| **OUTPUT** | UI shows trip segments, report context, status/reason, and `as_of` time. After an editor changes a report, another member manually refreshes and reads the new saved version. If offline, UI keeps the last response and shows it as stale | React UI reads/writes FastAPI; no pretend success for a failed write |
| **USER VALUE** | Traveller can judge whether a report applies, understand what remains uncertain, and still inspect the last-known journey context during a temporary connection loss | User acts with visible limits instead of treating silence or old data as reassurance |

**Shared state:** Neon stores the prepared trip catalog and segments, workspace-scoped incident reports, and report-change history. The browser holds only a bounded in-memory copy of the last successful context for the open page. Neon is the source of truth; no SQLite, local database, offline write queue, or separate local/hosted logic is introduced.

### Minimal API contract outline

**Quick summary:** The contract keeps the core workflow small and supports a real shared change. Exact Pydantic models and migrations must be agreed before implementation; these names define the current draft, not a deployed API.

- `GET /api/v1/workspaces/{workspace_id}/trips/{trip_id}/context` — requires a valid Clerk member token. Returns trip segments, applicable reports, relevance state, report age, and `as_of`.
- `POST /api/v1/workspaces/{workspace_id}/incidents` — requires `report_editor`. Accepts affected segment/place, mode, direction, nullable `observed_at`, source type, and description. Returns persisted report ID, status, version, and timestamps.
- `PATCH /api/v1/workspaces/{workspace_id}/incidents/{incident_id}` — requires `report_editor`. Accepts status/correction and `expected_version`. Returns the updated row and version; returns `409 VERSION_CONFLICT` if another editor changed it first.
- Common errors: `401 UNAUTHENTICATED`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 VERSION_CONFLICT`, `422 VALIDATION_ERROR`, `503 DATABASE_UNAVAILABLE`. Failed writes never appear as successful in the UI.

**Draft field rules:** IDs are UUIDs except Clerk/workspace identifiers, which remain strings supplied by the identity provider. Times use UTC ISO-8601 timestamps. `observed_at` may be null; when absent, relevance must not be presented as fully current. Lifecycle statuses are enums, not free text; freshness (`fresh`, `aged`, or `stale`) is derived separately. Writes include a version number to prevent one editor silently overwriting another. All API reads and writes are scoped to the verified workspace.

## 5. Baseline requirements — separate from product ranking

**Quick summary:** The following are mandatory acceptance conditions from the user's project rules. They are not optional features and cannot be removed to make the four-hour plan look feasible.

| Baseline | Required result |
|---|---|
| Remote Neon environments | Local app connects to a remote Neon development branch. Render uses a separate Neon deployment branch. Both use the same schema/migrations; configuration changes only. `DATABASE_URL` is required in every environment; missing DB configuration must not enable a standby or in-memory product mode. |
| Versioned schema changes | Use a migration tool such as Alembic; no startup `create_all`. Add primary/foreign keys, required-field checks, allowed-status checks, workspace scoping, and version constraints. |
| Safe seed handling | Use stable seed identifiers and idempotent inserts/updates for only known demo rows. Never truncate or overwrite user-authored reports on startup. Label synthetic rows in the data and UI. |
| Render assets and guide | Check in deployment configuration and start/build assets. Write setup steps that change environment values only; do not require product-code edits between local and hosted environments. |
| Real Clerk identity | Use actual Clerk accounts and verified server-side tokens. Reporter/editor permissions are enforced in FastAPI, not just hidden in React. |
| Shared access and isolation | Both users are members of the same workspace to see the report. Check membership and role on each request; reject another workspace's access. |
| Real persistence | Main screens load from and write to FastAPI/Neon. No in-memory item list or fake persistence for the incident workflow. |
| Honest readiness | Health/readiness must report the app as unavailable when Neon is missing or unreachable; it must not report healthy while serving empty or in-memory substitute data. |
| UI acceptance | Inspect real desktop and mobile browser screens. Show loading, empty, stale/offline, validation, permission, conflict, and service-error states clearly. |
| Critical tests | Test migration/seed safety, report relevance edge cases, persistence after restart, role denial, workspace isolation, concurrent edits, and the two-user update/refresh path. |

**Safe seed rule:** Apply the same versioned migrations to the Neon development and deployment branches. Test a clean migration and repeatable seed on a disposable Neon branch; do not run destructive reset tests against either shared project branch. Seed only stable demo fixtures and preserve operator/user changes.

**Deployment guide inputs:** Document `DATABASE_URL` separately for the Neon development and deployment branches; server-only `CLERK_SECRET_KEY`; frontend `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_BASE_URL`; and `CORS_ORIGINS` for local development. Never commit values. Do not add a Gemini key because this workflow does not need AI. Confirm the Clerk role/organization settings against the actual dashboard before coding.

## 6. Four-hour work plan and feasibility

**Quick summary:** The three available people can work in parallel after a short contract gate, but the current starter lacks several baseline pieces. Treat the first 15 minutes as a go/no-go check; feature cuts cannot compensate for missing mandatory deployment or authorization.

**Observed from current files:** `backend/app/core/database.py` allows the database dependency to yield `None` when `DATABASE_URL` is absent; `backend/app/api/routes.py` stores demo items in process memory; `backend/pyproject.toml` has no Alembic dependency; and the checked file list did not show Clerk or Render setup. The user reported Clerk and Neon projects exist, but their credentials/branches were not live-verified. Render was previously reported as work to do later. Current starter behavior does not satisfy the stated baselines.

| Time | Work and owner | Gate / output |
|---|---|---|
| 0–15 min | All: verify Neon development/deployment branches, Clerk app/roles, Render access, secrets, and current deploy smoke test | If Clerk or Render cannot be configured, record baseline conflict immediately; do not begin a fake-mode workaround |
| 15–35 min | Pantha + Tanvir: freeze request/response contract, tables, migration, access roles, and shared fixture; Yousha reviews the journey on desktop/mobile | One agreed contract and no ambiguous field/status meanings |
| 35–125 min | Pantha: migrations, Neon config, Clerk token/role checks, Render assets. Tanvir: report create/update/read, deterministic relevance, conflict/version behavior, tests. Yousha: responsive screens, online/offline/error states, integrate against agreed API | One real API read/write path, no mocks in acceptance flow |
| 125–165 min | Tanvir coordinates integration; Pantha checks workspace isolation and persistence; Yousha connects UI and verifies refresh/offline behavior | Second authorized account sees a saved change; last-loaded context remains visibly stale offline |
| 165–195 min | Pantha leads Render deploy and configuration-only guide; Tanvir runs migration/seed and API checks against the deployment branch; Yousha inspects deployed desktop/mobile screens | Hosted app uses deployment Neon branch and real Clerk; deployment is not claimed until browser-verified |
| 195–225 min | All: run acceptance checklist, fix only critical failures, repeat concurrent edit and permission tests | All baseline failures are either fixed or explicitly reported |
| 225–240 min | All: freeze changes, prepare the 4–5 minute demo and 2-minute Q&A handoff | No new scope; keep logs/screens for verified claims |

**Schedule conflict:** This timeline has almost no recovery time. It is only plausible if the provider accounts, correct Neon branches, Clerk workspace roles, and Render service can be accessed immediately. The repository currently has no migration or Clerk implementation, and Render is not confirmed ready. If that preflight fails, the entire baseline set is not credibly completable in four hours. Keep the product cut, but report the baseline as blocked rather than removing Neon, Clerk, Render, persistence, or tests.

**Organizer scope conflict:** This MVP does not include full multimodal route search, constrained cost/time/transfer ranking, fare calculations, disruption-triggered rerouting, or contextual English/Banglish chat. Those appear in the organizer brief. Therefore this is a narrow proposition demo, not a complete response to the full challenge unless judges accept that narrower scope. Do not claim full brief compliance.

## 7. Small acceptance checklist

**Quick summary:** A successful demo requires evidence from the real deployed path and two distinct authorized accounts. A local build or static mock alone does not pass.

- [ ] Local app reads and writes only to the remote Neon development branch; Render uses a separate deployment branch with the same migrations.
- [ ] Missing/unreachable Neon prevents a healthy readiness result; the user-facing flow does not silently switch to in-memory data.
- [ ] A clean migration succeeds, constraints reject invalid records, and seeding twice creates no duplicates or resets user data.
- [ ] Two real Clerk accounts in the same workspace can use the intended reader/editor roles; an unauthorized role and a different workspace are denied server-side.
- [ ] A traveller selects a seeded trip and receives an API-backed relevance result, including `unknown` for missing/contradictory evidence.
- [ ] An editor's report update persists; another authorized account sees the new version after manual refresh.
- [ ] Removing network access after a successful read leaves the current trip/report visible with its last-fetch time and stale/offline warning; report writes are disabled or visibly fail without false success.
- [ ] Two simultaneous updates cannot silently overwrite each other; the conflicting update returns `409 VERSION_CONFLICT` and can be reloaded.
- [ ] Desktop and mobile browser screens show readable data and clear loading, empty, offline, invalid-input, permission, conflict, and server-failure states.
- [ ] Render deployment, browser behavior, Clerk verification, Neon persistence after restart, and each test result are reported as verified, unverified, or blocked.
