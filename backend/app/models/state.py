import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class State(Base):
    __tablename__ = "states"
    __table_args__ = (
        UniqueConstraint("workflow_id", "name", name="uq_state_workflow_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    is_initial: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_final: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    workflow: Mapped["Workflow"] = relationship(back_populates="states")
    transitions_from: Mapped[list["Transition"]] = relationship(
        back_populates="from_state", foreign_keys="Transition.from_state_id"
    )
    transitions_to: Mapped[list["Transition"]] = relationship(
        back_populates="to_state", foreign_keys="Transition.to_state_id"
    )
