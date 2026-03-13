from __future__ import annotations

from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def build_change_summary(db: Session) -> dict:
    transactions = db.query(Transaction).order_by(Transaction.date.asc()).all()

    if not transactions:
        return {
            "latest_month": None,
            "previous_month": None,
            "month_over_month": [],
        }

    monthly_totals = defaultdict(float)
    monthly_category_totals = defaultdict(lambda: defaultdict(float))

    for tx in transactions:
        month_key = tx.date.strftime("%Y-%m")
        if tx.amount < 0:
            monthly_totals[month_key] += abs(tx.amount)
            monthly_category_totals[month_key][tx.category or "Uncategorized"] += abs(tx.amount)

    months = sorted(monthly_totals.keys())
    if len(months) < 2:
        return {
            "latest_month": months[-1] if months else None,
            "previous_month": None,
            "month_over_month": [],
        }

    latest_month = months[-1]
    previous_month = months[-2]

    rows = []
    all_categories = set(monthly_category_totals[latest_month].keys()) | set(monthly_category_totals[previous_month].keys())

    for category in sorted(all_categories):
        latest_value = round(monthly_category_totals[latest_month].get(category, 0), 2)
        previous_value = round(monthly_category_totals[previous_month].get(category, 0), 2)

        if previous_value == 0:
            pct_change = None
        else:
            pct_change = round(((latest_value - previous_value) / previous_value) * 100, 2)

        rows.append(
            {
                "category": category,
                "latest_value": latest_value,
                "previous_value": previous_value,
                "pct_change": pct_change,
            }
        )

    rows.sort(key=lambda x: x["latest_value"], reverse=True)

    return {
        "latest_month": latest_month,
        "previous_month": previous_month,
        "month_over_month": rows,
    }