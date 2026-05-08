# AuraFit v2 — Next.js + FastAPI

## Project structure

```
aurafit-nextjs/
├── frontend/          # Next.js 14 (App Router, TypeScript, Tailwind)
│   ├── app/           # Route segments
│   │   ├── auth/login/      page.tsx
│   │   ├── auth/register/   page.tsx
│   │   ├── dashboard/       page.tsx
│   │   ├── workouts/        page.tsx  +  [id]/page.tsx
│   │   ├── exercises/       page.tsx
│   │   ├── metrics/         page.tsx
│   │   └── analytics/       page.tsx
│   ├── components/
│   │   ├── layout/    AppShell, Sidebar, Providers
│   │   ├── ui/        Button, Input, Card, Badge …
│   │   └── dashboard/ StatCard, VolumeChart …
│   ├── lib/api.ts     # Axios client + all API helpers
│   └── store/         # Zustand auth store (persisted)
└── backend/           # FastAPI
    ├── main.py        # App entry, routes, lifespan hook
    ├── database.py    # Engine, session, setup_database()  ← BUG FIX
    ├── auth.py        # JWT + password hashing
    ├── models.py      # SQLAlchemy ORM models
    ├── schemas.py     # Pydantic v2 schemas
    └── crud.py        # DB queries + analytics helpers
```

---

## Quick start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Copy and edit env
# add secret key in env using "python -c 'import secrets; print(secrets.token_hex(32))'"
cp .env.example .env

uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local

npm run dev
# → http://localhost:3000
```

---

## Key bug fixes

### `database.py` — SQL semicolon splitting (critical fix)

We now grab the raw `psycopg2` connection from SQLAlchemy via
`engine.raw_connection()` and call `.execute()` with the **entire SQL block** at once.
This bypasses any statement-splitting logic and lets PostgreSQL parse the full
/pgSQL function correctly.

```python
raw_conn = engine.raw_connection()
cursor = raw_conn.cursor()
cursor.execute(ENTIRE_SQL_BLOCK)   # no splitting — psycopg2 sends it verbatim
raw_conn.commit()
```

### `main.py` — deprecated `@app.on_event`

Replaced with the modern `lifespan` async context manager:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_database()
    yield
```

### `auth.py` — rotating SECRET_KEY

Added a warning when `SECRET_KEY` env var is missing and a random key is generated.
Tokens issued with a random key are invalidated on every restart — the .env file
should always set this in production.

### `crud.py` — session ID filter bug

`get_session()` previously filtered `WorkoutSession.id == user_id` (wrong column).
Fixed to `WorkoutSession.id == session_id`.

---

## Environment variables

**Backend `.env`**:
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/aurafit
SECRET_KEY=your-secret-key-min-32-chars python -c 'import secrets; print(secrets.token_hex(32))'
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Frontend `.env.local`**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
zahid2@gmail.com
zahid123