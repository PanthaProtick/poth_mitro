# Local backend

- Uses SQLite at `data/dhakapath.db` by default, with Alembic-managed schema.
- Binds to localhost; no authentication or multi-user isolation is provided.
- Validates map files before importing approximate source references.
- Demo trip/report records are synthetic and repeat-safe.
- Run the setup, import, and server commands below from this directory.

Run these commands from `backend/` after installing Python 3.12+ and `uv`:

```powershell
uv sync --locked
uv run alembic upgrade head
uv run python -m app.scripts.map_data validate --summary-only
uv run python -m app.scripts.map_data import
uv run python -m app.scripts.map_data seed-demo
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The local database defaults to `data/dhakapath.db` relative to this directory. Set `DATABASE_PATH` in `.env` to use a different persistent SQLite file. The API can start before migrations so `/health/live` remains available; `/health/ready` returns `503 DATABASE_UNAVAILABLE` until the expected Alembic migration and bounded SQLite probe succeed. Invalid `DATABASE_PATH` configuration fails during startup. `/api/v1/map-data/summary` reads the committed approximate catalog inventory.

The map-data import is safe to repeat for an identical manifest. The demo seed creates explicitly synthetic data and skips existing seed rows; it does not repair or overwrite edits. Stop the API before copying the database file for a backup. Keep a disposable check database at a clearly separate path such as `data/module-c-check.db`; only remove that named disposable file after confirming it is not your active `DATABASE_PATH`. The repository does not provide a command that deletes a database.

The local API has no login and is for one operator on the same machine. Keep it bound to `127.0.0.1`; do not expose it to a network.
