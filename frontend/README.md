# DhakaPath frontend

This React/Vite app opens on the Poth Mitro welcome page. **Plan a journey** loads selectable places and approximate route geometry from `GET /api/v1/map-data/network`, then searches paths through `GET /api/v1/journeys/search`. It displays route-linked reports saved in SQLite and supports local feedback on offered paths. The commute assistant searches the graph and can submit reports that remain reported and unverified. No fare table or timetable exists in the source, so general fare and duration remain unknown.

From the repository root, first start the backend using the [local setup instructions](../README.md#backend-quickstart), including migrations, map import, and the explicit demo seed. Then start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend and backend bind to `127.0.0.1`. The service is local single-operator software with no sign-in or multi-user isolation. Route/stop data and reports come from the local API; the raster basemap uses OpenStreetMap tiles and needs internet access. Vite proxies `/api` to port 8000 by default; set `VITE_API_PROXY_TARGET` before starting Vite to use another backend port.
