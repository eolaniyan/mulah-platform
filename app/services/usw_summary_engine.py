from __future__ import annotations


def build_usw_summary(analysis: dict) -> dict:
    patterns = analysis.get("patterns", [])

    subscription_items = [p for p in patterns if p["classification"] == "subscription" and p["direction"] == "outgoing"]
    bill_items = [p for p in patterns if p["classification"] == "bill" and p["direction"] == "outgoing"]
    usage_items = [p for p in patterns if p["classification"] == "usage_based_recurring" and p["direction"] == "outgoing"]

    subscription_total = round(sum(p["avg_amount"] for p in subscription_items), 2)
    bill_total = round(sum(p["avg_amount"] for p in bill_items), 2)
    usage_total = round(sum(p["avg_amount"] for p in usage_items), 2)

    monthly_recurring_total = round(subscription_total + bill_total + usage_total, 2)
    annual_recurring_total = round(monthly_recurring_total * 12, 2)

    return {
        "subscription_count": len(subscription_items),
        "bill_count": len(bill_items),
        "usage_based_count": len(usage_items),
        "subscription_total_monthly": subscription_total,
        "bill_total_monthly": bill_total,
        "usage_total_monthly": usage_total,
        "monthly_recurring_total": monthly_recurring_total,
        "annual_recurring_total": annual_recurring_total,
        "subscriptions": subscription_items,
        "bills": bill_items,
        "usage_based": usage_items,
    }