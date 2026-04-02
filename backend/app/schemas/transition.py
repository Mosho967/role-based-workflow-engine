import uuid

from pydantic import BaseModel, ConfigDict, field_validator


class TransitionCreate(BaseModel):
    from_state_id: uuid.UUID
    to_state_id: uuid.UUID
    required_role: str

    @field_validator("required_role")
    @classmethod
    def validate_required_role(cls, v: str) -> str:
        allowed = {"admin", "user", "reviewer"}
        if v not in allowed:
            raise ValueError(f"Role must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("to_state_id")
    @classmethod
    def validate_different_states(cls, v: uuid.UUID, info) -> uuid.UUID:
        from_state_id = info.data.get("from_state_id")
        if from_state_id and v == from_state_id:
            raise ValueError("from_state_id and to_state_id cannot be the same state")
        return v


class TransitionRead(BaseModel):
    id: uuid.UUID
    workflow_id: uuid.UUID
    from_state_id: uuid.UUID
    to_state_id: uuid.UUID
    required_role: str

    model_config = ConfigDict(from_attributes=True)


class TransitionRequest(BaseModel):
    task_id: uuid.UUID
    to_state_id: uuid.UUID
