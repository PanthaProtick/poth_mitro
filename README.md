# DhakaPath local prototype

- Persistent local SQLite backend with versioned Alembic migrations.
- Local-only access on `127.0.0.1`, for one operator without login.
- Approximate transit reference data imported from the checked-in map files.
- Synthetic demo records are labeled and never treated as live reports.
- Trip/report workflows and browser-to-database integration are still in progress.

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

The UI is still a prototype and is not yet connected to the persistent local API.

## Project documents

- [Backend implementation plan](backend/implementation_plan.md)
- [API contracts](docs/api_contracts.md)
- [Architecture](docs/architecture.md)
- [MVP scope](docs/mvp.md)
- [Project checkpoint](AGENTS.md)
