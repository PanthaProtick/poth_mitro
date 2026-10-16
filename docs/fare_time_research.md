# Fare and travel-time research: Mirpur 10 to Shahbagh

**Status:** Research snapshot consumed only by the planner's explicitly labeled demo overlay for exact matches on this corridor. It is not the canonical network fare table or a general estimator.
**Researched:** 2026-10-16
**Scope:** The three paths returned by the current local graph for Mirpur 10 → Shahbagh.

## Quick summary

- DMTCL reports an actual MRT-6 end-to-end journey time of 33.36 minutes from Uttara North to Motijheel. The per-segment metro times below are estimates derived from that line-wide figure, not published station-to-station times.
- The published single-journey metro fares needed here are ৳20–৳60, depending on the station pair. Mirpur 10 → Karwan Bazar is ৳40; Mirpur 10 → Shahbagh is ৳50; Pallabi → Shahbagh is ৳60; Bangladesh Secretariat → Shahbagh is ৳20.
- Bangladesh's revised Dhaka city diesel-bus rate is reported as ৳2.70/km, with a ৳10 minimum for buses; minibuses are ৳2.60/km with ৳8 minimum. It does not establish the fare on the local Bikolpo or “Uttara bus” edges because their fuel type, actual service identity, and fare chart have not been verified.
- For comparison only, assuming each bus edge is a conventional diesel city bus, these short segments fall below the minimum fare, so the placeholder is ৳10 per bus ride. This is a conditional synthetic assumption, not a confirmed fare.
- There were no trustworthy stop-to-stop bus times for these catalog edges. Bus and walking times below are estimates; bus bands are informed by published Dhaka speed studies but are not route-specific measurements. All route totals exclude waiting, ticket queues, and disruptions.
- The imported graph itself is approximate: it infers transfers by proximity and has questionable same-name connections. Treat all three options as graph examples, not verified itineraries.

## Current graph paths and comparison estimates

The route names, distances, and stop pairs are copied from the local `/api/v1/journeys/search` response for `mirpur-10-266cfedd` → `shahbagh-cc0b0547` on 2026-10-16. These examples are attached to planner responses only if the selected origin/destination names and every ordered leg (including route labels and recorded distances where available) still match this snapshot. Fare values marked **conditional** assume a diesel city bus; time bands are **synthetic estimates**.

| Path shown in app | Current graph legs | Fare comparison (single journey) | Moving-time estimate |
|---|---|---:|---:|
| Fewest inferred transfers | Bikolpo bus Mirpur 10 → Mirpur 12 (2.36 km); walk Mirpur 12 → Pallabi (0.24 km); MRT-6 Pallabi → Shahbagh (10.24 km in graph) | ৳10 conditional bus + ৳60 metro = **৳70** | **33–45 min** |
| Shortest approximate distance | walk Mirpur 10 → Mirpur 10 (0.06 km); MRT-6 Mirpur 10 → Karwan Bazar (6.82 km in graph); walk between two Karwan Bazar points (0.16 km); “Uttara bus” Karwan Bazar → Shahbag (1.40 km); walk Shahbag → Shahbagh (0.16 km) | ৳40 metro + ৳10 conditional bus = **৳50** | **24–32 min** |
| Alternative network path | walk Mirpur 10 → Mirpur 10 (0.06 km); MRT-6 Mirpur 10 → Karwan Bazar (6.82 km in graph); walk between two Karwan Bazar points (0.16 km); “Uttara bus” Karwan Bazar → Secretariat (2.90 km); walk to Bangladesh Secretariat (0.21 km); MRT-6 Bangladesh Secretariat → Shahbagh (2.03 km in graph) | ৳40 metro + ৳10 conditional bus + ৳20 metro = **৳70** | **34–50 min** |

### Time-estimate method

- **MRT-6:** DMTCL states the actual Uttara North → Motijheel ride takes 33.36 minutes across 15 station-to-station intervals. For this comparison only, each interval is assigned the line average (33.36 / 15 ≈ 2.22 minutes). This gives about 20 minutes Pallabi → Shahbagh (9 intervals), 13 minutes Mirpur 10 → Karwan Bazar (6 intervals), and 4–5 minutes Bangladesh Secretariat → Shahbagh (2 intervals). Actual intervals differ; this is not a DMTCL journey planner result.
- **Buses:** The local graph provides no timetable. A 2020 Dhaka urban-transport study reports an average Dhaka Chaka bus speed of 7.5 km/h; an older JICA Dhaka network study reports cruising speeds around 14.4 km/h in peak periods and 17.7 km/h off-peak, excluding stops. The route-specific placeholder bands use roughly 7.5–14.4 km/h and round outward: 2.36 km → 10–20 min; 1.40 km → 6–12 min; 2.90 km → 12–24 min. The sources cover different measures and years, so these bands are deliberately rough.
- **Walking:** Synthetic 4–5 km/h walking speed, rounded to whole minutes. Graph edges are straight-line proximity links, not checked footpaths.
- Totals add the leg estimates and round outward. They represent moving/ride time, not door-to-door elapsed time: metro/bus headway, boarding, station entry/exit, congestion variation, and wait time are excluded.

## Fare findings and applicability

### MRT-6

The DMTCL site provides a fare-list and fare-collection-guidelines page. A station-pair matrix published by MetroDhaka attributes its chart to DMTCL's fare collection guidelines and DTCA's fare notification. The matrix, cross-checked for Mirpur 10 → Shahbagh by Prothom Alo's report of the original DTCA fare list, gives these pair fares:

| From → To | Single-journey fare used here | Evidence quality |
|---|---:|---|
| Mirpur 10 → Karwan Bazar | ৳40 | Secondary fare matrix; aligns with the published DMTCL/DTCA fare chart |
| Mirpur 10 → Shahbagh | ৳50 | Prothom Alo reports this station-pair fare from the DTCA list; MetroDhaka matrix agrees |
| Pallabi → Shahbagh | ৳60 | Secondary station-pair fare matrix, attributed to DMTCL/DTCA chart |
| Bangladesh Secretariat → Shahbagh | ৳20 | Secondary station-pair fare matrix; minimum metro fare applies |

The DMTCL fare page is available at [DMTCL fare list and collection guidelines](https://dmtcl.gov.bd/pages/static-pages/6922df5a933eb65569e2169f). The exact station-pair figures are currently read from secondary sources because the official page exposes download links but its PDF content was not independently extracted in this research pass. Single-journey fares are used; MRT/Rapid Pass discounts are excluded.

### City buses

News coverage of the government/BRTA notification effective 22 September 2026 reports the following Dhaka rates for **diesel-powered** vehicles: city bus ৳2.70/km and ৳10 minimum; city minibus ৳2.60/km and ৳8 minimum. Gas-run buses/minibuses are not covered by that diesel adjustment. No evidence found here confirms whether either local graph service is diesel-powered, which fare class applies, or whether the local edge geometry is the actual service's traveled distance.

For the three example paths, multiplying the graph distances by ৳2.70/km gives amounts below ৳10, so **৳10 is only a conditional diesel-bus minimum-fare comparison** for each bus leg. If the route is gas-run or uses an operator-specific fare schedule, this estimate may not apply. This snapshot does not estimate student discounts or connector-mode fares.

## Sources

1. [DMTCL: MRT Line-6 FAQ](https://dmtcl.gov.bd/pages/static-pages/6922e089933eb65569e27764) — official: 16 stations, 15 intervals, and actual Uttara North → Motijheel running time of 33.36 minutes (page updated 7 April 2026).
2. [DMTCL: MRT Line-6 route map](https://dmtcl.gov.bd/pages/static-pages/6922ddb2933eb65569e15eb8) — official station order, including Pallabi, Mirpur 10, Karwan Bazar, Shahbag, and Bangladesh Secretariat.
3. [DMTCL: fare list and fare-collection guidelines](https://dmtcl.gov.bd/pages/static-pages/6922df5a933eb65569e2169f) — official fare-guideline/download landing page.
4. [Prothom Alo: full metro fare list](https://www.prothomalo.com/bangladesh/capital/9r9wjsxdpd) — reports Mirpur 10 → Karwan Bazar ৳40 and Mirpur 10 → Shahbagh ৳50 from DTCA's fare chart.
5. [MetroDhaka: fares and tickets](https://metrodhaka.com/fares-and-tickets/) — secondary station-pair matrix; says it uses DMTCL's fare collection guidelines and DTCA notification. Used for Pallabi → Shahbagh and Bangladesh Secretariat → Shahbagh fares; not an official government source.
6. [bdnews24: revised diesel-bus fares](https://hello.bdnews24.com/english/bangladesh/vi8979wckd) — reports the 22 September 2026 BRTA/Road Transport and Highways Division notification: Dhaka bus ৳2.70/km, minibus ৳2.60/km, and fuel-specific scope. This is news reporting of the notification, not the gazette itself.
7. [ICCESD 2020 study: Dhaka Chaka bus performance](https://iccesd.kuet.ac.bd/2020/Papers/TRE-4371.pdf) — reports 7.5 km/h average speed and 20-minute average one-way trip for the studied service; not these routes.
8. [JICA: Dhaka Urban Transport Network Development Study](https://openjicareport.jica.go.jp/pdf/11996782_05.pdf) — older Dhaka network cruising-speed measurements, excluding stop time; used only as broad context for synthetic bus-time bands.

## Data quality and next step

The current route catalog has approximate geometries and inferred edges; in this exact response, “Uttara bus” connects Karwan Bazar to Shahbag/Secretariat even though the route identity and source alignment have not been verified. Also, the response calls the MRT-6 leg Pallabi → Shahbagh 10.24 km while the official rail alignment follows nine station intervals; straight-line imported segment geometry is not a station-to-station fare distance. Do not treat catalog kilometers as a fare meter or assert these are valid operating itineraries. The overlay fails closed: if a path changes and no longer matches the complete snapshot signature, that path returns null for the demo estimate.

Before implementation, verify the source bus routes and stop mapping, inspect the DMTCL downloadable fare table, and decide whether the product should display conditional estimates or keep fares unknown when fuel/service identity is missing. Calibrate time ranges against actual route observations or a maintained timetable. The companion JSON records the current research snapshot; it is not canonical route data.
