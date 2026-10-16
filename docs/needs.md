- **Decision:** Translate the ten workflow failures, plus their repeated checking burden, into needs rather than product features.
- **Critical needs:** Establish whether a journey is usable, affordable, and supported by sufficiently current and relevant evidence.
- **Important needs:** Make journey comparisons, boarding, waiting, variable prices, and conflicting advice understandable.
- **Secondary need:** Reduce repeated effort once the traveller can make a sound decision.
- **Unknown:** Failure frequency and affected population sizes are not measured. These priorities are provisional judgments about consequences, not organizer scoring weights.

# User and system needs

## 1. Scope and evidence

**Quick summary:** A need describes what someone must be able to achieve, regardless of how it is delivered. A system need describes a condition the supporting information or process must satisfy.

**Fact:** [The problem decomposition](decomposed_problem.md) records the organizer's concerns about fragmented transport information, fare uncertainty, disruptions, and unreliable reports.

**Inference:** The current-workflow analysis in the preceding chat reconstructed how travellers may use experience, advice, transport staff, notices, maps, and social posts. Its failure IDs F1–F10 are retained here for traceability, meaning that each need can be traced back to the failure that motivated it.

**Decision:** Each entry uses the requested chain: Failure → Root cause → User affected → User need → Desired outcome. A priority and its reasoning follow the chain. Supporting system conditions are included without selecting a tool or implementation.

**Unknown:** Root causes inferred from the workflow remain hypotheses. No new field research or current fare verification was performed for this document.

## 2. How priorities are assigned

**Quick summary:** A need is more urgent when failure can prevent the journey, break a hard budget limit, or expose someone to harm. Convenience matters, but comes after a decision is usable and honest about uncertainty.

| Rank | Meaning | Reasoning |
|---|---|---|
| **Critical** | Failure can invalidate the journey or cause serious financial or physical consequences | A commuter cannot reasonably rely on a journey that is disconnected, unaffordable under a stated limit, or based on misleading incident evidence |
| **Important** | Failure causes meaningful effort, delay, expense, or confusion, while recovery is often possible | These needs affect the quality and practicality of the journey even when it remains usable |
| **Secondary** | The journey remains understandable and usable, but unnecessary effort remains | Reducing repetition matters after correctness, relevant constraints, and uncertainty are addressed |

**Assumption:** A traveller may have a firm spending limit or arrival deadline. These limits must be established rather than assumed for every person.

**Decision:** Rank the underlying need, not every occurrence of the failure. An Important need may become Critical for a particular person, such as someone facing the last available service or unable to walk an extra distance.

**Decision:** User-need priority is separate from organizer compliance and implementation order. A required language interaction does not become optional because reducing repetition is ranked Secondary.

## 3. Needs ranked Critical

**Quick summary:** These needs protect whether a journey can be completed under the traveller's stated constraints. They also protect decisions from unsupported or outdated claims.

### N3 — Understand whether the whole journey fits the available budget

**Failure (F3):** Expected fare and actual payment do not match.

→ **Root cause:** **Fact from the brief:** fare rules differ across transport modes and student eligibility. **Inference:** incomplete totals, misunderstood conditions, or outdated prices can create mismatches.

→ **User affected:** Students and other travellers with limited money; transport staff involved in fare disagreements.

→ **User need:** Know the expected total cost of all journey parts, which concessions apply, and which costs remain uncertain before committing money or travel time.

→ **Desired outcome:** The traveller can distinguish a journey that fits their stated budget from one that may exceed it, without assuming a discount applies everywhere.

**Priority: Critical.** A cost error can prevent completion for a person with a firm budget. This does not imply that every small fare disagreement has severe consequences.

**Supporting system need:** Fare statements must use applicable rules, cover every paid part, and distinguish supported prices from estimates. A range crossing the budget limit cannot honestly be called certainly affordable.

### N6 — Know that consecutive journey parts form a practical connection

**Failure (F6):** A completed first part is followed by an unavailable, inaccessible, or impractical transfer.

→ **Root cause:** **Inference:** individual services may be described separately without establishing the place, time, walking effort, and availability required to connect them.

→ **User affected:** Travellers changing vehicles, especially unfamiliar passengers and people with mobility limitations.

→ **User need:** Understand whether the complete sequence of travel parts can be followed under their known circumstances.

→ **Desired outcome:** The traveller avoids a journey whose individual parts exist but cannot reasonably be connected; unknown transfer conditions remain explicit.

**Priority: Critical.** One unusable connection can invalidate the entire journey and leave the passenger stranded.

**Supporting system need:** Journey claims must refer to real, connected services. Unverified operating or access conditions must not be presented as guaranteed availability.

### N7 — Reassess a journey when conditions change

**Failure (F7):** A commuter discovers a serious disruption only after committing to the affected journey.

→ **Root cause:** **Fact from the brief:** street conditions change. **Inference:** relevant information may arrive late, be unavailable, or not reach the traveller.

→ **User affected:** Passengers and drivers, with greater consequences for people with urgent commitments or limited mobility.

→ **User need:** Understand how a relevant disruption changes the possibility, cost, time, and practical risks of continuing.

→ **Desired outcome:** The traveller can make an informed choice to continue, wait, change direction, or abandon the journey, including recognising when no alternative is known.

**Priority: Critical.** A disruption can prevent completion or expose someone to hazardous conditions.

**Supporting system need:** Distinguish slowing conditions from unusable connections, and acknowledge uncertainty. Absence of a report is not evidence that a route is safe.

### N8 — Understand whether an incident report applies to this journey

**Failure (F8):** A report names a general area but leaves its exact relevance unclear.

→ **Root cause:** **Inference:** descriptions may omit the affected road, direction, transport mode, or observation time.

→ **User affected:** Travellers interpreting reports and people answering repeated clarification questions.

→ **User need:** Know what happened, where and when it was observed, and whether it affects the journey they are considering.

→ **Desired outcome:** The traveller can distinguish a relevant disruption from a nearby but unrelated incident, or recognise that relevance cannot yet be established.

**Priority: Critical.** Applying a report to the wrong connection can invalidate a travel decision even if the report itself is true.

**Supporting system need:** Information must retain the context needed for interpretation; missing details must remain unknown rather than being guessed into certainty.

### N9 — Distinguish current, supported information from old or repeated claims

**Failure (F9):** An ended incident remains influential, or repeated versions of one account appear to be independent confirmation.

→ **Root cause:** **Fact from the brief:** reports become outdated. **Inference:** forwarding separates reports from their observation time, source, and later corrections.

→ **User affected:** Travellers making decisions and people whose accurate updates are overshadowed by older claims.

→ **User need:** Judge whether an incident is still relevant and whether apparent support comes from separate observations.

→ **Desired outcome:** Old or copied claims do not create unjustified confidence, and uncertainty about the current street condition remains visible.

**Priority: Critical.** Misleading freshness or false confirmation can cause unnecessary detours or false reassurance about a disruption.

**Supporting system need:** Distinguish observation time from publication time and repeated claims from independent evidence. An old report losing credibility does not prove that the incident has ended.

## 4. Needs ranked Important

**Quick summary:** These needs reduce avoidable confusion and help travellers choose between workable options. Their urgency increases when the traveller has fewer alternatives.

### N1 — Compare complete journeys against personal priorities

**Failure (F1):** The commuter cannot confidently compare complete journeys.

→ **Root cause:** **Fact from the brief:** information is fragmented. **Inference:** the commuter must assemble separate services and compare incomplete options using local knowledge.

→ **User affected:** Unfamiliar travellers and people balancing budget, arrival time, and vehicle changes.

→ **User need:** Understand the relevant differences between complete journey options and how each fits their stated priorities.

→ **Desired outcome:** The traveller can explain why one option suits them better and recognise when no known option meets all stated limits.

**Priority: Important.** Better comparison improves decisions, but a traveller may still complete a journey using one known workable option. Respecting a firm budget or other essential limit remains Critical under N3 and N6.

**Supporting system need:** Keep cost, time, and transfer claims comparable and distinguish firm constraints from preferences. Do not silently ignore a requested limit.

### N2 — Identify the correct boarding and transfer location

**Failure (F2):** A place name does not lead the traveller to the actual boarding point.

→ **Root cause:** **Inference:** local names and general area descriptions may omit road side, direction, entrance, or physical boarding location.

→ **User affected:** First-time travellers, visitors, and people for whom extra walking is difficult.

→ **User need:** Recognise where to board, the direction of travel, and whether the service goes towards the intended destination.

→ **Desired outcome:** The traveller reaches the intended boarding point without unnecessary backtracking or boarding the wrong service.

**Priority: Important.** Many mistakes can be corrected, although the need becomes Critical where access limitations or a last service make recovery impractical.

**Supporting system need:** Location descriptions must distinguish places that share similar names and acknowledge uncertain boarding details.

### N4 — Understand waiting and arrival uncertainty

**Failure (F4):** The commuter cannot tell whether to keep waiting or change plans.

→ **Root cause:** **Inference:** uncertain operations, congestion, capacity, or unavailable current information make waiting difficult to judge.

→ **User affected:** People with arrival deadlines and those who cannot wait comfortably for long periods.

→ **User need:** Understand what is known about service availability and likely delay, including the limits of any estimate.

→ **Desired outcome:** The traveller can make a reasoned wait-or-change decision without mistaking an uncertain time for a promise.

**Priority: Important.** Uncertain waiting causes meaningful delays. It may become Critical near the end of service or when a consequential deadline is involved.

**Supporting system need:** Separate travel duration from waiting time and distinguish unavailable information from unavailable transport.

### N5 — Understand the financial exposure of a variable-fare connection

**Failure (F5):** A connector journey costs substantially more than the traveller expected.

→ **Root cause:** **Fact from the brief:** weather and rush-hour conditions can change connector costs. **Inference:** availability, trip difficulty, and negotiation also affect a quote.

→ **User affected:** Budget-constrained passengers and drivers undertaking more difficult journeys.

→ **User need:** Understand the plausible cost variation and remaining uncertainty before agreeing to the journey.

→ **Desired outcome:** The passenger can accept or reject the cost with fewer surprises, without treating an estimate as a guaranteed price or every higher quote as misconduct.

**Priority: Important.** Variable prices are not inherently a failure. Unexpected exposure becomes Critical when it breaks the whole-journey spending limit covered by N3.

**Supporting system need:** Price claims must state their relevant conditions and must not imply that an estimate binds a driver.

### N10 — Make a reasoned choice when sources disagree

**Failure (F10):** Conflicting advice leaves the traveller unsure whom to trust.

→ **Root cause:** **Inference:** sources may refer to different times or places, have different knowledge, repeat hearsay, or have different incentives.

→ **User affected:** Travellers making the decision and legitimate information providers whose accounts are dismissed.

→ **User need:** Understand the basis of conflicting claims and which uncertainty remains unresolved.

→ **Desired outcome:** The traveller can explain why they rely on an account, or choose not to rely on any account when evidence is insufficient.

**Priority: Important.** This supports informed judgment across the journey. Its current-condition and safety consequences are already covered by Critical needs N7–N9.

**Supporting system need:** Distinguish direct observations from hearsay and supported facts from interpretations. Popularity and confidence of wording do not establish truth.

## 5. Need ranked Secondary

**Quick summary:** Repeated checking consumes effort, but removing repetition must not erase necessary verification. This is a separate burden shared by several existing failure points.

### N11 — Avoid repeating information that is still valid

**Failure (shared across F1, F6, and F8):** The traveller repeatedly explains the same destination, constraints, or incident question to make progress.

→ **Root cause:** **Inference:** separate conversations and journey stages do not share the traveller's context, so relevant details must be reconstructed.

→ **User affected:** Travellers making several changes and people repeatedly answering the same questions.

→ **User need:** Continue a travel decision without unnecessarily restating already established details, while being able to correct them when circumstances change.

→ **Desired outcome:** Less repeated explanation and checking, without silently carrying an outdated destination, budget, or incident assumption into a later decision.

**Priority: Secondary.** Repetition is usually an effort cost once the underlying decision is correct. If language or communication barriers prevent the person from conveying an essential constraint at all, that is a more serious need and should be reassessed.

**Supporting system need:** Previously established context must not be treated as permanently correct. Changes and uncertainty must remain possible.

## 6. Priority overview and boundaries

**Quick summary:** The rankings show consequence-based urgency, not feature scope or a promise to solve transport operations. Several needs depend on information that may not be available.

| Need | Failure link | Rank | Main reason |
|---|---|---|---|
| N3: Whole-journey affordability | F3 | Critical | Unexpected costs can prevent completion |
| N6: Practical connections | F6 | Critical | One failed connection can invalidate the journey |
| N7: Reassess after disruption | F7 | Critical | Changed conditions can block travel or create risk |
| N8: Incident relevance | F8 | Critical | A true report applied to the wrong journey still misleads |
| N9: Freshness and independent support | F9 | Critical | Old or repeated claims can create false confidence |
| N1: Compare complete options | F1 | Important | Improves choices between usable journeys |
| N2: Find the correct boarding place | F2 | Important | Prevents avoidable mistakes and extra walking |
| N4: Understand waiting uncertainty | F4 | Important | Supports meaningful wait-or-change decisions |
| N5: Understand variable costs | F5 | Important | Reduces unexpected financial exposure |
| N10: Interpret conflicting advice | F10 | Important | Supports justified trust rather than guesswork |
| N11: Reduce unnecessary repetition | F1, F6, F8 | Secondary | Reduces effort after essential correctness is protected |

**Decision:** Keep N3 and N5 separate: N3 concerns total affordability, while N5 concerns uncertain prices within that total. Likewise, N8 concerns relevance, N9 concerns age and support, and N10 concerns disagreement between accounts.

**Inference:** Commuters also need available vehicles, usable roads, and fair treatment. An information problem does not explain every transport failure, and better information alone cannot guarantee these conditions.

**Unknown:** The evidence does not justify numerical targets for acceptable cost error, waiting uncertainty, report age, or transfer effort. Those targets require user research and relevant source data.

## 7. Supporting evidence and validation gaps

**Quick summary:** These checks would establish whether each proposed need reflects a meaningful real burden. They are research questions, not product requirements or implementation contracts.

| Need | Evidence that would strengthen or change the ranking |
|---|---|
| N1 | Observe unfamiliar-trip planning; compare considered options with independently checked journeys |
| N2 | Record wrong boarding locations, clarification requests, and added walking during accompanied journeys |
| N3 | Compare expected and paid totals with applicable fare rules, eligibility, and the traveller's actual budget |
| N4 | Record expected versus actual waits; distinguish information gaps from capacity and service shortages |
| N5 | Compare connector quotes and payments for the same places under recorded time and weather conditions |
| N6 | Follow complete journeys; record transfer distance, availability, extra payments, and abandoned connections |
| N7 | Compare incident start times, information availability, traveller awareness, and consequences |
| N8 | Test whether independent readers interpret a report's location, time, direction, and affected mode consistently |
| N9 | Trace original observations, copied reports, later corrections, and actual street conditions |
| N10 | Compare conflicting accounts with independently established events and travellers' trust decisions |
| N11 | Count repeated explanations and time spent; establish whether repetition causes inconvenience or prevents completion |

**Fact:** The prior workflow analysis included reporting of weather-related price increases and an announced e-ticketing initiative. Neither establishes the prevalence of all failures, and an announced rollout does not establish complete implementation.

**Source boundary:** The main source is [decomposed_problem.md](decomposed_problem.md), especially sections 5–7, 10, and 13. Failure IDs and their current-workflow interpretation come from the preceding chat. No new external claims are asserted here.

**Decision:** Revisit these priorities if evidence shows different frequency, consequences, recovery options, or affected groups. No product features, technology choices, schemas, or API contracts are selected in this document.
