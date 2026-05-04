from __future__ import annotations


def build_anomaly_flags(change_summary: dict) -> dict:
    flags = []

    for row in change_summary.get("month_over_month", []):
        pct_change = row.get("pct_change")
        latest_value = row.get("latest_value", 0)

        if pct_change is None:
            if latest_value > 0:
                flags.append(
                    {
                        "severity": "medium",
                        "title": f"New spend detected in {row['category']}",
                        "message": f"{row['category']} appeared in the latest month with {latest_value:.2f} in spend.",
                    }
                )
            continue

        if pct_change >= 25:
            flags.append(
                {
                    "severity": "high",
                    "title": f"{row['category']} spend spiked",
                    "message": f"{row['category']} increased by {pct_change}% compared with the previous month.",
                }
            )
        elif pct_change >= 15:
            flags.append(
                {
                    "severity": "medium",
                    "title": f"{row['category']} spend is rising",
                    "message": f"{row['category']} increased by {pct_change}% month over month.",
                }
            )

    return {"flags": flags}