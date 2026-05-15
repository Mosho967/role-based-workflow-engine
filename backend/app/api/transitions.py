from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.core.notifications import manager
from app.models.user import User
from app.schemas.task import TaskRead
from app.schemas.transition import TransitionRequest
from app.services.transition_service import execute_transition

router = APIRouter(prefix="/transitions", tags=["transitions"])


@router.post("", response_model=TaskRead)
async def trigger_transition(
    data: TransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = execute_transition(
        db,
        task_id=data.task_id,
        to_state_id=data.to_state_id,
        user_id=current_user.id,
        user_role=current_user.role,
        comment=data.comment,
    )

    notification = {
        "type": "transition",
        "task_id": str(task.id),
        "task_title": task.title,
        "new_state": task.current_state.name,
        "actioned_by": current_user.username,
    }

    owner_id = str(task.created_by)
    actor_id = str(current_user.id)

    if owner_id != actor_id:
        await manager.send(owner_id, {**notification, "message": f'{current_user.username} moved your task "{task.title}" to {task.current_state.name}'})

    await manager.broadcast_to_role("admin", {**notification, "message": f'"{task.title}" was moved to {task.current_state.name} by {current_user.username}'}, exclude_id=actor_id)
    await manager.broadcast_to_role("reviewer", {**notification, "message": f'"{task.title}" was moved to {task.current_state.name} by {current_user.username}'}, exclude_id=actor_id)

    return task
