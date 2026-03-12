from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from statistics import mean
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.subscription import Subscription


KNOWN_SUBSCRIPTION_MERCHANTS = {
    "netflix",
    "spotify",
    "apple",
    "disney+",
    "youtube",
    "google",
    "openai",
    "amazon prime",
    "icloud",
}

EXCLUDED_USAGE_BASED_MERCHANTS = {
    "uber",
    "tesco",
    "aldi",
    "lidl",
    "shell",
    "circle k",
}


def detect_recurring_subscriptions(db: Session) -> dict:
    """
    Improved subscription detection:
    - outgoing transactions only
    - same merchant appears at least 3 times
    - intervals roughly regular
    - amounts reasonably consistent
    - prioritizes known subscription merchants / categories
    - excludes common usage-based merchants like Uber, fuel, groceries
    """
    transactions = (
        db.query(Transaction)
        .filter(Transaction.amount < 0)
        .order_by(Transaction.merchant.asc(), Transaction.date.asc())
        .all()
    )

    grouped: dict[str, list[Transaction]] = defaultdict(list)
    for tx in transactions:
        merchant_key = (tx.merchant or "").strip().lower()
        grouped[merchant_key].append(tx)

    detected = 0

    db.query(Subscription).delete()
    db.flush()

    for merchant_key, txs in grouped.items():
        if len(txs) < 3:
            continue

        if merchant_key in EXCLUDED_USAGE_BASED_MERCHANTS:
            continue

        dates = [tx.date for tx in txs]
        amounts = [abs(tx.amount) for tx in txs]
        categories = {(tx.category or "").strip().lower() for tx in txs}

        intervals = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        if not intervals:
            continue

        avg_interval = mean(intervals)
        avg_amount = mean(amounts)

        interval_ok = (
            27 <= avg_interval <= 32     # monthly
            or 6 <= avg_interval <= 8    # weekly
            or 13 <= avg_interval <= 15  # biweekly
            or 360 <= avg_interval <= 370
        )

        if not interval_ok:
            continue

        max_deviation = max(abs(a - avg_amount) for a in amounts)
        amount_ok = avg_amount > 0 and (max_deviation / avg_amount) <= 0.15

        if not amount_ok:
            continue

        # Stronger subscription confidence
        is_known_subscription = merchant_key in KNOWN_SUBSCRIPTION_MERCHANTS
        is_subscription_category = "subscriptions" in categories

        # For MVP, require at least one strong subscription signal
        if not (is_known_subscription or is_subscription_category):
            continue

        for tx in txs:
            tx.is_recurring = True

        next_billing_date = dates[-1] + timedelta(days=round(avg_interval))

        sub = Subscription(
            merchant=txs[0].merchant,
            average_amount=round(avg_amount, 2),
            billing_cycle_days=round(avg_interval),
            next_billing_date=next_billing_date,
            status="active",
        )
        db.add(sub)
        detected += 1

    db.commit()
    return {"detected_subscriptions": detected}