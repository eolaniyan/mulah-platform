def calculate_health_score(cfa_summary: dict) -> dict:
    """
    Very simple MVP score out of 100.
    Can be made far more advanced later.
    """
    score = 50

    savings_rate = cfa_summary.get("savings_rate", 0.0)
    recurring_burden = cfa_summary.get("recurring_burden", 0.0)
    income_total = cfa_summary.get("income_total", 0.0)

    if savings_rate >= 20:
        score += 25
    elif savings_rate >= 10:
        score += 15
    elif savings_rate > 0:
        score += 5
    else:
        score -= 15

    if income_total > 0:
        recurring_ratio = (recurring_burden / income_total) * 100
    else:
        recurring_ratio = 100

    if recurring_ratio < 5:
        score += 15
    elif recurring_ratio < 10:
        score += 10
    elif recurring_ratio < 20:
        score += 0
    else:
        score -= 10

    if cfa_summary.get("net_cashflow", 0.0) > 0:
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
    }