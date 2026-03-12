from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.subscription import Subscription
from app.models.transaction import Transaction
from app.schemas.subscription import SubscriptionResponse
from app.services.subscription_engine import extract_subscriptions, run_recurring_analysis

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


@router.post("/detect")
def detect_subscriptions(db: Session = Depends(get_db)):
    return extract_subscriptions(db)


@router.get("/", response_model=list[SubscriptionResponse])
def list_subscriptions(db: Session = Depends(get_db)):
    return db.query(Subscription).order_by(Subscription.merchant.asc()).all()


@router.get("/analysis")
def recurring_analysis(db: Session = Depends(get_db)):
    return run_recurring_analysis(db)


@router.get("/debug")
def debug_transactions_for_detection(db: Session = Depends(get_db)):
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.merchant.asc(), Transaction.date.asc())
        .all()
    )

    return [
        {
            "merchant": tx.merchant,
            "amount": tx.amount,
            "date": str(tx.date),
            "category": tx.category,
            "is_recurring": tx.is_recurring,
        }
        for tx in transactions
    ]