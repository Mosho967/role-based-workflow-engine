import pytest
from tests.conftest import TestingSessionLocal
from app.models.workflow import Workflow
from app.models.state import State
from app.models.transition import Transition
from app.models.task import Task
from app.models.user import User
from app.core.security import hash_password
import uuid


@pytest.fixture
def workflow_setup(admin_headers, client):
    # Create workflow
    wf_res = client.post("/workflows", json={"name": "Test Workflow"}, headers=admin_headers)
    workflow_id = wf_res.json()["id"]

    # Create states
    s1 = client.post(f"/workflows/{workflow_id}/states", json={"name": "Submitted", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    s2 = client.post(f"/workflows/{workflow_id}/states", json={"name": "Reviewed", "is_initial": False, "is_final": False}, headers=admin_headers).json()
    s3 = client.post(f"/workflows/{workflow_id}/states", json={"name": "Approved", "is_initial": False, "is_final": True}, headers=admin_headers).json()

    # Create transitions
    client.post(f"/workflows/{workflow_id}/transitions", json={
        "from_state_id": s1["id"],
        "to_state_id": s2["id"],
        "required_role": "user"
    }, headers=admin_headers)

    client.post(f"/workflows/{workflow_id}/transitions", json={
        "from_state_id": s2["id"],
        "to_state_id": s3["id"],
        "required_role": "admin"
    }, headers=admin_headers)

    return {"workflow_id": workflow_id, "s1": s1, "s2": s2, "s3": s3}


@pytest.fixture
def user_task(client, auth_headers, workflow_setup):
    res = client.post("/tasks", json={
        "title": "Test Task",
        "workflow_id": workflow_setup["workflow_id"]
    }, headers=auth_headers)
    return res.json()


def test_task_created_in_initial_state(user_task, workflow_setup):
    assert user_task["current_state_id"] == workflow_setup["s1"]["id"]


def test_user_can_trigger_allowed_transition(client, auth_headers, user_task, workflow_setup):
    res = client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s2"]["id"]
    }, headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["current_state_id"] == workflow_setup["s2"]["id"]


def test_user_cannot_trigger_admin_transition(client, auth_headers, user_task, workflow_setup):
    # First move to s2
    client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s2"]["id"]
    }, headers=auth_headers)

    # Try to move to s3 as user — should fail
    res = client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s3"]["id"]
    }, headers=auth_headers)
    assert res.status_code == 403


def test_admin_can_trigger_admin_transition(client, auth_headers, admin_headers, user_task, workflow_setup):
    # Move to s2 as user first
    client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s2"]["id"]
    }, headers=auth_headers)

    # Move to s3 as admin
    res = client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s3"]["id"]
    }, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["current_state_id"] == workflow_setup["s3"]["id"]


def test_cannot_transition_from_final_state(client, auth_headers, admin_headers, user_task, workflow_setup):
    # Move through to final state
    client.post("/transitions", json={"task_id": user_task["id"], "to_state_id": workflow_setup["s2"]["id"]}, headers=auth_headers)
    client.post("/transitions", json={"task_id": user_task["id"], "to_state_id": workflow_setup["s3"]["id"]}, headers=admin_headers)

    # Try to transition again from final state
    res = client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s2"]["id"]
    }, headers=admin_headers)
    assert res.status_code == 400


def test_invalid_transition_role(client):
    wf_id = str(uuid.uuid4())
    s1_id = str(uuid.uuid4())
    s2_id = str(uuid.uuid4())

    db = TestingSessionLocal()
    wf = Workflow(id=uuid.UUID(wf_id), name="Role Test", created_by=uuid.uuid4())

    admin = User(username="roleadmin", email="roleadmin@example.com", password_hash=hash_password("Admin123!"), role="admin", is_active=True)
    db.add(admin)
    db.flush()

    wf.created_by = admin.id
    db.add(wf)

    s1 = State(id=uuid.UUID(s1_id), workflow_id=uuid.UUID(wf_id), name="Start", is_initial=True, is_final=False)
    s2 = State(id=uuid.UUID(s2_id), workflow_id=uuid.UUID(wf_id), name="End", is_initial=False, is_final=True)
    db.add_all([s1, s2])
    db.commit()
    db.close()

    from tests.conftest import fastapi_app as app_instance
    res = app_instance.dependency_overrides

    # Test invalid role via API
    from starlette.testclient import TestClient
    client2 = TestClient(app_instance)
    login = client2.post("/auth/login", json={"email": "roleadmin@example.com", "password": "Admin123!"})
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    res = client2.post(f"/workflows/{wf_id}/transitions", json={
        "from_state_id": s1_id,
        "to_state_id": s2_id,
        "required_role": "superuser"
    }, headers=headers)
    assert res.status_code == 422
