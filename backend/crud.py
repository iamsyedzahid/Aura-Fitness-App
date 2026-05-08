"""crud.py — Database query and manipulation functions."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, text
from sqlalchemy.orm import Session

import models, schemas
from auth import hash_password, verify_password


# ── Users ──────────────────────────────────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, payload: schemas.UserCreate) -> models.User:
    # Default role = "Athlete" (id=2)
    role = db.query(models.UserRole).filter_by(name="Athlete").first()
    if not role:
        role = models.UserRole(name="Athlete")
        db.add(role)
        db.flush()

    user = models.User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


# ── Exercises ──────────────────────────────────────────────────────────────────

def _seed_exercises(db: Session):
    # Ensure muscle groups and equipment exist
    get_muscle_groups(db)
    get_equipment_types(db)
    
    # Fetch maps for IDs
    mg_map = {m.name: m.id for m in db.query(models.MuscleGroup).all()}
    eq_map = {e.name: e.id for e in db.query(models.EquipmentType).all()}

    defaults = [
        {
            "name": "Barbell Bench Press",
            "description": "Primary Muscles: Chest, Shoulders, Triceps.\nHow to: Lie on a flat bench, grip the barbell slightly wider than shoulder-width. Lower the bar to your mid-chest, then press it back up until arms are fully extended.\nEffectiveness: Essential compound movement for building upper body pushing strength and chest mass.",
            "muscle": "Chest",
            "equipment": "Barbell"
        },
        {
            "name": "Barbell Squat",
            "description": "Primary Muscles: Quads, Glutes, Hamstrings, Core.\nHow to: Place the barbell across your upper back. Keep your chest up and core braced, bend your knees and hips to lower your body until thighs are parallel to the floor, then drive back up.\nEffectiveness: The king of all leg exercises. Crucial for overall lower body development and core stability.",
            "muscle": "Legs",
            "equipment": "Barbell"
        },
        {
            "name": "Conventional Deadlift",
            "description": "Primary Muscles: Hamstrings, Glutes, Lower Back, Traps.\nHow to: Stand with mid-foot under the bar. Bend over and grab the bar, bend your knees until shins touch the bar, lift your chest, and pull the bar up by extending hips and knees.\nEffectiveness: Unmatched for building posterior chain strength and overall full-body power.",
            "muscle": "Back",
            "equipment": "Barbell"
        },
        {
            "name": "Pull-up",
            "description": "Primary Muscles: Lats, Biceps, Upper Back.\nHow to: Grab a pull-up bar with an overhand grip. Pull yourself up until your chin clears the bar, then lower yourself under control.\nEffectiveness: One of the best bodyweight exercises for back width and upper body pulling strength.",
            "muscle": "Back",
            "equipment": "Bodyweight"
        },
        {
            "name": "Overhead Press",
            "description": "Primary Muscles: Shoulders, Triceps, Core.\nHow to: Stand and press a barbell from your shoulders directly overhead until your arms are locked out.\nEffectiveness: Excellent for building strong, broad shoulders and improving overhead stability.",
            "muscle": "Shoulders",
            "equipment": "Barbell"
        },
        {
            "name": "Dumbbell Bicep Curl",
            "description": "Primary Muscles: Biceps.\nHow to: Hold a dumbbell in each hand, keep your elbows close to your torso, and curl the weights up towards your shoulders.\nEffectiveness: Essential isolation exercise for maximizing bicep hypertrophy.",
            "muscle": "Arms",
            "equipment": "Dumbbell"
        },
        {
            "name": "Tricep Cable Pushdown",
            "description": "Primary Muscles: Triceps.\nHow to: Attach a rope or straight bar to a high cable pulley. Push the attachment down until arms are fully extended, focusing on squeezing the triceps.\nEffectiveness: Great isolation movement for building tricep size and lockout strength.",
            "muscle": "Arms",
            "equipment": "Cable"
        },
        {
            "name": "Leg Extension",
            "description": "Primary Muscles: Quads.\nHow to: Sit on the machine with your legs under the pad. Extend your legs forward until fully straight, then slowly return to the starting position.\nEffectiveness: Highly effective for isolating and carving out the quadriceps without lower back stress.",
            "muscle": "Legs",
            "equipment": "Machine"
        },
        {
            "name": "Leg Press",
            "description": "Primary Muscles: Quadriceps, Glutes.\nHow to: Sit on the machine with feet shoulder-width apart on the platform. Lower the weight until your knees are at 90 degrees, then press back up without locking your knees.\nEffectiveness: Excellent for building mass in the lower body with less spinal loading than squats.",
            "muscle": "Legs",
            "equipment": "Machine"
        },
        {
            "name": "Lateral Raises",
            "description": "Primary Muscles: Lateral Deltoids (Shoulders).\nHow to: Stand with dumbbells at your sides. Lift them out to the sides until they are level with your shoulders. Lower slowly.\nEffectiveness: The best exercise for building 'width' in the shoulders and achieving the V-taper look.",
            "muscle": "Shoulders",
            "equipment": "Dumbbell"
        },
        {
            "name": "Lat Pulldown",
            "description": "Primary Muscles: Lats (Back), Biceps.\nHow to: Sit at the machine and pull the bar down to your upper chest while leaning back slightly. Squeeze your shoulder blades together.\nEffectiveness: A fundamental movement for back width and vertical pulling strength.",
            "muscle": "Back",
            "equipment": "Machine"
        },
        {
            "name": "Bicep Curls",
            "description": "Primary Muscles: Biceps.\nHow to: Hold dumbbells with palms forward. Curl the weights toward your shoulders while keeping elbows pinned to your sides.\nEffectiveness: Isolated movement for peak bicep development.",
            "muscle": "Arms",
            "equipment": "Dumbbell"
        },
        {
            "name": "Tricep Pushdowns",
            "description": "Primary Muscles: Triceps.\nHow to: Using a cable machine, push the bar or rope down until your arms are fully extended. Focus on isolating the triceps.\nEffectiveness: Key for building the back of the arm and overall arm thickness.",
            "muscle": "Arms",
            "equipment": "Cable"
        },
        {
            "name": "Leg Extensions",
            "description": "Primary Muscles: Quadriceps.\nHow to: Sit in the machine and extend your legs until straight. Squeeze the quads at the top.\nEffectiveness: Great for isolating the quads and building definition around the knee.",
            "muscle": "Legs",
            "equipment": "Machine"
        },
        {
            "name": "Hamstring Curls",
            "description": "Primary Muscles: Hamstrings.\nHow to: Lying or sitting in the machine, curl the weight toward your glutes. Control the eccentric phase.\nEffectiveness: Essential for posterior chain balance and knee health.",
            "muscle": "Legs",
            "equipment": "Machine"
        },
        {
            "name": "Face Pulls",
            "description": "Primary Muscles: Rear Deltoids, Upper Back.\nHow to: Pull the rope toward your forehead, pulling the ends apart. Focus on external rotation.\nEffectiveness: Vital for shoulder health and posture.",
            "muscle": "Shoulders",
            "equipment": "Cable"
        },
        {
            "name": "Plank",
            "description": "Primary Muscles: Core (Abs, Obliques).\nHow to: Hold a push-up like position resting on your forearms instead of hands. Keep your body in a straight line from head to heels.\nEffectiveness: One of the safest and most effective exercises for building deep core stability.",
            "muscle": "Core",
            "equipment": "Bodyweight"
        }
    ]

    exercises_to_insert = []
    for ex in defaults:
        m_id = mg_map.get(ex["muscle"])
        e_id = eq_map.get(ex["equipment"])
        if not m_id or not e_id:
            continue
        
        # Determine aura points and effectiveness for defaults
        aura = 20 if ex["equipment"] == "Barbell" else 15 if ex["equipment"] in ["Dumbbell", "Bodyweight"] else 10
        effect = "S-Tier" if "Primary" in ex["description"] and "Effective" in ex["description"] else "A-Tier"

        exercises_to_insert.append(
            models.ExerciseRegistry(
                name=ex["name"],
                description=ex["description"],
                muscle_group_id=m_id,
                equipment_type_id=e_id,
                aura_points=aura,
                effectiveness=effect
            )
        )
    
    if exercises_to_insert:
        db.add_all(exercises_to_insert)
        db.commit()


def get_exercises(
    db: Session,
    search: Optional[str] = None,
    muscle_group_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> list[models.ExerciseRegistry]:
    if db.query(models.ExerciseRegistry).count() == 0:
        _seed_exercises(db)

    q = db.query(models.ExerciseRegistry)
    if search:
        # Use PostgreSQL full-text search if the column exists, else ILIKE fallback
        try:
            q = q.filter(
                text("search_vector @@ plainto_tsquery('english', :q)").bindparams(q=search)
            )
        except Exception:
            q = q.filter(models.ExerciseRegistry.name.ilike(f"%{search}%"))
    if muscle_group_id:
        q = q.filter(models.ExerciseRegistry.muscle_group_id == muscle_group_id)
    return q.offset(skip).limit(limit).all()


def get_muscle_groups(db: Session) -> list[models.MuscleGroup]:
    groups = db.query(models.MuscleGroup).all()
    if not groups:
        defaults = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"]
        groups = [models.MuscleGroup(name=n) for n in defaults]
        db.add_all(groups)
        db.commit()
        for g in groups:
            db.refresh(g)
    return groups


def get_equipment_types(db: Session) -> list[models.EquipmentType]:
    types = db.query(models.EquipmentType).all()
    if not types:
        defaults = ["Barbell", "Dumbbell", "Machine", "Cable", "Bodyweight"]
        types = [models.EquipmentType(name=n) for n in defaults]
        db.add_all(types)
        db.commit()
        for t in types:
            db.refresh(t)
    return types


def create_exercise(db: Session, payload: schemas.ExerciseCreate) -> models.ExerciseRegistry:
    exercise = models.ExerciseRegistry(
        name=payload.name,
        description=payload.description,
        muscle_group_id=payload.muscle_group_id,
        equipment_type_id=payload.equipment_type_id,
        aura_points=payload.aura_points or 10,
        effectiveness=payload.effectiveness or "High",
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


# ── Workout sessions ───────────────────────────────────────────────────────────

def get_sessions(db: Session, user_id: int, skip: int = 0, limit: int = 20):
    sessions = (
        db.query(models.WorkoutSession)
        .filter(models.WorkoutSession.user_id == user_id)
        .order_by(models.WorkoutSession.session_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    # Attach log_count to each session object
    for s in sessions:
        s.log_count = len(s.logs)
    return sessions


def get_session(db: Session, session_id: int, user_id: int) -> Optional[models.WorkoutSession]:
    session = (
        db.query(models.WorkoutSession)
        .filter(
            models.WorkoutSession.id == session_id,
            models.WorkoutSession.user_id == user_id,
        )
        .first()
    )
    if session:
        session.log_count = len(session.logs)
    return session


def create_session(
    db: Session, user_id: int, payload: schemas.WorkoutSessionCreate
) -> models.WorkoutSession:
    session = models.WorkoutSession(
        user_id=user_id,
        notes=payload.notes,
        session_date=payload.session_date or datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    session.log_count = 0
    return session


def create_performance_log(
    db: Session, session_id: int, user_id: int, payload: schemas.PerformanceLogCreate
) -> models.PerformanceLog:
    log = models.PerformanceLog(
        session_id=session_id,
        user_id=user_id,
        exercise_id=payload.exercise_id,
        sets=payload.sets,
        reps=payload.reps,
        weight_kg=payload.weight_kg,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ── Body metrics ───────────────────────────────────────────────────────────────

def get_body_metrics(db: Session, user_id: int) -> list[models.BodyMetric]:
    return (
        db.query(models.BodyMetric)
        .filter(models.BodyMetric.user_id == user_id)
        .order_by(models.BodyMetric.recorded_at.desc())
        .all()
    )


def create_body_metric(
    db: Session, user_id: int, payload: schemas.BodyMetricCreate
) -> models.BodyMetric:
    metric = models.BodyMetric(
        user_id=user_id,
        weight_kg=payload.weight_kg,
        goal=payload.goal,
        notes=payload.notes,
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric


# ── Analytics ──────────────────────────────────────────────────────────────────

def get_analytics_summary(db: Session, user_id: int) -> dict:
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    total_sessions = (
        db.query(func.count(models.WorkoutSession.id))
        .filter(models.WorkoutSession.user_id == user_id)
        .scalar() or 0
    )
    sessions_this_week = (
        db.query(func.count(models.WorkoutSession.id))
        .filter(
            models.WorkoutSession.user_id == user_id,
            models.WorkoutSession.session_date >= week_ago,
        )
        .scalar() or 0
    )
    total_exercises = (
        db.query(func.count(models.PerformanceLog.id))
        .filter(models.PerformanceLog.user_id == user_id)
        .scalar() or 0
    )
    total_volume = (
        db.query(func.sum(models.PerformanceLog.sets * models.PerformanceLog.reps * models.PerformanceLog.weight_kg))
        .filter(models.PerformanceLog.user_id == user_id)
        .scalar() or 0.0
    )

    return {
        "total_sessions": total_sessions,
        "sessions_this_week": sessions_this_week,
        "total_exercises": total_exercises,
        "total_volume_kg": float(total_volume),
    }


def get_volume_trend(db: Session, user_id: int, days: int = 30) -> list[dict]:
    start = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (
        db.query(
            func.date(models.WorkoutSession.session_date).label("date"),
            func.sum(
                models.PerformanceLog.sets
                * models.PerformanceLog.reps
                * models.PerformanceLog.weight_kg
            ).label("volume_kg"),
        )
        .join(models.WorkoutSession, models.PerformanceLog.session_id == models.WorkoutSession.id)
        .filter(
            models.PerformanceLog.user_id == user_id,
            models.WorkoutSession.session_date >= start,
        )
        .group_by(func.date(models.WorkoutSession.session_date))
        .order_by(func.date(models.WorkoutSession.session_date))
        .all()
    )
    return [{"date": str(r.date), "volume_kg": float(r.volume_kg or 0)} for r in rows]


def get_strength_progress(db: Session, user_id: int, exercise_id: int) -> list[dict]:
    rows = (
        db.query(
            func.date(models.WorkoutSession.session_date).label("date"),
            func.max(models.PerformanceLog.weight_kg).label("max_weight_kg"),
        )
        .join(models.WorkoutSession, models.PerformanceLog.session_id == models.WorkoutSession.id)
        .filter(
            models.PerformanceLog.user_id == user_id,
            models.PerformanceLog.exercise_id == exercise_id,
        )
        .group_by(func.date(models.WorkoutSession.session_date))
        .order_by(func.date(models.WorkoutSession.session_date))
        .all()
    )
    return [{"date": str(r.date), "max_weight_kg": float(r.max_weight_kg or 0)} for r in rows]
def get_recent_exercises_summary(db: Session, user_id: int, limit: int = 10) -> str:
    # Get the last N performance logs with exercise names
    logs = (
        db.query(models.PerformanceLog, models.ExerciseRegistry.name)
        .join(models.ExerciseRegistry, models.PerformanceLog.exercise_id == models.ExerciseRegistry.id)
        .filter(models.PerformanceLog.user_id == user_id)
        .order_by(models.PerformanceLog.id.desc())
        .limit(limit)
        .all()
    )
    if not logs:
        return "No workouts recorded yet."
    
    summary_parts = []
    for log_obj, name in logs:
        summary_parts.append(f"{name}: {log_obj.sets}x{log_obj.reps} @ {log_obj.weight_kg}kg")
    
    return ", ".join(summary_parts)
def get_chat_sessions(db: Session, user_id: int):
    return (
        db.query(models.ChatSession)
        .filter(models.ChatSession.user_id == user_id)
        .order_by(models.ChatSession.created_at.desc())
        .all()
    )

def create_chat_session(db: Session, user_id: int, title: str = "New Chat"):
    session = models.ChatSession(user_id=user_id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def get_chat_history(db: Session, user_id: int, session_id: int = None, limit: int = 50):
    q = db.query(models.ChatMessage).filter(models.ChatMessage.user_id == user_id)
    if session_id:
        q = q.filter(models.ChatMessage.session_id == session_id)
    return q.order_by(models.ChatMessage.created_at.asc()).limit(limit).all()

def save_chat_message(db: Session, user_id: int, role: str, content: str, session_id: int = None):
    msg = models.ChatMessage(user_id=user_id, role=role, content=content, session_id=session_id)
    db.add(msg)
    
    # If it's the first user message in a session, update the session title
    if session_id and role == "user":
        session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
        if session and session.title == "New Chat":
            session.title = (content[:30] + "...") if len(content) > 30 else content
            db.add(session)

    db.commit()
    db.refresh(msg)
    return msg
