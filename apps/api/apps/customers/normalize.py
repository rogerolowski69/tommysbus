import re


def normalize_email(email: str) -> str:
    return email.strip().lower()


def normalize_phone(phone: str) -> str:
    """Keep a leading + and digits only; validation happens in serializers."""
    phone = phone.strip()
    prefix = "+" if phone.startswith("+") else ""
    return prefix + re.sub(r"\D", "", phone)
