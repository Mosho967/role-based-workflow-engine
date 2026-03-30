import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transition(Base):
    __tablename__ = "transitions"
    __table_args__ = (
        UniqueConstraint(
            "workflow_id", "from_state_id", "to_state_id", "required_role",
            name="uq_transition_rule"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False
    )
    from_state_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("states.id"), nullable=False
    )
    to_state_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("states.id"), nullable=False
    )
    required_role: Mapped[str] = mapped_column(String(20), nullable=False)

    workflow: Mapped["Workflow"] = relationship(back_populates="transitions")
    from_state: Mapped["State"] = relationship(
        back_populates="transitions_from", foreign_keys=[from_state_id]
    )
    to_state: Mapped["State"] = relationship(
        back_populates="transitions_to", foreign_keys=[to_state_id]
    )
