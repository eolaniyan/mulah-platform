from __future__ import annotations


KNOWN_SUBSCRIPTIONS = {
    "netflix": "subscription",
    "spotify": "subscription",
    "youtube premium": "subscription",
    "youtube": "subscription",
    "apple": "subscription",
    "openai": "subscription",
    "chatgpt": "subscription",
    "disney+": "subscription",
    "amazon prime": "subscription",
    "icloud": "subscription",
}

KNOWN_BILLS = {
    "ranelagh rent": "bill",
    "electric ireland": "bill",
    "vodafone bill pay": "bill",
    "vodafone": "bill",
}

KNOWN_USAGE_BASED = {
    "uber": "usage_based_recurring",
    "deliveroo": "usage_based_recurring",
    "tesco": "usage_based_recurring",
    "aldi": "usage_based_recurring",
    "lidl": "usage_based_recurring",
    "shell": "usage_based_recurring",
    "circle k": "usage_based_recurring",
    "starbucks": "usage_based_recurring",
    "costa coffee": "usage_based_recurring",
    "cafe nero": "usage_based_recurring",
}

KNOWN_INCOME = {
    "salary january": "recurring_income",
    "salary february": "recurring_income",
    "salary march": "recurring_income",
    "salary april": "recurring_income",
    "salary": "recurring_income",
}


def classify_recurring_pattern(pattern: dict) -> dict:
    merchant_key = pattern["merchant_key"]
    avg_interval_days = pattern["avg_interval_days"]
    direction = pattern["direction"]
    categories = {c.lower() for c in pattern.get("categories", [])}

    classification = "unknown_recurring"
    classification_confidence = 0.5

    if merchant_key in KNOWN_SUBSCRIPTIONS or "subscriptions" in categories:
        classification = "subscription"
        classification_confidence = 0.95

    elif merchant_key in KNOWN_BILLS:
        classification = "bill"
        classification_confidence = 0.93

    elif merchant_key in KNOWN_USAGE_BASED:
        classification = "usage_based_recurring"
        classification_confidence = 0.88

    elif merchant_key in KNOWN_INCOME or direction == "incoming":
        classification = "recurring_income"
        classification_confidence = 0.90

    else:
        if direction == "outgoing":
            if avg_interval_days and 27 <= avg_interval_days <= 32:
                classification = "bill"
                classification_confidence = 0.70
            elif avg_interval_days and 6 <= avg_interval_days <= 8:
                classification = "usage_based_recurring"
                classification_confidence = 0.65

    result = dict(pattern)
    result["classification"] = classification
    result["classification_confidence"] = classification_confidence
    return result