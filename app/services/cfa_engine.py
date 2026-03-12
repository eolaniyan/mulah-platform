from __future__ import annotations

from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


def generate_cfa_summary(db: Session) -> dict:
    transactions = db.query(Transaction).all()

    if not transactions:
        return {
            "income_total": 0.0,
            "expense_total": 0.0,
            "net_cashflow": 0.0,
            "savings_rate": 0.0,
            "category_breakdown": {},
            "top_spending_category": None,
            "recurring_burden": 0.0,
        }

    income_total = round(sum(tx.amount for tx in transactions if tx.amount > 0), 2)
    expense_total = round(abs(sum(tx.amount for tx in transactions if tx.amount < 0)), 2)
    net_cashflow = round(income_total - expense_total, 2)

    savings_rate = 0.0
    if income_total > 0:
        savings_rate = round((net_cashflow / income_total) * 100, 2)

    category_breakdown_map = defaultdict(float)
    recurring_burden = 0.0

    for tx in transactions:
        if tx.amount < 0:
            category_breakdown_map[tx.category or "Uncategorized"] += abs(tx.amount)
        if tx.is_recurring and tx.amount < 0:
            recurring_burden += abs(tx.amount)

    category_breakdown = {
        k: round(v, 2) for k, v in sorted(category_breakdown_map.items(), key=lambda x: x[1], reverse=True)
    }

    top_spending_category = next(iter(category_breakdown), None)

    return {
        "income_total": income_total,
        "expense_total": expense_total,
        "net_cashflow": net_cashflow,
        "savings_rate": savings_rate,
        "category_breakdown": category_breakdown,
        "top_spending_category": top_spending_category,
        "recurring_burden": round(recurring_burden, 2),
    }