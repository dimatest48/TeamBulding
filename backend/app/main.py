from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

import os

from .database import Base, engine, get_db
from .models import EmailVerificationToken, Subject, Task, User
from .email_utils import send_verification_email
from .schemas import (
    ResendRequest,
    SubjectCreate,
    SubjectRead,
    SubjectUpdate,
    TaskCreate,
    TaskRead,
    TaskUpdate,
    Token,
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
    VerifyRequest,
)
from .security import (
    create_access_token,
    get_current_token,
    get_current_user,
    hash_password,
    revoke_token,
    verify_password,
)

# Schema is managed by Alembic migrations (`alembic upgrade head`).
# For quick local dev without migrations, set AUTO_CREATE_TABLES=1.
if os.getenv("AUTO_CREATE_TABLES") == "1":
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Student Task Tracker API")

# Allowed origins are configurable via CORS_ORIGINS (comma-separated) so the
# same image works in dev, docker-compose, and prod without code changes.
_default_origins = (
    "http://127.0.0.1:5173,http://localhost:5173,"
    "http://127.0.0.1:4173,http://localhost:4173"
)
cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ----------------------------- Auth -----------------------------
def _issue_verification(user: User, db: Session) -> None:
    """Create a fresh verification token for a user and 'send' it."""
    import secrets
    from datetime import datetime, timedelta, timezone

    # Invalidate any previous tokens for this user
    db.query(EmailVerificationToken).filter(
        EmailVerificationToken.user_id == user.id
    ).delete()

    token = secrets.token_urlsafe(32)
    db.add(
        EmailVerificationToken(
            token=token,
            user_id=user.id,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
    )
    db.commit()
    send_verification_email(user.email, user.name, token)


@app.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing_user:
        raise HTTPException(status_code=409, detail="User with this email already exists")

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    _issue_verification(user, db)

    return Token(access_token=create_access_token(str(user.id)), user=user)


@app.post("/auth/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return Token(access_token=create_access_token(str(user.id)), user=user)


@app.post("/auth/verify", response_model=UserRead)
def verify_email(payload: VerifyRequest, db: Session = Depends(get_db)):
    from datetime import datetime, timezone

    record = db.get(EmailVerificationToken, payload.token)
    if record is None:
        raise HTTPException(status_code=400, detail="Invalid or already-used verification link")

    expires = record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification link has expired")

    user = db.get(User, record.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid verification link")

    user.email_verified = True
    db.delete(record)  # one-time use
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/resend-verification", status_code=status.HTTP_202_ACCEPTED)
def resend_verification(payload: ResendRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    # Always return 202 so this can't be used to discover which emails exist.
    if user and not user.email_verified:
        _issue_verification(user, db)
    return {"status": "accepted"}


@app.get("/users/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.patch("/users/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = payload.name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token: str = Depends(get_current_token),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Server-side invalidation (T-08): the token's jti is denylisted so the
    # token cannot be reused even before its natural expiry.
    revoke_token(token, db)


@app.post("/users/me/complete-onboarding", response_model=UserRead)
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)
    return current_user


# --------------------------- Subjects ---------------------------
def _subject_to_read(db: Session, subject: Subject) -> SubjectRead:
    count = db.scalar(
        select(func.count(Task.id)).where(Task.subject_id == subject.id)
    ) or 0
    return SubjectRead(id=subject.id, name=subject.name, color=subject.color, task_count=count)


@app.get("/subjects", response_model=list[SubjectRead])
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subjects = db.scalars(
        select(Subject).where(Subject.owner_id == current_user.id).order_by(Subject.created_at)
    ).all()
    return [_subject_to_read(db, s) for s in subjects]


@app.post("/subjects", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
def create_subject(
    payload: SubjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = Subject(name=payload.name.strip(), color=payload.color, owner_id=current_user.id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return _subject_to_read(db, subject)


def _get_owned_subject(db: Session, user: User, subject_id: int) -> Subject:
    subject = db.get(Subject, subject_id)
    if subject is None or subject.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@app.patch("/subjects/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = _get_owned_subject(db, current_user, subject_id)
    if payload.name is not None:
        subject.name = payload.name.strip()
    if payload.color is not None:
        subject.color = payload.color
    db.commit()
    db.refresh(subject)
    return _subject_to_read(db, subject)


@app.delete("/subjects/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = _get_owned_subject(db, current_user, subject_id)
    db.delete(subject)
    db.commit()


# ----------------------------- Tasks ----------------------------
def _get_owned_task(db: Session, user: User, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if task is None or task.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _validate_subject(db: Session, user: User, subject_id: int | None):
    if subject_id is not None:
        _get_owned_subject(db, user, subject_id)


@app.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tasks = db.scalars(
        select(Task).where(Task.owner_id == current_user.id).order_by(Task.created_at.desc())
    ).all()
    return tasks


@app.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_subject(db, current_user, payload.subject_id)
    task = Task(
        title=payload.title.strip(),
        notes=payload.notes,
        priority=payload.priority,
        due_date=payload.due_date,
        subject_id=payload.subject_id,
        owner_id=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_owned_task(db, current_user, task_id)
    data = payload.model_dump(exclude_unset=True)
    if "subject_id" in data:
        _validate_subject(db, current_user, data["subject_id"])
    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
    for field, value in data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_owned_task(db, current_user, task_id)
    db.delete(task)
    db.commit()
