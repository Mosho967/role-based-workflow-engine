import json
import os
import uuid

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from pydantic import BaseModel
from sqlalchemy.orm import Session

load_dotenv()

from app.core.dependencies import get_current_user, get_db
from app.models.state import State
from app.models.transition import Transition
from app.models.user import User
from app.services.workflow_service import get_workflow

router = APIRouter(prefix="/ai", tags=["ai"])

SYSTEM_PROMPT = """You are a workflow design assistant for Cogflow, a role-based workflow engine.

The system has:
- States: stages a task moves through. Each has a name, is_initial (bool), is_final (bool).
- Transitions: connections between states with a required_role.

Roles (ONLY these three are valid — do not invent others):
- "user" — submits tasks, resubmits after rejection
- "reviewer" — approves, rejects, or requests changes
- "admin" — can terminate or override at any stage

CRITICAL: required_role must be EXACTLY one of: "user", "reviewer", "admin". Never use "manager", "finance", "hr", or any other role.

Avoid redundant transitions:
- Do NOT add admin terminate transitions from final states (Approved, Rejected, Terminated) — tasks cannot move from final states
- Do NOT create transitions that can never be reached
- Keep the workflow minimal and clean

Rules:
- Exactly ONE state must have is_initial: true
- At least ONE state must have is_final: true (terminal — tasks cannot leave)
- All transition state names must exactly match a name in your states list
- Keep it simple: 4–7 states is ideal
- State names must reflect the actual business context from the description — do NOT use generic names like "Under Review" or "In Progress". Instead use domain-specific names like "Receipt Verification", "Leave Assessment", "Budget Sign-Off", "Claims Approved" etc.
- Final states should also be specific: "Reimbursement Approved", "Leave Denied", "Claim Terminated" rather than just "Approved", "Rejected", "Terminated"

Return ONLY valid JSON in this exact structure, nothing else:
{
  "states": [
    {"name": "State Name", "is_initial": false, "is_final": false}
  ],
  "transitions": [
    {"from_state": "State Name", "to_state": "Other State", "required_role": "reviewer"}
  ]
}"""


class GenerateRequest(BaseModel):
    description: str
    workflow_id: uuid.UUID


@router.post("/generate-workflow")
def generate_workflow(
    data: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can generate workflows")

    workflow = get_workflow(db, data.workflow_id)

    # Clear existing states and transitions before generating fresh
    from app.models.task import Task
    in_use = db.query(Task).filter(Task.workflow_id == workflow.id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="Cannot regenerate — this workflow already has tasks assigned to it")
    db.query(Transition).filter(Transition.workflow_id == workflow.id).delete()
    db.query(State).filter(State.workflow_id == workflow.id).delete()
    db.commit()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Return valid JSON only. Design a workflow for: {data.description}"},
            ],
            temperature=0.3,
        )
        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    created_states: dict[str, State] = {}

    for s in result.get("states", []):
        name = s.get("name", "").strip()
        if not name:
            continue
        existing = db.query(State).filter(
            State.workflow_id == workflow.id, State.name == name
        ).first()
        if existing:
            created_states[name] = existing
            continue
        if s.get("is_initial"):
            existing_initial = db.query(State).filter(
                State.workflow_id == workflow.id, State.is_initial == True
            ).first()
            if existing_initial:
                created_states[name] = existing_initial
                continue
        state = State(
            workflow_id=workflow.id,
            name=name,
            is_initial=s.get("is_initial", False),
            is_final=s.get("is_final", False),
        )
        db.add(state)
        db.flush()
        created_states[name] = state

    db.commit()

    for t in result.get("transitions", []):
        from_state = created_states.get(t.get("from_state", ""))
        to_state = created_states.get(t.get("to_state", ""))
        role = t.get("required_role", "user")
        if not from_state or not to_state:
            continue
        duplicate = db.query(Transition).filter(
            Transition.workflow_id == workflow.id,
            Transition.from_state_id == from_state.id,
            Transition.to_state_id == to_state.id,
            Transition.required_role == role,
        ).first()
        if duplicate:
            continue
        db.add(Transition(
            workflow_id=workflow.id,
            from_state_id=from_state.id,
            to_state_id=to_state.id,
            required_role=role,
        ))

    db.commit()

    states = db.query(State).filter(State.workflow_id == workflow.id).all()
    transitions = db.query(Transition).filter(Transition.workflow_id == workflow.id).all()

    return {
        "states": [{"id": str(s.id), "name": s.name, "is_initial": s.is_initial, "is_final": s.is_final} for s in states],
        "transitions": [{"id": str(t.id), "from_state_id": str(t.from_state_id), "to_state_id": str(t.to_state_id), "required_role": t.required_role} for t in transitions],
    }
