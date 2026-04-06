import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogRead(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    performed_by: uuid.UUID
    from_state_id: uuid.UUID | None
    to_state_id: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
