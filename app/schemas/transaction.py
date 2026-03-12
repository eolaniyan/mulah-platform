from datetime import date, datetime
from pydantic import BaseModel


class TransactionBase(BaseModel):
    date: date
    amount: float
    merchant: str
    description: str | None = None
    category: str | None = "Uncategorized"
    currency: str = "EUR"
    is_recurring: bool = False


class TransactionResponse(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True