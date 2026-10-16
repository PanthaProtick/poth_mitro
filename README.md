# DhakaPath local prototype

- Persistent local SQLite backend with versioned Alembic migrations.
- Local-only access on `127.0.0.1`, for one operator without login.
- Approximate transit reference data imported from the checked-in map files.
- Synthetic demo records are labeled and never treated as live reports.
- The default page is the Poth Mitro welcome screen. **Plan a journey** loads place/route geometry from SQLite and searches paths through the imported local graph; route geometry is approximate, while fare/time remain unknown because no fare table or timetable is supplied. Current saved route-linked reports appear with the options. **Trip brief** manages prepared trip context and report create/correction through the local API.
- Successful context pages are cached in this browser for up to 30 days. If FastAPI is unavailable, the last selected trip can be restored as stale, read-only data; report writes are never queued.

DhakaPath is being built as a local-first prototype. The current backend uses a persistent SQLite database and binds to `127.0.0.1`. Clerk, Neon, and Render are deferred. This phase supports one local operator and does not provide login or multi-user isolation.

## Backend quickstart

Prerequisites: Python 3.12 or newer and [`uv`](https://docs.astral.sh/uv/).

```powershell
cd backend
uv sync --locked
uv run alembic upgrade head
uv run python -m app.scripts.map_data validate --summary-only
uv run python -m app.scripts.map_data import
uv run python -m app.scripts.map_data seed-demo
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The SQLite file defaults to `backend/data/dhakapath.db` and is ignored by Git. Set `DATABASE_PATH` in `backend/.env` to use another persistent local file. `DATABASE_PATH` may be a path relative to `backend/` or an absolute path; in-memory SQLite is rejected. Apply migrations before starting the API. Readiness is available at `/health/ready`; liveness is at `/health/live`; interactive API documentation is at `/docs`.

The map validator/importer treats `Map Data/json/transit-data.json` as canonical. The Bikolpo/Uttara CSV files are comparison evidence only; Metro/Road CSV files are inventoried but excluded. Data is approximate, not live or independently verified. `seed-demo` adds one clearly synthetic sample trip and report; repeated calls do not create duplicates or overwrite edited reports.

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server binds to `127.0.0.1` and proxies `/api` requests to FastAPI on port 8000. Start the backend first and seed its local database to see the prepared synthetic trip/report. The welcome screen opens the SQLite-backed map planner; route options are searched from the imported graph, and reports linked to those routes are shown as saved records. Trip Brief creates and corrects route-linked reports through the same API. The browser's online indicator is informational only. Build checks do not establish every write, pagination, or responsive behavior.

## Project documents

- [Backend implementation plan](backend/implementation_plan.md)
- [API contracts](docs/api_contracts.md)
- [Architecture](docs/architecture.md)
- [MVP scope](docs/mvp.md)
- [Project checkpoint](AGENTS.md)
