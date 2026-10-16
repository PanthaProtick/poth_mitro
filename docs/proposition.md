# Central proposition

- **Target user hypothesis:** A Dhaka commuter following an unfamiliar trip who may lose mobile connectivity along the way.
- **Core problem:** The traveller may not know whether a disruption report affects their trip, and may lose access to trip context when connectivity drops.
- **Known overlap:** Local services advertise route information, rider updates, and some offline information; the exact end-to-end gap is unverified.
- **Current proposition:** Connect the traveller's chosen journey with relevant, time-aware disruption information, while keeping that journey context available through a connectivity loss.
- **Evidence status:** This is a testable proposition, not a validated user need, product feature list, or architecture decision.

## 1. Proposition in the requested format

**Quick summary:** The proposition combines the selected opportunities into one traveller journey. It focuses on whether alerts can be judged against a trip and whether the traveller can retain useful trip context without a live connection.

For **Dhaka commuters following an unfamiliar journey who may lose mobile connectivity**,  
who experience **uncertainty about whether a disruption report is current and affects their trip, and may lose access to journey information while travelling**,  
existing approaches **advertise route planning, rider updates, and offline references, but the sources reviewed do not establish whether these approaches connect alert relevance to a selected trip and preserve that trip context when connectivity is lost**.  
We propose **a journey decision approach that links disruption information to the traveller's chosen trip and maintains access to the relevant trip context during a connection loss**,  
which works by **using the report's observation time, place, direction, and transport mode to judge its relevance to the trip, showing uncertainty where evidence is missing, and retaining the trip context with its age visible**,  
with the goal of improving **the share of travellers who correctly judge whether a reported disruption affects their trip and complete a short journey-information task after connectivity is removed**.

**Evidence labels:** The existence of route, fare, and rider-update products is supported by publisher descriptions cited below. The limitation about connecting alert relevance with offline trip continuity is an **UNKNOWN**, not an established fact.

## 2. Short versions

**Quick summary:** The one-sentence version is compact enough for a pitch. The judge-friendly version explains the user problem and the test without claiming that the gap is already proven.

**One-sentence version:** For Dhaka commuters who may lose connectivity on unfamiliar trips, we aim to make disruption reports easier to judge against their journey and keep relevant trip context accessible, improving correct alert decisions and task completion without a live connection.

**Judge-friendly version:** A traveller may see a disruption alert but still not know whether it affects their route, then lose access to trip details when mobile data drops. We are testing whether connecting an alert's time and location to a chosen journey, while keeping that journey context available offline, helps travellers make the right decision and continue a short information task.

## 3. Technical version

**Quick summary:** The technical statement defines the information relationship and evaluation outcomes, without selecting a programming stack, interface, database, or model. Those choices remain open.

**Technical proposition:** Given a selected trip context and one or more disruption reports, the approach relates each report's observation time, location, direction, and affected transport mode to the trip. It must preserve an explicit unknown or conflicting state when the report lacks enough evidence. When network access is unavailable, the traveller should still be able to access the relevant trip context, with its last-known age visible. Evaluate the approach using (1) correct user classification of whether a report affects a trip and (2) completion of a defined journey-information task during a no-network condition.

**Metric definitions:**

- **Alert relevance accuracy:** number of test cases where the participant correctly says “affects my trip,” “does not affect my trip,” or “not enough information,” divided by all test cases. Include an answer key based on known test scenarios.
- **No-network task completion:** participants who complete the defined trip-information task after connectivity is removed, divided by participants who attempt it.
- **Stale-information recognition:** test cases where a participant correctly notices that the trip context is old, divided by all stale-context cases.

No success threshold is set because there is no baseline yet. Set a threshold before testing, and report the number and type of participants and scenarios.

## 4. Assumptions required

**Quick summary:** The proposition depends on a specific commuter context and two gaps that have not been confirmed. If the gaps are absent or unrelated for the same users, the combined proposition should be narrowed or dropped.

- **ASSUMPTION — user:** A meaningful group of Dhaka commuters follows unfamiliar routes and sometimes loses usable connectivity during a trip.
- **ASSUMPTION — current pain:** These commuters struggle to tell whether a disruption report applies to their particular journey, even when they can access the report.
- **ASSUMPTION — offline gap:** Existing offline references do not already preserve enough of the same trip context for the relevant users.
- **ASSUMPTION — information quality:** Reports can sometimes provide trustworthy observation time, location, direction, and transport mode. If they do not, the right result may often be “unknown.”
- **ASSUMPTION — coherent workflow:** A traveller who needs to judge an alert is also likely to need journey details when connectivity fails. The two needs have not yet been shown to co-occur.
- **ASSUMPTION — usefulness:** Better relevance judgments and offline task completion matter enough to change a real travel decision.
- **ASSUMPTION — evaluation:** Test cases can be prepared with known affected and unaffected trips, including cases where available information is insufficient.

## 5. Evidence needed

**Quick summary:** First verify that the same travellers experience both parts of the problem. Then compare their current approach with a controlled test and measure correctness, completion, and time.

### User and workflow evidence

- Ask target commuters to describe a recent disruption decision and a recent connectivity loss during travel. Record what information they had, what they did, and what happened.
- Observe a small set of travellers using their current route and offline information sources. Do not assume that a missing public feature means users lack a workaround.
- Check whether the two problems occur for the same people and journey. If not, do not combine them merely to make a larger pitch.

### Existing-product evidence

- Test the relevant journeys directly in Jaatra, including its Pulse updates, and in Smart Route BD, including its advertised offline information.
- Record app/version, route, report, connectivity condition, steps, and result. Distinguish observed behavior from what the publisher says the product supports.
- If current products already support the same journey and offline context reliably, the proposition is unnecessary or needs a different, evidence-backed gap.

### Controlled outcome evidence

- Prepare route/report scenarios with known answers: relevant, irrelevant, stale, conflicting, and insufficient information.
- Compare participant judgments and task completion with their current method. Measure alert relevance accuracy, no-network task completion, stale-information recognition, and time to decide.
- Include a small number of participants from the intended user group and report the sample size. A hackathon-sized sample can reveal usability problems but cannot establish citywide performance.
- Set success criteria before running the test. Report failures and uncertain cases, not only successful examples.

### Existing evidence and its limits

- **VERIFIED FACT, publisher claim:** [Jaatra's App Store listing](https://apps.apple.com/gb/app/jaatra-dhaka-bus-transit/id6809208687) describes Pulse rider updates. Its [official site](https://www.jaatra.bd/) says vehicle positions are simulated pending authorized operator GPS. This does not establish how Pulse reports are verified or whether a trip is retained offline.
- **VERIFIED FACT, publisher claim:** [Smart Route BD](https://smartroutebd.com/en) advertises route/fare reference and offline information. This does not establish whether the selected journey and relevant disruption context remain available offline in practice.
- **UNKNOWN:** Whether users experience the combined gap, whether the two needs co-occur, and whether the proposed outcome is better than existing apps or non-app workarounds.

## 6. Scope boundary

**Quick summary:** This proposition locks the user problem and intended outcome for validation. It does not yet define features, screen behavior, technical architecture, or a promise of live Dhaka-wide accuracy.

**Decision:** Keep Opportunities 1 and 5 together only while evidence supports a shared traveller and workflow. Opportunity 3 (whole-trip affordability) remains a possible future addition, not part of this proposition.

**Unknown:** The target user segment, actual prevalence of connectivity loss, report quality, and performance threshold remain unmeasured. Do not present these as established facts in a judge pitch.
