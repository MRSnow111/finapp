from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..schemas.user import User as UserSchema
from .deps import get_current_admin, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserSchema])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Список пользователей (админка)."""
    return db.query(User).order_by(User.id).all()


@router.post("/{user_id}/block", response_model=UserSchema)
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Заблокировать аккаунт."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя заблокировать свой аккаунт",
        )
    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.post("/{user_id}/unblock", response_model=UserSchema)
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Разблокировать аккаунт."""
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден",
        )
    user.is_active = True
    db.commit()
    db.refresh(user)
    return user
