import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.state import State
from app.models.task import Task
from app.schemas.task import TaskCreate
from app.services.workflow_service import get_workflow


def create_task(db: Session, data: TaskCreate, user_id: uuid.UUID) -> Task:
    workflow = get_workflow(db, data.workflow_id)

    initial_state = db.query(State).filter(
        State.workflow_id == workflow.id,
        State.is_initial == True
    ).first()
    if not initial_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Workflow has no initial state defined"
        )

    task = Task(
        title=data.title,
        description=data.description,
        workflow_id=workflow.id,
        current_state_id=initial_state.id,
        created_by=user_id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def assert_task_access(task: Task, user_id: uuid.UUID, role: str) -> None:
    if role not in ("admin", "reviewer") and task.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this task"
        )


def get_task(db: Session, task_id: uuid.UUID) -> Task:
    task = (
        db.query(Task)
        .options(joinedload(Task.creator))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return task


def list_tasks(db: Session, user_id: uuid.UUID, role: str) -> list[Task]:
    q = db.query(Task).options(joinedload(Task.creator))
    if role in ("admin", "reviewer"):
        return q.all()
    return q.filter(Task.created_by == user_id).all()


def delete_task(db: Session, task_id: uuid.UUID, user_id: uuid.UUID, role: str) -> None:
    task = get_task(db, task_id)
    if role != "admin" and task.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this task"
        )
    db.delete(task)
    db.commit()
