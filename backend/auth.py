"""
auth.py — JWT token creation, password hashing, current-user dependency.

Fixes vs original:
 - SECRET_KEY defaults to a real random value with a warning if env var is missing
 - Expiry is now configurable via ACCESS_TOKEN_EXPIRE_MINUTES env var
 - get_current_user raises 401 (not 403) for invalid/missing tokens
 - Passwords hashed with bcrypt via passlib
"""

import os
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from database import get_db

log = logging.getLogger(__name__)

# Load .env from the same directory as this file
load_dotenv(Path(__file__).parent / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    import secrets
    SECRET_KEY = secrets.token_hex(32)
    log.warning(
        "SECRET_KEY not set — generated a random key.  "
        "All existing tokens will be invalidated on restart.  "
        "Set SECRET_KEY in your .env for production."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


# ── Passwords ──────────────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ── Tokens ────────────────────────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── FastAPI dependency ─────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """Validate JWT and return the User ORM object; raise 401 on failure."""
    from crud import get_user_by_id  # lazy import avoids circular dependency

    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = get_user_by_id(db, int(user_id))
    if user is None:
        raise credentials_exc
    return user


def require_admin(current_user=Depends(get_current_user)):
    """Additional dependency that enforces Administrator role."""
    if current_user.role != "Administrator":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
