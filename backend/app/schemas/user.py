from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=50)


class UserCreate(UserBase):
    password: str = Field(min_length=10, max_length=128)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    password: str | None = Field(default=None, min_length=10, max_length=128)


class User(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
