from __future__ import annotations

from datetime import timedelta


def build_forecast(analysis: dict, horizon_days: int = 30) -> dict:
    patterns = analysis.get("patterns", [])

    # Use the latest transaction date in the loaded dataset as the forecast anchor
    all_dates = []
    for item in patterns:
        all_dates.extend(item.get("dates", []))

    if not all_dates:
        return {
            "horizon_days": horizon_days,
            "forecast_anchor_date": None,
            "projected_outflow_total": 0.0,
            "projected_outflow_by_type": {},
            "upcoming_items": [],
        }

    anchor_date = max(all_dates)
    forecast_end = anchor_date + timedelta(days=horizon_days)

    forecast_items = []

    for item in patterns:
        if item.get("direction") != "outgoing":
            continue

        interval = item.get("avg_interval_days")
        if not interval or interval <= 0:
            continue

        dates = item.get("dates", [])
        if not dates:
            continue

        last_seen = dates[-1]
        next_due = last_seen + timedelta(days=interval)

        cursor = next_due
        while cursor <= forecast_end:
            forecast_items.append(
                {
                    "merchant": item["merchant"],
                    "classification": item["classification"],
                    "expected_date": cursor.isoformat(),
                    "amount": round(item["avg_amount"], 2),
                }
            )
            cursor += timedelta(days=interval)

    forecast_items.sort(key=lambda x: x["expected_date"])

    total_outflow = round(sum(x["amount"] for x in forecast_items), 2)

    by_type = {}
    for row in forecast_items:
        classification = row["classification"]
        by_type[classification] = round(by_type.get(classification, 0) + row["amount"], 2)

    return {
        "horizon_days": horizon_days,
        "forecast_anchor_date": anchor_date.isoformat(),
        "projected_outflow_total": total_outflow,
        "projected_outflow_by_type": by_type,
        "upcoming_items": forecast_items,
    }