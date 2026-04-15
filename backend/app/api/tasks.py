import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.task import TaskCreate, TaskRead
from app.services.task_service import assert_task_access, create_task, get_task, list_tasks

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskRead, status_code=201)
def create(
    data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_task(db, data, current_user.id)


@router.get("", response_model=list[TaskRead])
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_tasks(db, current_user.id, current_user.role)


@router.get("/{task_id}", response_model=TaskRead)
def get_one(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id)
    assert_task_access(task, current_user.id, current_user.role)
    return task
