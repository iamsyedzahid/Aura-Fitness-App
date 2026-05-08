"""models.py — SQLAlchemy ORM models for AuraFit."""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime,
    ForeignKey, Boolean, JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class UserRole(Base):
    __tablename__ = "user_roles"
    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)      # e.g. "Athlete", "Administrator"
    users = relationship("User", back_populates="role_rel")


class User(Base):
    __tablename__ = "users"
    id           = Column(Integer, primary_key=True, index=True)
    email        = Column(String(255), unique=True, nullable=False, index=True)
    full_name    = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role_id      = Column(Integer, ForeignKey("user_roles.id"), nullable=False, default=2)
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    role_rel     = relationship("UserRole", back_populates="users")
    sessions     = relationship("WorkoutSession", back_populates="user")
    metrics      = relationship("BodyMetric", back_populates="user")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

    @property
    def role(self) -> str:
        return self.role_rel.name if self.role_rel else "Athlete"


class EquipmentType(Base):
    __tablename__ = "equipment_types"
    id   = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)


class MuscleGroup(Base):
    __tablename__ = "muscle_groups"
    id   = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)


class ExerciseRegistry(Base):
    __tablename__ = "exercise_registry"
    id               = Column(Integer, primary_key=True)
    name             = Column(String(200), nullable=False)
    description      = Column(Text)
    muscle_group_id  = Column(Integer, ForeignKey("muscle_groups.id"))
    equipment_type_id = Column(Integer, ForeignKey("equipment_types.id"))
    aura_points      = Column(Integer, default=10)
    effectiveness    = Column(String(100), default="High")

    muscle_group     = relationship("MuscleGroup")
    equipment_type   = relationship("EquipmentType")
    performance_logs = relationship("PerformanceLog", back_populates="exercise")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"
    id           = Column(Integer, primary_key=True)
    user_id      = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_date = Column(DateTime(timezone=True), server_default=func.now())
    notes        = Column(Text)

    user         = relationship("User", back_populates="sessions")
    logs         = relationship("PerformanceLog", back_populates="session", cascade="all, delete-orphan")


class PerformanceLog(Base):
    __tablename__ = "performance_logs"
    id          = Column(Integer, primary_key=True)
    session_id  = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercise_registry.id"), nullable=False)
    sets        = Column(Integer, nullable=False, default=1)
    reps        = Column(Integer, nullable=False)
    weight_kg   = Column(Float, nullable=False, default=0.0)
    notes       = Column(Text)
    logged_at   = Column(DateTime(timezone=True), server_default=func.now())

    session     = relationship("WorkoutSession", back_populates="logs")
    exercise    = relationship("ExerciseRegistry", back_populates="performance_logs")


class BodyMetric(Base):
    __tablename__ = "body_metrics"
    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    weight_kg  = Column(Float)
    goal       = Column(String(255))
    notes      = Column(Text)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User", back_populates="metrics")


class SystemAuditTrail(Base):
    __tablename__ = "system_audit_trail"
    id          = Column(Integer, primary_key=True)
    table_name  = Column(String(100), nullable=False)
    operation   = Column(String(10), nullable=False)   # INSERT | UPDATE | DELETE
    old_data    = Column(JSON)
    new_data    = Column(JSON)
    changed_at  = Column(DateTime(timezone=True), server_default=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), default="New Chat")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=True)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_messages")
    session = relationship("ChatSession", back_populates="messages")
