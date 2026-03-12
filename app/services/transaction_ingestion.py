from __future__ import annotations

import pandas as pd
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.utils.normalization import normalize_merchant


DATE_CANDIDATES = ["date", "transaction_date", "posted_date"]
AMOUNT_CANDIDATES = ["amount", "debit", "credit"]
DESCRIPTION_CANDIDATES = ["description", "details", "narrative", "merchant"]


def _find_column(columns: list[str], candidates: list[str]) -> str | None:
    normalized = {c.lower().strip(): c for c in columns}
    for candidate in candidates:
        if candidate in normalized:
            return normalized[candidate]
    return None


def _categorize_transaction(merchant: str, amount: float) -> str:
    merchant_lower = merchant.lower()

    if merchant_lower in {"netflix", "spotify", "youtube premium", "youtube", "apple", "openai", "amazon prime", "disney+"}:
        return "Subscriptions"
    if merchant_lower in {"tesco", "lidl", "aldi"}:
        return "Groceries"
    if merchant_lower in {"uber"}:
        return "Transport"
    if merchant_lower in {"shell", "circle k"}:
        return "Fuel"
    if merchant_lower in {"deliveroo", "starbucks", "costa coffee", "cafe nero"}:
        return "Lifestyle"
    if merchant_lower in {"ranelagh rent", "electric ireland", "vodafone bill pay"}:
        return "Bills"
    if merchant_lower in {"salary", "freelance client"} or amount > 0:
        return "Income"
    return "General"


def ingest_csv(file_path: str, db: Session) -> dict:
    df = pd.read_csv(file_path)

    if df.empty:
        return {"inserted": 0, "errors": ["CSV file is empty"]}

    columns = list(df.columns)

    date_col = _find_column(columns, DATE_CANDIDATES)
    amount_col = _find_column(columns, AMOUNT_CANDIDATES)
    desc_col = _find_column(columns, DESCRIPTION_CANDIDATES)

    if not date_col or not amount_col or not desc_col:
        return {
            "inserted": 0,
            "errors": [
                "CSV must contain recognizable date, amount, and description/merchant columns"
            ],
        }

    inserted = 0
    errors = []

    for idx, row in df.iterrows():
        try:
            raw_date = row[date_col]
            raw_amount = row[amount_col]
            raw_desc = str(row[desc_col])

            parsed_date = pd.to_datetime(raw_date).date()
            amount = float(raw_amount)

            merchant = normalize_merchant(raw_desc)
            category = _categorize_transaction(merchant, amount)

            tx = Transaction(
                date=parsed_date,
                amount=amount,
                merchant=merchant,
                description=raw_desc,
                category=category,
                currency="EUR",
                is_recurring=False,
            )
            db.add(tx)
            inserted += 1
        except Exception as exc:
            errors.append(f"Row {idx + 1}: {exc}")

    db.commit()
    return {"inserted": inserted, "errors": errors}