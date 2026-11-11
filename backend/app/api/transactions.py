from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.category import Category
from ..models.transaction import Transaction as TransactionModel
from ..models.user import User
from ..schemas.transaction import TransactionCreate, TransactionUpdate, Transaction as TransactionSchema
from .deps import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


def _ensure_own_category(db: Session, user: User, category_id: int | None) -> None:
    """Категория операции должна принадлежать тому же пользователю."""
    if category_id is None:
        return
    owned = db.query(Category.id).filter(
        Category.id == category_id,
        Category.user_id == user.id,
    ).first()
    if owned is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Категория не найдена",
        )


@router.get("/", response_model=list[TransactionSchema])
def get_transactions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(TransactionModel).filter(TransactionModel.user_id == user.id).all()


@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # user_id берём только из сессии, не из тела запроса
    _ensure_own_category(db, user, transaction.category_id)
    db_transaction = TransactionModel(user_id=user.id, **transaction.model_dump(exclude={"user_id"}))
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == user.id,
    ).first()
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Операция не найдена",
        )

    changes = transaction_update.model_dump(exclude_unset=True)
    if "category_id" in changes:
        _ensure_own_category(db, user, changes["category_id"])
    for key, value in changes.items():
        setattr(db_transaction, key, value)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


@router.delete("/{transaction_id}")
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_transaction = db.query(TransactionModel).filter(
        TransactionModel.id == transaction_id,
        TransactionModel.user_id == user.id,
    ).first()
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Операция не найдена",
        )

    db.delete(db_transaction)
    db.commit()
    return {"message": "Операция удалена"}
