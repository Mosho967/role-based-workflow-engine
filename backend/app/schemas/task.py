import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    workflow_id: uuid.UUID

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("Title must be at least 3 characters")
        if len(v) > 100:
            raise ValueError("Title must be at most 100 characters")
        return v.strip()


class TaskRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    workflow_id: uuid.UUID
    current_state_id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
