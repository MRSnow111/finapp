from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CategoryBase(BaseModel):
    name: str
    type: str  # INCOME, EXPENSE, BOTH
    color: str
    icon: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class Category(CategoryBase):
    id: int
    user_id: int
    updated_at: datetime
    
    class Config:
        from_attributes = True