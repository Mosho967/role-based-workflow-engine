
def test_register_success(client):
    res = client.post("/auth/register", json={
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "Test123!",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "user"
    assert "password_hash" not in data


def test_register_duplicate_email(client, registered_user):
    res = client.post("/auth/register", json={
        "username": "anotheruser",
        "email": "test@example.com",
        "password": "Test123!",
    })
    assert res.status_code == 400
    assert "Email already registered" in res.json()["detail"]


def test_register_duplicate_username(client, registered_user):
    res = client.post("/auth/register", json={
        "username": "testuser",
        "email": "other@example.com",
        "password": "Test123!",
    })
    assert res.status_code == 400
    assert "Username already taken" in res.json()["detail"]


def test_register_weak_password(client):
    res = client.post("/auth/register", json={
        "username": "weakuser",
        "email": "weak@example.com",
        "password": "password",
    })
    assert res.status_code == 422


def test_register_short_username(client):
    res = client.post("/auth/register", json={
        "username": "ab",
        "email": "short@example.com",
        "password": "Test123!",
    })
    assert res.status_code == 422


def test_login_success(client, registered_user):
    res = client.post("/auth/login", json=registered_user)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, registered_user):
    res = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPass1!",
    })
    assert res.status_code == 401


def test_login_wrong_email(client):
    res = client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "Test123!",
    })
    assert res.status_code == 401


def test_protected_route_without_token(client):
    res = client.get("/tasks")
    assert res.status_code == 403


def test_protected_route_with_token(client, auth_headers):
    res = client.get("/tasks", headers=auth_headers)
    assert res.status_code == 200


def test_login_deactivated_account(client):
    from app.models.user import User
    from app.core.security import hash_password
    from tests.conftest import TestingSessionLocal

    db = TestingSessionLocal()
    user = User(
        username="inactive",
        email="inactive@example.com",
        password_hash=hash_password("Test123!"),
        role="user",
        is_active=False,
    )
    db.add(user)
    db.commit()
    db.close()

    res = client.post("/auth/login", json={
        "email": "inactive@example.com",
        "password": "Test123!",
    })
    assert res.status_code == 403
    assert "deactivated" in res.json()["detail"].lower()
