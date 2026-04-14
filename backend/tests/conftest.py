import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base import Base
from app.db.session import SessionLocal
from app.main import app as fastapi_app
from app.core.dependencies import get_db

import app.models.user  # noqa
import app.models.workflow  # noqa
import app.models.state  # noqa
import app.models.transition  # noqa
import app.models.task  # noqa
import app.models.audit_log  # noqa

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


fastapi_app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(fastapi_app)


@pytest.fixture
def registered_user(client):
    client.post("/auth/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123!",
    })
    return {"email": "test@example.com", "password": "Test123!"}


@pytest.fixture
def auth_headers(client, registered_user):
    res = client.post("/auth/login", json=registered_user)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user(client):
    from app.core.security import hash_password
    from app.models.user import User
    db = TestingSessionLocal()
    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash=hash_password("Admin123!"),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.close()
    return {"email": "admin@example.com", "password": "Admin123!"}


@pytest.fixture
def admin_headers(client, admin_user):
    res = client.post("/auth/login", json=admin_user)
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
