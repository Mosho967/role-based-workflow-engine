from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.task import TaskRead
from app.schemas.transition import TransitionRequest
from app.services.transition_service import execute_transition

router = APIRouter(prefix="/transitions", tags=["transitions"])


@router.post("", response_model=TaskRead)
def trigger_transition(
    data: TransitionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return execute_transition(
        db,
        task_id=data.task_id,
        to_state_id=data.to_state_id,
        user_id=current_user.id,
        user_role=current_user.role,
    )
