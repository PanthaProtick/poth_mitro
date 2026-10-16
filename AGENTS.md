# INIF 2026 hackathon project checkpoint

This file is the project's persistent context checkpoint. Read it before planning, researching, or changing the project. Keep it current when a major phase is completed, a scope or architecture decision is made, a significant fact is verified or overturned, or an important external dependency changes. Update only the relevant sections and date the change. Do not wait for the user to ask for routine checkpoint maintenance.

## How to work with the user

- Act as a hackathon mentor, product engineer, architect, and skeptical reviewer.
- Challenge technical and product assumptions. Explain trade-offs, edge cases, security, failure modes, and simpler alternatives. Do not implement a weak idea just because it was proposed.
- Preserve the user's requested phase. When asked to analyze or compare, do not jump to building a solution.
- Separate **VERIFIED FACT**, **REASONABLE INFERENCE**, **ASSUMPTION**, **UNKNOWN**, and **DECISION**. Attribute product/provider claims and distinguish what a source claims from what has been independently tested.
- Search for evidence that disproves or makes the proposed direction unnecessary. Do not present a feature checklist as proof of a real user gap.
- Use plain English suitable for an undergraduate student. Explain technical terms when they first appear. Keep detailed supporting evidence after the main explanation.
- For documents, begin with five quick-summary bullets and start each major section with a 1–2 sentence `Quick summary:`.
- Continue authorized work without unnecessary confirmation. Ask only for essential missing information or an explicit user choice that genuinely determines the next phase.

## Challenge and limits

**Fact from the organizer statement:** The challenge is “DhakaPath: Live Urban Transit & Route Intelligence” under the Smart City theme. Organizers describe fragmented Dhaka travel across local buses, MRT-6, legunas, connector rickshaws, and walking; changing fares; waterlogging and blockades; and scattered, rapidly aging reports.

**Organizer requirements:**

1. Maintain and browse a transit network and street alerts, including transport mode, origin/destination, base BDT fare, student-fare eligibility, and estimated travel time.
2. Search trips in English or Banglish, including constraints such as a budget or avoided intersection; return valid multi-leg options ranked by cost, time, and transfers.
3. Apply the stated bus student discount (50%) and BDT 10 minimum, modes without student passes, variable connector fare ranges, and disruption simulation/rerouting.
4. Ground route claims in stored data; support report confirmation/resolution and age-based downgrading/expiry; flag implausible fares and contradictory reports.
5. Provide English/Banglish conversational access alongside a visual interface, including contextual follow-ups.

**Constraints from the PDF:** Build duration is 5 hours 40 minutes; demonstration is 4–5 minutes plus 2 minutes Q&A. Paid map services are prohibited. Free-tier or local language models are required. Organizers permit an online or local prototype. A schematic map of 12–15 hubs is explicitly acceptable. Three bonus tasks are signboard digitization, audio/offline briefing, and rideshare coordination.

**Unknown:** The PDF does not provide scoring weights, authoritative datasets, accuracy tolerances, report confidence thresholds, or full fare-rounding/transfer rules. The user confirmed no additional organizer criteria or clarifications.

## User and project requirements

- The available team excludes Partha Sarathi Saha Tirtha. `docs/team_skills.md` lists Pantha Protick (backend, ML, database, systems), Tanvir Hasan Ratul (full-stack), and Yousha Shahid (frontend/UI).
- The user reported having a Clerk app, an AI API key, and a Neon project set up. Render can be arranged later. This is user-reported setup; credentials and live integrations have not been verified. Never put secrets in this file.
- For web MVP implementation after an intervention is selected, the user requires React + FastAPI + `uv`, remote Neon PostgreSQL, and Render. The same application must run locally and on Render by changing configuration, not business logic.
- Local development must use a Neon development branch and deployment must use a separate Neon branch with the same schema and migrations.
- Do not introduce SQLite, a local database, anonymous fallback accounts, fabricated tokens, or separate local/hosted product modes. Missing credentials must not silently enable a mock application mode.
- Decide whether users need accounts and shared roles. If reports or administration require them, integrate real Clerk login and backend authorization in the first working flow. If public access is sufficient, state the policy and do not force login.
- Synthetic domain data may be used only when clearly disclosed. Authentication, persistence, and core interactions must be real.
- Deployment and required user isolation are baseline acceptance criteria for this project, even though the organizer PDF also permits local demonstration.
- Define frontend quality before implementation and inspect actual browser screens; a successful build is not UI acceptance.
- Define API/data contracts before implementation: exact schemas, units, nullability, validation, errors, identifiers, and producer/consumer boundaries. Keep mocks consistent with real contracts and do not present mocks as live integrations.

## Current phase and status

**Current phase: product opportunity discovery.** Problem decomposition, current-workflow reconstruction, needs ranking, intervention alternatives, desk-research comparison, and seven mechanism-level opportunity hypotheses have been completed. No opportunity, product scope, or architecture has been selected. Do not start implementation until the user chooses a direction or explicitly asks to proceed.

The current project workspace is still a hackathon starter, not the Dhaka transit product. Prior code inspection found that demo item endpoints use an in-memory list, chat does not retain conversation history despite accepting a `conversation_id`, and Gemini can return mock responses when configuration is missing. Treat README claims as scaffolding; recheck code before making claims about current implementation. No live database, Clerk, AI, Render, or browser flow has been verified.

## Research findings that affect novelty

All claims below are based on public product descriptions and have not been independently performance-tested:

- Jaatra already advertises Dhaka bus/metro/rail journey planning, fares, directions, and (in its latest reviewed release notes) Pulse rider updates about traffic, crowding, closures, and other conditions.
- Jaatra's website says vehicle positions are simulated until it receives authorized operator GPS. This is about vehicle tracking; do not confuse it with rider-submitted incident updates.
- Smart Route BD advertises local route/fare reference, bilingual/offline information, and simulated metro movement.
- Vara Koto advertises approximate distance-based fare estimates for several modes and cautions actual fares vary.
- RouteGPT's Devpost entry describes a Banglish route/fare chat prototype. This shows concept overlap, not proof of a maintained production service.
- OpenTripPlanner, GTFS/GTFS-Realtime, OpenStreetMap, manual field mapping, human moderation, operator notices, and sensors are established approaches. None creates accurate local source data automatically.

**Current skeptical conclusion:** Generic Dhaka route search, fare lookup, chat, or rider-report sharing is not novel on the available evidence. Possible remaining gaps include verified report relevance/freshness, student fare correctness across complete trips, variable connector price evidence, route/transfer accuracy, and access for people who cannot rely on apps. These are hypotheses until compared with actual products and commuter journeys.

## Project documents

- `docs/Hackathon Problem Statement - INIF 2026.pdf` — organizer source; use it for requirement claims.
- `docs/decomposed_problem.md` — facts, inferences, unknowns, requirements, and non-requirements.
- `docs/needs.md` — 11 user/system needs (N1–N11), prioritized Critical / Important / Secondary.
- `docs/interventions.md` — 22 alternatives, two per need; no winner selected.
- `docs/background_research.md` — product, industry, open-source, research, low-tech, and comparable-environment evidence.
- `docs/comparison.md` — approach comparison, overlap, limitations, and remaining opportunity hypotheses.
- `docs/possible_features.md` — seven testable solution opportunities, each linked from an existing limitation to an affected user, intervention, rationale, and measurable outcome; feasibility is assessed against the 5h40 event, team skills, demo, and setup dependencies. Despite the filename, these are opportunity hypotheses, not selected features.
- `docs/team_skills.md` — available team skills; exclude Partha when allocating work.

Keep these documents consistent. In particular, do not claim rider alerts are absent from Jaatra: its current reviewed listing describes Pulse. Do distinguish rider sharing from verified/independent corroboration, lifecycle, accuracy, or live GPS, which remain unverified.

## Next work

1. Compare the shortlisted opportunity hypotheses against a specific commuter segment and journey. Verify existing apps hands-on or with direct product evidence and collect user evidence where possible.
2. Keep alternatives open until a real gap and a specific intervention are selected. The opportunity document now uses the confirmed 5 hours 40 minutes and notes the need to prepare deployment setup before the event.
3. After selection, define and review the contract and acceptance criteria before coding; then build the smallest coherent vertical flow and deploy early.
4. Verify actual browser journeys, authentication/authorization where required, Neon persistence, and the deployed Render flow. Report each as tested, untested, or blocked.

## Checkpoint maintenance

After any substantial phase, revise **Current phase and status**, **Research findings** if evidence changes, and **Next work**. Add a brief dated note below for consequential updates; do not copy whole reports into this checkpoint.

### Update log

- **2026-10-16:** Created after completing problem decomposition, current workflow, needs, intervention alternatives, background research, and comparison. No solution selected. Added Jaatra Pulse, Vara Koto, and RouteGPT overlap to reflect the latest reviewed evidence.
- **2026-10-16:** Added seven unselected, mechanism-level opportunity hypotheses to `docs/possible_features.md`, with measurable tests, 24/48-hour prototype estimates, and explicit dependencies. None is validated by user research; retain the event's stated 5h40 limit.
- **2026-10-16:** Revised `docs/possible_features.md` for the confirmed 5h40 event, three available members, 4–5 minute demo plus Q&A, and pre-event setup needed for the required stack/deployment. Removed 24/48-hour assumptions and marked field-dependent and partner-dependent work as out of scope for live delivery.
- **2026-10-16:** Initialized this workspace as the local Git repository for `https://github.com/PanthaProtick/poth_mitro.git` on `main` after verifying the remote had no refs. Initial publication includes the existing starter and project documents; local environment files, dependencies, and generated builds are excluded. Repository setup does not change product scope or validate runtime integrations.
