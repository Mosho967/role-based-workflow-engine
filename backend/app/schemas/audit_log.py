import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    performed_by: uuid.UUID
    performed_by_username: str | None = None
    from_state_id: uuid.UUID | None
    to_state_id: uuid.UUID
    comment: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
