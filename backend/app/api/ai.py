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
- "admin" — terminates/overrides at any stage; does NOT approve or reject unless explicitly told to

CRITICAL: required_role must be EXACTLY one of: "user", "reviewer", "admin". Never use "manager", "finance", "hr", or any other role.

ADMIN ROLE INTERPRETATION — CRITICAL:
- "admin can terminate / cancel / void / close / override / kill" → create ONE final "X Terminated" state and add admin transitions from each non-final, non-initial state TO it. Do NOT give admin the same approve/reject transitions as reviewer.
- Admin should NOT bypass all review: never add an admin transition straight from the initial state to the approved/accepted final state unless the description explicitly says admin is the sole approver.
- Only give admin approve/reject paths if the user explicitly says "admin can approve" or "admin can reject".
- Admin's primary role is an emergency override that ends a task at any mid-workflow stage via the Terminated state.

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


CHAT_SYSTEM_PROMPT = """You are Cogsy, a friendly workflow design assistant for Cogflow, a role-based workflow engine.

You help admins design approval workflows. You can give advice OR generate a complete workflow.

RESPONSE STYLE — CRITICAL:
- Be concise and direct. No long paragraphs.
- For explanations, use short numbered steps or bullet points.
- Max 3-4 sentences for advice. If listing steps, max 6 items.
- Never start with "Certainly!" or "Of course!" — just answer.
- Use **bold** for key terms, state names, and role names.
- Put a blank line between each numbered or bulleted item so they are spaced out.

The system has:
- States: stages a task moves through. Each has a name, is_initial (bool), is_final (bool).
- Transitions: connections between states with a required_role.

Roles (ONLY these three are valid):
- "user" — submits tasks, resubmits after rejection
- "reviewer" — approves, rejects, or requests changes
- "admin" — terminates/overrides at any stage; does NOT approve or reject unless explicitly told to

ADMIN ROLE INTERPRETATION — CRITICAL:
- "admin can terminate / cancel / void / close / override / kill" → create ONE final "X Terminated" state and add admin transitions from each non-final, non-initial state TO it. Do NOT give admin approve/reject transitions.
- Admin should NOT bypass all review: never add admin → approved final state from the initial state unless the description explicitly says admin is the sole approver.
- Only give admin approve/reject paths if the user explicitly says "admin can approve" or "admin can reject".
- Admin's primary role is an emergency override that ends a task at any mid-workflow stage via the Terminated state.

Rules when generating:
- Exactly ONE state must have is_initial: true
- At least ONE state must have is_final: true (terminal)
- All transition state names must exactly match a state name
- Keep it simple: 4-7 states
- Use domain-specific state names from the business context — NOT generic names like "Under Review"
- No transitions out of final states
- Only roles: "user", "reviewer", "admin"

REDUNDANCY RULES — understand these precisely before generating or reviewing:
TRUE redundancy (flag these):
- Duplicate transition — same from/to/role combination already exists
- Admin path FROM the initial state directly to a final state — bypasses all review entirely, task was never assessed

NOT redundant (never flag these):
- Transition FROM a final state requested as part of a "reopen" or "loop back" scenario — instead, regenerate with that state marked as non-final (is_final: false) so the transition is valid
- Admin override from mid-workflow states — valid escape hatch
- Multiple transitions out of the same state to different destinations — branching, not redundancy
- User looping back to an earlier state (e.g. Resolved → Ticket Raised) — valid reopen pattern, just make the source state non-final
- Both admin and reviewer reaching the same final state — valid parallel paths

IMPORTANT: If someone asks to add a transition FROM a state that is currently final, do NOT warn about redundancy. Instead, regenerate the workflow with that state marked as non-final so the transition works.

CONTEXT AWARENESS: You are given the current workflow states and transitions. Use them to answer factual questions directly — e.g. "how many transitions" → count them from context and answer. Never ask the user to provide information you already have.

Decide based on the message:
- If the user wants to CREATE/BUILD/GENERATE/DESIGN a workflow AND there is no prior preview in the conversation → action: "preview" — describe the plan in 2-3 sentences max (no bullet lists, no transition details, just the overall flow and key roles), then ask if they want to proceed
- If the user CONFIRMS a preview (says yes, go ahead, looks good, do it, build it, correct, sure) → action: "generate"
- If the user REJECTS a preview or asks to change something → action: "advice" — ask what they'd like to adjust
- If the user wants advice or asks a question → action: "advice"
- If the user asks to MODIFY/ADD/CHANGE the current workflow AND the result contains TRUE redundancy (only the two cases above) → action: "warn"

For "warn": explain specifically which transition is redundant and exactly why using the rules above. Do not flag valid patterns.

Return ONLY valid JSON. State and transition fields must match EXACTLY:
- States: {"name": "State Name", "is_initial": false, "is_final": false}
- Transitions: {"from_state": "State Name", "to_state": "Other State Name", "required_role": "reviewer"}

For advice: {"action": "advice", "message": "..."}
For preview: {"action": "preview", "message": "..."}
For generate: {"action": "generate", "message": "...", "states": [{"name": "...", "is_initial": false, "is_final": false}], "transitions": [{"from_state": "...", "to_state": "...", "required_role": "reviewer"}]}
For warn: {"action": "warn", "message": "...", "states": [{"name": "...", "is_initial": false, "is_final": false}], "transitions": [{"from_state": "...", "to_state": "...", "required_role": "reviewer"}]}"""


class GenerateRequest(BaseModel):
    description: str
    workflow_id: uuid.UUID


class ChatRequest(BaseModel):
    message: str
    workflow_id: uuid.UUID
    states: list[dict] = []
    transitions: list[dict] = []
    history: list[dict] = []


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


def _save_states_and_transitions(db, workflow, result):
    created_states: dict[str, State] = {}
    for s in result.get("states", []):
        name = s.get("name", "").strip()
        if not name:
            continue
        existing = db.query(State).filter(State.workflow_id == workflow.id, State.name == name).first()
        if existing:
            created_states[name] = existing
            continue
        if s.get("is_initial"):
            existing_initial = db.query(State).filter(State.workflow_id == workflow.id, State.is_initial == True).first()
            if existing_initial:
                created_states[name] = existing_initial
                continue
        state = State(workflow_id=workflow.id, name=name, is_initial=s.get("is_initial", False), is_final=s.get("is_final", False))
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
        db.add(Transition(workflow_id=workflow.id, from_state_id=from_state.id, to_state_id=to_state.id, required_role=role))
    db.commit()


@router.post("/chat")
def chat_workflow(
    data: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can use the AI assistant")

    workflow = get_workflow(db, data.workflow_id)

    state_name_map = {s.get("id"): s.get("name", "") for s in data.states}
    context = f"Current workflow name: {workflow.name}\n"
    if data.states:
        state_list = ", ".join(
            f"{s.get('name')}{'(start)' if s.get('is_initial') else '(end)' if s.get('is_final') else ''}"
            for s in data.states
        )
        context += f"Current states: {state_list}\n"
    if data.transitions:
        trans_lines = "\n".join(
            f"  {state_name_map.get(t.get('from_state_id'), '?')} → {state_name_map.get(t.get('to_state_id'), '?')} · {t.get('required_role', '')}"
            for t in data.transitions
        )
        context += f"Current transitions:\n{trans_lines}\n"

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    client = OpenAI(api_key=api_key)

    history_messages = [
        {"role": m["role"], "content": m["content"]}
        for m in data.history[-10:]
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": CHAT_SYSTEM_PROMPT},
                *history_messages,
                {"role": "user", "content": f"{context}\nUser message: {data.message}"},
            ],
            temperature=0.4,
        )
        result = json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")

    action = result.get("action", "advice")
    message = result.get("message", "I'm not sure how to help with that.")

    if action == "warn":
        return {
            "message": message,
            "generated": False,
            "warn": True,
            "pending_states": result.get("states", []),
            "pending_transitions": result.get("transitions", []),
        }

    if action == "preview":
        return {"message": message, "generated": False, "preview": True}

    if action != "generate":
        return {"message": message, "generated": False}

    from app.models.task import Task
    in_use = db.query(Task).filter(Task.workflow_id == workflow.id).first()
    if in_use:
        return {"message": "I can't regenerate this workflow — it already has tasks assigned. Create a new workflow to start fresh.", "generated": False}

    db.query(Transition).filter(Transition.workflow_id == workflow.id).delete()
    db.query(State).filter(State.workflow_id == workflow.id).delete()
    db.commit()

    _save_states_and_transitions(db, workflow, result)

    states = db.query(State).filter(State.workflow_id == workflow.id).all()
    transitions = db.query(Transition).filter(Transition.workflow_id == workflow.id).all()

    return {
        "message": message,
        "generated": True,
        "states": [{"id": str(s.id), "name": s.name, "is_initial": s.is_initial, "is_final": s.is_final} for s in states],
        "transitions": [{"id": str(t.id), "from_state_id": str(t.from_state_id), "to_state_id": str(t.to_state_id), "required_role": t.required_role} for t in transitions],
    }


class ApplyRequest(BaseModel):
    workflow_id: uuid.UUID
    states: list[dict]
    transitions: list[dict]


@router.post("/apply-workflow")
def apply_workflow(
    data: ApplyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can apply workflows")

    workflow = get_workflow(db, data.workflow_id)

    from app.models.task import Task
    in_use = db.query(Task).filter(Task.workflow_id == workflow.id).first()
    if in_use:
        raise HTTPException(status_code=400, detail="Cannot apply — this workflow already has tasks assigned")

    db.query(Transition).filter(Transition.workflow_id == workflow.id).delete()
    db.query(State).filter(State.workflow_id == workflow.id).delete()
    db.commit()

    _save_states_and_transitions(db, workflow, {"states": data.states, "transitions": data.transitions})

    saved_states = db.query(State).filter(State.workflow_id == workflow.id).all()
    saved_transitions = db.query(Transition).filter(Transition.workflow_id == workflow.id).all()

    return {
        "states": [{"id": str(s.id), "name": s.name, "is_initial": s.is_initial, "is_final": s.is_final} for s in saved_states],
        "transitions": [{"id": str(t.id), "from_state_id": str(t.from_state_id), "to_state_id": str(t.to_state_id), "required_role": t.required_role} for t in saved_transitions],
    }
