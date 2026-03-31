import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class WorkflowCreate(BaseModel):
    name: str
    description: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("Workflow name must be at least 3 characters")
        if len(v) > 100:
            raise ValueError("Workflow name must be at most 100 characters")
        return v.strip()


class WorkflowRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    created_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
