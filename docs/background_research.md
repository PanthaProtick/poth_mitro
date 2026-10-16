- **Fact:** Dhaka already has public-facing transit tools for bus/metro routes, fare estimates, and multi-leg trip planning.
- **Fact:** Jaatra and Smart Route BD currently advertise substantial overlap with route, stop, fare, map, and language needs.
- **Fact:** Jaatra says its vehicle positions are simulated pending authorized operator GPS data; Smart Route BD also labels its metro tracking a simulation.
- **Fact:** Jaatra's latest App Store release advertises Pulse rider updates for traffic, crowding, and closures; RouteGPT describes a Banglish route/fare chatbot; Vara Koto advertises distance-based fare estimates.
- **Inference:** Generic route, fare, chat, or rider-report functions may duplicate existing work. Whether incident verification, variable-fare accuracy, report relevance, and evidence quality remain unmet needs is unverified.
- **Unknown:** Public product descriptions do not establish field accuracy, user adoption, completeness, or sustained reliability.

# Background research: current approaches

## 1. Scope and evidence labels

**Quick summary:** This research checks what existing services and practices already do for the 11 needs in [needs.md](needs.md). Provider feature descriptions are treated as claims until independently tested.

**Fact:** The problem framing comes from [decomposed_problem.md](decomposed_problem.md), and the intervention families come from [interventions.md](interventions.md). This review searches for both overlap and weaknesses that could make a proposed direction unnecessary or ineffective.

- **VERIFIED FACT** means the cited primary or reputable source directly states the claim. A company's statement about its own product verifies that it makes the claim, not that the service performs accurately in all journeys.
- **REASONABLE INFERENCE** means a conclusion supported by the sources but not directly measured by them.
- **UNKNOWN** means the available sources do not answer the question.

**Decision:** “Already solves our proposed idea” is assessed against the problem and needs as currently written, not an implementation that has not yet been selected. “Partial” means a documented overlap with material gaps. “Unknown” means no reliable evidence of coverage was found.

**Evidence limit:** No hands-on app accuracy test, interviews, route-by-route audit, or survey of Dhaka commuters was performed. Product listings and product websites can be promotional or become outdated.

## 2. Main finding: existing Dhaka products overlap substantially

**Quick summary:** This is a serious challenge to a generic route-planning proposal. Two Dhaka services already advertise many of the expected route, transfer, fare, bilingual, and map functions, though their public claims do not prove that all required needs are met reliably.

### Jaatra: Dhaka Bus & Transit

- **VERIFIED FACT:** Its Google Play listing advertises multi-modal planning across MRT-6, buses, and walking; route options ranked by fastest, cheapest, and simplest; maps and stops; English and Bangla; fare estimates; and coverage of MRT-6 plus 100+ bus routes. The listing says it was updated September 12, 2026. [Google Play listing](https://play.google.com/store/apps/details?hl=en-US&id=bd.jaatra.app)
- **VERIFIED FACT:** Jaatra's own site says route and stop data is manually verified, the service is free to download/use for trip planning, and no account is needed to begin. It explicitly says live vehicle positions are **simulated** until authorized GPS data is available from operators. [Jaatra product site](https://www.jaatra.bd/)
- **VERIFIED FACT:** Jaatra's latest App Store release notes advertise Pulse, a feed for rider updates about traffic, crowding, closures, and other conditions, plus updates shown along a trip. This verifies a public feature claim, not report accuracy or independent verification. [App Store listing and release notes](https://apps.apple.com/gb/app/jaatra-dhaka-bus-transit/id6809208687)
- **Target users:** Dhaka bus and metro commuters, including English- and Bangla-speaking passengers.
- **Strengths:** Strong overlap with N1 (journey comparison), N2 (search by landmark/stop and step-by-step directions), N3 (fare estimates), N6 (multi-leg options), and parts of N11 (saved Home/Work locations). The latest release also overlaps with incident sharing under N7–N10.
- **Limitations:** The public descriptions do not establish student half-fare handling, rain/rush-hour connector fare ranges, independent report corroboration, report decay/resolution rules, or contextual conversational assistance. The provider says live vehicle positions are simulated pending operator GPS data. Bangla support does not establish romanized Banglish understanding. Rider updates exist, but their quality and trust rules are unknown.
- **Deployment requirements:** Current route/stop data; mapping; operator-authorized GPS feeds for genuine live positions; maintenance and user support. The public pages do not specify all data suppliers.
- **Cost considerations:** The provider says trip planning is free to users. Operating cost, advertising or revenue model, and long-term service funding are not established by these pages.
- **Scalability:** Software could expand to more routes, but manually verified data and missing authorized live feeds create people and partnership costs.
- **Already solves the need/problem?** **Partial, very high overlap.** It covers much of the generic Dhaka multimodal planner and now advertises rider-submitted local updates. Its own disclosure says vehicle positions are simulated. Report trust and lifecycle, variable connector fares, student-rule accuracy, and Banglish remain unverified or not evidenced in the public material.

### Smart Route BD

- **VERIFIED FACT:** Its site describes a bilingual public-transit reference for buses, MRT-6, rail, and river launches. It reports 112 bus routes and 382 stops on its About page, and says its data is cross-referenced with regulatory/operator sources. [About page](https://smartroutebd.com/en/about)
- **VERIFIED FACT:** It describes bus search by origin/destination, stop sequences, operator names, fare calculation, offline access, and a metro map simulation. It identifies the metro live-map simulation as physics-based simulated tracking. [Bus and transit overview](https://smartroutebd.com/en)
- **Target users:** Bangladesh public-transport travellers who need route/fare references, including people with intermittent connectivity.
- **Strengths:** Direct overlap with route discovery, mode coverage, stops, fare estimates, bilingual reference, and offline lookup. Its explicit “unofficial” and fare/source caveats on the app listing are useful signs that users should verify details. [Google Play listing](https://play.google.com/store/apps/details?hl=en-US&id=com.newage.bdbusroute)
- **Limitations:** No evidence on the reviewed pages of verified live vehicle GPS, crowdsourced street alerts, report decay, student fare comparison, natural-language multi-constraint search, or chat context. Its site uses both “112 bus routes” and “180+ city buses”; these may count different things, but the distinction is not clear from the headline descriptions. The data and fare calculations have not been independently audited.
- **Deployment requirements:** Maintained route/fare data, source review, offline caching, and ongoing editorial work. Real live vehicle positions would require more than simulated tracking.
- **Cost considerations:** The site says it is free; the Android listing is free to install. Hosting, editorial labour, and long-term funding are not stated.
- **Scalability:** Offline data can serve users without constant connectivity. Adding and auditing routes still requires a reliable update process.
- **Already solves the need/problem?** **Partial, high overlap.** It already targets the fragmented route and fare reference problem. Its published descriptions do not cover the challenge's full live street-report validation workflow.

### Other Dhaka route and fare apps

- **VERIFIED FACT:** The Google Play listing for “Dhaka Bus Route” advertises bus lists, route connections, an interactive map, offline access, and English/Bangla. It says fares are “coming soon,” and lists 2.19K reviews and a 3.4-star rating at the time of search. [Google Play listing](https://play.google.com/store/apps/details?hl=en_IN&id=com.rongdhonuapps.dhaka_bus_route)
- **VERIFIED FACT:** “Jatayat” advertises Dhaka bus routes and fare lookup based on BRTA gazette documents; its listing shows 50+ downloads and says it contains ads. [Google Play listing](https://play.google.com/store/apps/details?id=com.raindropstudio.jatayat)
- **Target users:** Bus passengers needing route or regulated-fare information.
- **Strengths:** They show that route maps, offline references, and official-rate calculators are already familiar approaches in the local market.
- **Limitations:** The listings do not establish completeness, update quality, live disruption support, multi-mode planning, or user outcomes. The smaller Jatayat download count is not enough to infer overall market demand.
- **Deployment requirements:** App maintenance and route/fare updates; some apps may use advertising.
- **Cost considerations:** Listings show free installation; Jatayat states it contains ads. Developer operating costs are unknown.
- **Scalability:** Static reference apps are relatively simple to distribute; keeping numerous bus routes current is ongoing work.
- **Already solves the need/problem?** **Partial, narrower overlap.** They cover some bus route and fare discovery, not the complete set of needs.

### Dhaka fare and chat prototypes

- **VERIFIED FACT:** Vara Koto's current Android listing advertises GPS-based distance and approximate fares for bus, bike, CNG, and car. It states the actual fare may vary and that advertising may be shown. A related public fare lookup lists data for 464 places. [Google Play listing](https://play.google.com/store/apps/details?id=com.monixsoft.vara_koto), [fare lookup](https://varakoto.vercel.app/)
- **VERIFIED FACT:** RouteGPT's Devpost page describes a Banglish route/fare assistant using a structured route database, comparison of buses/CNG/ride-hailing, and a correction action. The page describes a hackathon project; it does not establish a currently maintained public service. [Devpost](https://devpost.com/software/routegpt)
- **Strengths:** These projects overlap with N3/N5 (fare estimates) and with natural-language trip assistance. RouteGPT explicitly describes grounding route answers in stored data.
- **Limitations:** Vara Koto states its fares are approximate. RouteGPT is a project description, not proof of reliable operations, complete route coverage, or moderated corrections.
- **Already solves the need/problem?** **Partial.** A local fare calculator or Banglish route assistant is not a novel concept on its own. Current performance, coverage, and report verification remain unknown.

### Global journey planners: Google Maps, Moovit, and Transit

- **VERIFIED FACT:** Google Maps displays transit lines and transit directions where available. Its Routes API can return transit legs and estimated fare only when it can determine fares for all steps. The Routes API is billed per request under a pay-as-you-go model, with a current free usage cap documented by Google. [Transit route documentation](https://developers.google.com/maps/documentation/routes/transit-route), [pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- **VERIFIED FACT:** Moovit says it combines operator/authority information with user-community reports to present routes and a real-time transit picture across its supported markets. [Moovit](https://moovit.com/about-us/)
- **VERIFIED FACT:** Transit distinguishes live from scheduled departures, uses agency GPS feeds where available, and supports rider-sourced vehicle location and crowding in supported areas. Its own help page notes that scheduled data is not real time and availability depends on agency feeds and regional support. [Transit support](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line)
- **Target users:** General public-transit travellers in supported markets.
- **Strengths:** Mature journey planning, walking/transit combinations, real-time feeds where supplied, and—in Transit and Moovit—community contributions. These products show that AI is not necessary for core journey planning or simple crowd reports.
- **Limitations:** Coverage and features depend on local transit data, agency participation, and market support. Google says fare may be missing if any leg lacks determinable fare data. The challenge explicitly prohibits paid map services, so paid Google Maps Platform integration is not an eligible shortcut even if its API has a free usage allowance.
- **Deployment requirements:** For reliable real-time transit, agencies need vehicle-location/operations systems and must publish or share data. User crowdsourcing needs enough active riders and location permissions.
- **Cost considerations:** Google Maps Platform uses usage-based billing; a free cap does not turn a paid service into a guaranteed-free deployment. Moovit and Transit consumer pricing for every market was not established by the reviewed pages.
- **Scalability:** Commercial providers can aggregate across markets. Local quality still depends on route data, agency feeds, and sufficient rider activity.
- **Already solves the need/problem?** **Partial globally; Dhaka-specific completeness unknown.** These are alternatives commuters may already use, but public feature documentation does not prove that they represent all local buses, Banglish, Dhaka student rules, connector fares, or validated street incidents.

## 3. Common industry approaches

**Quick summary:** Established transit systems separate planned service data from live operations. Data standards and GPS help only when operators maintain the underlying information and share it.

### Scheduled route data: GTFS

- **VERIFIED FACT:** GTFS (General Transit Feed Specification) is a common format for agencies to publish stops, routes, trips, schedules, and related geography. Journey planners can use these feeds to calculate itineraries. [GTFS overview](https://developers.google.com/transit/gtfs/)
- **How it works:** Operators prepare structured files; a journey planner imports them and searches connected trips.
- **Target users:** Transit agencies, journey-planning providers, researchers, and passengers indirectly.
- **Strengths:** Standardizes route information for different applications and avoids each service inventing a separate format.
- **Limitations:** A schedule feed does not itself provide current traffic, road blockage, negotiated rickshaw prices, or truthful data. Semi-formal services may not have fixed timetables.
- **Deployment requirements:** Accurate stop, route, calendar, and schedule data; staff to publish and update it; validation and distribution.
- **Cost considerations:** The specification is openly documented. Data collection, software, hosting, and upkeep still cost staff time and money; no universal deployment price is established.
- **Scalability:** Standards help share data across many services, but only as far as feed quality and maintenance scale.
- **Already solves the need/problem?** **Partial.** Supports N1/N2/N6 when correct data exists, but not N3–N10 by itself.

### Live service feeds: GTFS Realtime and vehicle GPS

- **VERIFIED FACT:** GTFS Realtime represents service alerts, trip updates, and vehicle positions. Transit agencies or their vendors can publish these data for applications to consume. [GTFS Realtime](https://developers.google.com/transit/gtfs-realtime/)
- **How it works:** A vehicle GPS or dispatch system tracks operations; an agency feed publishes positions, delays/cancellations, or alerts; apps display updates.
- **Target users:** Passengers and operational staff.
- **Strengths:** Supports current service status from operational sources; can distinguish some delays and cancellations from scheduled times.
- **Limitations:** GPS position is not a report of road safety or water depth. Bad vehicle identifiers, stale feeds, incomplete fleets, or poor predictions can mislead. It covers participating fleets, not every connector mode.
- **Deployment requirements:** Vehicle tracking, dispatch systems, connectivity, feed management, agency participation, and incident/update procedures.
- **Cost considerations:** Hardware, connectivity, integration, and support costs are agency-specific; no authoritative Dhaka-wide price was found.
- **Scalability:** Once deployed, a feed can serve many consumer apps. Expanding coverage requires more operators, devices, and data governance.
- **Already solves the need/problem?** **Partial for N4/N7; unknown for Dhaka coverage.** It can represent transit operations but cannot validate all street incidents or individual variable fares.

### Automatic fare collection and e-ticketing

- **VERIFIED FACT:** Bangladesh’s transport policy and procurement record include electronic fare collection/validator and clearing-house work. A 2024 government procurement award lists an AFC bus validator system and integration with the DTCA clearing house, with a contract amount of BDT 51,975,000. [Government procurement notice](https://bangla.bppa.gov.bd/upload/noa/2024-05-20-16-02-22-NoA-S3-CH%28a%29.pdf)
- **VERIFIED FACT:** In January 2026, The Business Standard reported a planned Dhaka bus e-ticketing rollout, with designated stops and student half-fares retained. The report describes a launch and intended rollout; it does not establish complete adoption across the city. [The Business Standard](https://www.tbsnews.net/bangladesh/transport/e-ticketing-be-introduced-bus-services-dhaka-next-week-1338611)
- **How it works:** Passenger purchases or validates a ticket electronically; operator/clearing systems record transactions and reconcile payments.
- **Target users:** Passengers, operators, transport authorities, and revenue auditors.
- **Strengths:** Can standardize payment records, reduce cash handling, and help enforce published fares if deployed consistently.
- **Limitations:** Does not tell a passenger which route to take or whether a road is flooded. Hardware, cash alternatives, enforcement, and operator adoption matter. Announcement is not proof of complete rollout.
- **Deployment requirements:** Validators or ticketing devices, payment and clearing systems, service support, operator onboarding, connectivity or offline reconciliation, and accessible alternatives.
- **Cost considerations:** The cited 2024 procurement amount is BDT 51.975 million for a particular system contract, not the cost of all city ticketing or an app. [Procurement notice](https://bangla.bppa.gov.bd/upload/noa/2024-05-20-16-02-22-NoA-S3-CH%28a%29.pdf)
- **Scalability:** Shared standards can expand across operators, but each new operator and mode adds integration and governance work.
- **Already solves the need/problem?** **Partial for fare payment consistency, not fare-aware trip planning.** Could reduce some payment disputes while leaving N1/N5/N7–N10 mostly untouched.

### Human dispatch, notices, and physical wayfinding

- **VERIFIED FACT:** Standard passenger-information practice includes scheduled notices, station announcements, operator alerts, signs, and staff assistance. The precise Dhaka coverage and operating procedures were not established in the reviewed sources.
- **How it works:** Staff and operators communicate route changes, delays, and boarding instructions through existing channels and physical locations.
- **Target users:** Passengers at stops/stations, including those without data access or smartphones.
- **Strengths:** Can reach people directly where they make travel decisions; a human can clarify context.
- **Limitations:** Updates can be delayed or inconsistent across operators; signs do not adapt automatically to rapidly changing street conditions.
- **Deployment requirements:** Staff responsibility, reliable source information, announcement/sign maintenance, and coordination across services.
- **Cost considerations:** Staff time, printing, signage, and communications are ongoing costs; no Dhaka-specific estimate was found.
- **Scalability:** Broad reach is possible through common standards, but staffing and cross-operator coordination grow with coverage.
- **Already solves the need/problem?** **Partial.** Useful for N2/N4/N7, but not a complete multimodal comparison or crowd-report validation system.

## 4. Open-source solutions and standards

**Quick summary:** Open tools can reduce software licensing barriers, but they do not provide a current Dhaka transit database automatically. Data collection and operations remain the harder part.

### OpenTripPlanner (OTP)

- **VERIFIED FACT:** OpenTripPlanner is an open-source multimodal journey-planning engine built from OpenStreetMap street data and transit feeds such as GTFS. Its documentation describes APIs and the ability to incorporate real-time updates and alerts. It is LGPL-licensed. [OTP documentation](https://docs.opentripplanner.org/), [project site](https://www.opentripplanner.org/)
- **How it works:** Import street and transit data into a network model, then search for trips combining transit and walking (and supported other modes).
- **Target users:** Agencies and technical teams operating journey-planning services; passengers use the resulting app.
- **Strengths:** Mature open-source routing engine; no per-trip proprietary routing API fee; can support several modes and live feeds where available.
- **Limitations:** Needs good input data and technical administration. A routing engine cannot infer missing informal services, current fares, or street safety.
- **Deployment requirements:** Java-capable server, GTFS/OSM data preparation, configuration, operations, and a client interface.
- **Cost considerations:** Software license is open source; servers, engineering, data collection, and maintenance still have costs. No universal hosting cost is stated by the project.
- **Scalability:** Designed for agency and regional deployments; more coverage depends on data preparation and server operations.
- **Already solves the need/problem?** **Partial.** Strongly overlaps with N1/N2/N6 and some N7 when appropriate data exists; not report trust, variable fares, student concessions, or Banglish conversation by itself.

### OpenStreetMap (OSM) and schematic maps

- **VERIFIED FACT:** OSM is community-maintained open map data and asks users to credit contributors. Data use is governed by the Open Database License, including attribution and share-alike obligations for derived databases in relevant cases. [OSM about page](https://www.openstreetmap.org/about), [license information](https://www.openstreetmap.org/copyright)
- **How it works:** Contributors map streets, landmarks, stations, and other features; applications display the data or redraw a simplified network diagram.
- **Target users:** The public, developers, humanitarian mappers, and civic mapping groups.
- **Strengths:** Open data, community local knowledge, and map/schematic use without a paid map API.
- **Limitations:** Mapping a road does not establish a bus route, service frequency, fare, or current blockage. Coverage and freshness vary. License obligations must be followed.
- **Deployment requirements:** Relevant local mapping, quality review, appropriate map renderer or schematic, attribution, and data update process.
- **Cost considerations:** The data is open; a team still pays for its own hosting, tiles, editing, field verification, and maintenance. Do not assume public tile servers are an unlimited production service.
- **Scalability:** Community contributions can expand coverage, but validation and local stewardship also need to scale.
- **Already solves the need/problem?** **Partial for N2 and visual context only.** Not a transit or incident truth source.

### GTFS editing and validation tools

- **VERIFIED FACT:** GTFS feeds use standardized tables and can be validated before being consumed by a trip planner. Digital Matatus reports adapting an open-source GTFS editor to compare and revise route data. [GTFS overview](https://developers.google.com/transit/gtfs/), [Digital Matatus research group](https://civicdatadesignlab.mit.edu/Digital-Matatus)
- **How it works:** Editors create/compare structured route and stop files; validators find format errors; human reviewers check whether the contents match reality.
- **Target users:** Agencies, transit data teams, researchers, and civic mappers.
- **Strengths:** Makes data auditable and reusable; comparison avoids rebuilding an entire feed for every change.
- **Limitations:** A syntactically valid feed can still describe a route that is wrong or obsolete. Standards fit scheduled transit better than irregular services unless extended carefully.
- **Deployment requirements:** Data editors, source records, validation and field-check workflow, and version management.
- **Cost considerations:** Tools and formats may be free/open; field research and ongoing review cost time and travel.
- **Scalability:** Standard formats ease reuse; quality assurance effort grows with route count and update frequency.
- **Already solves the need/problem?** **Partial for N1/N2/N6 data quality.** It does not itself supply the data or solve live incidents and fare negotiation.

## 5. Relevant research approaches

**Quick summary:** Research supports field mapping and careful use of crowdsourced information, while warning that coverage and data quality are not automatic. These studies demonstrate methods, not guaranteed Dhaka outcomes.

### Digital Matatus: field mapping semi-formal transit in Nairobi

- **VERIFIED FACT:** A university collaboration collected routes by riding matatus with mobile devices, combining passenger/driver knowledge, signs, and local workshops. It created a public map and data. Researchers noted that fixed schedules and fares did not fit the system well and adapted the data model. [Project method](https://digitalmatatus.com/), [MIT project record](https://civicdatadesignlab.mit.edu/Digital-Matatus)
- **Target users:** Nairobi passengers, local planners, and transport researchers.
- **Strengths:** Addresses informal routes through fieldwork and local stakeholder knowledge; makes a fragmented network visible; provides reusable open data.
- **Limitations:** Route data requires repeat collection and updates. The project itself documents variable fares, stops, and routes. Published survey findings had a limited, non-representative student sample.
- **Deployment requirements:** Student/local field teams, route rides, GPS devices/phones, workshops, data cleaning, open publication, and maintainers.
- **Cost considerations:** The sources describe grant/university collaboration, not a comparable operating cost per route. Labour and field collection are material costs.
- **Scalability:** Field collection can be repeated across corridors, but citywide maintenance requires sustained local participation.
- **Comparable setting:** Nairobi's matatu system has semi-formal bus services and variable routes/fare conditions, making it more relevant than a fully scheduled rail network.
- **Already solves the need/problem?** **Partial as a method, not a Dhaka service.** It strongly supports N2/N6 mapping approaches but does not supply current Dhaka routes or alerts.

### Crowdsourced transit location and transfer research

- **VERIFIED FACT:** Transit products and research have used rider phone locations to estimate vehicle positions. A study of crowdsourced transit information found user-generated data can be sparse across the whole network while being more useful at locations and times when users access the service. Research also uses crowdsourcing to identify inconvenient or potentially unsafe transfers. [Transit's explanation](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line), [TRB study summary](https://www.researchgate.net/publication/280922334_The_Performance_of_a_Crowdsourced_Transportation_Information_System), [transfer research abstract](https://www.sciencedirect.com/science/article/abs/pii/S0965856417314040)
- **How it works:** Aggregate opt-in phone location or journey feedback; compare reports across users/time; infer vehicle movement, crowding, or transfer conditions.
- **Target users:** Riders seeking arrival or transfer information; agencies studying service quality.
- **Strengths:** Can fill gaps where agencies do not publish live feeds and reveal real passenger experience.
- **Limitations:** Sparse participation, phone/GPS error, privacy concerns, and route/time coverage bias. A crowded central corridor can look well covered while other areas have no observations.
- **Deployment requirements:** Mobile participation, privacy controls, enough users, data processing, and ground-truth evaluation.
- **Cost considerations:** Research sources do not establish a universal monetary cost. Maintaining apps, cloud processing, and incentives may incur costs.
- **Scalability:** Software processing can scale; representative human participation is the limiting factor.
- **Already solves the need/problem?** **Partial for N4/N6/N10.** Does not guarantee citywide coverage or solve all report freshness and incident safety questions.

### Crowdsourced incident and crisis information

- **VERIFIED FACT:** Research on disaster crowdsourcing studies volunteer, mobile, and social-media contributions; witness-based verification has been proposed to let people near an event evaluate reports. This establishes research approaches, not that all crowd reports can be reliably verified. [Systematic review](https://www.sciencedirect.com/science/article/pii/S2212420918310410), [witness-verification paper](https://arxiv.org/abs/1212.4989)
- **How it works:** Collect time/location-tagged reports, compare independent witnesses, check against authority information, and preserve disagreement/uncertainty.
- **Target users:** Emergency responders, affected residents, and people making local safety decisions.
- **Strengths:** Timely local observations can surface incidents before formal feeds; independent evidence can improve confidence.
- **Limitations:** False reports, duplicate reposts, uneven participation, privacy, danger to witnesses, and difficulty declaring an incident resolved.
- **Deployment requirements:** Moderation roles, report formats, privacy and safety rules, independent sources, and correction/expiry procedures.
- **Cost considerations:** No general cost estimate is established by the reviewed papers; moderation labour is an ongoing need.
- **Scalability:** Digital intake scales more easily than verification. Human review and representative coverage remain hard to scale.
- **Already solves the need/problem?** **Partial for N7–N10.** Methods exist, but no evidence found that they already provide a complete Dhaka commute-alert service.

### Urban waterlogging sensors and rainfall monitoring

- **VERIFIED FACT:** A Dhaka-focused research paper studies an IoT waterlogging detection system using sensor data and a central database. A separate World Bank report describes rain monitoring and flood forecasting institutions for broader flood-risk management. [Dhaka sensor paper](https://arxiv.org/abs/2403.18949), [World Bank report](https://documents1.worldbank.org/curated/en/585131520257159174/pdf/Flood-risk-management-in-Dhaka-a-case-for-eco-engineering-approaches-and-institutional-reform.pdf)
- **How it works:** Sensors measure water or rain at selected points; readings are transmitted and interpreted as potential flood/waterlogging conditions.
- **Target users:** City operators, disaster-management staff, and residents in monitored areas.
- **Strengths:** Repeated objective measurements can supplement witness reports and identify recurring hotspots.
- **Limitations:** A sensor measures one location and variable; it does not prove which bus/road is passable. A paper or prototype does not establish an operating citywide sensor network.
- **Deployment requirements:** Sensors, installation permissions, power, connectivity, calibration, maintenance, and a response organization.
- **Cost considerations:** The papers establish technical approaches, not a verified Dhaka deployment budget. Hardware purchase is only part of lifetime cost.
- **Scalability:** More coverage requires more devices, upkeep, and integration with agencies; sensor failures create blind spots.
- **Already solves the need/problem?** **Partial for detecting some physical hazards; no for full commute decisions.** It does not cover fares, route options, or all incidents.

## 6. Low-tech and non-AI approaches

**Quick summary:** Several needs can be addressed without AI or even software. These methods are often cheaper to start and easier to explain, but depend on staff, sign upkeep, and timely communication.

| Approach | How it works / users | Strengths | Limitations and resources | Costs and scale | Existing coverage |
|---|---|---|---|---|---|
| Printed corridor maps and stop boards | Operators/community groups post route diagrams and landmarks for passengers | Offline, visible at decision points, easy to understand | Printing, installation permission, revision owner; goes stale when routes change | Low initial unit cost likely, but no Dhaka estimate found; citywide upkeep is substantial | Partial N1/N2/N6; no live alerts or personal fares |
| Conductor, station staff, or travel-desk help | Passenger asks a knowledgeable person about routes, boarding, fares, or changes | Flexible language and human clarification | Staff knowledge varies; coverage/hours and queue time; training needed | Staff labour dominates; scales with staffing points | Partial N1–N7, depending on staff and current information |
| Operator/authority announcements and call trees | Staff relay a dated disruption/update through established public channels | Trusted source for operational changes; useful without sophisticated prediction | Cross-agency delays, limited local detail, and no guarantee that every traveller receives it | Communication and staff costs unknown; coordination burden grows with organizations | Partial N4/N7/N8; limited fare comparison and crowd corroboration |
| Fare charts, tickets, and pre-trip price agreement | Publish fixed fare rules and agree variable connector prices before travel | Transparent, simple, no model needed | Fare chart may not match variable quotes; negotiation and enforcement remain | Printing or staff procedures; possible ticketing infrastructure cost | Partial N3/N5 only |
| Community witness confirmation | People who directly observe an incident tell one another or a moderator; later witnesses update status | Local context and quick peer correction | Duplicates, silence, unsafe witnessing, social reach bias | Low tech cost; human moderation grows with coverage | Partial N7–N10; no complete network guarantee |

**REASONABLE INFERENCE:** A printed schematic can be superior to an app for a passenger with no battery, data plan, or familiarity with mapping. That does not make it more current.

**UNKNOWN:** We found no reliable source measuring the relative cost or effectiveness of these options in Dhaka today.

## 7. Comparable environments

**Quick summary:** Nairobi’s Digital Matatus project is the closest researched analogue found: a fragmented semi-formal bus system was mapped through local fieldwork. Transit apps in other markets demonstrate live-data patterns, but depend on participating agencies and substantial rider activity.

### Nairobi: Digital Matatus

- **VERIFIED FACT:** Researchers and students rode routes, collected GPS/location data, checked stop identity with local knowledge and operators, ran community workshops, and published a diagram map and data. Later collection rounds updated routes. [Digital Matatus project](https://digitalmatatus.com/), [MIT Civic Data Design Lab](https://civicdatadesignlab.mit.edu/Digital-Matatus)
- **Target users:** Matatu riders, visitors, planners, and transport researchers.
- **Strengths:** Demonstrates that a manual field-survey approach can make a decentralized network legible and reusable.
- **Limitations:** Data became old without new collection; routes, schedules, and fares were variable. It was a multi-institution project, not a quick software-only intervention.
- **Deployment requirements:** Local university/community collaboration, ride-alongs, route data cleaning, stakeholder workshops, open publishing, repeat surveys.
- **Cost considerations:** Grant-funded project; comparable operational unit costs were not stated in the reviewed source.
- **Scalability:** Strong as a repeatable method; maintaining citywide freshness needs sustained local teams.
- **Already solves the need/problem?** **Method precedent only.** It does not cover Dhaka's current passenger decisions.

### Real-time transit apps in agency-supported cities

- **VERIFIED FACT:** Transit documents a mix of agency GPS, service alerts, and rider-sourced location/crowding reports; it explicitly labels schedule-based estimates separately from real-time data. [Transit support](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line)
- **Target users:** Passengers on supported routes.
- **Strengths:** Shows how official operations and crowd contributions can complement each other.
- **Limitations:** Support is regional; agency feeds and sufficient rider use are prerequisites. Sparse crowdsourcing may not cover the whole system.
- **Deployment requirements:** Agency feed integration, GPS/dispatch infrastructure, app users, and service operations.
- **Cost considerations:** Product and agency contract terms vary; no single public cost is established here.
- **Scalability:** Software scales across supported agencies; feed onboarding and active participation do not happen automatically.
- **Already solves the need/problem?** **Partial as a general pattern; Dhaka fit unknown.**

## 8. Need coverage: what seems solved and what remains open

**Quick summary:** The existing market most clearly covers finding routes and calculating/reference-checking fares. The needs around live disruption evidence and human trust are less clearly covered by Dhaka-specific services.

| Need | Existing evidence | Coverage judgment |
|---|---|---|
| N1 Compare full journeys | Jaatra advertises ranked multimodal options; Smart Route BD advertises route finding/corridor comparison | **Substantial overlap; quality and completeness unverified** |
| N2 Find boarding/transfer places | Jaatra advertises landmark/stop search and step guidance; other bus apps publish route maps | **Partial to substantial overlap** |
| N3 Whole-journey affordability | Dhaka fare calculators/reference products; Jaatra and Smart Route BD advertise fare estimates | **Partial.** Full mode-by-mode current costs, discounts, and confidence are unverified |
| N4 Waiting uncertainty | Global apps can use agency real-time feeds; Dhaka providers' vehicle simulation is disclosed | **Major gap in verified real-time coverage** |
| N5 Variable connector cost | Products describe regulated/static fare calculations; no verified current rickshaw/CNG range dataset found | **Major gap** |
| N6 Practical transfers | Jaatra advertises multi-leg route planning; OTP supports transfers given correct data | **Substantial planning overlap; real-world transfer validity unverified** |
| N7 Respond to disruptions | Industry alerts and city incident channels exist as patterns; no complete Dhaka commute feed established here | **Partial/unknown locally** |
| N8 Incident relevance | Structured reporting and human moderation are established approaches | **No complete Dhaka-specific implementation verified** |
| N9 Freshness and independent support | Commercial products use some crowd/agency data; methods exist for timestamps and corroboration | **Specific Dhaka alert decay/copy validation unknown** |
| N10 Conflicting evidence | Human moderation and evidence rules are established approaches | **No public evidence of full coverage in local planners reviewed** |
| N11 Carry context | Jaatra advertises saved places; journey planners preserve trip inputs during a session | **Partial.** This is a lower-priority convenience need |

**REASONABLE INFERENCE:** If the proposed project is mainly a multi-modal Dhaka route and fare planner, existing local services make that direction potentially duplicative. A meaningful difference would need to be evidenced against their actual coverage and the parts they explicitly do not claim.

**UNKNOWN:** Whether Jaatra, Smart Route BD, or other apps are accurate in daily use; how many people use them; whether student-discount details are complete; and whether they have private capabilities not described publicly.

## 9. What could make the proposed direction unnecessary or inferior

**Quick summary:** The strongest counterevidence is that local products already advertise the central route-planning and fare-reference jobs. A new app could add maintenance burden without improving data freshness or user trust.

- **VERIFIED FACT:** Jaatra advertises the core multi-leg transit journey and fare workflow; Smart Route BD advertises a broad route/fare directory. Their own descriptions overlap materially with N1–N3 and N6.
- **VERIFIED FACT:** Jaatra says its vehicle positions are simulated pending authorized GPS. This directly cautions against claiming genuine live tracking based on a moving marker.
- **REASONABLE INFERENCE:** Rebuilding route search or static fares is likely less valuable than resolving a proven uncovered need, improving a data source, or testing whether users need another front end at all.
- **REASONABLE INFERENCE:** A crowd-alert feature with few active users may be less reliable than an existing local community channel; a new platform starts without an established contributor base.
- **REASONABLE INFERENCE:** Sensors may detect local water conditions but could be more expensive and less comprehensive than human or authority reporting; they do not solve a full journey by themselves.
- **REASONABLE INFERENCE:** A conversational interface may increase false confidence if it wraps incomplete data in fluent answers. Deterministic route and fare calculations already address many needs without AI.
- **UNKNOWN:** Whether users prefer one of the existing apps, a paper route map, transport staff, social channels, or a new integrated service. No comparative user study was found.
- **UNKNOWN:** Whether the hackathon judges reward novelty, completeness, reliability, use of AI, or another criterion; no weights are available in the project context.

**Decision for subsequent discovery:** Before choosing an intervention, compare the actual Jaatra and Smart Route BD user journeys with the highest-priority needs, especially N3, N6–N10. Verify exact limitations with a hands-on test or direct public product documentation, and do not infer poor quality from missing website claims alone.

## 10. Sources and evidence notes

**Quick summary:** The sources below prioritize product owners, official technical documentation, government records, research teams, and established reporting. Their claims are linked to the areas above; product claims remain attributed to their publishers.

### Dhaka products and reporting

- [Jaatra Google Play listing](https://play.google.com/store/apps/details?hl=en-US&id=bd.jaatra.app) — listed features, coverage, update date, and developer data-safety declaration.
- [Jaatra App Store listing](https://apps.apple.com/gb/app/jaatra-dhaka-bus-transit/id6809208687) — latest release notes describing Pulse rider updates on traffic, crowding, and closures.
- [Jaatra official site](https://www.jaatra.bd/) — free-planning claim, manually verified data, and explicit simulated-position disclosure.
- [Vara Koto Android listing](https://play.google.com/store/apps/details?id=com.monixsoft.vara_koto) and [public fare calculator](https://varakoto.vercel.app/) — approximate fare and distance-estimate claims.
- [RouteGPT Devpost page](https://devpost.com/software/routegpt) — hackathon chatbot concept for Banglish route/fare queries; deployment and performance unknown.
- [Smart Route BD feature page](https://smartroutebd.com/en) and [About/data methodology](https://smartroutebd.com/en/about) — provider-reported route counts, fare method, source policy, bilingual/offline capability, and simulation disclosure.
- [Smart Route BD Google Play listing](https://play.google.com/store/apps/details?hl=en-US&id=com.newage.bdbusroute) — unofficial-service/data caveat and offline listing.
- [Dhaka Bus Route Google Play listing](https://play.google.com/store/apps/details?hl=en_IN&id=com.rongdhonuapps.dhaka_bus_route) — bus routes, offline/bilingual claims, fare status, and listed rating/reviews.
- [Jatayat Google Play listing](https://play.google.com/store/apps/details?id=com.raindropstudio.jatayat) — BRTA-document fare and route claims, listing size, and advertising.
- [The Business Standard, January 2026](https://www.tbsnews.net/bangladesh/transport/e-ticketing-be-introduced-bus-services-dhaka-next-week-1338611) — reported launch and intended bus e-ticket rollout; not proof of full adoption.
- [Bangladesh Public Procurement Authority contract notice](https://bangla.bppa.gov.bd/upload/noa/2024-05-20-16-02-22-NoA-S3-CH%28a%29.pdf) — specific bus validator/clearing-house award amount.

### Commercial and technical documentation

- [Google Transit directions API](https://developers.google.com/maps/documentation/routes/transit-route) — transit details and condition for returning a route-wide fare.
- [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing) — pay-per-event billing and current listed price categories.
- [Moovit company description](https://moovit.com/about-us/) — provider description of authority/agency and user-community data.
- [Transit real-time support](https://help.transitapp.com/article/445-how-to-track-departures-on-your-transit-line) — distinction among real-time, scheduled, and cancelled information; GPS and crowdsourcing methods.
- [GTFS static specification overview](https://developers.google.com/transit/gtfs/) and [GTFS Realtime](https://developers.google.com/transit/gtfs-realtime/) — transit data exchange formats.
- [OpenTripPlanner documentation](https://docs.opentripplanner.org/) and [project site](https://www.opentripplanner.org/) — open-source router, source data, APIs, and license.
- [OpenStreetMap about](https://www.openstreetmap.org/about) and [copyright/licence page](https://www.openstreetmap.org/copyright) — community map data, attribution, and ODbL terms.

### Research and comparable environments

- [Digital Matatus project site](https://digitalmatatus.com/) and [MIT Civic Data Design Lab record](https://civicdatadesignlab.mit.edu/Digital-Matatus) — field data collection, community workshops, map, updates, and informal-service data limitations.
- [Crowdsourced transfer study](https://www.sciencedirect.com/science/article/abs/pii/S0965856417314040) — methods for discovering inconvenient and potentially unsafe transfers.
- [Crowdsourced transit information performance study](https://www.researchgate.net/publication/280922334_The_Performance_of_a_Crowdsourced_Transportation_Information_System) — reported sparsity and usage-dependent value; the linked page is a secondary-hosted abstract, so full-method review is still needed.
- [Volunteer crowdsourcing and disaster-risk systematic review](https://www.sciencedirect.com/science/article/pii/S2212420918310410) and [witness-based verification paper](https://arxiv.org/abs/1212.4989) — verification approaches and research context.
- [Dhaka IoT waterlogging paper](https://arxiv.org/abs/2403.18949) and [World Bank Dhaka flood-risk report](https://documents1.worldbank.org/curated/en/585131520257159174/pdf/Flood-risk-management-in-Dhaka-a-case-for-eco-engineering-approaches-and-institutional-reform.pdf) — sensor research and institutional rainfall/flood-warning context.

**Unknown:** This is a bounded desk review, not a complete market census or systematic literature review. Source pages were checked on 16 October 2026; pricing, app listings, features, and service status can change.
