from __future__ import annotations

from datetime import timedelta
from sqlalchemy.orm import Session

from app.models.subscription import Subscription
from app.models.transaction import Transaction
from app.services.recurring_pattern_engine import detect_recurring_patterns
from app.services.recurring_classifier import classify_recurring_pattern


def run_recurring_analysis(db: Session) -> dict:
    patterns = detect_recurring_patterns(db)
    classified_patterns = [classify_recurring_pattern(p) for p in patterns]

    return {
        "total_patterns": len(classified_patterns),
        "patterns": [
            {
                "merchant": p["merchant"],
                "transaction_count": p["transaction_count"],
                "avg_amount": p["avg_amount"],
                "avg_interval_days": p["avg_interval_days"],
                "direction": p["direction"],
                "classification": p["classification"],
                "recurring_confidence": p["recurring_confidence"],
                "classification_confidence": p["classification_confidence"],
                "categories": p["categories"],
            }
            for p in classified_patterns
        ],
    }


def extract_subscriptions(db: Session) -> dict:
    patterns = detect_recurring_patterns(db)
    classified_patterns = [classify_recurring_pattern(p) for p in patterns]

    db.query(Subscription).delete()
    db.flush()

    detected = 0

    for pattern in classified_patterns:
        if pattern["classification"] != "subscription":
            continue

        txs = pattern["transactions"]
        avg_interval = pattern["avg_interval_days"] or 30
        next_billing_date = txs[-1].date + timedelta(days=avg_interval)

        for tx in txs:
            tx.is_recurring = True

        sub = Subscription(
            merchant=pattern["merchant"],
            average_amount=pattern["avg_amount"],
            billing_cycle_days=avg_interval,
            next_billing_date=next_billing_date,
            status="active",
        )
        db.add(sub)
        detected += 1

    db.commit()
    return {"detected_subscriptions": detected}