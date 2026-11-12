from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from datetime import datetime
from ..database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # INCOME, EXPENSE
    amount_minor = Column(BigInteger, nullable=False)  # Сумма в копейках
    category_id = Column(Integer, ForeignKey("categories.id"))
    date = Column(String, nullable=False)  # YYYY-MM-DD
    note = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)