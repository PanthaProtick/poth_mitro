- **Fact:** The challenge concerns travel in Dhaka across several transport modes, changing fares, and changing street conditions.
- **Fact:** The statement requires five connected areas: information management, trip search, fares and rerouting, validation, and conversation.
- **Fact:** The official build duration is 5 hours 40 minutes. A local or online working prototype is allowed.
- **Unknown:** Data sources, acceptable estimation error, report reliability thresholds, and scoring weights are not defined.
- **Decision:** This document explains the problem and its boundaries only. It does not select an intervention, architecture, or technology.

# Hackathon problem decomposition

## 1. One-sentence plain-English problem

**Quick summary:** People travelling in Dhaka struggle to choose a usable, affordable journey because transport information, fares, and street conditions are scattered, change quickly, and may be unreliable.

**Fact:** This restates the organizers' problem framing. It is not an independently verified claim about every existing navigation service.

## 2. Explanation for a first-year university student

**Quick summary:** A journey may involve several vehicles, and each part has different costs and risks. Finding a route on a map does not establish that the whole journey is affordable or usable now.

Imagine a student travelling from Mirpur to Motijheel. They might use a rickshaw to reach a station, take the metro, and walk the final distance. Another journey might use buses.

The student needs to know:

- Which connections actually exist?
- Where should they board and change vehicles?
- What will each part cost, and where does a student discount apply?
- Does rain or a blocked intersection make a connection unusable?
- Is a reported blockage still active, or is the information old or mistaken?

**Assumption for illustration:** This example explains the decision a commuter faces. It does not establish a particular service, fare, or disruption as real.

**Fact:** The challenge also asks commuters to express these needs in ordinary English or Banglish and continue the conversation without repeating all earlier details.

## 3. Target users

**Quick summary:** Commuters are the primary users. Administrators also have explicitly required work, while some commuters contribute street information.

| User | Need or task | Evidence status |
|---|---|---|
| Commuters using multiple transport modes | Find usable journeys and compare costs, time, and vehicle changes | Fact: explicit |
| Student commuters | Understand applicable half-fares and minimum charges | Fact: explicit fare requirement |
| Commuters reporting street conditions | Submit, confirm, or mark reports resolved | Fact: explicit |
| Administrators | Maintain the route network and moderate reports | Fact: explicit |
| English/Banglish speakers | Ask trip questions and contextual follow-ups | Fact: explicit |

**Inference:** Cost-sensitive and unfamiliar travellers may benefit especially, but the statement does not identify them as exclusive target groups.

## 4. Other stakeholders

**Quick summary:** Several groups influence transport information or may be affected by it. The statement does not require partnerships with these groups.

| Stakeholder | Possible interest | Evidence status |
|---|---|---|
| Organizers and judges | Assess the working prototype and its explanation | Fact: deliverables and presentation |
| Bus, metro, and leguna operators | Correct representation of services and fares | Inference |
| Rickshaw and CNG drivers | Fair representation of variable connector costs | Inference |
| Traffic and road authorities | Accurate descriptions of restrictions and disruptions | Inference |
| Educational institutions | Student discount eligibility and commuter needs | Inference |
| People near a reported incident | Effects of inaccurate or misleading location reports | Inference |

**Unknown:** No official data provider, transport partner, or authority integration is named as mandatory.

## 5. What exactly goes wrong

**Quick summary:** The problem is a chain of mismatches between a planned journey and what the commuter can actually do. Unreliable information can affect every stage.

| Failure | Concrete meaning | Evidence status |
|---|---|---|
| Incomplete transport coverage | A journey crosses services that are not represented together | Fact: organizer framing |
| Wrong fare expectation | Student rules or variable connector prices are missed | Fact: explicit |
| Route becomes unusable | Waterlogging or a blockade breaks a connection | Fact: explicit |
| Old information looks current | A social post or report no longer describes the street | Fact: explicit |
| Incorrect reports influence decisions | An unverified or contradictory report changes a journey | Fact: explicit concern |
| Invented travel advice | A suggested bus, station, connection, or fare does not exist in the stored network | Fact: explicit concern |
| Combined needs are misunderstood | A request such as avoiding an intersection while staying within budget is reduced to simple keywords | Fact: requirement addresses this failure |

**Inference:** Even individually correct facts can produce a bad journey if they refer to different times or cannot form a connected trip.

## 6. Why it happens / possible root causes

**Quick summary:** The statement identifies fragmented services and fast-changing conditions. Other plausible causes need investigation rather than being treated as proven.

**Fact: Causes described by the organizers**

- Existing navigation platforms are framed as better suited to private vehicles and predictable transit schedules.
- Dhaka travel combines buses, MRT-6, legunas, and connector rickshaws.
- Student fare rules and weather-related connector prices complicate cost estimates.
- Waterlogging and intersection blockades change route availability.
- Commuter information is scattered across posts that become outdated quickly.
- Crowd reports can be inaccurate, and language models can invent route details.

**Inference: Possible additional causes**

- Different operators may describe stops and services differently.
- A landmark may have several spellings or local names.
- A report may lack enough location or time detail to interpret it.
- People may have limited incentives to return and mark an incident resolved.
- Negotiated fares may vary even for similar journeys.

**Unknown:** The PDF provides no field study, commuter survey, incident dataset, or measured contribution of each cause.

## 7. Consequences

**Quick summary:** The immediate consequences are uncertain journeys, costs, and delays. Broader effects are plausible but are not measured in the statement.

- **Fact:** Commuters depend on scattered, quickly outdated information under the organizers' framing.
- **Inference:** They may spend more than planned or abandon an otherwise useful journey.
- **Inference:** They may miss classes, work, or appointments after an unexpected detour.
- **Inference:** A wrong report may steer people away from a usable connection.
- **Inference:** A stale reassurance may send someone towards an active disruption.
- **Inference:** Repeated incorrect advice may reduce trust in later, correct information.
- **Unknown:** The scale of these effects, including money lost or time wasted, is not quantified.

## 8. Explicit constraints stated by organizers

**Quick summary:** The challenge fixes the time limit, fairness rules, major capabilities, and deliverables. Examples and optional bonuses should not be mistaken for universal requirements.

| Constraint | Exact practical meaning | Source |
|---|---|---|
| Theme and location | Smart City; transit and street conditions tailored to Dhaka | Page 1 |
| Build duration | 5 hours 40 minutes | Page 1 |
| Presentation | 4–5 minutes of demonstration plus 2 minutes of questions | Pages 1 and 3 |
| Open technology stack | No single framework or programming language is prescribed | Page 1 |
| Free-stack framing | Paid APIs or credit-card-gated services are not required or rewarded | Page 1 |
| Paid map prohibition | Paid map services must not be used | Page 1 |
| Map representation options | Free mapping or an interactive schematic covering 12–15 major hubs is allowed | Page 1 |
| Language-model restriction | Free-tier APIs or local models must be used | Page 1 |
| Optional media tools | Browser-native or free open-source tools should be used for bonus media/speech work | Page 1 |
| Information categories | Data must be organized under Transit Network or Street Alerts | Page 2, Part 1 |
| Route metadata | Include mode, origin/destination, base BDT fare, student eligibility, and estimated travel time | Page 2, Part 1 |
| Natural-language access | Trip search supports English or Banglish; chat explicitly supports English and Banglish | Pages 2–3, Parts 2 and 5 |
| Fare rules | Account for 50% bus student discount, BDT 10 minimum bus fare, and modes without student passes | Page 2, Part 3 |
| Variable connector costs | Provide estimated ranges and distinguish baseline from rush-hour/weather surge rates | Page 2, Part 3 |
| Interactive disruption | Users can trigger scenarios; affected journeys are recalculated with updated costs and times | Page 2, Part 3 |
| Validated information | Check route grounding, report corroboration/age, unrealistic fares, and contradictory reports | Pages 2–3, Part 4 |
| Conversation context | Chat retains context and accompanies a core visual interface | Page 3, Part 5 |
| Working prototype | Online deployment or local demonstration is acceptable | Page 3 |
| Source and explanation | GitHub source developed during the session, setup instructions, architecture/routing/AI explanation | Page 3 |

**Unknown:** The free-stack wording does not fully define how existing paid accounts, hosting plans, or credit-card-gated free hosting are treated. The prohibition on paid maps and the free-tier/local language-model restriction are explicit.

## 9. Possible implicit constraints

**Quick summary:** Some practical limits follow from the setting, but they are not organizer rules. They should guide questions rather than become invented requirements.

| Possible limit | Why it might matter | Status |
|---|---|---|
| Limited build and integration time | Five substantial requirement groups share a short event | Inference |
| Limited or inconsistent source data | No official dataset or fare source is supplied in the PDF | Inference; absence from PDF is fact |
| Connectivity and service quotas | A demonstration may depend on network access or free service limits | Inference |
| Ambiguous place names | English/Banglish spelling may vary | Inference |
| Conflicting commuter goals | Cheapest, fastest, and fewest transfers may identify different journeys | Inference |
| Abuse and privacy concerns | Reports can be manipulated or reveal travel information | Inference |
| Short explanation window | Judges need to see the required behavior within a 4–5 minute demo | Inference |

**Fact from team context, not the PDF:** The team has three available members after excluding Partha. The user requires deployment and real persistence/authentication where needed. These are separate project constraints, not organizer requirements.

## 10. What organizers actually expect participants to achieve

**Quick summary:** The explicit goal is a working prototype that connects transit information, journey decisions, changing conditions, and information reliability. A conversation-only demonstration would not cover the full statement.

| Required achievement | Behavior the statement asks participants to demonstrate |
|---|---|
| Maintain and browse transport information | Administrators maintain the network and moderate reports; commuters inspect routes and conditions |
| Understand constrained requests | Interpret more than keywords, including budgets and places to avoid |
| Find connected journeys | Return valid multi-leg options ranked by cost, estimated duration, and transfers |
| Explain costs | Compare regular/student fares and show uncertain connector costs as ranges |
| Respond to disruptions | Identify affected connections and produce a usable detour with updated estimates |
| Validate advice and reports | Check recommendations against stored transit facts; confirm, resolve, downgrade, or expire reports |
| Support conversation | Search, report incidents, request alternatives, and answer contextual follow-ups in English/Banglish |
| Deliver and explain | Provide working software, session-developed GitHub source, setup instructions, and a live demonstration |

**Inference:** Judges are likely to need visible evidence of these behaviors. No scoring weights or pass thresholds are supplied, and the user confirms no additional judging criteria are available.

## 11. Ambiguous phrases and simple meanings

**Quick summary:** Much of the terminology describes ordinary travel decisions. Several words sound precise even though their acceptance thresholds are undefined.

| Term | Simple meaning | Remaining ambiguity |
|---|---|---|
| Multi-modal | Using different transport types | Required breadth across modes is not quantified |
| Hub | A place where a journey starts, ends, or changes transport | Exact location boundaries are unspecified |
| Route graph | Places and the travel connections between them | Required connection detail is unspecified |
| Multi-leg | A journey divided into connected parts | Maximum legs or transfers are unspecified |
| Metadata | Descriptive details, such as fare and transport type | Required fields are listed, but formats are not |
| CMS | Content management system: maintaining stored information and its current state | Editing depth and permissions are not fully defined |
| Banglish | Bengali expressed using English letters, often mixed with English | Accepted spelling and language range are unspecified |
| Intent extraction | Understanding what a person wants and their constraints | No benchmark or accuracy target is supplied |
| Multi-constraint | Considering several needs together | Priority when needs conflict is undefined |
| Dynamic fare estimation | Updating expected cost when conditions change | Surge amounts and evidence sources are undefined |
| Grounding | Checking advice against known stored transit facts | Stored facts may still be inaccurate in the real world |
| Hallucination | A model inventing details that are not supported | Required handling is described, but no test set is supplied |
| Corroboration | Other people supporting a report | Number and independence of confirmations are undefined |
| Decay | Reducing confidence in older information | Time limits and reduction rules are undefined |
| Sanity check | Rejecting or flagging obviously implausible information | Thresholds and contradiction rules are undefined |
| Live | Reflecting current or recently reported conditions | Required freshness is undefined |
| Accurate fare | A cost consistent with applicable fare rules and conditions | Real-world tolerance, rounding, and sources are undefined |
| Conversational context | Remembering enough earlier discussion to interpret follow-ups | Retention duration and scope are undefined |

## 12. Facts explicitly stated

**Quick summary:** These are facts about the written brief, not independent verification of Dhaka's transport conditions. This index points to the detailed explanations above without repeating them.

| Explicit statement group | Where explained | PDF location |
|---|---|---|
| Dhaka transport fragmentation and shortcomings of current information | Sections 1, 5, and 6 | Page 1, Problem Statement |
| Commuter and administrator responsibilities | Sections 3 and 10 | Page 1, System Overview |
| Timing, platform freedom, and free-service rules | Section 8 | Page 1 |
| Transit information, street alerts, and required metadata | Sections 8 and 10 | Page 2, Part 1 |
| Constrained language queries and ranked multi-leg journeys | Sections 8 and 10 | Page 2, Part 2 |
| Fare calculations and disruption simulation | Sections 8 and 10 | Page 2, Part 3 |
| Grounding, report confirmations/resolution, decay, and filtering | Sections 8 and 10 | Pages 2–3, Part 4 |
| English/Banglish conversation and retained context | Sections 8 and 10 | Page 3, Part 5 |
| Deliverables and separately labelled bonuses | Sections 8, 10, and 15 | Page 3 |

**Fact:** The brief describes a prototype challenge. It does not provide evidence that all requested capabilities can be completed to operational transport-service standards within the event.

## 13. Assumptions we might accidentally make

**Quick summary:** The biggest risks are treating estimates as verified facts and filling gaps in the rules without noticing. The following claims are not established by the PDF.

| Accidental assumption | Why it is unsafe |
|---|---|
| A complete, current transit dataset is available | No dataset or access method is supplied |
| Synthetic routes and fares are explicitly approved | The schematic allowance does not itself settle data authenticity |
| Every service offers a student discount | The statement explicitly distinguishes eligible and ineligible modes |
| The BDT 10 floor and rounding are fully specified | Per-boarding application, transfers, and rounding are not explained |
| A confirmation proves an incident is true | Several reports may come from the same person or repeat the same mistake |
| A recently submitted report describes a recent incident | Submission time and observation time can differ |
| Congestion, waterlogging, and blockage have identical effects | Some conditions slow a journey; others prevent it |
| Road disruption affects every nearby mode equally | The brief does not define mode-specific effects |
| A valid stored path is usable at any time | Operating hours and service availability are not specified |
| Lowest price also means best journey | Time and transfers can conflict with cost |
| A stored route fact is an authoritative real-world fact | Grounding checks consistency with the stored network, not external truth |
| Examples are exhaustive requirements | Listed hubs and scenarios are examples; coverage needs clarification |
| Online deployment and a particular login provider are organizer mandates | The brief permits local demonstration and names no login provider |
| The organizers ban or permit AI coding assistance | Language-model usage is discussed, but coding-assistance rules are not supplied |
| Existing starter code is automatically eligible | Source is expected to be developed during the session; reuse boundaries are unclear |

## 14. Questions to clarify with organizers

**Quick summary:** Clarify eligibility and acceptance first. Questions about datasets, fares, and report reliability directly affect whether results can be judged correct.

| Priority | Question | Why the answer matters |
|---|---|---|
| First | What pre-existing starter code, libraries, generated code, and AI coding assistance are permitted? | Avoids submission eligibility problems |
| First | Are disclosed synthetic routes, fares, travel times, and street reports acceptable? | Establishes what demonstration data may represent |
| First | Is there an official dataset or reference for fares, routes, and student eligibility? | Establishes the source of correctness |
| First | Must all five parts work, and is there a scoring rubric or minimum acceptance checklist? | Establishes required coverage; none has been supplied so far |
| First | How does the 100% free-stack rule apply to hosting and existing accounts? | Resolves the scope of the fairness restriction |
| Next | Does the 12–15 hub range apply only to schematics, and are the example hubs mandatory? | Establishes geographic coverage |
| Next | How should the student discount, minimum fare, rounding, and separate boardings interact? | Prevents conflicting fare interpretations |
| Next | What sources or acceptable assumptions define surge ranges and travel times? | Establishes estimation standards |
| Next | How should cost, duration, and transfers influence ranking? | Clarifies conflicting user goals |
| Next | What makes a report reliable enough to affect routing, and when should it expire? | Establishes validation expectations |
| Next | Which disruption scenarios and transport modes must be demonstrated? | Separates examples from mandatory breadth |
| Next | What English/Banglish cases and conversation follow-ups will be assessed? | Establishes language acceptance |
| Next | Is source control submission required at the build cutoff, and what are the exact demo logistics? | Prevents deadline misunderstandings |

**Unknown:** These questions are unresolved by the PDF unless explicitly marked otherwise. They are not reasons to invent stricter requirements.

## 15. Things the problem statement does NOT require

**Quick summary:** The brief does not demand a complete navigation business or a citywide operating service. Optional tasks and team preferences must remain separate from organizer requirements.

**Fact: Not explicitly required**

- A particular frontend, backend, database, hosting provider, or authentication provider.
- Online deployment as the only demonstration method; local demonstration is allowed.
- Coverage of every road, stop, operator, or neighbourhood in Dhaka.
- Exact geographic map geometry; an interactive schematic is explicitly allowed.
- Real vehicle GPS tracking, live arrival predictions, or a supplied connection to official traffic feeds.
- Physical sensors, IoT hardware, or blockchain.
- Payments, ticket purchases, fare collection, or commercial operator booking.
- A native mobile application or an app-store release.
- Training a new language model or building a new routing research algorithm.
- A defined production scale, uptime guarantee, or numerical latency target.
- Bengali-script support as a separately named requirement; English and Banglish are named.
- A specific account system, identity-verification method, or permission implementation. Administrator and commuter responsibilities are nevertheless explicit.

**Fact: Explicitly optional or bonus**

- Detailed landmark boarding and transfer instructions for each journey leg are labelled a bonus in Part 2. Part 1 separately includes boarding landmark notes, so all landmark information should not be dismissed as optional.
- Extracting route information from signboard or notice photos.
- Audio briefings or downloadable offline visual summaries.
- Community ride sharing, coordination bots, and split-fare calculations.

**Decision:** None of these omissions removes the five core requirement groups. Conversely, adding a bonus does not establish that a missing core requirement has been met.

## Supporting source and interpretation notes

**Quick summary:** This document uses the three-page official PDF as its primary evidence. Project preferences and interpretations are labelled separately.

- **Primary source:** [Official hackathon problem statement](Hackathon%20Problem%20Statement%20-%20INIF%202026.pdf), pages 1–3, read in full.
- **Fact label:** An explicit statement in the PDF, or a clearly identified statement from the user/team context. A PDF claim about the outside world is attributed to the organizers.
- **Inference label:** A reasonable interpretation or possible consequence, not an explicit rule or verified research finding.
- **Assumption label:** An unverified proposition used for illustration or something participants may accidentally take for granted.
- **Unknown label:** A material point not settled by the available evidence.
- **Decision label:** A boundary for this analysis, not a claim about organizer policy.
- **Evidence limit:** No external transit research or current fare verification was performed. No implementation contracts are defined because no intervention is being selected here.
