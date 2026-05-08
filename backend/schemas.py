"""schemas.py — Pydantic v2 request/response schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool


class Token(BaseModel):
    access_token: str
    token_type: str


# ── Exercises ─────────────────────────────────────────────────────────────────

class ExerciseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    muscle_group_id: Optional[int] = None
    equipment_type_id: Optional[int] = None
    aura_points: Optional[int] = 10
    effectiveness: Optional[str] = "High"


class MuscleGroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class EquipmentTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: Optional[str] = None
    aura_points: int
    effectiveness: str
    muscle_group: Optional[MuscleGroupOut] = None
    equipment_type: Optional[EquipmentTypeOut] = None


# ── Performance logs ──────────────────────────────────────────────────────────

class PerformanceLogCreate(BaseModel):
    exercise_id: int
    sets: int = 1
    reps: int
    weight_kg: float = 0.0
    notes: Optional[str] = None


class PerformanceLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    exercise_id: int
    sets: int
    reps: int
    weight_kg: float
    notes: Optional[str] = None
    logged_at: datetime


# ── Workout sessions ──────────────────────────────────────────────────────────

class WorkoutSessionCreate(BaseModel):
    notes: Optional[str] = None
    session_date: Optional[datetime] = None


class WorkoutSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    session_date: datetime
    notes: Optional[str] = None
    log_count: Optional[int] = None  # computed field, populated in crud


class WorkoutSessionDetail(WorkoutSessionOut):
    logs: list[PerformanceLogOut] = []


# ── Body metrics ──────────────────────────────────────────────────────────────

class BodyMetricCreate(BaseModel):
    weight_kg: Optional[float] = None
    goal: Optional[str] = None
    notes: Optional[str] = None


class BodyMetricOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    weight_kg: Optional[float]
    goal: Optional[str]
    notes: Optional[str]

# ── AI Coaching ───────────────────────────────────────────────────────────────

class ChatSessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    created_at: datetime


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[int] = None
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    response: str
    session_id: int
