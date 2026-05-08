"""
main.py — FastAPI application entry point.

Changes vs original:
 - Uses the new `lifespan` context manager (replaces deprecated @app.on_event)
 - Calls database.setup_database() so table creation + advanced SQL run once
 - Added /analytics endpoints that the Next.js frontend needs
 - CORS updated to allow the Next.js dev server (port 3000)
"""

from typing import Optional, List
from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import crud, schemas, auth, models, ai_service
from database import get_db, setup_database

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Lifespan (replaces deprecated on_event("startup"))
# ──────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting AuraFit API…")
    setup_database()          # create tables + apply advanced SQL (fixed)
    yield
    log.info("Shutting down AuraFit API.")


app = FastAPI(
    title="AuraFit API",
    version="2.0.0",
    description="Fitness tracking REST API",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
        "http://localhost:8000",   # local direct API access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────────────────────────────────────
# Auth routes
# ──────────────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db, payload)


@app.post("/auth/token", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form.username, form.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# ──────────────────────────────────────────────────────────────────────────────
# Exercise routes
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/exercises", response_model=list[schemas.ExerciseOut])
def list_exercises(
    search: str | None = None,
    muscle_group_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    return crud.get_exercises(db, search=search, muscle_group_id=muscle_group_id, skip=skip, limit=limit)


@app.post("/exercises", response_model=schemas.ExerciseOut, status_code=201)
def create_exercise_endpoint(
    payload: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    return crud.create_exercise(db, payload)


@app.get("/exercises/muscle-groups", response_model=list[schemas.MuscleGroupOut])
def list_muscle_groups(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    return crud.get_muscle_groups(db)


@app.get("/exercises/equipment-types", response_model=list[schemas.EquipmentTypeOut])
def list_equipment_types(
    db: Session = Depends(get_db),
    _: models.User = Depends(auth.get_current_user),
):
    return crud.get_equipment_types(db)


# ──────────────────────────────────────────────────────────────────────────────
# Workout session routes
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/workouts/sessions", response_model=list[schemas.WorkoutSessionOut])
def list_sessions(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_sessions(db, user_id=current_user.id, skip=skip, limit=limit)


@app.post("/workouts/sessions", response_model=schemas.WorkoutSessionOut, status_code=201)
def create_session(
    payload: schemas.WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.create_session(db, user_id=current_user.id, payload=payload)


@app.get("/workouts/sessions/{session_id}", response_model=schemas.WorkoutSessionDetail)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session = crud.get_session(db, session_id=session_id, user_id=current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.post("/workouts/sessions/{session_id}/logs", response_model=schemas.PerformanceLogOut, status_code=201)
def log_performance(
    session_id: int,
    payload: schemas.PerformanceLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session = crud.get_session(db, session_id=session_id, user_id=current_user.id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return crud.create_performance_log(db, session_id=session_id, user_id=current_user.id, payload=payload)


# ──────────────────────────────────────────────────────────────────────────────
# Body metrics routes
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/metrics/body", response_model=list[schemas.BodyMetricOut])
def list_metrics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_body_metrics(db, user_id=current_user.id)


@app.post("/metrics/body", response_model=schemas.BodyMetricOut, status_code=201)
def create_metric(
    payload: schemas.BodyMetricCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.create_body_metric(db, user_id=current_user.id, payload=payload)


# ──────────────────────────────────────────────────────────────────────────────
# Analytics routes  (new — consumed by Next.js dashboard)
# ──────────────────────────────────────────────────────────────────────────────

@app.get("/analytics/summary", response_model=dict)
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_analytics_summary(db, current_user.id)


@app.get("/ai/sessions", response_model=list[schemas.ChatSessionOut])
async def list_chat_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_chat_sessions(db, current_user.id)


@app.get("/ai/history", response_model=list[schemas.ChatMessage])
async def get_chat_history_endpoint(
    session_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_chat_history(db, current_user.id, session_id=session_id)


@app.post("/ai/chat", response_model=schemas.ChatResponse)
async def ai_chat_endpoint(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    session_id = payload.session_id
    if not session_id:
        new_session = crud.create_chat_session(db, current_user.id)
        session_id = new_session.id

    # Save user message
    crud.save_chat_message(db, current_user.id, "user", payload.message, session_id=session_id)

    # Fetch deep context about the user
    summary = crud.get_analytics_summary(db, current_user.id)
    recent_metrics = crud.get_body_metrics(db, current_user.id)
    recent_exercises = crud.get_recent_exercises_summary(db, current_user.id)
    latest_metric = recent_metrics[0] if recent_metrics else None
    
    context = f"User: {current_user.full_name}. "
    if latest_metric:
        context += f"Weight: {latest_metric.weight_kg}kg, Goal: {latest_metric.goal}. "
    context += f"Recent Workouts: {recent_exercises}. "
    context += f"30-day Volume: {summary.get('total_volume_kg', 0)}kg, Sessions: {summary.get('total_sessions', 0)}."

    history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]
    response = await ai_service.get_ai_coach_response(payload.message, history_dicts, user_context=context)
    
    # Save assistant response
    crud.save_chat_message(db, current_user.id, "assistant", response, session_id=session_id)
    
    return {"response": response, "session_id": session_id}


@app.get("/analytics/volume-trend")
def volume_trend(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_volume_trend(db, user_id=current_user.id)


@app.get("/analytics/strength-progress/{exercise_id}")
def strength_progress(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.get_strength_progress(db, user_id=current_user.id, exercise_id=exercise_id)
