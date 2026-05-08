import sys
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from database import SessionLocal
import models
from crud import get_exercises

def seed_dummy_data():
    db = SessionLocal()
    try:
        # 1. Get all users
        users = db.query(models.User).all()
        if not users:
            print("No users found in database. Please register a user first!")
            return

        # 2. Make sure exercises exist
        exercises = get_exercises(db)
        if not exercises:
            print("No exercises found! Please open the 'Exercises' tab in the app first to auto-seed them.")
            return

        now = datetime.now(timezone.utc)

        for user in users:
            print(f"Cleaning existing data and seeding fresh dummy data for user: {user.email} (ID: {user.id})")
            
            # 3. Wipe existing data for this user to ensure the new 3-month format is applied
            db.query(models.PerformanceLog).filter(models.PerformanceLog.user_id == user.id).delete()
            db.query(models.WorkoutSession).filter(models.WorkoutSession.user_id == user.id).delete()
            db.query(models.BodyMetric).filter(models.BodyMetric.user_id == user.id).delete()
            db.commit()

            print(f"  Generating 36 Workout Sessions for {user.email}...")
            # Generate 36 sessions over the last 90 days (3 months, ~3 times a week)
            for i in range(36):
                days_ago = 90 - (i * 2.5) # Spaced out
                session_date = now - timedelta(days=days_ago)
                
                session = models.WorkoutSession(
                    user_id=user.id,
                    session_date=session_date,
                    notes=f"Dummy session {i+1} - Consistent work!"
                )
                db.add(session)
                db.commit()
                db.refresh(session)

                # Add 3-4 random exercises per session
                session_exercises = random.sample(exercises, random.randint(3, 4))
                for ex in session_exercises:
                    # Progressive overload simulation
                    base_weight = 40.0
                    if "Squat" in ex.name or "Deadlift" in ex.name:
                        base_weight = 60.0
                    elif "Curl" in ex.name or "Extension" in ex.name:
                        base_weight = 15.0
                    
                    weight = base_weight + (i * 1.5) # Weight increases over 3 months
                    
                    log = models.PerformanceLog(
                        session_id=session.id,
                        user_id=user.id,
                        exercise_id=ex.id,
                        sets=3,
                        reps=random.randint(8, 12),
                        weight_kg=weight,
                        logged_at=session_date
                    )
                    db.add(log)
                db.commit()

            print(f"  Generating 12 Body Metrics for {user.email}...")
            # Generate 12 body metrics over the last 90 days
            start_weight = 88.0
            for i in range(12):
                days_ago = 90 - (i * 7.5)
                metric_date = now - timedelta(days=days_ago)
                weight = start_weight - (i * 0.4)
                
                metric = models.BodyMetric(
                    user_id=user.id,
                    weight_kg=weight,
                    goal="Lose Fat",
                    notes="Weekly weigh-in",
                    recorded_at=metric_date
                )
                db.add(metric)
            db.commit()

        print("\nSuccessfully added dummy data for all users! Check your Dashboard and Analytics.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_dummy_data()
