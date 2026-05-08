"""
database.py — SQLAlchemy engine + session factory + startup DB initialisation.

FIX: The previous apply_db_upgrades.py split the SQL on semicolons, which broke
PL/pgSQL function bodies that contain internal semicolons (e.g. variable declarations
like `v_old_data JSONB := NULL;`).  We now execute the entire SQL script as ONE
atomic block via a raw psycopg2 cursor, bypassing SQLAlchemy's statement splitting.
"""

import os
import logging
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load .env from the same directory as this file
load_dotenv(Path(__file__).parent / ".env")

log = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/aurafit",
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # detect stale connections
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ──────────────────────────────────────────────────────────────────────────────
# Dependency — yields a DB session and closes it when the request is done
# ──────────────────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ──────────────────────────────────────────────────────────────────────────────
# Startup: create tables + apply advanced SQL features
# ──────────────────────────────────────────────────────────────────────────────

def setup_database() -> None:
    """Called once at application startup (via lifespan hook in main.py)."""
    _create_tables()
    _apply_advanced_sql()


def _create_tables() -> None:
    """Create all SQLAlchemy-managed tables if they don't exist yet."""
    # Import models so SQLAlchemy registers them before create_all
    import models  # noqa: F401  (side-effect: registers ORM metadata)
    Base.metadata.create_all(bind=engine)
    log.info("Database tables verified / created.")


# ──────────────────────────────────────────────────────────────────────────────
# Advanced SQL (full-text search, audit triggers, materialised views)
#
# KEY FIX: We grab the raw psycopg2 connection and call .execute() on it
# directly so the *entire* script runs as a single command.  SQLAlchemy's
# text() helper would split on semicolons and break PL/pgSQL blocks.
# ──────────────────────────────────────────────────────────────────────────────

_ADVANCED_SQL = """
DO $$ BEGIN

  -- ── 1. Full-Text Search column on exercise_registry ───────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_name = 'exercise_registry' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE exercise_registry
      ADD COLUMN search_vector TSVECTOR
        GENERATED ALWAYS AS (
          to_tsvector('english',
            coalesce(name, '') || ' ' || coalesce(description, ''))
        ) STORED;

    CREATE INDEX IF NOT EXISTS idx_exercise_fts
      ON exercise_registry USING GIN (search_vector);
  END IF;

  -- ── 2. Audit trigger function ──────────────────────────────────────────────
  -- The function must be created outside the anonymous block because PL/pgSQL
  -- does not allow CREATE OR REPLACE FUNCTION inside a DO block in older PG
  -- versions.  We use a separate statement below (see _AUDIT_FUNC_SQL).

  -- ── 3. Materialised view: per-exercise best lifts ─────────────────────────
  -- Only create if both tables have the expected columns (guards against
  -- fresh DBs where tables were just created and might have a schema mismatch).
  IF NOT EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'mv_best_lifts')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercise_registry' AND column_name = 'id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_logs' AND column_name = 'exercise_id')
  THEN
    EXECUTE $mv$
      CREATE MATERIALIZED VIEW mv_best_lifts AS
      SELECT
        pl.user_id,
        pl.exercise_id,
        er.name            AS exercise_name,
        MAX(pl.weight_kg)  AS best_weight_kg,
        MAX(pl.reps)       AS max_reps,
        COUNT(*)           AS total_sets
      FROM  performance_logs pl
      JOIN  exercise_registry er ON er.id = pl.exercise_id
      GROUP BY pl.user_id, pl.exercise_id, er.name
    $mv$;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_best_lifts_pk
      ON mv_best_lifts (user_id, exercise_id);
  END IF;

END $$;
"""

# Audit function created OUTSIDE the DO block so it is a proper top-level DDL.
_AUDIT_FUNC_SQL = """
CREATE OR REPLACE FUNCTION fn_audit_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $func$
DECLARE
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    v_old_data := row_to_json(OLD)::JSONB;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old_data := row_to_json(OLD)::JSONB;
    v_new_data := row_to_json(NEW)::JSONB;
  ELSIF (TG_OP = 'INSERT') THEN
    v_new_data := row_to_json(NEW)::JSONB;
  END IF;

  INSERT INTO system_audit_trail
    (table_name, operation, old_data, new_data, changed_at)
  VALUES
    (TG_TABLE_NAME, TG_OP, v_old_data, v_new_data, now());

  RETURN COALESCE(NEW, OLD);
END;
$func$;
"""

# Tables that should have audit triggers.
_AUDIT_TABLES = ["users", "workout_sessions", "performance_logs", "body_metrics"]


def _apply_advanced_sql() -> None:
    """
    Execute the advanced DDL using a raw psycopg2 cursor so that PL/pgSQL
    blocks are sent as-is — no semicolon splitting, no statement fragmentation.
    """
    raw_conn = engine.raw_connection()
    try:
        cursor = raw_conn.cursor()

        # 1. Anonymous DO block (FTS column + materialised view)
        cursor.execute(_ADVANCED_SQL)

        # 2. Audit trigger function (standalone DDL, safe to run separately)
        cursor.execute(_AUDIT_FUNC_SQL)

        # 3. Attach audit triggers to each table (idempotent via DROP IF EXISTS)
        for table in _AUDIT_TABLES:
            trigger_name = f"trg_audit_{table}"
            cursor.execute(f"""
                DROP TRIGGER IF EXISTS {trigger_name} ON {table};
                CREATE TRIGGER {trigger_name}
                  AFTER INSERT OR UPDATE OR DELETE ON {table}
                  FOR EACH ROW EXECUTE FUNCTION fn_audit_trigger();
            """)

        raw_conn.commit()
        log.info("Successfully applied advanced DB features on startup.")
    except Exception as exc:
        raw_conn.rollback()
        log.error("Failed to apply advanced DB features: %s", exc)
        # Don't crash the server — log the error and continue.
    finally:
        raw_conn.close()