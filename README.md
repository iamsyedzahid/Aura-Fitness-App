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

### `auth.py` — rotating SECRET_KEY

Added a warning when `SECRET_KEY` env var is missing and a random key is generated.
Tokens issued with a random key are invalidated on every restart — the .env file
should always set this in production.
---
