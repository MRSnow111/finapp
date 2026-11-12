from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class InviteCreate(BaseModel):
    email: EmailStr


class Invite(BaseModel):
    id: int
    email: str
    expires_at: datetime
    used_at: Optional[datetime]

    class Config:
        from_attributes = True


class InviteCreated(BaseModel):
    id: int
    email: str
    code: str  # показывается один раз
    expires_at: datetime
