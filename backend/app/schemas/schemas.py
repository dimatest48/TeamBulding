from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models.models import Priority, SharePermission, TaskStatus


# --- Auth ---

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserRead(BaseModel):
    id: int
    email: str
    name: str
    onboarding_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --- Subjects ---

class SubjectCreate(BaseModel):
    name: str


class SubjectUpdate(BaseModel):
    name: str


class SubjectRead(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    task_count: int = 0
    completion_percent: float = 0.0

    model_config = {"from_attributes": True}


# --- Tasks ---

class TaskCreate(BaseModel):
    name: str
    subject_id: int
    due_date: Optional[datetime] = None
    priority: Priority = Priority.medium
    status: TaskStatus = TaskStatus.todo
    description: Optional[str] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    subject_id: Optional[int] = None
    due_date: Optional[datetime] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    description: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus


class TaskRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    subject_id: int
    owner_id: int
    due_date: Optional[datetime]
    priority: Priority
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# --- Sharing ---

class ShareByEmail(BaseModel):
    email: EmailStr
    permission: SharePermission = SharePermission.view


class ShareLinkCreate(BaseModel):
    permission: SharePermission = SharePermission.view


class ShareLinkRead(BaseModel):
    share_token: str
    permission: SharePermission
    is_active: bool

    model_config = {"from_attributes": True}
