from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, require_role
from app.models.user import User
from app.schemas.user import UserAdminCreate, UserRead
from app.services.auth_service import create_user_as_admin

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return db.query(User).all()


@router.post("", response_model=UserRead, status_code=201)
def create_user(
    data: UserAdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    return create_user_as_admin(db, data)


@router.patch("/{user_id}/deactivate", response_model=UserRead)
def deactivate_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate your own account")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
