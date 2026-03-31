import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class StateCreate(BaseModel):
    name: str
    is_initial: bool = False
    is_final: bool = False

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v.strip()) < 1:
            raise ValueError("State name cannot be empty")
        if len(v) > 50:
            raise ValueError("State name must be at most 50 characters")
        return v.strip()

    @field_validator("is_final")
    @classmethod
    def validate_state_flags(cls, v: bool, info) -> bool:
        is_initial = info.data.get("is_initial")
        if is_initial and v:
            raise ValueError("State cannot be both initial and final")
        return v


class StateRead(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    name: str
    is_initial: bool
    is_final: bool

    model_config = ConfigDict(from_attributes=True)
