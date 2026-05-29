# TeamBulding — Student Task Tracker

Projekt Zespołowy

## Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 + Vite + Tailwind CSS + React Router |
| Backend  | Python 3.12 + FastAPI + SQLAlchemy  |
| Database | SQLite (dev) → PostgreSQL (prod)    |
| Auth     | JWT (python-jose + passlib/bcrypt)  |
| DevOps   | Docker Compose                      |

---

## Quickstart — Docker (recommended)

> Requires: Docker + Docker Compose

```bash
# 1. Clone & enter the repo
git clone <repo-url> && cd TeamBulding

# 2. Copy env files
cp backend/.env.example backend/.env

# 3. Start everything with one command
docker compose up --build
```

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8000      |
| API docs | http://localhost:8000/docs |

---

## Quickstart — Local (without Docker)

### Backend

> Requires: Python 3.11+

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env if needed (default SQLite is fine for local dev)

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API will be available at http://localhost:8000  
Interactive docs at http://localhost:8000/docs

### Frontend

> Requires: Node.js 18+

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App will be available at http://localhost:5173  
Requests to `/api/*` are proxied to the backend automatically.

---

## Project structure

```
TeamBulding/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # SQLAlchemy engine + session
│   │   ├── dependencies.py  # JWT auth dependency
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   └── routers/         # API route handlers
│   ├── alembic/             # Database migrations
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── main.jsx         # React entry point
│   │   ├── App.jsx          # Router setup
│   │   ├── api/             # Axios client
│   │   ├── pages/           # Page components
│   │   └── components/      # Shared UI components
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── docs/
│   ├── ROADMAP.md
│   └── ux/
└── Brief.pdf
```

---

## Database migrations

```bash
# Apply all pending migrations
alembic upgrade head

# Create a new migration (after changing models)
alembic revision --autogenerate -m "description"

# Roll back one step
alembic downgrade -1
```

---

## Documentation

- [Roadmap](docs/ROADMAP.md) — epics, tasks, sprint plan, risk register
- [UX Documentation](docs/ux/README.md) — personas, user stories, IA, user flows
- [Brief](Brief.pdf) — original project brief
