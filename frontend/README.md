# DhakaPath frontend

This React/Vite app opens on the Poth Mitro welcome page. **Plan a journey** loads selectable places and approximate route geometry from `GET /api/v1/map-data/network`, then searches paths through `GET /api/v1/journeys/search`. It displays route-linked reports saved in SQLite. No fare table or timetable exists in the source, so the app leaves fare and duration unknown. **Trip brief** reads prepared trips/report context and creates or corrects reports through the same-origin Vite proxy to FastAPI; those reports feed back into planner options.

From the repository root, first start the backend using the [local setup instructions](../README.md#backend-quickstart), including migrations, map import, and the explicit demo seed. Then start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend and backend bind to `127.0.0.1`. The service is local single-operator software with no sign-in or multi-user isolation. Route/stop data and reports come from the local API; the raster basemap uses OpenStreetMap tiles and needs internet access. The query `?design-preview=1` enables a development-only synthetic Trip Brief fixture; report writes are disabled in that preview.

The trip list and report evidence use 20-row cursor pages, with explicit **Load more** controls. The browser stores successful context pages in an IndexedDB cache scoped to this local app and trip; entries expire after 30 days. A restored cache is labeled stale, includes the original server check time and cache time, and stays read-only. Offline writes are never queued. `navigator.onLine` is an informational hint; requests still attempt the loopback API.

The report editor retains an identical idempotency key and request body after a timeout or lost response, including across page reloads in the same tab session. It stores a recovery record in sessionStorage but never auto-submits or replays it; this is not an offline write queue. Refresh the trip to reconcile before allowing a different attempt. A version conflict keeps the draft and requires refresh plus deliberate review of the latest version before resubmitting.
