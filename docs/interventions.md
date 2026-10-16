- **Fact:** The needs document defines 11 user/system needs across travel comparison, costs, transfers, disruptions, reports, and repeated effort.
- **Decision:** Each need below has two distinct approaches; neither alternative is selected as a winner.
- **Decision:** Alternatives include software and rules, people and process, existing infrastructure, and physical sensing where relevant.
- **Assumption:** “Hackathon feasibility” means whether a small demonstration or bounded pilot can be prepared during the event, not citywide service readiness.
- **Unknown:** Real data access, operator participation, sensor installation, and deployment permissions are unconfirmed.

# Intervention alternatives

## 1. How to read these alternatives

**Quick summary:** An intervention is a way to meet a need; it is not automatically a product feature. Each option describes a different source of information, decision process, or change in the physical service.

**Fact:** The needs and their Critical / Important / Secondary rankings are in [needs.md](needs.md). The need IDs N1–N11 are preserved for traceability.

**Hackathon feasibility** describes a credible event-time prototype using disclosed sample data or a paper demonstration. **Real-world feasibility** reflects likely deployment obstacles such as data access, staff, cost, permissions, and maintenance.

**Decision:** Alternatives are not ranked against each other. “High” hackathon feasibility does not mean a real service is accurate or ready for public use. No need-specific approach has been chosen.

## 2. Critical needs

**Quick summary:** These needs concern whether a commuter can complete a journey within their limits and judge street conditions responsibly. Approaches may reduce uncertainty, but none can guarantee that vehicles or safe roads are available.

### N3 — Understand whether the whole journey fits the available budget

**Quick summary:** The traveller needs the total cost and its uncertainty across journey parts. Options differ in whether cost information comes from official rules or observed transactions.

#### N3-A — Fare-rule reference maintained by operators or authorities

- **Need:** Know which published fare and student rules apply to each journey part.
- **Intervention concept:** Agree on a small, dated reference of official fares, concession eligibility, minimums, and update responsibility.
- **How it would work:** Participating operators or authorities supply approved rules; a designated editor checks changes and publishes effective dates. Connector prices without fixed tariffs remain ranges.
- **Required resources:** Participating organizations, authoritative documents, fare editor, review process, and update schedule.
- **Main advantage:** Rules are explainable and traceable to a responsible source.
- **Main weakness:** Agreements and updates may be slow; published rules may not match each real payment.
- **Hackathon feasibility:** **Medium.** A cited sample rulebook is demoable; obtaining organization approval during the event is unlikely.
- **Real-world feasibility:** **Medium to low.** Depends on ongoing operator cooperation and rule maintenance.

#### N3-B — Community fare observations and uncertainty ranges

- **Need:** Estimate what passengers are actually being asked to pay, especially where prices vary.
- **Intervention concept:** Collect privacy-conscious reports of fares paid or quoted, with journey, time, mode, and conditions.
- **How it would work:** Compare multiple observations for similar trips and show a range, sample size, and observation dates. Keep official rules distinct from observed prices.
- **Required resources:** Commuter participation, a consistent reporting method, basic outlier review, and enough observations for useful comparisons.
- **Main advantage:** Captures real variation that a fixed tariff misses.
- **Main weakness:** Reports can be biased, sparse, mistaken, or unrepresentative; a typical range is not a promised price.
- **Hackathon feasibility:** **High for demonstration; low for useful coverage.** Seeded, clearly disclosed examples can demonstrate calculations, but cannot establish actual city fares.
- **Real-world feasibility:** **Medium.** Useful coverage needs sustained participation and validation.

### N6 — Know that consecutive journey parts form a practical connection

**Quick summary:** A connected route must work across the handoff between services. Alternatives include people coordinating the handoff or publishing field-checked connection knowledge.

#### N6-A — Inter-operator transfer agreement

- **Need:** Avoid reaching a transfer point where the next journey part cannot reasonably be taken.
- **Intervention concept:** Operators coordinate named transfer points, passenger directions, service timing information, and escalation contacts.
- **How it would work:** Participating services agree where passengers change, what happens when a service is delayed, and how staff direct transferring passengers.
- **Required resources:** Operator and station staff, agreed transfer locations, service contacts, accessible walking paths, and regular coordination.
- **Main advantage:** Resolves operational handoffs at their source instead of only describing them.
- **Main weakness:** Requires organizations to coordinate; one agreement does not cover independent vehicles or changing road conditions.
- **Hackathon feasibility:** **Low as a real agreement; medium as a role-play or workflow demonstration.**
- **Real-world feasibility:** **Low to medium.** Depends on authority, operator incentives, and physical access.

#### N6-B — Field-checked connection directory

- **Need:** Know whether listed journey parts connect at an identified place.
- **Intervention concept:** Maintain a reviewed directory of service-to-service connections, walking links, and known limitations.
- **How it would work:** Local observers check selected transfers, record how to reach them, and mark which details and operating assumptions are unverified.
- **Required resources:** Route observations, local reviewers, place descriptions, update responsibility, and accessibility information where available.
- **Main advantage:** Can cover services that do not have formal agreements.
- **Main weakness:** A verified location does not prove that a service is running at the time a passenger arrives.
- **Hackathon feasibility:** **High for a bounded sample.** A few honestly labelled examples can demonstrate evidence handling.
- **Real-world feasibility:** **Medium.** Maintaining current coverage takes continuing fieldwork.

### N7 — Reassess a journey when conditions change

**Quick summary:** Commuters need timely understanding of a disruption and its consequences. Alternatives include authorized operational notices, direct human observations, or physical measurements.

#### N7-A — Existing authority and operator alert chain

- **Need:** Learn whether an official road, station, or service notice affects the journey.
- **Intervention concept:** Use existing police, city, transport operator, or station communication channels as the source of disruption notices.
- **How it would work:** Staff issue a dated notice with location and operational effect; transport staff relay changes through current public information channels.
- **Required resources:** Named duty contacts, a common description format, communications access, and an update/closure responsibility.
- **Main advantage:** Notices can come from people responsible for the affected service or site.
- **Main weakness:** Coverage and update speed may vary; an official notice may not capture every local street condition.
- **Hackathon feasibility:** **Medium for a simulated notice workflow; low for new live authority integration.**
- **Real-world feasibility:** **Medium.** Existing channels may be usable, but participation and timely updates are not assured.

#### N7-B — Human street-observer network

- **Need:** Learn about local changes that formal notices do not cover quickly.
- **Intervention concept:** Train or organize trusted local observers to report observed conditions and later confirm changes.
- **How it would work:** An observer records the place, time, direction, condition, and mode affected. A later observation updates whether it still appears active.
- **Required resources:** Observer recruitment, safety guidance, supervision, communications, and a process for correcting reports.
- **Main advantage:** People can describe context that a fixed sensor may miss.
- **Main weakness:** Coverage is uneven; observers face safety, workload, and reliability concerns.
- **Hackathon feasibility:** **High as a tabletop or sample reporting exercise; low for a staffed city network.**
- **Real-world feasibility:** **Medium to low.** Requires sustained staffing and safe participation.

#### N7-C — Environmental and road sensors

- **Need:** Detect measurable conditions that may affect road use, such as water depth or rainfall.
- **Intervention concept:** Place physical sensors at selected flood-prone sites and transmit readings to an operations team.
- **How it would work:** A device records a measurement and time; a human or agreed rule checks whether the reading indicates a road-impact threshold.
- **Required resources:** Sensor hardware, power, connectivity, installation permissions, calibration, maintenance, and a safe threshold policy.
- **Main advantage:** Can provide repeated measurements without requiring a witness at every moment.
- **Main weakness:** Measures only its location and variable; faulty or poorly placed sensors can create false confidence. It cannot alone establish whether a particular service is operating.
- **Hackathon feasibility:** **Low for a real deployment; medium for a small hardware mock-up.**
- **Real-world feasibility:** **Low to medium.** Installation and upkeep are substantial dependencies.

### N8 — Understand whether an incident report applies to this journey

**Quick summary:** A report is useful only if a traveller can relate its place, time, direction, and type to a journey. Options differ in who supplies and checks that context.

#### N8-A — Structured reporting protocol for existing channels

- **Need:** Interpret incident descriptions consistently.
- **Intervention concept:** Agree on a short human-readable reporting format covering location, observation time, direction, incident type, and affected modes.
- **How it would work:** Community moderators, transport groups, or administrators ask witnesses to provide the same essential details through their existing communication channels.
- **Required resources:** Shared guidance, trained or informed reporters, moderation time, and an agreed location vocabulary.
- **Main advantage:** Improves reports without requiring new infrastructure.
- **Main weakness:** People may omit fields, use ambiguous landmarks, or lack a safe way to confirm details.
- **Hackathon feasibility:** **High.** The protocol and example reports can be demonstrated immediately.
- **Real-world feasibility:** **Medium.** Adoption across separate groups takes time.

#### N8-B — Local steward verification

- **Need:** Clarify whether an incident affects a particular segment or direction.
- **Intervention concept:** Designated transport staff, community representatives, or local stewards review unclear reports with witnesses.
- **How it would work:** A reviewer asks for missing context or checks the site through an available local contact before the information is relied upon.
- **Required resources:** Trusted stewards, contact channels, local knowledge, moderation rules, and time for follow-up.
- **Main advantage:** Resolves ambiguity using human judgment and local context.
- **Main weakness:** Expensive in staff time and slow when the reviewer is unavailable; reviewer judgments may vary.
- **Hackathon feasibility:** **Medium.** A moderator workflow can be role-played; real local coverage cannot be established during the event.
- **Real-world feasibility:** **Medium to low.** Coverage and accountability require ongoing organization.

### N9 — Distinguish current, supported information from old or repeated claims

**Quick summary:** The traveller needs evidence that is fresh enough to matter and support that is not merely copied. Options range from a human review process to automatic checks on timestamps and duplication.

#### N9-A — Time-limited human confirmation process

- **Need:** Know whether an earlier incident report remains relevant.
- **Intervention concept:** Ask the original reporter or a later witness to confirm, revise, or resolve a report after a defined interval.
- **How it would work:** Reviewers check the observation time and request a new direct observation; if no update arrives, mark the status as unknown or stale rather than assuming the road is clear.
- **Required resources:** Reporter contact, review schedule, moderation staff, and clear distinctions among active, resolved, and unverified.
- **Main advantage:** A human can interpret context and distinguish changed conditions from missing updates.
- **Main weakness:** Follow-up consumes time; non-response cannot show whether an incident ended.
- **Hackathon feasibility:** **High for a simulated report timeline.**
- **Real-world feasibility:** **Medium to low.** Depends on reliable follow-up and moderation capacity.

#### N9-B — Timestamp and duplicate checking

- **Need:** Avoid treating an old or copied claim as a fresh independent observation.
- **Intervention concept:** Apply transparent rules to observation time and compare reports for likely duplication.
- **How it would work:** A rule-based process flags reports with old observations or matching location/text/time. Reviewers distinguish confirmed independent reports from likely repeats.
- **Required resources:** Report timestamps, consistent location labels, simple matching rules, and human review of uncertain matches.
- **Main advantage:** Makes obvious age and copy patterns easier to detect at scale.
- **Main weakness:** Similar independent reports may be incorrectly merged; copied reports can be altered to evade matching. Age does not prove resolution.
- **Hackathon feasibility:** **High.** Simple rules and labelled examples are easy to demonstrate.
- **Real-world feasibility:** **Medium.** Requires careful rules and appeal/correction handling.

## 3. Important needs

**Quick summary:** These needs make options easier to compare, find, and trust. Some approaches organize information; others change how people provide it.

### N1 — Compare complete journeys against personal priorities

**Quick summary:** Commuters need understandable comparisons across cost, duration, and transfers. A person can do the comparison manually from verified information, or a rules-based process can calculate it.

#### N1-A — Human travel desk or trained travel helpers

- **Need:** Compare usable journey alternatives against the traveller’s stated priorities.
- **Intervention concept:** Trained staff or volunteers help passengers compare route information across available sources.
- **How it would work:** The traveller explains the trip and constraints; the helper checks transport references and walks through the trade-offs.
- **Required resources:** Trained helpers, reference material, accessible service locations, and regular updates.
- **Main advantage:** Handles unusual questions and can explain trade-offs directly.
- **Main weakness:** Staffed help is costly, limited in hours and locations, and can vary by helper.
- **Hackathon feasibility:** **High as a service blueprint or role-play; low as a staffed citywide service.**
- **Real-world feasibility:** **Medium to low.** Depends on staffing and accurate reference material.

#### N1-B — Deterministic journey comparison

- **Need:** Compare known journeys on common measures without arithmetic mistakes.
- **Intervention concept:** A rule-based method calculates cost, estimated time, and transfer count from a verified set of known connections.
- **How it would work:** Compare only connections with known endpoints and conditions; display assumptions and leave unknown values visibly unknown.
- **Required resources:** A maintained connection list, fare/time assumptions, comparison rules, and verification.
- **Main advantage:** Repeatable calculations and transparent ranking logic.
- **Main weakness:** Missing or outdated inputs produce neatly calculated but misleading results; real-time conditions may be unavailable.
- **Hackathon feasibility:** **High for a bounded, disclosed network.**
- **Real-world feasibility:** **Medium.** Data maintenance is the main ongoing cost.

### N2 — Identify the correct boarding and transfer location

**Quick summary:** A name alone may not identify the correct roadside point or entrance. Alternatives include local wayfinding knowledge and standardized physical signs.

#### N2-A — Peer wayfinding and local landmark knowledge

- **Need:** Find the correct boarding point and direction.
- **Intervention concept:** Experienced commuters, community volunteers, or existing station staff provide verified landmark directions.
- **How it would work:** Directions use recognizable nearby landmarks and distinguish direction, street side, and entrance; travellers can report confusing descriptions.
- **Required resources:** Local contributors, fact-checking visits, shared place names, and revision responsibility.
- **Main advantage:** Uses familiar descriptions that match how people navigate locally.
- **Main weakness:** Knowledge can vary by person and become stale when stops move.
- **Hackathon feasibility:** **High for a few reviewed examples.**
- **Real-world feasibility:** **Medium.** Requires ongoing local review.

#### N2-B — Physical wayfinding standards

- **Need:** Identify boarding points without needing to ask several people.
- **Intervention concept:** Operators or local authorities adopt consistent stop names, direction signs, and visible boarding markers.
- **How it would work:** Each recognized stop has standardized naming and directional cues that are consistent with operator announcements and printed material.
- **Required resources:** Authority/operator approval, sign design, manufacturing, installation, upkeep, and accessible placement.
- **Main advantage:** Helps people who do not have a smartphone or internet connection.
- **Main weakness:** Physical changes cost money and may be delayed, damaged, blocked, or inconsistently adopted.
- **Hackathon feasibility:** **Low as an installation; high as a paper prototype or location audit.**
- **Real-world feasibility:** **Medium to low.** Requires permissions, funding, and maintenance.

### N4 — Understand waiting and arrival uncertainty

**Quick summary:** A traveller needs to decide whether to wait or change plans. This can be addressed through operational staff communication or measured service observation.

#### N4-A — Existing dispatch or station announcements

- **Need:** Learn whether the service is expected, delayed, or unavailable.
- **Intervention concept:** Operators and station staff provide timely status updates through existing signs, announcements, or staff channels.
- **How it would work:** Dispatch information is relayed with a timestamp and clear caveat when arrival time is uncertain.
- **Required resources:** Operator coordination, dispatch visibility, staff procedures, and announcement channels.
- **Main advantage:** Uses operational knowledge rather than inferring service status from general traffic.
- **Main weakness:** Requires timely operator information and may not cover informal or independent services.
- **Hackathon feasibility:** **Medium as a simulated notice process; low for a live feed.**
- **Real-world feasibility:** **Medium**, subject to operator systems and participation.

#### N4-B — Manual arrival observation

- **Need:** Understand observed service frequency and waiting variation where live dispatch data is absent.
- **Intervention concept:** Observers record service arrivals at selected stops over time.
- **How it would work:** Repeated observations produce a typical interval and variation by location and time period, clearly marked as historical rather than a live prediction.
- **Required resources:** Observers, recording templates, enough observations, and periodic repetition.
- **Main advantage:** Can establish a useful baseline without connecting to operator systems.
- **Main weakness:** It cannot tell an individual commuter when the next vehicle will arrive; conditions may change.
- **Hackathon feasibility:** **High for analysis of supplied sample observations; low for collecting representative city data.**
- **Real-world feasibility:** **Medium.** Observation coverage takes sustained effort.

### N5 — Understand the financial exposure of a variable-fare connection

**Quick summary:** Variable fares need to be described honestly. Alternatives include reporting observed price ranges or helping passengers agree on the price before committing.

#### N5-A — Condition-tagged fare survey

- **Need:** Understand how connector prices vary with place, time, and conditions.
- **Intervention concept:** Collect fare quotes and payments with context, then summarize distributions rather than claiming a fixed price.
- **How it would work:** Analysts group comparable trips and show sample counts, typical ranges, dates, and known limitations.
- **Required resources:** Survey design, participants, analysis, privacy practices, and repeated data collection.
- **Main advantage:** Quantifies uncertainty instead of hiding it behind one number.
- **Main weakness:** Historical samples may not predict the next quote and can overrepresent particular passengers or areas.
- **Hackathon feasibility:** **High for a synthetic or tiny clearly labelled dataset; low for statistically reliable ranges.**
- **Real-world feasibility:** **Medium.** Requires regular, representative participation.

#### N5-B — Fare agreement and receipt practice

- **Need:** Reduce disagreement between quoted and paid connector prices.
- **Intervention concept:** Drivers and passengers agree on a price or range before departure and receive a simple written or digital record.
- **How it would work:** Existing transport groups encourage a clear pre-trip quote, destination confirmation, and receipt or reference if a dispute arises.
- **Required resources:** Driver/passenger agreement, accessible recording method, dispute channel, and fair process for both parties.
- **Main advantage:** Addresses surprise at the point of payment rather than trying to predict every fare.
- **Main weakness:** Agreement may be difficult in urgent conditions; it does not establish that the quote is affordable or fair.
- **Hackathon feasibility:** **High as a process demonstration; low for real adoption.**
- **Real-world feasibility:** **Medium to low.** Depends on operator practices and enforcement/mediation.

### N10 — Make a reasoned choice when sources disagree

**Quick summary:** Disagreement should be handled by comparing evidence and context. Alternatives include a human mediator or explicit evidence rules.

#### N10-A — Local moderator or transport information steward

- **Need:** Understand why sources disagree and what remains unknown.
- **Intervention concept:** A trained person reviews conflicting accounts and records their basis and observation times.
- **How it would work:** The steward contacts sources where possible, separates direct observation from hearsay, and reports an unresolved status when evidence is insufficient.
- **Required resources:** Trained reviewers, communication channels, impartiality guidance, and escalation responsibility.
- **Main advantage:** Human judgment can understand context and nuanced explanations.
- **Main weakness:** Slow and costly; different reviewers can reach different conclusions.
- **Hackathon feasibility:** **High as a moderator exercise; low as continuously staffed coverage.**
- **Real-world feasibility:** **Medium to low.** Requires accountability and sustained staffing.

#### N10-B — Published evidence and confidence rules

- **Need:** Decide how much weight to give each account without treating popularity as proof.
- **Intervention concept:** Define transparent rules for direct observation, age, location precision, and independent confirmation.
- **How it would work:** A rules-based process labels what is supported and what is uncertain; it does not automatically resolve contradictory facts.
- **Required resources:** Agreed definitions, example cases, rule review, and a route for corrections.
- **Main advantage:** Decisions are more consistent and explainable.
- **Main weakness:** Badly chosen rules can systematically mislead; context may not fit preset categories.
- **Hackathon feasibility:** **High.** Rules and sample cases can be reviewed in the event.
- **Real-world feasibility:** **Medium.** Requires governance and ongoing revision.

## 4. Secondary need

**Quick summary:** Repeated explanation is a real burden, but preserving current, correct context matters more than reducing every question. These alternatives differ in whether continuity is handled by a person or maintained information.

### N11 — Avoid repeating information that is still valid

**Quick summary:** A traveller may repeat destination or constraints across steps. A handoff record or a human travel companion can reduce repetition in different settings.

#### N11-A — Shared journey note at service handoffs

- **Need:** Carry still-valid travel details from one interaction to the next.
- **Intervention concept:** A concise paper or digital journey note records destination, constraints, and confirmed journey parts for the passenger or next helper.
- **How it would work:** The traveller reviews and corrects the note at each handoff; observations that can expire are dated.
- **Required resources:** Common note format, passenger consent, suitable handoff process, and protection of personal details.
- **Main advantage:** Works across separate people or services and can be paper-based.
- **Main weakness:** The note may be lost or outdated, and passengers must still review it.
- **Hackathon feasibility:** **High as a paper or screen mock-up.**
- **Real-world feasibility:** **Medium.** Depends on uptake, handoffs, and careful handling of personal information.

#### N11-B — Assisted journey continuity

- **Need:** Continue help without asking a traveller to explain known details again.
- **Intervention concept:** A designated travel helper or companion follows the journey context and confirms changes with the passenger.
- **How it would work:** At each change, the helper repeats back the next destination and relevant constraints before coordinating the next step.
- **Required resources:** Companion/helper availability, training, communication method, and boundaries on authority and privacy.
- **Main advantage:** Handles corrections and ambiguity through direct conversation.
- **Main weakness:** Labour-intensive and difficult to scale; may reduce traveller independence if poorly designed.
- **Hackathon feasibility:** **High as a role-play; low as an available service.**
- **Real-world feasibility:** **Low to medium**, depending on user group and staffing model.

## 5. Comparison boundaries and evidence gaps

**Quick summary:** Each approach has different costs, authority needs, and evidence requirements. A demonstration can show a process or calculation, but it cannot establish citywide accuracy or adoption.

| Question for later comparison | Why it matters |
|---|---|
| Who owns and updates each fact? | Unowned information becomes stale |
| What is observed directly, and what is inferred? | Prevents estimates from appearing certain |
| How does a user correct a wrong record or report? | Prevents errors becoming permanent |
| Which groups or locations remain uncovered? | Avoids claiming universal service from a small sample |
| What personal information is necessary? | Travel and report history can be sensitive |
| Who pays for staff, signs, sensors, and maintenance? | Upfront demonstrations omit continuing costs |
| Can a proposed measurement actually answer the travel question? | Rain or water depth alone does not establish service availability |

**Decision:** Evaluate alternatives later against user evidence, event time, resource access, safety, and whether multiple approaches support one coherent journey. No winner is selected here.

**Unknown:** We have no confirmed access to transport agencies, operator data, sensors, staff, public survey participants, or installation permissions. These gaps limit claims about real-world readiness.
