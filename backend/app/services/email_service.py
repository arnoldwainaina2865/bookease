import smtplib
import ssl

from email.message import EmailMessage
from urllib.parse import urlencode

from flask import current_app


def send_password_reset_email(recipient, token):
    """Send a secure password recovery link."""

    config = current_app.config

    required_settings = (
        "SMTP_HOST",
        "SMTP_FROM_EMAIL",
        "FRONTEND_URL",
    )

    if not all(config.get(key) for key in required_settings):
        raise RuntimeError("Email delivery is not configured.")

    # Build the link using the configured frontend URL,
    # rather than an untrusted request Host header.
    query = urlencode({"token": token})

    reset_url = (
        f"{config['FRONTEND_URL']}"
        f"/reset-password?{query}"
    )

    expiry_minutes = int(
        config["PASSWORD_RESET_TOKEN_EXPIRES"]
        .total_seconds() / 60
    )

    message = EmailMessage()

    message["Subject"] = "Reset your BookEase password"
    message["From"] = config["SMTP_FROM_EMAIL"]
    message["To"] = recipient

    message.set_content(
        "Hello,\n\n"
        "We received a request to reset your BookEase password.\n\n"
        "Use the following link to create a new password:\n\n"
        f"{reset_url}\n\n"
        f"This link expires in {expiry_minutes} minutes "
        "and can only be used once.\n\n"
        "If you did not request a password reset, "
        "you can safely ignore this email.\n\n"
        "Regards,\n"
        "The BookEase Team"
    )

    if not config["SMTP_USE_TLS"]:
        raise RuntimeError("Secure SMTP transport is required.")

    context = ssl.create_default_context()

    with smtplib.SMTP(
        config["SMTP_HOST"],
        config["SMTP_PORT"],
        timeout=config["SMTP_TIMEOUT"]
    ) as server:

        server.ehlo()
        server.starttls(context=context)
        server.ehlo()

        if config["SMTP_USERNAME"]:
            server.login(
                config["SMTP_USERNAME"],
                config["SMTP_PASSWORD"]
            )

        server.send_message(message)
