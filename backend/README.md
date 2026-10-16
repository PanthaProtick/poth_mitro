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

The map-data import is safe to repeat for an identical manifest. The imported approximate catalog is served by `GET /api/v1/map-data/network`; `GET /api/v1/journeys/search` runs deterministic graph search over that catalog and attaches current route-linked report records. `POST /api/v1/journeys/feedback` stores feedback against a currently offered path and the manifest SHA-256; `GET /api/v1/journeys/feedback` reads recent feedback for local review. The source has no fare table or timetable, so the API returns null for fare/duration. The demo seed creates explicitly synthetic trip/report data and skips existing seed rows; it does not repair or overwrite edits. Stop the API before copying the database file for a backup. Keep a disposable check database at a clearly separate path such as `data/module-c-check.db`; only remove that named disposable file after confirming it is not your active `DATABASE_PATH`. The repository does not provide a command that deletes a database.

The local API has no login and is for one operator on the same machine. Keep it bound to `127.0.0.1`; do not expose it to a network.

Vite proxies `/api` to `http://127.0.0.1:8000` by default. If the backend must use another port, set `VITE_API_PROXY_TARGET` before starting Vite (for example, `http://127.0.0.1:8001`). Vite reads this when it starts, so restart the frontend after changing it.

## Conversational commute API

The local chat is stored in SQLite and reuses the imported graph search and incident write service:

- `POST /api/v1/chat/sessions` creates a random local session. The default retention is 24 hours (`CHAT_SESSION_TTL_HOURS`).
- `POST /api/v1/chat/sessions/{id}/messages` accepts `{ "message": "from Mirpur 10 to Shahbagh" }`. English and a bounded Banglish phrase set are parsed deterministically. It can search the actual imported approximate graph, honor recognized avoided hubs/modes, transfer limits and mode preferences, answer follow-ups from the same session, check fresh route-linked reports, and create a traveller report after required details are available.
- `GET /api/v1/chat/sessions/{id}/messages` returns up to the latest 80 messages.
- `DELETE /api/v1/chat/sessions/{id}` deletes the session, context, and messages.

New traveller reports are persisted through the existing idempotent incident service with status `reported`, `is_synthetic=false`, and source `traveller_report`; chat never confirms them. Existing route reports are shown with their stored status and freshness, and a route-level link is not treated as exact-place evidence. Session IDs provide continuity only: there is no user authentication or multi-user isolation in this local single-operator phase. A process-local limiter permits at most 30 messages per session per minute and is not a distributed control.

The graph has no general fare table or timetable. Chat returns unknown for fares and times except where every leg matches the source-annotated Mirpur 10 → Shahbagh demo overlay. Student estimates apply the stated 50% bus discount and BDT 10 minimum only to those already-labeled estimates; they assume eligibility and round half-taka amounts upward. This is a calculation assumption, not a general or authoritative fare result. Other modes receive no student discount.

Gemini intent parsing is optional and disabled by default. To enable it later, set `LLM_PROVIDER=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` in the backend `.env`; the key stays server-side and is sent in the `x-goog-api-key` header. Gemini may extract intent fields only; graph resolution, route search, budget/fare handling, report status, and writes remain server-controlled. A timeout, malformed response, or provider error falls back to deterministic parsing. Without a key, all chat behavior remains local and testable.

The latest schema is Alembic revision `20261016_04`; upgrade an existing local database with `uv run alembic upgrade head`. The automated backend checks run with `python -m unittest discover -s tests -v` from `backend/` and use only a temporary SQLite file.
