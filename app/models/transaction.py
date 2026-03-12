from sqlalchemy import Column, Integer, String, Float, Date, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, default="Uncategorized")
    currency = Column(String, nullable=False, default="EUR")
    is_recurring = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())