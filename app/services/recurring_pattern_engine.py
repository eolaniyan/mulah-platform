from __future__ import annotations

from collections import defaultdict
from statistics import mean
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def detect_recurring_patterns(db: Session) -> list[dict]:
    """
    Detect repeated transaction patterns without deciding yet whether
    they are subscriptions, bills, or usage-based recurring spend.
    """
    transactions = (
        db.query(Transaction)
        .order_by(Transaction.merchant.asc(), Transaction.date.asc())
        .all()
    )

    grouped: dict[str, list[Transaction]] = defaultdict(list)
    for tx in transactions:
        merchant_key = (tx.merchant or "").strip().lower()
        if merchant_key:
            grouped[merchant_key].append(tx)

    patterns: list[dict] = []

    for merchant_key, txs in grouped.items():
        if len(txs) < 3:
            continue

        dates = [tx.date for tx in txs]
        amounts = [tx.amount for tx in txs]

        outgoing = [abs(a) for a in amounts if a < 0]
        incoming = [a for a in amounts if a > 0]

        direction = "mixed"
        sample_amounts = amounts

        if len(outgoing) == len(amounts):
            direction = "outgoing"
            sample_amounts = outgoing
        elif len(incoming) == len(amounts):
            direction = "incoming"
            sample_amounts = incoming

        intervals = []
        for i in range(1, len(dates)):
            intervals.append((dates[i] - dates[i - 1]).days)

        avg_interval = round(mean(intervals)) if intervals else None
        avg_amount = round(mean(sample_amounts), 2) if sample_amounts else 0.0

        amount_consistency = 0.0
        if avg_amount > 0 and sample_amounts:
            max_deviation = max(abs(a - avg_amount) for a in sample_amounts)
            amount_consistency = round(1 - min(max_deviation / avg_amount, 1), 3)

        interval_consistency = 0.0
        if avg_interval and intervals:
            max_interval_deviation = max(abs(i - avg_interval) for i in intervals)
            interval_consistency = round(1 - min(max_interval_deviation / max(avg_interval, 1), 1), 3)

        recurring_confidence = round((amount_consistency + interval_consistency) / 2, 3)

        patterns.append(
            {
                "merchant": txs[0].merchant,
                "merchant_key": merchant_key,
                "transaction_count": len(txs),
                "direction": direction,
                "dates": dates,
                "amounts": amounts,
                "avg_amount": avg_amount,
                "avg_interval_days": avg_interval,
                "amount_consistency": amount_consistency,
                "interval_consistency": interval_consistency,
                "recurring_confidence": recurring_confidence,
                "categories": sorted({(tx.category or "Uncategorized") for tx in txs}),
                "transactions": txs,
            }
        )

    return patterns