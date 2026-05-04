from __future__ import annotations

from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def generate_change_summary(db: Session) -> dict:
    txs = db.query(Transaction).order_by(Transaction.date.asc()).all()

    monthly_category_totals = defaultdict(lambda: defaultdict(float))

    for tx in txs:
        if tx.amount < 0:
            month_key = f"{tx.date.year}-{tx.date.month:02d}"
            monthly_category_totals[month_key][tx.category or "Uncategorized"] += abs(tx.amount)

    months = sorted(monthly_category_totals.keys())
    if len(months) < 2:
        return {
            "current_month": None,
            "previous_month": None,
            "changes": [],
        }

    previous_month = months[-2]
    current_month = months[-1]

    current_data = monthly_category_totals[current_month]
    previous_data = monthly_category_totals[previous_month]

    categories = sorted(set(current_data.keys()) | set(previous_data.keys()))
    changes = []

    for category in categories:
        prev_val = round(previous_data.get(category, 0.0), 2)
        curr_val = round(current_data.get(category, 0.0), 2)
        delta = round(curr_val - prev_val, 2)

        pct_change = None
        if prev_val > 0:
            pct_change = round((delta / prev_val) * 100, 2)

        changes.append(
            {
                "category": category,
                "previous": prev_val,
                "current": curr_val,
                "delta": delta,
                "pct_change": pct_change,
            }
        )

    changes.sort(key=lambda x: abs(x["delta"]), reverse=True)

    return {
        "current_month": current_month,
        "previous_month": previous_month,
        "changes": changes,
    }