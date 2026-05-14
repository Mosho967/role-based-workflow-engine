import pytest
from app.core.security import hash_password
from app.models.user import User
from tests.conftest import TestingSessionLocal


@pytest.fixture
def workflow_with_states(client, admin_headers):
    wf = client.post("/workflows", json={"name": "Task Workflow"}, headers=admin_headers).json()
    wf_id = wf["id"]
    s1 = client.post(f"/workflows/{wf_id}/states", json={"name": "Submitted", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    s2 = client.post(f"/workflows/{wf_id}/states", json={"name": "Approved", "is_initial": False, "is_final": True}, headers=admin_headers).json()
    client.post(f"/workflows/{wf_id}/transitions", json={"from_state_id": s1["id"], "to_state_id": s2["id"], "required_role": "reviewer"}, headers=admin_headers)
    return {"workflow_id": wf_id, "initial_state_id": s1["id"]}


@pytest.fixture
def reviewer_headers(client):
    db = TestingSessionLocal()
    reviewer = User(
        username="reviewer",
        email="reviewer@example.com",
        password_hash=hash_password("Review123!"),
        role="reviewer",
        is_active=True,
    )
    db.add(reviewer)
    db.commit()
    db.close()
    res = client.post("/auth/login", json={"email": "reviewer@example.com", "password": "Review123!"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_user_can_create_task(client, auth_headers, workflow_with_states):
    res = client.post("/tasks", json={"title": "My Task", "workflow_id": workflow_with_states["workflow_id"]}, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["title"] == "My Task"
    assert res.json()["current_state_id"] == workflow_with_states["initial_state_id"]


def test_task_placed_in_initial_state(client, auth_headers, workflow_with_states):
    res = client.post("/tasks", json={"title": "Check State", "workflow_id": workflow_with_states["workflow_id"]}, headers=auth_headers)
    assert res.json()["current_state_id"] == workflow_with_states["initial_state_id"]


def test_unauthenticated_cannot_create_task(client, workflow_with_states):
    res = client.post("/tasks", json={"title": "Sneaky", "workflow_id": workflow_with_states["workflow_id"]})
    assert res.status_code == 403


def test_user_can_list_own_tasks(client, auth_headers, workflow_with_states):
    client.post("/tasks", json={"title": "Task 1", "workflow_id": workflow_with_states["workflow_id"]}, headers=auth_headers)
    client.post("/tasks", json={"title": "Task 2", "workflow_id": workflow_with_states["workflow_id"]}, headers=auth_headers)
    res = client.get("/tasks", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_admin_can_list_all_tasks(client, auth_headers, admin_headers, workflow_with_states):
    client.post("/tasks", json={"title": "User Task", "workflow_id": workflow_with_states["workflow_id"]}, headers=auth_headers)
    res = client.get("/tasks", headers=admin_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_reviewer_can_list_all_tasks(client, auth_headers, reviewer_headers, workflow_with_states):
    client.post("/tasks", json={"title": "For Reviewer", "workflow_id": workflow_with_states["workflow_id"]}, headers=auth_headers)
    res = client.get("/tasks", headers=reviewer_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_user_cannot_see_other_users_task(client, admin_headers, workflow_with_states):
    db = TestingSessionLocal()
    other = User(
        username="otheruser",
        email="other@example.com",
        password_hash=hash_password("Other123!"),
        role="user",
        is_active=True,
    )
    db.add(other)
    db.commit()
    db.close()
    other_headers_res = client.post("/auth/login", json={"email": "other@example.com", "password": "Other123!"})
    other_headers = {"Authorization": f"Bearer {other_headers_res.json()['access_token']}"}

    task = client.post("/tasks", json={"title": "Private Task", "workflow_id": workflow_with_states["workflow_id"]}, headers=other_headers).json()

    from app.core.security import hash_password as hp
    db2 = TestingSessionLocal()
    viewer = User(username="viewer", email="viewer@example.com", password_hash=hp("Viewer123!"), role="user", is_active=True)
    db2.add(viewer)
    db2.commit()
    db2.close()
    viewer_res = client.post("/auth/login", json={"email": "viewer@example.com", "password": "Viewer123!"})
    viewer_headers = {"Authorization": f"Bearer {viewer_res.json()['access_token']}"}

    res = client.get(f"/tasks/{task['id']}", headers=viewer_headers)
    assert res.status_code == 403
