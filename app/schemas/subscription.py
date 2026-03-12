from datetime import date, datetime
from pydantic import BaseModel


class SubscriptionResponse(BaseModel):
    id: int
    merchant: str
    average_amount: float
    billing_cycle_days: int
    next_billing_date: date | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True