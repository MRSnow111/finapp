"""Профиль: смена пароля, экспорт/импорт, удаление аккаунта."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..core.security import hash_password, verify_password
from ..database import get_db
from ..models.category import Category
from ..models.transaction import Transaction
from ..models.user import User
from ..schemas.auth import ChangePasswordInput, ConfirmPasswordInput
from .deps import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


class UpdateNameInput(BaseModel):
    name: str = Field(min_length=1, max_length=50)


@router.put("/name", response_model=dict)
def update_name(
    data: UpdateNameInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.name = data.name.strip()
    db.commit()
    return {"message": "Имя обновлено", "name": user.name}


@router.post("/change-password")
def change_password(
    data: ChangePasswordInput,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Текущий пароль неверный",
        )
    if verify_password(data.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Новый пароль совпадает с текущим",
        )
    user.password_hash = hash_password(data.new_password)
    db.commit()
    return {"message": "Пароль изменён"}


def _export_payload(user: User, db: Session) -> dict:
    """Формат экспорта — та же схема данных, её читает Android-приложение."""
    categories = (
        db.query(Category).filter(Category.user_id == user.id).order_by(Category.id).all()
    )
    transactions = (
        db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.id).all()
    )
    return {
        "version": 1,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "profile": {
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at.isoformat(),
        },
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "type": c.type,
                "color": c.color,
                "icon": c.icon,
                "updated_at": c.updated_at.isoformat(),
            }
            for c in categories
        ],
        "transactions": [
            {
                "id": t.id,
                "type": t.type,
                "amount_minor": t.amount_minor,
                "category_id": t.category_id,
                "date": t.date,
                "note": t.note,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat(),
            }
            for t in transactions
        ],
    }


@router.get("/export")
def export_data(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    payload = _export_payload(user, db)
    filename = f"finapp-export-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.json"
    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


class ImportCategory(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=50)
    type: str
    color: str = "#6b7280"
    icon: str | None = None


class ImportTransaction(BaseModel):
    id: int
    type: str
    amount_minor: int
    category_id: int | None = None
    date: str
    note: str | None = None


class ImportPayload(BaseModel):
    version: int = 1
    categories: list[ImportCategory]
    transactions: list[ImportTransaction]


@router.post("/import")
def import_data(
    payload: ImportPayload,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Импорт файла экспорта. Только в аккаунт без операций (иначе круг не гарантирован)."""
    existing = db.query(Transaction).filter(Transaction.user_id == user.id).count()
    if existing > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Импорт возможен только в аккаунт без операций. Удалите текущие операции и попробуйте снова",
        )

    # Категории: сопоставление по (name, type), чтобы не плодить дубли
    current = db.query(Category).filter(Category.user_id == user.id).all()
    by_key = {(c.name.lower(), c.type): c for c in current}
    id_map: dict[int, int | None] = {}

    for cat in payload.categories:
        key = (cat.name.lower(), cat.type)
        existing_cat = by_key.get(key)
        if existing_cat is not None:
            id_map[cat.id] = existing_cat.id
        else:
            new_cat = Category(
                user_id=user.id,
                name=cat.name,
                type=cat.type,
                color=cat.color,
                icon=cat.icon,
            )
            db.add(new_cat)
            db.flush()
            id_map[cat.id] = new_cat.id
            by_key[key] = new_cat

    added_txs = 0
    for tx in payload.transactions:
        if tx.type not in ("INCOME", "EXPENSE"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неизвестный тип операции: {tx.type}",
            )
        db.add(
            Transaction(
                user_id=user.id,
                type=tx.type,
                amount_minor=tx.amount_minor,
                category_id=id_map.get(tx.category_id) if tx.category_id is not None else None,
                date=tx.date,
                note=tx.note,
            )
        )
        added_txs += 1

    db.commit()
    return {"message": "Импорт завершён", "categories": len(payload.categories), "transactions": added_txs}


@router.delete("/account")
def delete_account(
    data: ConfirmPasswordInput,
    response: Response,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Удаление аккаунта с данными. Требует пароль."""
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный пароль",
        )
    if user.role == "admin":
        admins = db.query(User).filter(User.role == "admin", User.is_active.is_(True)).count()
        if admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя удалить единственного администратора. Сначала создайте другого",
            )

    db.query(Transaction).filter(Transaction.user_id == user.id).delete()
    db.query(Category).filter(Category.user_id == user.id).delete()
    db.delete(user)
    db.commit()
    response.delete_cookie(key="finapp_session", path="/")
    return {"message": "Аккаунт удалён"}
