import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.task import Task
from app.models.transition import Transition
from app.services.task_service import get_task


def execute_transition(
    db: Session,
    task_id: uuid.UUID,
    to_state_id: uuid.UUID,
    user_id: uuid.UUID,
    user_role: str,
) -> Task:
    task = get_task(db, task_id)

    if task.current_state.is_final:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task is already in a final state and cannot be transitioned"
        )

    transition = db.query(Transition).filter(
        Transition.workflow_id == task.workflow_id,
        Transition.from_state_id == task.current_state_id,
        Transition.to_state_id == to_state_id,
    ).first()

    if not transition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid transition exists from the current state to the requested state"
        )

    if transition.required_role != user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your role '{user_role}' is not permitted to perform this transition"
        )

    previous_state_id = task.current_state_id
    task.current_state_id = to_state_id
    db.add(task)

    audit_log = AuditLog(
        task_id=task.id,
        performed_by=user_id,
        from_state_id=previous_state_id,
        to_state_id=to_state_id,
    )
    db.add(audit_log)

    db.commit()
    db.refresh(task)
    return task
