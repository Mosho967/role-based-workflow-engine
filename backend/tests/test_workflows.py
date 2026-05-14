def test_admin_can_create_workflow(client, admin_headers):
    res = client.post("/workflows", json={"name": "My Workflow"}, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["name"] == "My Workflow"


def test_non_admin_cannot_create_workflow(client, auth_headers):
    res = client.post("/workflows", json={"name": "My Workflow"}, headers=auth_headers)
    assert res.status_code == 403


def test_unauthenticated_cannot_create_workflow(client):
    res = client.post("/workflows", json={"name": "My Workflow"})
    assert res.status_code == 403


def test_list_workflows_authenticated(client, admin_headers, auth_headers):
    client.post("/workflows", json={"name": "WF1"}, headers=admin_headers)
    res = client.get("/workflows", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_list_workflows_unauthenticated(client):
    res = client.get("/workflows")
    assert res.status_code == 403


def test_get_workflow_by_id(client, admin_headers):
    created = client.post("/workflows", json={"name": "Single WF"}, headers=admin_headers).json()
    res = client.get(f"/workflows/{created['id']}", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


def test_get_nonexistent_workflow(client, admin_headers):
    res = client.get("/workflows/00000000-0000-0000-0000-000000000000", headers=admin_headers)
    assert res.status_code == 404


def test_clear_workflow_removes_states_and_transitions(client, admin_headers):
    wf = client.post("/workflows", json={"name": "Clear Test"}, headers=admin_headers).json()
    wf_id = wf["id"]
    s1 = client.post(f"/workflows/{wf_id}/states", json={"name": "Start", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    s2 = client.post(f"/workflows/{wf_id}/states", json={"name": "End", "is_initial": False, "is_final": True}, headers=admin_headers).json()
    client.post(f"/workflows/{wf_id}/transitions", json={"from_state_id": s1["id"], "to_state_id": s2["id"], "required_role": "reviewer"}, headers=admin_headers)

    res = client.delete(f"/workflows/{wf_id}/clear", headers=admin_headers)
    assert res.status_code == 204

    states = client.get(f"/workflows/{wf_id}/states", headers=admin_headers).json()
    transitions = client.get(f"/workflows/{wf_id}/transitions", headers=admin_headers).json()
    assert states == []
    assert transitions == []


def test_clear_workflow_blocked_when_tasks_exist(client, admin_headers, auth_headers):
    wf = client.post("/workflows", json={"name": "Busy WF"}, headers=admin_headers).json()
    wf_id = wf["id"]
    s1 = client.post(f"/workflows/{wf_id}/states", json={"name": "Start", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    client.post("/tasks", json={"title": "Task", "workflow_id": wf_id}, headers=auth_headers)

    res = client.delete(f"/workflows/{wf_id}/clear", headers=admin_headers)
    assert res.status_code == 400
