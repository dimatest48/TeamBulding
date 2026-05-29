import logging
import os
import secrets
import time
from datetime import datetime, timedelta, timezone

# passlib 1.7.4 probes bcrypt.__about__ which newer bcrypt removed; the probe
# fails harmlessly but logs a noisy traceback. Suppress just that logger.
logging.getLogger("passlib.handlers.bcrypt").setLevel(logging.ERROR)

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import RevokedToken, User

# In production, SECRET_KEY MUST be supplied via the environment.
# We only fall back to a generated ephemeral key in dev so that a weak,
# source-visible secret is never used to sign real tokens.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    SECRET_KEY = secrets.token_urlsafe(48)
    print(
        "[security] WARNING: SECRET_KEY not set. Using a random ephemeral key. "
        "Tokens will be invalidated on restart. Set SECRET_KEY in production."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# auto_error=False so we can return a clean 401 instead of 403 when missing.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CLERK_ISSUER = os.getenv("CLERK_ISSUER")
CLERK_AUTHORIZED_PARTIES = [
    origin.strip()
    for origin in os.getenv("CLERK_AUTHORIZED_PARTIES", os.getenv("CORS_ORIGINS", "")).split(",")
    if origin.strip()
]
_jwks_cache: dict[str, object] = {"expires_at": 0.0, "keys": []}


def _prepare_password(password: str) -> bytes:
    # bcrypt only uses the first 72 bytes; truncate on a byte boundary so
    # multibyte passwords never raise and behaviour stays deterministic.
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return password_context.hash(_prepare_password(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_context.verify(_prepare_password(plain_password), hashed_password)


def create_access_token(subject: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": subject,
        "exp": expires_at,
        "jti": secrets.token_urlsafe(16),  # unique id so the token can be revoked
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def _credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _get_clerk_jwks() -> list[dict]:
    if not CLERK_JWKS_URL:
        raise _credentials_error()

    now = time.time()
    if float(_jwks_cache["expires_at"]) > now:
        return list(_jwks_cache["keys"])

    try:
        response = httpx.get(CLERK_JWKS_URL, timeout=5)
        response.raise_for_status()
        keys = response.json().get("keys", [])
    except (httpx.HTTPError, ValueError) as exc:
        raise _credentials_error() from exc

    _jwks_cache["keys"] = keys
    _jwks_cache["expires_at"] = now + 60 * 30
    return keys


def _decode_clerk_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        alg = header.get("alg")
        if alg != "RS256" or not kid:
            raise _credentials_error()

        key = next((candidate for candidate in _get_clerk_jwks() if candidate.get("kid") == kid), None)
        if key is None:
            _jwks_cache["expires_at"] = 0.0
            key = next((candidate for candidate in _get_clerk_jwks() if candidate.get("kid") == kid), None)
        if key is None:
            raise _credentials_error()

        options = {"verify_aud": False}
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER or None,
            options=options,
        )
    except (JWTError, ValueError) as exc:
        raise _credentials_error() from exc

    authorized_party = payload.get("azp")
    if CLERK_AUTHORIZED_PARTIES and authorized_party not in CLERK_AUTHORIZED_PARTIES:
        raise _credentials_error()
    return payload


def _get_or_create_clerk_user(payload: dict, db: Session) -> User:
    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        raise _credentials_error()

    user = db.scalar(select(User).where(User.clerk_user_id == clerk_user_id))
    if user:
        return user

    email = f"{clerk_user_id}@clerk.local"
    user = User(
        clerk_user_id=clerk_user_id,
        email=email.lower(),
        name="Student",
        hashed_password="clerk-managed",
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def revoke_token(token: str, db: Session) -> None:
    """Add the token's jti to the denylist (T-08 logout)."""
    try:
        payload = _decode(token)
    except JWTError:
        return  # already invalid; nothing to revoke
    jti = payload.get("jti")
    if jti and db.get(RevokedToken, jti) is None:
        db.add(RevokedToken(jti=jti))
        db.commit()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if CLERK_JWKS_URL:
        return _get_or_create_clerk_user(_decode_clerk_token(token), db)

    credentials_error = _credentials_error()

    try:
        payload = _decode(token)
        user_id = payload.get("sub")
        jti = payload.get("jti")
        if user_id is None:
            raise credentials_error
    except (JWTError, ValueError) as exc:
        raise credentials_error from exc

    # reject tokens that were explicitly revoked on logout
    if jti and db.get(RevokedToken, jti) is not None:
        raise credentials_error

    user = db.get(User, int(user_id))
    if user is None:
        raise credentials_error
    return user


def get_current_token(token: str = Depends(oauth2_scheme)) -> str:
    return token
