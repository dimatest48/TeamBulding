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

    model_config = {"from_attributes": True}


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
    notes: Optional[str] = Field(default=None, max_length=2000)
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

    model_config = {"from_attributes": True}
