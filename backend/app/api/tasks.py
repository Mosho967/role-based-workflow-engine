import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.dependencies import get_current_user, get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogRead
from app.schemas.task import TaskCreate, TaskRead
from app.services.task_service import assert_task_access, create_task, delete_task, get_task, list_tasks


class CommentBody(BaseModel):
    comment: str

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


@router.post("/{task_id}/comment", response_model=AuditLogRead, status_code=201)
def add_comment(
    task_id: uuid.UUID,
    body: CommentBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = get_task(db, task_id)
    assert_task_access(task, current_user.id, current_user.role)
    log = AuditLog(
        task_id=task.id,
        performed_by=current_user.id,
        from_state_id=None,
        to_state_id=task.current_state_id,
        comment=body.comment,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    log = db.query(AuditLog).options(joinedload(AuditLog.performed_by_user)).filter(AuditLog.id == log.id).first()
    return log


@router.delete("/{task_id}", status_code=204)
def delete_one(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_task(db, task_id, current_user.id, current_user.role)
