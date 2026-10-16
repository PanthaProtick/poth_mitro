# Hackathon Project Starter

A high-velocity, production-ready hackathon workspace powered by **React**, **FastAPI**, **Neon Serverless Postgres**, **Google Gemini AI**, and Astral's **uv** package manager.

---

## 🚀 Tech Stack Overview

- **Frontend:** [React](https://react.dev/) + [Vite](https://vitejs.dev/) + Modern Glassmorphic UI & Lucide Icons
- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+, Pydantic v2, Async/Await)
- **Database:** [Neon](https://neon.tech/) Serverless PostgreSQL via SQLAlchemy Async + asyncpg
- **AI / LLM:** Google Gemini (`google-genai` SDK with structured JSON schemas and conversational chat)
- **Project Manager:** [`uv`](https://github.com/astral-sh/uv) (ultra-fast virtual environment and dependency manager)

---

## 📁 Repository Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI route handlers (endpoints)
│   │   │   └── routes.py    # Health check, Gemini chat, idea generator, items CRUD
│   │   ├── core/            # Configuration and database connection
│   │   │   ├── config.py    # Pydantic BaseSettings
│   │   │   └── database.py  # Async SQLAlchemy session manager
│   │   ├── models/          # Schemas & data contracts
│   │   │   └── schemas.py   # Request/response validation models
│   │   ├── services/        # Service integrations
│   │   │   └── gemini.py    # Google Gemini client & structured generator
│   │   └── main.py          # FastAPI application entrypoint & CORS
│   ├── pyproject.toml       # Managed by uv
│   ├── uv.lock              # Lockfile for reproducible builds
│   ├── .env.example         # Backend environment variables
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components (Header, Playground, Team, Data Explorer)
│   │   ├── services/        # Frontend API client
│   │   ├── App.jsx          # Dashboard application
│   │   └── index.css        # Modern dark-theme glassmorphism CSS
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── .env
├── docs/
│   ├── team_skills.md       # Team roster, roles, and workstream allocations
│   └── prefered_stacks.md   # Architectural breakdown and specifications
└── README.md
```

---

## ⚡ Quickstart

### 1. Backend (FastAPI + uv)

```bash
cd backend

# uv manages the environment and dependencies automatically:
uv run uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### 2. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start local dev server
npm run dev
```
- App UI: [http://localhost:5173](http://localhost:5173)

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PROJECT_NAME="Hackathon Starter API"
ENV="development"
DEBUG=True
DATABASE_URL="postgresql+asyncpg://<username>:<password>@<neon-hostname>/<dbname>?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]
```

> **Note:** The backend automatically operates in standby / mock mode if `GEMINI_API_KEY` or `DATABASE_URL` is omitted, allowing you to develop UI workflows immediately without waiting for API keys.

---

## 👥 Team & Workstreams

See [docs/team_skills.md](docs/team_skills.md) for full member skill breakdown, domain matrices, and hackathon workstream ownership.
