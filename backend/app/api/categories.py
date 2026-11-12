from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.category import Category as CategoryModel
from ..models.transaction import Transaction
from ..schemas.category import CategoryCreate, CategoryUpdate, Category as CategorySchema
from .deps import get_current_user
from ..models.user import User

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("/", response_model=list[CategorySchema])
def get_categories(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(CategoryModel).filter(CategoryModel.user_id == user.id).all()


@router.post("/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # user_id берём только из сессии, не из тела запроса
    db_category = CategoryModel(user_id=user.id, **category.model_dump(exclude={"user_id"}))
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == user.id,
    ).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена",
        )

    for key, value in category_update.model_dump(exclude_unset=True).items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db_category = db.query(CategoryModel).filter(
        CategoryModel.id == category_id,
        CategoryModel.user_id == user.id,
    ).first()
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена",
        )

    # Проверяем, есть ли операции с этой категорией
    has_transactions = db.query(Transaction).filter(
        Transaction.category_id == category_id,
        Transaction.user_id == user.id,
    ).first()
    if has_transactions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невозможно удалить категорию, так как есть операции с ней",
        )

    db.delete(db_category)
    db.commit()
    return {"message": "Категория удалена"}
