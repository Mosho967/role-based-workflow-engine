import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.state import State
from app.models.transition import Transition
from app.models.workflow import Workflow
from app.schemas.state import StateCreate
from app.schemas.transition import TransitionCreate
from app.schemas.workflow import WorkflowCreate


def create_workflow(db: Session, data: WorkflowCreate, user_id: uuid.UUID) -> Workflow:
    workflow = Workflow(
        name=data.name,
        description=data.description,
        created_by=user_id,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


def get_workflow(db: Session, workflow_id: uuid.UUID) -> Workflow:
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    return workflow


def list_workflows(db: Session) -> list[Workflow]:
    return db.query(Workflow).all()


def add_state(db: Session, workflow_id: uuid.UUID, data: StateCreate) -> State:
    workflow = get_workflow(db, workflow_id)

    if data.is_initial:
        existing_initial = db.query(State).filter(
            State.workflow_id == workflow.id,
            State.is_initial == True
        ).first()
        if existing_initial:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow already has an initial state"
            )

    state = State(
        workflow_id=workflow.id,
        name=data.name,
        is_initial=data.is_initial,
        is_final=data.is_final,
    )
    db.add(state)
    db.commit()
    db.refresh(state)
    return state


def list_states(db: Session, workflow_id: uuid.UUID) -> list[State]:
    get_workflow(db, workflow_id)
    return db.query(State).filter(State.workflow_id == workflow_id).all()


def add_transition(
    db: Session, workflow_id: uuid.UUID, data: TransitionCreate
) -> Transition:
    workflow = get_workflow(db, workflow_id)

    from_state = db.query(State).filter(
        State.id == data.from_state_id,
        State.workflow_id == workflow.id
    ).first()
    if not from_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="from_state not found in this workflow"
        )

    to_state = db.query(State).filter(
        State.id == data.to_state_id,
        State.workflow_id == workflow.id
    ).first()
    if not to_state:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="to_state not found in this workflow"
        )

    transition = Transition(
        workflow_id=workflow.id,
        from_state_id=data.from_state_id,
        to_state_id=data.to_state_id,
        required_role=data.required_role,
    )
    db.add(transition)
    db.commit()
    db.refresh(transition)
    return transition


def list_transitions(db: Session, workflow_id: uuid.UUID) -> list[Transition]:
    get_workflow(db, workflow_id)
    return db.query(Transition).filter(Transition.workflow_id == workflow_id).all()
