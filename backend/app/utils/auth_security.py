import hashlib

from flask import request
from flask_jwt_extended import get_jwt_identity


def valid_password_input(password):
    """Validate password input against bcrypt's byte limit."""

    if not isinstance(password, str) or not password:
        return False

    try:
        return len(password.encode("utf-8")) <= 72
    except UnicodeError:
        return False


def valid_new_password(password):
    """Enforce the minimum length and bcrypt byte limit."""

    return (
        valid_password_input(password)
        and len(password) >= 8
    )


def email_rate_limit_key():
    """Generate a normalized account-specific rate-limit key."""

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return "invalid-email"

    email = data.get("email")

    if not isinstance(email, str):
        return "invalid-email"

    email = email.strip().lower()

    if not email or len(email) > 255:
        return "invalid-email"

    return hashlib.sha256(
        email.encode("utf-8", errors="replace")
    ).hexdigest()


def authenticated_rate_limit_key():
    """Rate-limit authenticated operations by user ID."""

    return f"user:{get_jwt_identity()}"
