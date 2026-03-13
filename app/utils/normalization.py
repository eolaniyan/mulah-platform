import re


def normalize_merchant(raw_text: str) -> str:
    """
    Normalize raw transaction descriptions into cleaner merchant labels.
    """
    if not raw_text:
        return "Unknown"

    text = raw_text.upper().strip()

    replacements = {
        "NETFLIX": "Netflix",
        "SPOTIFY": "Spotify",
        "YOUTUBE PREMIUM": "YouTube Premium",
        "YOUTUBE": "YouTube",
        "APPLE.COM/BILL ICLOUD": "Apple",
        "APPLE.COM/BILL": "Apple",
        "APPLE": "Apple",
        "OPENAI": "OpenAI",
        "CHATGPT": "ChatGPT",
        "AMAZON PRIME": "Amazon Prime",
         "ADOBE": "Adobe",
        "SAVINGS TRANSFER": "Savings Transfer",
        "DISNEY": "Disney+",
        "UBER": "Uber",
        "TESCO": "Tesco",
        "LIDL": "Lidl",
        "ALDI": "Aldi",
        "SHELL": "Shell",
        "CIRCLE K": "Circle K",
        "DELIVEROO": "Deliveroo",
        "STARBUCKS": "Starbucks",
        "COSTA COFFEE": "Costa Coffee",
        "CAFE NERO": "Cafe Nero",
        "RANELAGH RENT": "Ranelagh Rent",
        "ELECTRIC IRELAND": "Electric Ireland",
        "VODAFONE BILL PAY": "Vodafone Bill Pay",
        "SALARY JANUARY": "Salary",
        "SALARY FEBRUARY": "Salary",
        "SALARY MARCH": "Salary",
        "SALARY APRIL": "Salary",
        "FREELANCE CLIENT": "Freelance Client",
    }

    for key, value in replacements.items():
        if key in text:
            return value

    text = re.sub(r"[^A-Z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return "Unknown"

    return text.title()