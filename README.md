# Student Task Tracker

A web app for students to organize subjects and tasks in a private, database-backed cabinet.
**Stack:** React + Vite + Tailwind CSS · Clerk auth · FastAPI + SQLAlchemy + Alembic · SQLite (dev) → PostgreSQL (prod) · REST.

This matches the roadmap stack (EP-01/EP-02).

## Roadmap status

### EP-01 · Project setup
- **T-01** Repo structure (`/frontend`, `/backend`, `.gitignore`, README) — ✅
- **T-02** Backend (FastAPI + SQLAlchemy + **Alembic**) — ✅
- **T-03** Frontend (React + Vite + **Tailwind CSS** + React Router) — ✅
- **T-04** DB schema + **first migration** — ✅ (`alembic/versions/…initial_schema…`)
- **T-05** **docker-compose** one-command run — ✅

### EP-02 · Auth and users
- **T-06** Registration (email + password + name) — ✅
- **T-07** Login + JWT — ✅
- **T-08** Logout with **server-side token invalidation** — ✅ (jti denylist)
- **T-09** All endpoints protected (401 when unauthorized) — ✅
- **T-10** Profile page — view & **edit name** — ✅
- **T-11** UI: login/register with tab switcher — ✅

**Auth update:** Clerk now handles signup, login, email verification, sessions,
and password reset. Postgres stores app data such as subjects and tasks.

## Run with docker-compose (one command)

```bash
export SECRET_KEY="$(python3 -c 'import secrets;print(secrets.token_urlsafe(48))')"
docker compose up --build
```
- Frontend: http://127.0.0.1:5173
- Backend:  http://127.0.0.1:8000  (API docs at `/docs`)
- Postgres: localhost:5432 (user/pass/db = tracker/tracker/student_tracker)

The backend container runs `alembic upgrade head` automatically before starting.

## Run manually (SQLite, no Docker)

**Backend** (terminal 1):
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export SECRET_KEY="$(python -c 'import secrets;print(secrets.token_urlsafe(48))')"
alembic upgrade head            # create the schema via migration
uvicorn app.main:app --reload
```

**Frontend** (terminal 2):
```bash
cd frontend
npm install
npm run dev
```
Open http://127.0.0.1:5173, register, and you're in your cabinet (with a Profile page in the sidebar).

> Quick dev shortcut: set `AUTO_CREATE_TABLES=1` to let the app create tables on
> startup instead of running migrations. Migrations are the recommended path.

## Configuration (no hardcoded secrets/URLs — per Definition of Done)

| Variable | Where | Purpose | Default |
|---|---|---|---|
| `SECRET_KEY` | backend | JWT signing key (**set in prod**) | random ephemeral + warning |
| `DATABASE_URL` | backend | SQLAlchemy URL | `sqlite:///./student_tracker.db` |
| `CORS_ORIGINS` | backend | comma-separated allowed origins | localhost/127.0.0.1 :5173/:4173 |
| `AUTO_CREATE_TABLES` | backend | `1` = create tables on boot (skip migrations) | unset |
| `FRONTEND_URL` | backend | base URL used in email verification links | `http://127.0.0.1:5173` |
| `VITE_CLERK_PUBLISHABLE_KEY` | frontend | Clerk publishable key | unset |
| `CLERK_JWKS_URL` | backend | Clerk JWKS URL used to verify session tokens | unset |
| `CLERK_ISSUER` | backend | Clerk token issuer URL | unset |
| `CLERK_AUTHORIZED_PARTIES` | backend | allowed frontend origins for Clerk token `azp` | `CORS_ORIGINS` |
| `SMTP_HOST` | backend | SMTP server for real verification emails; unset = print link to backend logs | unset |
| `SMTP_PORT` | backend | SMTP port | `587` |
| `SMTP_USER` | backend | SMTP username | unset |
| `SMTP_PASSWORD` | backend | SMTP password/app password | unset |
| `SMTP_FROM` | backend | sender address for verification emails | `no-reply@tasker.local` |
| `VITE_API_URL` | frontend | backend base URL (build-time) | `http://127.0.0.1:8000` |

Copy `.env.example` to `.env` for Docker Compose. Copy `backend/.env.example`
and `frontend/.env.example` as starting points for manual local runs.

### Gmail verification emails

Gmail SMTP is no longer needed for app signup if you use Clerk. Clerk sends
verification and reset-password emails for you.

### Clerk setup

Create a Clerk application, then update `.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_JWKS_URL=https://your-clerk-frontend-api.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER=https://your-clerk-frontend-api.clerk.accounts.dev
CLERK_AUTHORIZED_PARTIES=http://127.0.0.1:5173,http://localhost:5173
```

The `CLERK_JWKS_URL` is your Clerk Frontend API URL with
`/.well-known/jwks.json` appended. Rebuild after changing Clerk keys:

```bash
docker compose up --build
```

### Legacy Gmail verification emails

The old custom email verification code remains in the backend for reference,
but the frontend no longer uses it. For Gmail SMTP, use an app password rather
than your normal Google password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourgmail@gmail.com
SMTP_PASSWORD=your-16-character-google-app-password
SMTP_FROM=yourgmail@gmail.com
```

After changing `.env`, restart the backend with `docker compose up --build`.
If `SMTP_HOST` is empty, verification links are printed in `docker compose logs
backend` instead of being sent to Gmail.

## Database migrations (Alembic)

```bash
cd backend
alembic upgrade head                                  # apply all migrations
alembic revision --autogenerate -m "describe change"  # after editing models
alembic downgrade -1                                  # roll back one
```
`alembic/env.py` reads `DATABASE_URL` from the environment and targets the app's
SQLAlchemy metadata, so the same migrations work for SQLite and Postgres.

## API summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /auth/register | – | Create account, returns token + user |
| POST | /auth/login | – | Log in, returns token + user |
| POST | /auth/logout | ✓ | Revoke current token (server-side) |
| GET | /users/me | ✓ | Current user |
| PATCH | /users/me | ✓ | Update name |
| GET/POST | /subjects | ✓ | List / create subjects |
| PATCH/DELETE | /subjects/{id} | ✓ | Update / delete a subject |
| GET/POST | /tasks | ✓ | List / create tasks |
| PATCH/DELETE | /tasks/{id} | ✓ | Update (incl. toggle complete) / delete |

## Security notes

- Passwords bcrypt-hashed; emails normalized; generic login error (no user enumeration).
- `SECRET_KEY` never has a weak hardcoded fallback (random ephemeral + warning in dev).
- JWTs carry a `jti`; logout adds it to a denylist (`revoked_tokens`), so the token is
  rejected immediately, not just dropped client-side.
- All subject/task/profile endpoints are owner-scoped (other users get 404).

## Next (Sprint 2)

EP-05 Dashboard · EP-06 Task sharing · EP-07 Onboarding · EP-08 polish & deploy.
