def calculate_health_score(cfa_summary: dict) -> dict:
    score = 50

    savings_rate = cfa_summary.get("savings_rate", 0.0)
    recurring_burden = cfa_summary.get("recurring_burden", 0.0)
    income_total = cfa_summary.get("income_total", 0.0)
    net_cashflow = cfa_summary.get("net_cashflow", 0.0)

    if savings_rate >= 25:
        score += 25
    elif savings_rate >= 15:
        score += 18
    elif savings_rate >= 5:
        score += 8
    else:
        score -= 12

    recurring_ratio = 100.0
    if income_total > 0:
        recurring_ratio = (recurring_burden / income_total) * 100

    if recurring_ratio < 5:
        score += 12
    elif recurring_ratio < 10:
        score += 8
    elif recurring_ratio < 20:
        score += 2
    else:
        score -= 10

    if net_cashflow > 0:
        score += 10
    else:
        score -= 10

    score = max(0, min(100, round(score)))

    if score >= 80:
        risk_level = "Low"
    elif score >= 60:
        risk_level = "Medium"
    else:
        risk_level = "High"

    return {
        "mulah_score": score,
        "risk_level": risk_level,
        "recurring_ratio": round(recurring_ratio, 2),
    }