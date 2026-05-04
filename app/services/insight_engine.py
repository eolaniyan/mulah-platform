from __future__ import annotations


def generate_insights(summary: dict, health: dict, recurring_analysis: dict) -> dict:
    insights = []
    warnings = []
    recommendations = []
    diagnosis = []

    income = summary.get("income_total", 0.0)
    expense = summary.get("expense_total", 0.0)
    net = summary.get("net_cashflow", 0.0)
    savings_rate = summary.get("savings_rate", 0.0)
    top_category = summary.get("top_spending_category")
    recurring_ratio = health.get("recurring_ratio", 0.0)

    patterns = recurring_analysis.get("patterns", [])
    subscriptions = [p for p in patterns if p["classification"] == "subscription"]
    bills = [p for p in patterns if p["classification"] == "bill"]
    usage = [p for p in patterns if p["classification"] == "usage_based_recurring"]

    diagnosis.append(f"You have {len(subscriptions)} active subscription-type recurring commitments.")
    diagnosis.append(f"You have {len(bills)} recurring bills or fixed obligations.")
    diagnosis.append(f"You have {len(usage)} usage-based recurring spend patterns.")

    if top_category:
        insights.append(f"Your top spending category is {top_category}.")

    if savings_rate >= 20:
        insights.append("Your savings rate is currently strong.")
    elif savings_rate >= 10:
        insights.append("Your savings rate is positive but has room to improve.")
    else:
        warnings.append("Your savings rate is low relative to your current spending pattern.")

    if recurring_ratio > 20:
        warnings.append("Recurring financial commitments are taking up a high share of your income.")
    elif recurring_ratio > 10:
        insights.append("Recurring commitments are noticeable but still manageable.")
    else:
        insights.append("Recurring commitment burden is currently relatively low.")

    if net < 0:
        warnings.append("You are spending more than you bring in across the loaded period.")
        recommendations.append("Reduce non-essential recurring and lifestyle spending immediately.")
    else:
        insights.append("Your net cashflow is positive across the loaded period.")

    if usage:
        recommendations.append("Review usage-based recurring spend like transport, food delivery, and convenience purchases.")
    if subscriptions:
        recommendations.append("Audit subscription value and remove anything underused.")
    if bills:
        recommendations.append("Track bill trends month to month to catch creeping increases early.")

    if income > 0 and expense > 0 and savings_rate < 15:
        recommendations.append("Aim to improve savings rate by 5–10 percentage points through targeted cuts.")

    return {
        "diagnosis": diagnosis,
        "insights": insights,
        "warnings": warnings,
        "recommendations": recommendations,
    }