from sqlalchemy import Column, Integer, String, Float, Date, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    merchant = Column(String, nullable=False, index=True)
    average_amount = Column(Float, nullable=False)
    billing_cycle_days = Column(Integer, nullable=False, default=30)
    next_billing_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())