# Opportunity and feature candidates

- Local route search, fare estimates, and rider updates already have product overlap, so repeating them is weak differentiation.
- Opportunities 1 and 5 are selected as the current pair to explore: disruption relevance/freshness and continuity when connectivity is lost.
- The selected pair is an opportunity direction, not an approved feature list or implementation plan. The other opportunities remain on the future radar.
- “Hackathon fit” estimates what this three-person team could demonstrate in the confirmed 5 hours 40 minutes; it does not mean a durable city service can be built in that time.
- The last 20 minutes are reserved as a contingency buffer, leaving about 5 hours 20 minutes for planned work. The final presentation is 4–5 minutes plus 2 minutes of questions.

## 1. How to read these opportunities

**Quick summary:** Opportunities 1 and 5 are selected as the current direction, but remain unverified hypotheses. The other candidates stay on the future radar; all need evidence from commuters or field checks.

**Fact:** The research and comparison documents report that Jaatra advertises multimodal route planning, fares, and Pulse rider updates; Smart Route BD advertises route/fare reference; and fare tools already provide estimates. These are publisher claims and were not performance-tested in this project.

**Inference:** A new route planner, fare calculator, or rider feed by itself would have weak differentiation. A meaningful opportunity must change how information is verified, connected to an actual journey, handed across channels, or interpreted under uncertainty.

**Assumption:** The proposed users and contexts below are plausible examples, not validated user segments. A short interview or observed trip should confirm each before implementation.

**Hackathon-fit labels:** “Fits as a narrow demo” means a small, prepared vertical slice could plausibly be shown in this event. “Only if prepared or simplified” means field work, setup, or data collection must already exist or be cut from the event clock. “Too ambitious” means the opportunity depends on real-world coverage, partner cooperation, or sustained operations that a demo cannot establish.

**Fact:** The available team has three people: Pantha Protick (backend, database, ML, and systems), Tanvir Hasan Ratul (full stack), and Yousha Shahid (frontend/UI). Partha Sarathi Saha Tirtha is excluded. The user's required web stack is React, FastAPI, `uv`, remote Neon PostgreSQL, and Render, with real Clerk authorization if accounts or roles are needed. The user reports Clerk and Neon are set up; Render is not yet arranged.

**Decision:** The 5h40 clock is too short to research a new user gap, collect representative city data, build all required infrastructure, deploy, and validate a full product from scratch. The practical event goal is one coherent end-to-end slice using pre-prepared accounts, schema, sample data, and deployment configuration. If these are not ready before the clock starts, the project must narrow further while still treating deployment and required user isolation as acceptance needs.

## 2. Candidate opportunities

**Quick summary:** Opportunities 1 and 5 are the selected pair for the current direction. The others remain future possibilities; each fit judgment assumes preparation happens before the event, and none can deliver citywide accuracy or sustained service in 5 hours 40 minutes.

**Decision:** Keep Opportunity 1 (incident relevance and freshness) as the central need and Opportunity 5 (journey information during connectivity loss) as a supporting need. They follow the same traveller's journey: assess a disruption, then continue with relevant trip context if connectivity fails. This pair is not yet a set of product features, screens, or technical requirements.

**Reasonable inference:** Opportunity 5 is less evidenced because some local services advertise offline information. Keep it in the pair only while testing confirms a distinct user problem; if existing offline tools already solve it, drop it without changing Opportunity 1.

**Future radar:** Opportunity 3 (whole-trip affordability) is the closest possible addition. Opportunities 2 and 4 depend on field evidence; Opportunity 6 depends on channel access; Opportunity 7 depends on an operating partner. Do not add them to the current scope without evidence and a coherent journey.

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

**Decision:** Opportunities 1 and 5 are selected as the current direction by the user, but they are not proven to represent a real user gap. Validate them against the affected journey and existing products before moving to feature design.

**Unknown:** No baseline rates, participant measurements, user interviews, organizer scoring weights, or verified thresholds are available. A team should set success thresholds before running each test, based on its specific task and sample size. The remaining project documents' deployment and account-isolation requirements may also exceed event capacity unless setup is completed in advance; that is a delivery risk, not a reason to claim those requirements are met.

## 4. Evidence anchors and source limits

**Quick summary:** Product overlap and research precedents below motivate the opportunities, but do not prove their local effectiveness or the presence of a user gap. Check the source descriptions and limits before using them in a pitch.

- **VERIFIED FACT, from publisher descriptions:** [Jaatra’s App Store listing](https://apps.apple.com/gb/app/jaatra-dhaka-bus-transit/id6809208687) describes Pulse rider updates; [Jaatra’s official site](https://www.jaatra.bd/) discloses simulated vehicle positions pending authorized GPS. Neither establishes how well incident claims are verified.
- **VERIFIED FACT, from publisher descriptions:** [Smart Route BD](https://smartroutebd.com/en) advertises route and fare information; [Vara Koto](https://varakoto.vercel.app/) describes approximate fare estimates. These establish overlap, not accuracy against current trips.
- **VERIFIED FACT, research method:** [Digital Matatus](https://digitalmatatus.com/) documents field collection and publication of Nairobi route data. It is a precedent for method, not proof of Dhaka route accuracy or low ongoing cost.
- **VERIFIED FACT, technical pattern:** The [GTFS Realtime specification](https://developers.google.com/transit/gtfs-realtime/) provides a standard format for transit updates. A data format does not supply an operator feed or street verification by itself.
- **REASONABLE INFERENCE:** Evidence history, field audits, and physical transfer checks could address weaknesses in stale, incomplete, or abstract route information if those weaknesses affect the selected users.
- **UNKNOWN:** Whether the opportunities outperform Jaatra, Smart Route BD, existing community channels, printed materials, or staff guidance in actual Dhaka journeys. The project has not performed a hands-on product comparison or user study.

## 5. Feature candidates traced to the capability tree

**Quick summary:** The entries below turn the proposition capabilities into possible user-visible and technical features. Each candidate is traced to a need, a documented limitation, and the original problem; “UNJUSTIFIED” marks a broken or weak link that needs a need-level decision before the feature is accepted.

**Scope:** “Core” means the central proposition cannot work without it. “Supporting” helps core behavior work reliably. “Differentiating” directly expresses the selected proposition's distinct value. “Nice-to-have” improves testing or convenience but is not essential. “High-risk experimental” depends on uncertain data or methods. A feature can have more than one label, such as **Core + Differentiating**.

**Trace keys:** Original problem statements are from the organizer brief and decomposition: **P1** fragmented Dhaka multimodal travel information; **P2** fare/student-discount/connector price complexity; **P3** changing street conditions such as waterlogging and blockades; **P4** scattered, aging, and potentially inaccurate reports; **P5** risk of invented route advice; **P6** English/Banglish access and offline briefing (offline briefing is a bonus, not a core requirement). Need IDs and failure IDs refer to `docs/needs.md` (N1–N11 and F1–F10). These are source references, not proof that every need occurs often.

### Capability C1 — Represent the selected trip

- **User-visible feature — Show a chosen trip as ordered travel segments.** **Class:** Core. **Trace:** Feature → C1 represent trip → N1 compare complete journeys / N6 practical connections → F1 fragmented options / F6 disconnected legs → P1 Dhaka travel combines multiple transport modes and information is fragmented. **Why:** Report relevance cannot be compared to an unspecified journey.
- **Technical feature — Store segment place, direction, and mode references.** **Class:** Core. **Trace:** Feature → C1 represent trip → N6 practical connections → F6 individual legs may not form a usable transfer → P1 multimodal travel crosses separate services. **Why:** Consistent segment references let the system compare a report with the right part of a trip.

### Capability C2 — Represent disruption reports with time and place context

- **User-visible feature — Show the report's observation time, affected place, direction, and mode when known.** **Class:** Core + Differentiating. **Trace:** Feature → C2 report context → N8 incident relevance → F8 report area is too general → P4 reports can be scattered and hard to apply. **Why:** A nearby incident may not affect the chosen route.
- **Technical feature — Keep observation time, entry time, place, direction, and mode as separate fields, allowing unknown values.** **Class:** Core. **Trace:** Feature → C2 report context → N8 and N9 relevance/freshness → F8 vague context / F9 old claims appear current → P4 reports age quickly and may lack context. **Why:** Missing or copied information must not be silently converted into a precise fact.

### Capability C3 — Judge relevance and communicate uncertainty

- **User-visible feature — Give each report a trip-relative state: affects this trip, does not appear to affect it, or not enough information.** **Class:** Core + Differentiating. **Trace:** Feature → C3 relevance assessment → N8 relevance / N7 reassess after disruption → F8 unclear relevance / F7 change discovered late → P3 disruptions can make journeys unusable and P4 reports may be unreliable. **Why:** The central proposition is a decision about a specific trip, not a general alert list.
- **Technical feature — Compare report segment, direction, mode, and age with trip segments using explicit rules.** **Class:** Core. **Trace:** Feature → C3 relevance assessment → N8 and N9 → F8 and F9 → P3 changing road conditions and P4 fast-aging reports. **Why:** A repeatable rule can be checked and tested; a language model should not invent whether a road or service is affected.

### Capability C4 — Preserve and provide trip context without connectivity

- **User-visible feature — Show a last-known trip summary when the network is unavailable, with its saved time and a clear old-data warning.** **Class:** Core to the selected pair; **UNJUSTIFIED against the current needs list**. **Trace:** Feature → C4 offline access → N11 only partially (retaining context is related, but N11 addresses repeated explanation, not network loss) → no matching offline failure is recorded in F1–F10 → P6 mentions offline briefing only as a bonus. **Why:** It is required by the chosen proposition but lacks a direct, validated need in `needs.md`; confirm the need or revise that document before treating this as a justified product feature.
- **Technical feature — Keep a bounded last-known copy of selected trip context on the device and expose its saved time.** **Class:** Core to the selected pair; **UNJUSTIFIED against the current needs list** for the same traceability gap. **Trace:** Feature → C4 offline access → N11 partial fit → no direct offline limitation in F1–F10 → P6 optional offline briefing. **Why:** Offline access cannot work without locally available data, but the user problem and current workaround are unverified. Do not cache an alert in a way that makes it look current.

### Capability C5 — Keep information traceable

- **User-visible feature — Show whether a claim is a direct observation, a second-hand report, or a correction, when that information is available.** **Class:** Supporting. **Trace:** Feature → C5 traceability → N9 freshness/support and N10 conflicting sources → F9 repeated claims / F10 conflicting advice → P4 reports can be inaccurate or contradictory. **Why:** Source context helps a traveller judge support without treating popularity as truth.
- **Technical feature — Retain source reference and report lineage (which report corrected or repeated another).** **Class:** Supporting. **Trace:** Feature → C5 traceability → N9 and N10 → F9/F10 → P4 stale and contradictory reports. **Why:** Without lineage, copied messages can look like independent confirmation.

### Capability C6 — Make information age visible

- **User-visible feature — Show “observed at” separately from “added at,” and mark old information as potentially stale.** **Class:** Core + Differentiating. **Trace:** Feature → C6 freshness → N9 distinguish current from old/repeated claims → F9 old reports remain influential → P4 reports quickly become outdated. **Why:** Recent posting does not prove a recent observation.
- **Technical feature — Apply a documented age rule without treating expiry or silence as proof the incident ended.** **Class:** Core. **Trace:** Feature → C6 freshness → N9 → F9 → P4 fast-aging information. **Why:** The proposition needs honest limits; otherwise an old alert or missing alert can create false reassurance.

### Capability C7 — Handle missing, conflicting, or invalid information

- **User-visible feature — Display missing details and conflicting reports as unresolved.** **Class:** Supporting. **Trace:** Feature → C7 safe handling → N8 relevance / N10 conflicting sources → F8 vague reports / F10 conflicting advice → P4 report accuracy is uncertain. **Why:** The traveller needs to know when the system cannot justify a clear answer.
- **Technical feature — Validate required fields and preserve disagreeing claims rather than overwriting one silently.** **Class:** Supporting. **Trace:** Feature → C7 safe handling → N9 and N10 → F9/F10 → P4 reports can be stale or inaccurate. **Why:** Safe failure behavior protects the core relevance judgment from bad input.

### Capability C8 — Support English and Banglish

- **User-visible feature — Present key status labels and explanations in English and Banglish.** **Class:** Supporting; also required by the organizer brief. **Trace:** Feature → C8 language access → N11 only for the stated risk that communication barriers can prevent conveying context → repeated/failed communication in F1/F8 → P1 fragmented travel information; organizer requirement P6. **Why:** Users must understand the status, but language support does not establish alert accuracy.
- **Technical feature — Resolve common English/Banglish place-name variants to the same known place reference.** **Class:** Supporting. **Trace:** Feature → C8 language access → N1 compare journeys (place names must be interpretable) → F1 fragmented journey information → P1 multimodal Dhaka information is fragmented; organizer requirement for English/Banglish search. **Why:** Different spellings should not make the system compare the wrong locations. **Risk:** This needs a verified alias list; guessing transliterations can create false matches.

### Capability C9 — Explain the relevance result

- **User-visible feature — Give a short reason for a report status, such as matching direction or missing location detail.** **Class:** Supporting. **Trace:** Feature → C9 explain result → N8 relevance / N10 reasoned trust → F8 vague location / F10 conflicting advice → P4 reports may be hard to interpret. **Why:** A status without a reason is difficult to assess or challenge.
- **Technical feature — Produce the explanation from the same comparison rules that produced the status.** **Class:** Supporting. **Trace:** Feature → C9 explanation consistency → N8 and N10 → F8/F10 → P4 unreliable report interpretation. **Why:** A separate generative explanation could contradict the actual comparison.

### Capability C10 — Accept and preserve corrections

- **User-visible feature — Let a user say that a report is outdated, incorrect, or has changed, while showing it as a claim pending review.** **Class:** Supporting. **Trace:** Feature → C10 correction learning → N9 freshness and N10 conflicting sources → F9 stale claim / F10 disagreement → P4 reports age and may be inaccurate. **Why:** Later information needs a path to challenge earlier claims; a correction should not automatically become verified truth.
- **Technical feature — Store corrections as linked events instead of deleting the earlier report.** **Class:** Supporting. **Trace:** Feature → C10 correction history → N9 and N10 → F9/F10 → P4 old and conflicting reports. **Why:** History makes changes auditable and helps distinguish an update from independent confirmation.
- **User-visible feature — Offer an optional compact view of earlier status changes and their sources.** **Class:** Nice-to-have. **Trace:** Feature → C10 correction history → N10 understand conflicting claims → F10 conflicting advice → P4 reports may contradict one another. **Why:** It may help a traveller who wants detail, but it is not needed to show a current status and can add clutter.

### Capability C11 — Predict whether an incident will spread or end

- **User-visible feature — Show a forecast of likely disruption duration or spread.** **Class:** High-risk experimental. **Trace:** Feature → C11 forecasting → N7 reassess after disruption → F7 condition changes after travel starts → P3 waterlogging and blockades affect routes. **Why:** It may help planning, but is beyond judging a current report and needs validated time-series data.
- **Technical feature — Estimate future impact from historical and current observations, with uncertainty.** **Class:** High-risk experimental. **Trace:** Feature → C11 forecasting → N7 → F7 → P3 changing disruption conditions. **Why:** A forecast without representative history may be wrong; do not use it to imply safety or certainty.

### Capability C12 — Infer report truth from text, images, or crowd patterns

- **User-visible feature — Show an automated suggestion that a report may be duplicate, unsupported, or inconsistent.** **Class:** High-risk experimental. **Trace:** Feature → C12 automated evidence assessment → N9/N10 → F9 copied claims / F10 conflict → P4 inaccurate or contradictory reports; P5 risk of invented advice. **Why:** It may help review, but a machine suggestion is not confirmation.
- **Technical feature — Compare report text or images with other reports and known places, returning a review signal rather than an authoritative truth score.** **Class:** High-risk experimental. **Trace:** Feature → C12 → N8/N9/N10 → F8/F9/F10 → P4 weak reports and P5 hallucination concern. **Why:** Requires labeled local examples and careful evaluation; otherwise it adds false precision.

### Capability C13 — Recalculate alternatives after a disruption

- **User-visible feature — Present an alternate trip when a report affects a selected route.** **Class:** High-risk experimental; outside the current proposition's minimum. **Trace:** Feature → C13 rerouting → N7 respond to disruption / N6 practical connections → F7/F6 → P3 disrupted roads and P1 connected multimodal trips. **Why:** It extends a relevance decision into a route decision, but the proposition does not yet promise this.
- **Technical feature — Re-run a route search after excluding or penalizing affected segments, then recalculate time and cost.** **Class:** High-risk experimental; outside current proposition. **Trace:** Feature → C13 rerouting → N7/N6 → F7/F6 → P3/P1. **Why:** Requires accurate network, fare, and disruption-effect data. A graph route that exists in stored data may still be unusable on the street.

### Traceability review

**Quick summary:** Most report-context features trace directly to critical needs N8 and N9. The most important gap is offline access: it is central to the selected proposition but is not represented as a need in `needs.md` and is only an optional organizer bonus in the original brief.

**UNJUSTIFIED pending need validation:** The two C4 offline features are necessary to the chosen proposition but cannot currently complete the requested chain through a documented user need and failure. Either validate and add that need before feature selection, or narrow the proposition so offline access is not promised.

**Scope warning:** C11 forecasting and C13 rerouting trace to broader organizer problems, but they are not required for the proposition. C12 automated truth inference is especially risky because no verified local labels or accuracy target are available. None should be treated as part of the core feature set.

**No feature selected:** These are candidates. Core classification describes what the proposition requires if retained; it does not prove that the proposition itself is worth building.
