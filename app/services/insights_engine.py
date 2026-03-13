from __future__ import annotations


def build_insight_cards(summary: dict, health: dict, usw_summary: dict, forecast: dict, change_summary: dict, anomalies: dict) -> dict:
    diagnosis = []
    warnings = []
    recommendations = []
    observations = []

    income_total = summary.get("income_total", 0.0)
    expense_total = summary.get("expense_total", 0.0)
    savings_rate = summary.get("savings_rate", 0.0)
    top_spending_category = summary.get("top_spending_category")
    recurring_burden = summary.get("recurring_burden", 0.0)
    mulah_score = health.get("mulah_score", 0)
    risk_level = health.get("risk_level", "Unknown")

    monthly_recurring_total = usw_summary.get("monthly_recurring_total", 0.0)
    subscription_total = usw_summary.get("subscription_total_monthly", 0.0)
    bill_total = usw_summary.get("bill_total_monthly", 0.0)
    usage_total = usw_summary.get("usage_total_monthly", 0.0)

    recurring_ratio = 0.0
    if income_total > 0:
        recurring_ratio = round((monthly_recurring_total / income_total) * 100, 2)

    diagnosis.append(
        {
            "title": "Financial Health",
            "status": risk_level.lower(),
            "message": f"Mulah score is {mulah_score} with a {risk_level.lower()} current risk profile.",
        }
    )

    diagnosis.append(
        {
            "title": "Recurring Burden",
            "status": "info",
            "message": f"Monthly recurring outflows are {monthly_recurring_total:.2f}, which is {recurring_ratio}% of income.",
        }
    )

    if bill_total > subscription_total and bill_total > usage_total:
        diagnosis.append(
            {
                "title": "Primary Pressure",
                "status": "info",
                "message": "Bills are currently the largest recurring pressure on cashflow.",
            }
        )

    if top_spending_category:
        observations.append(f"Top spending category is {top_spending_category}.")
    if savings_rate >= 20:
        observations.append("Savings rate is strong relative to income.")
    elif savings_rate >= 10:
        observations.append("Savings rate is positive but could be improved.")
    else:
        observations.append("Savings rate is weak and may need active intervention.")

    if subscription_total > 100:
        warnings.append("Subscription burden is elevated. Review subscriptions for overlap or underuse.")
    if usage_total > 150:
        warnings.append("Usage-based recurring spend is materially high. Habitual lifestyle spending may be leaking cash.")
    if savings_rate < 10:
        warnings.append("Savings rate is below a healthy target range.")
    if forecast.get("projected_outflow_total", 0.0) > (income_total * 0.5 if income_total else 0):
        warnings.append("Projected next-30-day recurring outflow is high relative to income.")
    for flag in anomalies.get("flags", []):
        warnings.append(flag["message"])

    if subscription_total > 0:
        recommendations.append("Audit subscriptions and consider pruning any low-value recurring services.")
    if usage_total > 0:
        recommendations.append("Track transport, delivery, and coffee-style spend weekly to reduce leakage.")
    if bill_total > 0:
        recommendations.append("Map fixed bills into a monthly obligations view so pressure is visible before due dates.")
    if savings_rate < 15:
        recommendations.append("Increase monthly surplus by reducing discretionary repeat spend or setting a fixed savings transfer.")
    if recurring_ratio > 35:
        recommendations.append("Recurring commitments are heavy relative to income; renegotiation or consolidation may be useful.")

    return {
        "diagnosis": diagnosis,
        "warnings": warnings,
        "recommendations": recommendations,
        "observations": observations,
    }