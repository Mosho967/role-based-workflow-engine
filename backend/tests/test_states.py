import pytest


@pytest.fixture
def workflow(client, admin_headers):
    res = client.post("/workflows", json={"name": "State Test Workflow"}, headers=admin_headers)
    return res.json()


def test_admin_can_create_state(client, admin_headers, workflow):
    res = client.post(f"/workflows/{workflow['id']}/states", json={
        "name": "Submitted", "is_initial": True, "is_final": False
    }, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["name"] == "Submitted"
    assert res.json()["is_initial"] is True


def test_non_admin_cannot_create_state(client, auth_headers, workflow):
    res = client.post(f"/workflows/{workflow['id']}/states", json={
        "name": "Submitted", "is_initial": True, "is_final": False
    }, headers=auth_headers)
    assert res.status_code == 403


def test_list_states(client, admin_headers, workflow):
    client.post(f"/workflows/{workflow['id']}/states", json={"name": "Start", "is_initial": True, "is_final": False}, headers=admin_headers)
    client.post(f"/workflows/{workflow['id']}/states", json={"name": "End", "is_initial": False, "is_final": True}, headers=admin_headers)
    res = client.get(f"/workflows/{workflow['id']}/states", headers=admin_headers)
    assert res.status_code == 200
    assert len(res.json()) == 2


def test_duplicate_initial_state_blocked(client, admin_headers, workflow):
    client.post(f"/workflows/{workflow['id']}/states", json={"name": "First Start", "is_initial": True, "is_final": False}, headers=admin_headers)
    res = client.post(f"/workflows/{workflow['id']}/states", json={"name": "Second Start", "is_initial": True, "is_final": False}, headers=admin_headers)
    assert res.status_code == 400


def test_delete_state(client, admin_headers, workflow):
    state = client.post(f"/workflows/{workflow['id']}/states", json={"name": "To Delete", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    res = client.delete(f"/workflows/{workflow['id']}/states/{state['id']}", headers=admin_headers)
    assert res.status_code == 204
    states = client.get(f"/workflows/{workflow['id']}/states", headers=admin_headers).json()
    assert all(s["id"] != state["id"] for s in states)


def test_non_admin_cannot_delete_state(client, admin_headers, auth_headers, workflow):
    state = client.post(f"/workflows/{workflow['id']}/states", json={"name": "Protected", "is_initial": True, "is_final": False}, headers=admin_headers).json()
    res = client.delete(f"/workflows/{workflow['id']}/states/{state['id']}", headers=auth_headers)
    assert res.status_code == 403


def test_toggle_state_final(client, admin_headers, workflow):
    state = client.post(f"/workflows/{workflow['id']}/states", json={"name": "Middle", "is_initial": False, "is_final": False}, headers=admin_headers).json()
    assert state["is_final"] is False
    res = client.patch(f"/workflows/{workflow['id']}/states/{state['id']}/toggle-final", headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["is_final"] is True
    res2 = client.patch(f"/workflows/{workflow['id']}/states/{state['id']}/toggle-final", headers=admin_headers)
    assert res2.json()["is_final"] is False


def test_non_admin_cannot_toggle_final(client, admin_headers, auth_headers, workflow):
    state = client.post(f"/workflows/{workflow['id']}/states", json={"name": "Middle", "is_initial": False, "is_final": False}, headers=admin_headers).json()
    res = client.patch(f"/workflows/{workflow['id']}/states/{state['id']}/toggle-final", headers=auth_headers)
    assert res.status_code == 403
