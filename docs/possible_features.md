# Possible solution opportunities

- Local route search, fare estimates, and rider updates already have product overlap, so repeating them is weak differentiation.
- The stronger opportunities target evidence quality, transfer reality, full-trip affordability, or access when normal information channels fail.
- Each opportunity is a hypothesis. The listed outcomes are ways to test it, not results already achieved.
- “Hackathon fit” estimates what this three-person team could demonstrate in the confirmed 5 hours 40 minutes; it does not mean a durable city service can be built in that time.
- The last 20 minutes are reserved as a contingency buffer, leaving about 5 hours 20 minutes for planned work. The final presentation is 4–5 minutes plus 2 minutes of questions.

## 1. How to read these opportunities

**Quick summary:** The opportunities below are different mechanisms for addressing documented limitations. None is selected as the project direction, and all need evidence from commuters or field checks.

**Fact:** The research and comparison documents report that Jaatra advertises multimodal route planning, fares, and Pulse rider updates; Smart Route BD advertises route/fare reference; and fare tools already provide estimates. These are publisher claims and were not performance-tested in this project.

**Inference:** A new route planner, fare calculator, or rider feed by itself would have weak differentiation. A meaningful opportunity must change how information is verified, connected to an actual journey, handed across channels, or interpreted under uncertainty.

**Assumption:** The proposed users and contexts below are plausible examples, not validated user segments. A short interview or observed trip should confirm each before implementation.

**Hackathon-fit labels:** “Fits as a narrow demo” means a small, prepared vertical slice could plausibly be shown in this event. “Only if prepared or simplified” means field work, setup, or data collection must already exist or be cut from the event clock. “Too ambitious” means the opportunity depends on real-world coverage, partner cooperation, or sustained operations that a demo cannot establish.

**Fact:** The available team has three people: Pantha Protick (backend, database, ML, and systems), Tanvir Hasan Ratul (full stack), and Yousha Shahid (frontend/UI). Partha Sarathi Saha Tirtha is excluded. The user's required web stack is React, FastAPI, `uv`, remote Neon PostgreSQL, and Render, with real Clerk authorization if accounts or roles are needed. The user reports Clerk and Neon are set up; Render is not yet arranged.

**Decision:** The 5h40 clock is too short to research a new user gap, collect representative city data, build all required infrastructure, deploy, and validate a full product from scratch. The practical event goal is one coherent end-to-end slice using pre-prepared accounts, schema, sample data, and deployment configuration. If these are not ready before the clock starts, the project must narrow further while still treating deployment and required user isolation as acceptance needs.

## 2. Candidate opportunities

**Quick summary:** Seven opportunities are listed without choosing a winner. Each fit judgment assumes preparation happens before the event; none can credibly deliver citywide accuracy or sustained service in 5 hours 40 minutes.

### Opportunity 1 — Show the evidence and age behind a disruption claim

**Existing limitation** → Jaatra already shares rider updates, but the reviewed public evidence does not establish a complete way to tell whether a report is current, applies to a specific direction or mode, or has independent confirmation.

→ **Specific user/context affected** → A passenger deciding whether to enter a particular road or transfer during a reported blockade or waterlogging event.

→ **Proposed intervention** → Define a compact incident record that preserves when the event was observed, where it applies, the transport mode and direction, whether the report is first-hand, and what later evidence confirms, disputes, or resolves it. Display “old,” “unconfirmed,” and “conflicting” states plainly. Do not treat silence as proof that the event ended.

→ **Why it could address the limitation** → The mechanism adds context and a visible evidence history to reports. It tests report quality beyond simply allowing people to post updates.

→ **Measurable outcome** → In a small set of observed or staged incidents, measure (a) the share with usable time, place, mode, and direction; (b) time from first observation to a supported current status; and (c) the share of cases where a user correctly identifies whether the report affects a sample journey. Compare with an unstructured post or message. No target threshold is known yet.

**5h40 fit — Fits as a narrow demo if prepared:** Show one incident with observation time, location/mode context, and a visible confirmation or conflict state. Use a prepared, clearly labeled example. A real independent verification service is out of scope.

**Skeptical check:** This is a hypothesis about a gap, because Jaatra’s Pulse already includes rider updates. We have not verified how its internal report review works.

### Opportunity 2 — Field-check a small route and stop set, with a correction trail

**Existing limitation** → Route and stop information can be mapped, but public descriptions do not prove that every boarding point or stop sequence remains correct on the street. Manual maps also become stale without repeat checks.

→ **Specific user/context affected** → An unfamiliar passenger boarding along one selected corridor, especially where stops are informal or described by landmarks.

→ **Proposed intervention** → Run a documented field audit of a small corridor. Record the observed stop order, recognizable boarding landmark, direction, date checked, and evidence for each correction. Keep the previous value and reason when an entry changes.

→ **Why it could address the limitation** → A bounded field check tests route claims against actual travel. A correction trail makes the information’s source and age visible and gives future maintainers a repeatable update method.

→ **Measurable outcome** → Measure the fraction of sampled stops and sequences matching field observations, the number of wrong-stop or backtracking events in a short unfamiliar-user trial, and the age of the latest check. Compare a route list before and after the audit.

**5h40 fit — Only if field evidence is prepared:** The team can present a small, already checked route segment and its correction record. Riding a new corridor, recruiting participants, and building a maintainable citywide audit within the event is too ambitious.

**Skeptical check:** Digital Matatus demonstrates field mapping as a method, but also shows that maintenance takes repeated local work. A tidy audit record alone does not guarantee that someone will keep it current.

### Opportunity 3 — Make student affordability a whole-trip decision

**Existing limitation** → Existing tools publish route fares or estimates, but the comparison found no verified evidence that they reliably combine applicable student discounts with uncertain connector fares across a complete trip.

→ **Specific user/context affected** → A student with a strict spending limit who combines a bus or metro journey with a variable-price connector.

→ **Proposed intervention** → For a small set of routes, show the total supported fixed fares separately from uncertain connector prices. For connector prices, report a range with sample count, collection time, and context; mark whether that range is observed, estimated, or synthetic. Flag when the range crosses the user’s budget instead of declaring the trip affordable.

→ **Why it could address the limitation** → It evaluates the full cash decision and exposes uncertainty instead of presenting one precise-looking number. A rule-based calculation can apply known discounts without an AI model.

→ **Measurable outcome** → Compare displayed ranges with prices observed on later sample trips. Measure how often the actual total falls inside the range, average absolute total-fare error, and the share of budget-crossing cases correctly labeled uncertain. Record eligibility errors separately.

**5h40 fit — Fits as a narrow demo if rules and data are prepared:** Demonstrate one complete fare calculation, including the brief's bus student discount and minimum where applicable, plus a clearly disclosed connector-fare range. Representative price collection and market accuracy are out of scope. Synthetic domain data is acceptable only when clearly disclosed.

**Skeptical check:** The brief’s student-fare rule may make part of this a compliance requirement rather than a novel opportunity. The opportunity is the complete trip total and honest treatment of variable prices.

### Opportunity 4 — Test whether a transfer works in the physical place

**Existing limitation** → A route planner can connect two services in its data while leaving the actual walking path, side of the road, transfer time, or access barriers unclear.

→ **Specific user/context affected** → An unfamiliar passenger transferring between two modes at one selected interchange; mobility needs should be included only if participants with those needs can be consulted.

→ **Proposed intervention** → Observe and document one or two transfers on site: where to exit, which direction to walk, visible landmarks, crossing or access barriers, and observed time. Compare the planned transfer with the path a first-time participant actually takes.

→ **Why it could address the limitation** → The test checks whether the connection is usable on the ground, not only connected in route data. It can identify a specific missing instruction or a transfer that should not be represented as easy.

→ **Measurable outcome** → Measure transfer completion without assistance, wrong turns or missed connections, elapsed transfer time, and differences between planned and observed walking time. Report the sample size and participant context.

**5h40 fit — Only if field observation is prepared:** Show one previously observed interchange and its measured transfer path. A new site visit, meaningful participant trials, and accessibility claims cannot be completed responsibly within the event. Never infer accessibility from a map-only inspection.

**Skeptical check:** Route planners already advertise multi-leg trips. The remaining question is whether one important connection is inaccurate for a clearly defined group, not whether transfer planning exists at all.

### Opportunity 5 — Carry a last-known plan across a loss of connectivity

**Existing limitation** → Some local products advertise offline information, so an offline app alone is not a strong difference. A traveller can still lose access to the exact trip context or fail to notice that saved details have aged.

→ **Specific user/context affected** → A passenger whose mobile data or battery fails while changing vehicles or walking through an unfamiliar area.

→ **Proposed intervention** → Test a pocket-sized or printable trip handoff card that contains only a selected route, landmarks, expected cash, timestamp, and an explicit warning when alert data is old. It should be usable without an account or network at the moment of travel if public access is appropriate.

→ **Why it could address the limitation** → A physical handoff can preserve a decision through a connectivity failure and make the age of remembered information visible. It tests access across digital and physical contexts rather than adding another offline route database.

→ **Measurable outcome** → In a simulated or observed no-network task, measure trip-step completion, time to find the next landmark, mistaken use of stale information, and whether users notice the timestamp. Compare the card with the ordinary offline reference they already use.

**5h40 fit — Fits as a narrow demo:** A single printable itinerary can be generated from the chosen trip and its known timestamp. There is little time for a meaningful user study, and the card may be inferior to existing offline tools. Validate the failure before treating this as an opportunity worth building.

**Skeptical check:** This is likely unnecessary for users whose current app already preserves the same trip offline. Validate the specific failure before building it.

### Opportunity 6 — Relay corrections into places commuters already check

**Existing limitation** → Updates can be scattered across group chats, social posts, and services. A new feed risks splitting attention and starting without contributors; Jaatra already advertises rider updates.

→ **Specific user/context affected** → A commuter who receives the same incident through multiple channels and cannot tell which report or correction is newest.

→ **Proposed intervention** → Define a short, dated incident-and-correction format that preserves the source link and points later corrections back to the earlier claim. Test the format through a human steward or a small simulated set of channels; do not assume access to private groups or publishing APIs.

→ **Why it could address the limitation** → The mechanism improves correction and provenance across existing channels rather than asking every traveller to join a new community. A steward can resolve duplicates and preserve disagreement.

→ **Measurable outcome** → Measure time for a correction to reach each test channel, duplicate claims consolidated, source links retained, and the share of test users who identify the latest status correctly.

**5h40 fit — Too ambitious for live use; simulation only:** A short tabletop demonstration could show a correction linked to an earlier report. Permission, channel-owner cooperation, and live integration are not safe assumptions for this event.

**Skeptical check:** Without channel-owner participation, this is only a prototype. It may add moderation work and could spread a wrong correction faster if the source process is weak.

### Opportunity 7 — Establish a confirmed status path for one corridor

**Existing limitation** → Crowd reports may be timely but uncertain; official service data can be trusted but may not describe street-level conditions or may arrive slowly. The research did not verify an existing complete, public Dhaka source for these conditions.

→ **Specific user/context affected** → A passenger on one corridor during a major service change, where a wrong answer could cause a long detour or missed connection.

→ **Proposed intervention** → Work with an authorized operator, station, campus, or community contact to define who can confirm a status, what area and mode it covers, when the next update is due, and how uncertainty is communicated. A tabletop demonstration can show the process when live cooperation is unavailable.

→ **Why it could address the limitation** → A named source and update responsibility can reduce the gap between an observation and a dependable status. It uses an operating relationship instead of relying only on more crowd submissions.

→ **Measurable outcome** → For a permitted pilot or drill, measure time from event report to first confirmed update, share of scheduled updates delivered, agreement with on-site observations, and time to publish a correction when the first status is wrong.

**5h40 fit — Too ambitious unless a partner and process already exist:** A tabletop demonstration can illustrate the workflow, but it cannot show that an operator will respond, maintain coverage, or publish accurate updates.

**Skeptical check:** It depends on institutional willingness, staff time, and a clear authority boundary. A named contact is not a guarantee that the information is complete or that an agency will act on it.

## 3. Feasibility and evidence limits

**Quick summary:** In 5 hours 40 minutes, focus on one demonstrated user outcome with prepared data and deployment setup. The table separates a demo that might fit from evidence gathering or operations that need prior work.

| Opportunity | 5h40 event fit | What must be ready before the clock | Full real-world outcome in 5h40 |
|---|---|---|---|
| 1. Incident evidence and age | Narrow demo | Prepared incident cases and clear evidence states | Too ambitious |
| 2. Corridor field audit | Prepared evidence only | A field-checked corridor and correction record | Too ambitious |
| 3. Whole-trip student affordability | Narrow demo | Fare rules and a small disclosed data set | Citywide accuracy too ambitious |
| 4. Physical transfer check | Prepared evidence only | On-site observations; no new accessibility claims | Too ambitious |
| 5. No-network handoff card | Narrow demo | A known trip and its source data | A proven user benefit is unlikely without prior testing |
| 6. Cross-channel correction relay | Tabletop simulation only | Example channels and correction cases | Too ambitious without permission and cooperation |
| 7. Confirmed corridor status path | Tabletop simulation only | Existing partner and agreed response process | Too ambitious without an operating partner |

**Assumption — planning sketch:** Reserve the final 20 minutes of the 5h40 build window as contingency. Use the first 20 minutes to lock one user journey and contracts, about 3 hours for the core end-to-end flow, about 1 hour for integration and deployment, 40 minutes for browser checks and fixes, and 20 minutes for demo rehearsal. The 4–5 minute demo and 2-minute Q&A follow the build window. This plan is only credible if credentials, Neon branches, migrations, Render configuration, and starter deployment are prepared before the event.

**Decision:** Allocate work across the three available members only after choosing one opportunity: Pantha can own backend/data/deployment, Tanvir the full-stack flow and integration, and Yousha the interface and browser review. Keep one shared contract and integrate early; do not split the team across unrelated opportunity demos.

**Decision:** Do not label any opportunity “proven,” “best,” or “selected” based on desk research alone. Choose only after checking the affected user journey and comparing the current product or process directly.

**Unknown:** No baseline rates, participant measurements, user interviews, organizer scoring weights, or verified thresholds are available. A team should set success thresholds before running each test, based on its specific task and sample size. The remaining project documents' deployment and account-isolation requirements may also exceed event capacity unless setup is completed in advance; that is a delivery risk, not a reason to claim those requirements are met.

## 4. Evidence anchors and source limits

**Quick summary:** Product overlap and research precedents below motivate the opportunities, but do not prove their local effectiveness or the presence of a user gap. Check the source descriptions and limits before using them in a pitch.

- **VERIFIED FACT, from publisher descriptions:** [Jaatra’s App Store listing](https://apps.apple.com/gb/app/jaatra-dhaka-bus-transit/id6809208687) describes Pulse rider updates; [Jaatra’s official site](https://www.jaatra.bd/) discloses simulated vehicle positions pending authorized GPS. Neither establishes how well incident claims are verified.
- **VERIFIED FACT, from publisher descriptions:** [Smart Route BD](https://smartroutebd.com/en) advertises route and fare information; [Vara Koto](https://varakoto.vercel.app/) describes approximate fare estimates. These establish overlap, not accuracy against current trips.
- **VERIFIED FACT, research method:** [Digital Matatus](https://digitalmatatus.com/) documents field collection and publication of Nairobi route data. It is a precedent for method, not proof of Dhaka route accuracy or low ongoing cost.
- **VERIFIED FACT, technical pattern:** The [GTFS Realtime specification](https://developers.google.com/transit/gtfs-realtime/) provides a standard format for transit updates. A data format does not supply an operator feed or street verification by itself.
- **REASONABLE INFERENCE:** Evidence history, field audits, and physical transfer checks could address weaknesses in stale, incomplete, or abstract route information if those weaknesses affect the selected users.
- **UNKNOWN:** Whether the opportunities outperform Jaatra, Smart Route BD, existing community channels, printed materials, or staff guidance in actual Dhaka journeys. The project has not performed a hands-on product comparison or user study.
