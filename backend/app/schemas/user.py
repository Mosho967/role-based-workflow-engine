import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(v) > 50:
            raise ValueError("Username must be at most 50 characters")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append("at least 8 characters")
        if not any(c.isupper() for c in v):
            errors.append("one uppercase letter")
        if not any(c.isdigit() for c in v):
            errors.append("one number")
        if not any(c in "!@#$%^&*" for c in v):
            errors.append("one special character (!@#$%^&*)")
        if errors:
            raise ValueError("Password must contain: " + ", ".join(errors))
        return v


class UserRead(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    email: EmailStr
    password: str
