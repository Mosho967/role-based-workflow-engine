"""
Run this script once to create the first admin user.
Usage (from backend/ with venv activated):
    python seed.py
"""

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
import app.models.workflow  # noqa
import app.models.state  # noqa
import app.models.transition  # noqa
import app.models.task  # noqa
import app.models.audit_log  # noqa

ADMIN_USERNAME = "admin"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "changeme123"


def seed():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            print(f"Admin user already exists: {ADMIN_EMAIL}")
            return

        admin = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Admin user created: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print("Change the password after first login.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
