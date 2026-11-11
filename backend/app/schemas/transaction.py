import re
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Максимум 10 млрд рублей в копейках: защита от опечаток и переполнения
MAX_AMOUNT_MINOR = 10_000_000_000_00
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _check_date(value: str) -> str:
    if not _DATE_RE.match(value):
        raise ValueError("Дата должна быть в формате YYYY-MM-DD")
    try:
        date.fromisoformat(value)
    except ValueError:
        raise ValueError("Некорректная дата")
    return value


class TransactionBase(BaseModel):
    type: Literal["INCOME", "EXPENSE"]
    amount_minor: int = Field(gt=0, le=MAX_AMOUNT_MINOR, description="Сумма в копейках, больше нуля")
    category_id: Optional[int] = None
    date: str  # YYYY-MM-DD
    note: Optional[str] = Field(default=None, max_length=200)

    _check_date = field_validator("date")(_check_date)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    # Все поля необязательны, но если переданы — проходят те же проверки
    type: Optional[Literal["INCOME", "EXPENSE"]] = None
    amount_minor: Optional[int] = Field(default=None, gt=0, le=MAX_AMOUNT_MINOR)
    category_id: Optional[int] = None
    date: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=200)

    @field_validator("date")
    @classmethod
    def _validate_date(cls, value: Optional[str]) -> Optional[str]:
        return None if value is None else _check_date(value)


class Transaction(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
