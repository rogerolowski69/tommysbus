import logging

from apps.core.logging import RedactPIIFilter, redact


def test_redact_email_and_phone():
    assert redact("mail jane.doe@example.com now") == "mail [email] now"
    assert redact("call (386) 555-0100 or +1 352.555.0123") == "call [phone] or [phone]"
    assert redact("ref=TB-ABC234 trip=12 pax=3") == "ref=TB-ABC234 trip=12 pax=3"


def test_filter_rewrites_record():
    record = logging.LogRecord("x", logging.INFO, __file__, 1, "user %s", ("a@b.co",), None)
    RedactPIIFilter().filter(record)
    assert record.getMessage() == "user [email]"
