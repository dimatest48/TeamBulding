from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Users ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class UserRead(BaseModel):
    id: int
    name: str
    email: EmailStr
    email_verified: bool
    onboarding_completed: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class UserSync(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr


class VerifyRequest(BaseModel):
    token: str = Field(min_length=8, max_length=64)


class ResendRequest(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


# ---------- Subjects ----------
class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    color: str = Field(default="#6366f1", max_length=20)


class SubjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    color: Optional[str] = Field(default=None, max_length=20)


class SubjectRead(BaseModel):
    id: int
    name: str
    color: str
    task_count: int = 0
    role: str = "owner"
    shared: bool = False

    model_config = {"from_attributes": True}


Role = Literal["owner", "editor", "viewer"]


class SubjectInviteCreate(BaseModel):
    email: EmailStr
    role: Literal["editor", "viewer"] = "editor"


class SubjectInviteRead(BaseModel):
    id: int
    subject_id: int
    subject_name: str
    email: EmailStr
    role: Literal["editor", "viewer"]
    status: str
    token: str
    expires_at: datetime


class SubjectMemberRead(BaseModel):
    id: int
    user_id: int
    email: EmailStr
    name: str
    role: Role


# ---------- Tasks ----------
Priority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=2000)
    priority: Priority = "medium"
    due_date: Optional[datetime] = None
    subject_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=20000)
    priority: Optional[Priority] = None
    due_date: Optional[datetime] = None
    subject_id: Optional[int] = None
    completed: Optional[bool] = None


class TaskRead(BaseModel):
    id: int
    title: str
    notes: Optional[str]
    priority: Priority
    due_date: Optional[datetime]
    completed: bool
    subject_id: Optional[int]
    owner_id: int

    model_config = {"from_attributes": True}


class StudySessionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    planned_for: Optional[datetime] = None


class StudySessionUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    planned_for: Optional[datetime] = None
    completed: Optional[bool] = None


class StudySessionRead(BaseModel):
    id: int
    task_id: int
    title: str
    planned_for: Optional[datetime]
    completed: bool

    model_config = {"from_attributes": True}


class TaskAttachmentCreate(BaseModel):
    filename: str = Field(min_length=1, max_length=200)
    mime_type: str = Field(min_length=1, max_length=80)
    data_url: str = Field(min_length=1)


class TaskAttachmentRead(BaseModel):
    id: int
    task_id: int
    filename: str
    mime_type: str
    data_url: str

    model_config = {"from_attributes": True}
