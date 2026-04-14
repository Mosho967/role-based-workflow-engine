import pytest


@pytest.fixture
def workflow_setup(admin_headers, client):
    wf_res = client.post("/workflows", json={"name": "Audit Workflow"}, headers=admin_headers)
    workflow_id = wf_res.json()["id"]

    s1 = client.post(f"/workflows/{workflow_id}/states", json={"name": "Submitted", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    s2 = client.post(f"/workflows/{workflow_id}/states", json={"name": "Reviewed", "is_initial": False, "is_final": False}, headers=admin_headers).json()
    s3 = client.post(f"/workflows/{workflow_id}/states", json={"name": "Approved", "is_initial": False, "is_final": True}, headers=admin_headers).json()

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
        "title": "Audit Test Task",
        "workflow_id": workflow_setup["workflow_id"]
    }, headers=auth_headers)
    return res.json()


def test_audit_log_created_on_transition(client, auth_headers, user_task, workflow_setup):
    client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s2"]["id"]
    }, headers=auth_headers)

    res = client.get(f"/audit/{user_task['id']}", headers=auth_headers)
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) == 1


def test_audit_log_records_correct_states(client, auth_headers, user_task, workflow_setup):
    client.post("/transitions", json={
        "task_id": user_task["id"],
        "to_state_id": workflow_setup["s2"]["id"]
    }, headers=auth_headers)

    res = client.get(f"/audit/{user_task['id']}", headers=auth_headers)
    log = res.json()[0]
    assert log["from_state_id"] == workflow_setup["s1"]["id"]
    assert log["to_state_id"] == workflow_setup["s2"]["id"]


def test_audit_log_multiple_transitions(client, auth_headers, admin_headers, user_task, workflow_setup):
    client.post("/transitions", json={"task_id": user_task["id"], "to_state_id": workflow_setup["s2"]["id"]}, headers=auth_headers)
    client.post("/transitions", json={"task_id": user_task["id"], "to_state_id": workflow_setup["s3"]["id"]}, headers=admin_headers)

    res = client.get(f"/audit/{user_task['id']}", headers=auth_headers)
    logs = res.json()
    assert len(logs) == 2


def test_audit_log_empty_for_new_task(client, auth_headers, user_task):
    res = client.get(f"/audit/{user_task['id']}", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


def test_audit_log_requires_auth(client, user_task):
    res = client.get(f"/audit/{user_task['id']}")
    assert res.status_code == 403
