import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, require_role
from app.models.user import User
from app.schemas.state import StateCreate, StateRead
from app.schemas.transition import TransitionCreate, TransitionRead
from app.schemas.workflow import WorkflowCreate, WorkflowRead
from app.services.workflow_service import (
    add_state,
    add_transition,
    create_workflow,
    delete_transition,
    list_states,
    list_transitions,
    list_workflows,
    get_workflow,
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.post("", response_model=WorkflowRead, status_code=201)
def create(
    data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return create_workflow(db, data, current_user.id)


@router.get("", response_model=list[WorkflowRead])
def list_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_workflows(db)


@router.get("/{workflow_id}", response_model=WorkflowRead)
def get_one(
    workflow_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_workflow(db, workflow_id)


@router.post("/{workflow_id}/states", response_model=StateRead, status_code=201)
def create_state(
    workflow_id: uuid.UUID,
    data: StateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return add_state(db, workflow_id, data)


@router.get("/{workflow_id}/states", response_model=list[StateRead])
def get_states(
    workflow_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_states(db, workflow_id)


@router.post("/{workflow_id}/transitions", response_model=TransitionRead, status_code=201)
def create_transition(
    workflow_id: uuid.UUID,
    data: TransitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return add_transition(db, workflow_id, data)


@router.get("/{workflow_id}/transitions", response_model=list[TransitionRead])
def get_transitions(
    workflow_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return list_transitions(db, workflow_id)


@router.delete("/{workflow_id}/transitions/{transition_id}", status_code=204)
def remove_transition(
    workflow_id: uuid.UUID,
    transition_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    delete_transition(db, workflow_id, transition_id)
