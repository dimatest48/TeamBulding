from datetime import datetime, timedelta, timezone
import secrets

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

import os

from .database import Base, engine, get_db
from .models import (
    EmailVerificationToken,
    StudySession,
    Subject,
    SubjectInvite,
    SubjectMember,
    Task,
    TaskAttachment,
    TaskCollaborator,
    TaskShareInvite,
    TaskShareLink,
    User,
)
from .email_utils import send_verification_email, send_task_share_email
from .schemas import (
    ResendRequest,
    SharePreview,
    SubjectCreate,
    SubjectInviteCreate,
    SubjectInviteRead,
    SubjectMemberRead,
    SubjectRead,
    SubjectUpdate,
    StudySessionCreate,
    StudySessionRead,
    StudySessionUpdate,
    TaskAttachmentCreate,
    TaskAttachmentRead,
    TaskCollaboratorRead,
    TaskCreate,
    TaskInviteRead,
    TaskRead,
    TaskShareInviteCreate,
    TaskShareLinkCreate,
    TaskShareLinkRead,
    TaskUpdate,
    Token,
    UserCreate,
    UserLogin,
    UserRead,
    UserSync,
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

EDIT_ROLES = {"owner", "editor"}
# Higher rank wins when a user holds access through several paths
# (ownership, subject membership, direct task collaboration).
ROLE_RANK = {"viewer": 1, "editor": 2, "owner": 3}


def _normalize_duplicate_text(value: str | None) -> str:
    import re

    normalized = (value or "").strip()
    normalized = re.sub(r"^[^\w]+", "", normalized, flags=re.UNICODE)
    normalized = re.sub(r"\s+", " ", normalized)
    return normalized.lower()


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


@app.post("/users/me/sync", response_model=UserRead)
def sync_me(
    payload: UserSync,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Persist the Clerk profile values the backend cannot always infer from JWT claims."""
    normalized_email = payload.email.lower()
    conflicting_user = db.scalar(
        select(User).where(User.email == normalized_email, User.id != current_user.id)
    )
    if conflicting_user is None:
        current_user.email = normalized_email
    current_user.name = payload.name.strip()
    current_user.email_verified = True
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
def _subject_role(db: Session, user: User, subject: Subject) -> str | None:
    if subject.owner_id == user.id:
        return "owner"
    membership = db.scalar(
        select(SubjectMember).where(
            SubjectMember.subject_id == subject.id,
            SubjectMember.user_id == user.id,
        )
    )
    return membership.role if membership else None


def _accessible_subject_ids(db: Session, user: User) -> list[int]:
    owned_ids = db.scalars(select(Subject.id).where(Subject.owner_id == user.id)).all()
    member_ids = db.scalars(select(SubjectMember.subject_id).where(SubjectMember.user_id == user.id)).all()
    return list(dict.fromkeys([*owned_ids, *member_ids]))


def _subject_to_read(db: Session, subject: Subject) -> SubjectRead:
    count = db.scalar(
        select(func.count(Task.id)).where(Task.subject_id == subject.id)
    ) or 0
    member_count = db.scalar(
        select(func.count(SubjectMember.id)).where(SubjectMember.subject_id == subject.id)
    ) or 0
    return SubjectRead(
        id=subject.id,
        name=subject.name,
        color=subject.color,
        task_count=count,
        shared=member_count > 0,
    )


@app.get("/subjects", response_model=list[SubjectRead])
def list_subjects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ids = _accessible_subject_ids(db, current_user)
    if not ids:
        return []
    subjects = db.scalars(select(Subject).where(Subject.id.in_(ids)).order_by(Subject.created_at)).all()
    response: list[SubjectRead] = []
    for subject in subjects:
        item = _subject_to_read(db, subject)
        item.role = _subject_role(db, current_user, subject) or "viewer"
        item.shared = item.shared or item.role != "owner"
        response.append(item)
    return response


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


def _get_accessible_subject(db: Session, user: User, subject_id: int, editable: bool = False) -> Subject:
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    role = _subject_role(db, user, subject)
    if role is None or (editable and role not in EDIT_ROLES):
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@app.patch("/subjects/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = _get_accessible_subject(db, current_user, subject_id, editable=True)
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


@app.get("/subjects/{subject_id}", response_model=SubjectRead)
def read_subject(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = _get_accessible_subject(db, current_user, subject_id)
    item = _subject_to_read(db, subject)
    item.role = _subject_role(db, current_user, subject) or "viewer"
    item.shared = item.shared or item.role != "owner"
    return item


@app.post("/subjects/{subject_id}/invites", response_model=SubjectInviteRead, status_code=status.HTTP_201_CREATED)
def create_subject_invite(
    subject_id: int,
    payload: SubjectInviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = _get_owned_subject(db, current_user, subject_id)
    email = payload.email.lower()
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        existing_role = _subject_role(db, existing_user, subject)
        if existing_role:
            raise HTTPException(status_code=409, detail="This user already has access")

    invite = SubjectInvite(
        subject_id=subject.id,
        email=email,
        token=secrets.token_urlsafe(32),
        role=payload.role,
        status="pending",
        invited_by_user_id=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return SubjectInviteRead(
        id=invite.id,
        subject_id=subject.id,
        subject_name=subject.name,
        email=invite.email,
        role=invite.role,  # type: ignore[arg-type]
        status=invite.status,
        token=invite.token,
        expires_at=invite.expires_at,
    )


@app.get("/invites", response_model=list[SubjectInviteRead])
def list_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invites = db.scalars(
        select(SubjectInvite)
        .where(SubjectInvite.email == current_user.email.lower(), SubjectInvite.status == "pending")
        .order_by(SubjectInvite.created_at.desc())
    ).all()
    return [
        SubjectInviteRead(
            id=invite.id,
            subject_id=invite.subject_id,
            subject_name=invite.subject.name,
            email=invite.email,
            role=invite.role,  # type: ignore[arg-type]
            status=invite.status,
            token=invite.token,
            expires_at=invite.expires_at,
        )
        for invite in invites
    ]


@app.post("/invites/{token}/accept", response_model=SubjectRead)
def accept_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = db.scalar(select(SubjectInvite).where(SubjectInvite.token == token))
    if invite is None or invite.status != "pending":
        raise HTTPException(status_code=404, detail="Invite not found")
    expires = invite.expires_at if invite.expires_at.tzinfo else invite.expires_at.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Invite has expired")
    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Invite belongs to another email")
    if _subject_role(db, current_user, invite.subject) is None:
        db.add(SubjectMember(subject_id=invite.subject_id, user_id=current_user.id, role=invite.role))
    invite.status = "accepted"
    db.commit()
    db.refresh(invite.subject)
    item = _subject_to_read(db, invite.subject)
    item.role = invite.role
    item.shared = True
    return item


@app.post("/invites/{token}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = db.scalar(select(SubjectInvite).where(SubjectInvite.token == token))
    if invite is None or invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = "declined"
    db.commit()


@app.get("/subjects/{subject_id}/members", response_model=list[SubjectMemberRead])
def list_subject_members(
    subject_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject = _get_accessible_subject(db, current_user, subject_id)
    owner = db.get(User, subject.owner_id)
    members: list[SubjectMemberRead] = []
    if owner:
        members.append(SubjectMemberRead(id=0, user_id=owner.id, email=owner.email, name=owner.name, role="owner"))
    records = db.scalars(select(SubjectMember).where(SubjectMember.subject_id == subject_id)).all()
    for record in records:
        members.append(
            SubjectMemberRead(
                id=record.id,
                user_id=record.user_id,
                email=record.user.email,
                name=record.user.name,
                role=record.role,  # type: ignore[arg-type]
            )
        )
    return members


# ----------------------------- Tasks ----------------------------
def _get_owned_task(db: Session, user: User, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if task is None or task.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _task_collaborator_role(db: Session, user: User, task: Task) -> str | None:
    collaborator = db.scalar(
        select(TaskCollaborator).where(
            TaskCollaborator.task_id == task.id,
            TaskCollaborator.user_id == user.id,
        )
    )
    return collaborator.role if collaborator else None


def _effective_task_role(db: Session, user: User, task: Task) -> str | None:
    """Highest role the user holds on a task across every access path (T-35)."""
    if task.owner_id == user.id:
        return "owner"
    roles: list[str] = []
    collaborator_role = _task_collaborator_role(db, user, task)
    if collaborator_role:
        roles.append(collaborator_role)
    if task.subject_id is not None and task.subject is not None:
        subject_role = _subject_role(db, user, task.subject)
        if subject_role:
            roles.append(subject_role)
    if not roles:
        return None
    return max(roles, key=lambda role: ROLE_RANK.get(role, 0))


def _get_accessible_task(db: Session, user: User, task_id: int, editable: bool = False) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    role = _effective_task_role(db, user, task)
    if role is None or (editable and role not in EDIT_ROLES):
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def _task_is_shared(db: Session, task: Task) -> bool:
    """True when the owner has shared the task with anyone (collaborator or active link)."""
    has_collaborator = db.scalar(
        select(func.count(TaskCollaborator.id)).where(TaskCollaborator.task_id == task.id)
    ) or 0
    if has_collaborator:
        return True
    active_links = db.scalar(
        select(func.count(TaskShareLink.id)).where(
            TaskShareLink.task_id == task.id, TaskShareLink.revoked_at.is_(None)
        )
    ) or 0
    return bool(active_links)


def _task_to_read(db: Session, user: User, task: Task) -> TaskRead:
    role = _effective_task_role(db, user, task) or "viewer"
    owner = db.get(User, task.owner_id)
    return TaskRead(
        id=task.id,
        title=task.title,
        notes=task.notes,
        priority=task.priority,  # type: ignore[arg-type]
        due_date=task.due_date,
        completed=task.completed,
        subject_id=task.subject_id,
        owner_id=task.owner_id,
        role=role,  # type: ignore[arg-type]
        owner_name=owner.name if owner else None,
        shared_with_me=task.owner_id != user.id,
        shared=task.owner_id == user.id and _task_is_shared(db, task),
    )


def _validate_subject(db: Session, user: User, subject_id: int | None):
    if subject_id is not None:
        _get_accessible_subject(db, user, subject_id, editable=True)


@app.get("/tasks", response_model=list[TaskRead])
def list_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subject_ids = _accessible_subject_ids(db, current_user)
    collaborator_task_ids = db.scalars(
        select(TaskCollaborator.task_id).where(TaskCollaborator.user_id == current_user.id)
    ).all()
    visibility = Task.owner_id == current_user.id
    if subject_ids:
        visibility = or_(visibility, Task.subject_id.in_(subject_ids))
    if collaborator_task_ids:
        visibility = or_(visibility, Task.id.in_(collaborator_task_ids))
    tasks = db.scalars(select(Task).where(visibility).order_by(Task.created_at.desc())).all()
    return [_task_to_read(db, current_user, task) for task in tasks]


@app.get("/tasks/{task_id}", response_model=TaskRead)
def read_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_accessible_task(db, current_user, task_id)
    return _task_to_read(db, current_user, task)


@app.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _validate_subject(db, current_user, payload.subject_id)
    candidates = db.scalars(
        select(Task).where(
            Task.owner_id == current_user.id,
            Task.subject_id == payload.subject_id,
        )
    ).all()
    new_title = _normalize_duplicate_text(payload.title)
    new_notes = _normalize_duplicate_text(payload.notes)
    if any(
        _normalize_duplicate_text(candidate.title) == new_title
        and _normalize_duplicate_text(candidate.notes) == new_notes
        for candidate in candidates
    ):
        raise HTTPException(status_code=409, detail="Task already exists")
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
    return _task_to_read(db, current_user, task)


@app.patch("/tasks/{task_id}", response_model=TaskRead)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_accessible_task(db, current_user, task_id, editable=True)
    data = payload.model_dump(exclude_unset=True)
    if "subject_id" in data:
        _validate_subject(db, current_user, data["subject_id"])
    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
    for field, value in data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return _task_to_read(db, current_user, task)


@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_accessible_task(db, current_user, task_id, editable=True)
    db.delete(task)
    db.commit()


@app.get("/tasks/{task_id}/study-sessions", response_model=list[StudySessionRead])
def list_study_sessions(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_accessible_task(db, current_user, task_id)
    return db.scalars(
        select(StudySession).where(StudySession.task_id == task_id).order_by(StudySession.created_at)
    ).all()


@app.post("/tasks/{task_id}/study-sessions", response_model=StudySessionRead, status_code=status.HTTP_201_CREATED)
def create_study_session(
    task_id: int,
    payload: StudySessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_accessible_task(db, current_user, task_id, editable=True)
    session = StudySession(task_id=task_id, title=payload.title.strip(), planned_for=payload.planned_for)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@app.patch("/study-sessions/{session_id}", response_model=StudySessionRead)
def update_study_session(
    session_id: int,
    payload: StudySessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.get(StudySession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found")
    _get_accessible_task(db, current_user, session.task_id, editable=True)
    data = payload.model_dump(exclude_unset=True)
    if "title" in data and data["title"] is not None:
        data["title"] = data["title"].strip()
    for field, value in data.items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


@app.delete("/study-sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.get(StudySession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Study session not found")
    _get_accessible_task(db, current_user, session.task_id, editable=True)
    db.delete(session)
    db.commit()


@app.get("/tasks/{task_id}/attachments", response_model=list[TaskAttachmentRead])
def list_task_attachments(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_accessible_task(db, current_user, task_id)
    return db.scalars(
        select(TaskAttachment).where(TaskAttachment.task_id == task_id).order_by(TaskAttachment.created_at)
    ).all()


@app.post("/tasks/{task_id}/attachments", response_model=TaskAttachmentRead, status_code=status.HTTP_201_CREATED)
def create_task_attachment(
    task_id: int,
    payload: TaskAttachmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_accessible_task(db, current_user, task_id, editable=True)
    if not payload.mime_type.startswith("image/") or not payload.data_url.startswith("data:image/"):
        raise HTTPException(status_code=400, detail="Only image attachments are supported")
    attachment = TaskAttachment(
        task_id=task_id,
        filename=payload.filename.strip(),
        mime_type=payload.mime_type,
        data_url=payload.data_url,
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    return attachment


@app.delete("/task-attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_attachment(
    attachment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    attachment = db.get(TaskAttachment, attachment_id)
    if attachment is None:
        raise HTTPException(status_code=404, detail="Attachment not found")
    _get_accessible_task(db, current_user, attachment.task_id, editable=True)
    db.delete(attachment)
    db.commit()


# ------------------------- Task sharing (EP-06) -------------------------
def _grant_collaborator(db: Session, task: Task, user: User, role: str) -> None:
    """Give a user access to a task, upgrading their role if they already have one.

    The owner is never demoted to a collaborator.
    """
    if task.owner_id == user.id:
        return
    existing = db.scalar(
        select(TaskCollaborator).where(
            TaskCollaborator.task_id == task.id,
            TaskCollaborator.user_id == user.id,
        )
    )
    if existing:
        if ROLE_RANK.get(role, 0) > ROLE_RANK.get(existing.role, 0):
            existing.role = role
            db.commit()
        return
    db.add(TaskCollaborator(task_id=task.id, user_id=user.id, role=role))
    db.commit()


def _link_to_read(link: TaskShareLink) -> TaskShareLinkRead:
    return TaskShareLinkRead(
        id=link.id,
        task_id=link.task_id,
        token=link.token,
        role=link.role,  # type: ignore[arg-type]
        revoked=link.revoked_at is not None,
        created_at=link.created_at,
    )


@app.post(
    "/tasks/{task_id}/collaborators/invite",
    response_model=TaskInviteRead,
    status_code=status.HTTP_201_CREATED,
)
def invite_task_collaborator(
    task_id: int,
    payload: TaskShareInviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Owner-only: viewers and editors cannot share (T-35).
    task = _get_owned_task(db, current_user, task_id)
    email = payload.email.lower()
    if email == current_user.email.lower():
        raise HTTPException(status_code=400, detail="You already own this task")

    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user and _task_collaborator_role(db, existing_user, task):
        raise HTTPException(status_code=409, detail="This user already has access")

    # Refresh any outstanding invite for the same email so the latest role wins.
    db.query(TaskShareInvite).filter(
        TaskShareInvite.task_id == task.id,
        TaskShareInvite.email == email,
        TaskShareInvite.status == "pending",
    ).delete()

    invite = TaskShareInvite(
        task_id=task.id,
        email=email,
        token=secrets.token_urlsafe(32),
        role=payload.role,
        status="pending",
        invited_by_user_id=current_user.id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    send_task_share_email(email, current_user.name, task.title, payload.role, invite.token)

    return TaskInviteRead(
        id=invite.id,
        task_id=task.id,
        task_title=task.title,
        email=invite.email,
        role=invite.role,  # type: ignore[arg-type]
        status=invite.status,
        token=invite.token,
        invited_by_name=current_user.name,
    )


@app.get("/tasks/{task_id}/collaborators", response_model=list[TaskCollaboratorRead])
def list_task_collaborators(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_accessible_task(db, current_user, task_id)
    owner = db.get(User, task.owner_id)
    collaborators: list[TaskCollaboratorRead] = []
    if owner:
        collaborators.append(
            TaskCollaboratorRead(id=0, user_id=owner.id, email=owner.email, name=owner.name, role="owner")
        )
    records = db.scalars(
        select(TaskCollaborator).where(TaskCollaborator.task_id == task.id)
    ).all()
    for record in records:
        collaborators.append(
            TaskCollaboratorRead(
                id=record.id,
                user_id=record.user_id,
                email=record.user.email,
                name=record.user.name,
                role=record.role,  # type: ignore[arg-type]
            )
        )
    return collaborators


@app.delete("/tasks/{task_id}/collaborators/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_task_collaborator(
    task_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Owner-only revoke (T-32, T-35).
    task = _get_owned_task(db, current_user, task_id)
    record = db.scalar(
        select(TaskCollaborator).where(
            TaskCollaborator.task_id == task.id,
            TaskCollaborator.user_id == user_id,
        )
    )
    if record is None:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    db.delete(record)
    db.commit()


@app.post(
    "/tasks/{task_id}/share-links",
    response_model=TaskShareLinkRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task_share_link(
    task_id: int,
    payload: TaskShareLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Owner-only: only the owner can mint a link (T-31, T-35).
    task = _get_owned_task(db, current_user, task_id)
    link = TaskShareLink(
        task_id=task.id,
        token=secrets.token_urlsafe(32),
        role=payload.role,
        created_by_user_id=current_user.id,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return _link_to_read(link)


@app.get("/tasks/{task_id}/share-links", response_model=list[TaskShareLinkRead])
def list_task_share_links(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = _get_owned_task(db, current_user, task_id)
    links = db.scalars(
        select(TaskShareLink)
        .where(TaskShareLink.task_id == task.id, TaskShareLink.revoked_at.is_(None))
        .order_by(TaskShareLink.created_at.desc())
    ).all()
    return [_link_to_read(link) for link in links]


@app.delete("/tasks/{task_id}/share-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_task_share_link(
    task_id: int,
    link_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Owner-only revoke (T-31, T-32, T-35).
    task = _get_owned_task(db, current_user, task_id)
    link = db.get(TaskShareLink, link_id)
    if link is None or link.task_id != task.id:
        raise HTTPException(status_code=404, detail="Share link not found")
    if link.revoked_at is None:
        link.revoked_at = datetime.now(timezone.utc)
        db.commit()


@app.get("/task-invites", response_model=list[TaskInviteRead])
def list_task_invites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invites = db.scalars(
        select(TaskShareInvite)
        .where(
            TaskShareInvite.email == current_user.email.lower(),
            TaskShareInvite.status == "pending",
        )
        .order_by(TaskShareInvite.created_at.desc())
    ).all()
    result: list[TaskInviteRead] = []
    for invite in invites:
        inviter = db.get(User, invite.invited_by_user_id)
        result.append(
            TaskInviteRead(
                id=invite.id,
                task_id=invite.task_id,
                task_title=invite.task.title,
                email=invite.email,
                role=invite.role,  # type: ignore[arg-type]
                status=invite.status,
                token=invite.token,
                invited_by_name=inviter.name if inviter else None,
            )
        )
    return result


@app.post("/task-invites/{token}/accept", response_model=TaskRead)
def accept_task_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = db.scalar(select(TaskShareInvite).where(TaskShareInvite.token == token))
    if invite is None or invite.status != "pending":
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="Invite belongs to another email")
    task = db.get(Task, invite.task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    _grant_collaborator(db, task, current_user, invite.role)
    invite.status = "accepted"
    db.commit()
    db.refresh(task)
    return _task_to_read(db, current_user, task)


@app.post("/task-invites/{token}/decline", status_code=status.HTTP_204_NO_CONTENT)
def decline_task_invite(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    invite = db.scalar(select(TaskShareInvite).where(TaskShareInvite.token == token))
    if invite is None or invite.email.lower() != current_user.email.lower():
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.status = "declined"
    db.commit()


@app.get("/share/{token}", response_model=SharePreview)
def preview_share_link(token: str, db: Session = Depends(get_db)):
    """Public, unauthenticated preview for the deep-link landing (T-34)."""
    link = db.scalar(select(TaskShareLink).where(TaskShareLink.token == token))
    if link is None or link.revoked_at is not None:
        raise HTTPException(status_code=404, detail="This share link is no longer active")
    task = db.get(Task, link.task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="This share link is no longer active")
    owner = db.get(User, task.owner_id)
    return SharePreview(
        task_id=task.id,
        title=task.title,
        owner_name=owner.name if owner else "Someone",
        role=link.role,  # type: ignore[arg-type]
    )


@app.post("/share/{token}/accept", response_model=TaskRead)
def accept_share_link(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    link = db.scalar(select(TaskShareLink).where(TaskShareLink.token == token))
    if link is None or link.revoked_at is not None:
        raise HTTPException(status_code=404, detail="This share link is no longer active")
    task = db.get(Task, link.task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="This share link is no longer active")
    _grant_collaborator(db, task, current_user, link.role)
    db.refresh(task)
    return _task_to_read(db, current_user, task)
