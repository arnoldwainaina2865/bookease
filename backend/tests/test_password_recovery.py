import hashlib
from datetime import datetime, timedelta, timezone

import pytest

from app.extensions import db, limiter
from app.models import User, PasswordResetToken


NEW_PASSWORD = "NewBookEasePassword2026!"

FORGOT_URL = "/api/auth/forgot-password"
RESET_URL = "/api/auth/reset-password"
LOGIN_URL = "/api/auth/login"


@pytest.fixture(autouse=True)
def reset_rate_limits(app):
    with app.app_context():
        limiter.reset()

    yield

    with app.app_context():
        limiter.reset()


@pytest.fixture
def sent_emails(monkeypatch):
    emails = []

    def fake_send(recipient, token):
        emails.append({
            "recipient": recipient,
            "token": token
        })

    monkeypatch.setattr(
        "app.routes.auth.send_password_reset_email",
        fake_send
    )

    return emails


def request_reset(client, account, sent_emails):
    response = client.post(
        FORGOT_URL,
        json={"email": account["email"]}
    )

    assert response.status_code == 200
    assert sent_emails

    return sent_emails[-1]["token"]


def reset_password(client, token, password=NEW_PASSWORD):
    return client.post(
        RESET_URL,
        json={
            "token": token,
            "new_password": password
        }
    )


def login(client, account, password=None):
    return client.post(
        LOGIN_URL,
        json={
            "email": account["email"],
            "password": password or account["password"]
        }
    )


# --------------------------------------------------
# PASSWORD RECOVERY REQUESTS
# --------------------------------------------------

def test_recovery_token_is_stored_as_hash(
    app, client, customer, sent_emails
):
    token = request_reset(client, customer, sent_emails)

    expected_hash = hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()

    with app.app_context():
        record = PasswordResetToken.query.one()

        assert record.token_hash == expected_hash
        assert record.token_hash != token
        assert record.user_id == customer["id"]
        assert record.used_at is None

        lifetime = record.expires_at - record.created_at

        assert lifetime == timedelta(minutes=30)


def test_unknown_email_returns_same_response(
    client, customer, sent_emails
):
    known = client.post(
        FORGOT_URL,
        json={"email": customer["email"]}
    )

    unknown = client.post(
        FORGOT_URL,
        json={"email": "unknown@example.com"}
    )

    assert known.status_code == 200
    assert unknown.status_code == 200
    assert known.get_json() == unknown.get_json()
    assert len(sent_emails) == 1

    assert sent_emails[0]["token"] not in known.get_data(
        as_text=True
    )


def test_inactive_account_cannot_request_reset(
    app, client, customer, sent_emails
):
    with app.app_context():
        user = db.session.get(User, customer["id"])
        user.is_active = False
        db.session.commit()

    response = client.post(
        FORGOT_URL,
        json={"email": customer["email"]}
    )

    assert response.status_code == 200
    assert sent_emails == []

    with app.app_context():
        assert PasswordResetToken.query.count() == 0


@pytest.mark.parametrize("payload", [
    {},
    {"email": ""},
    {"email": 123},
    {"email": "invalid-email"},
])
def test_invalid_recovery_request(
    client, payload, sent_emails
):
    response = client.post(
        FORGOT_URL,
        json=payload
    )

    assert response.status_code == 400
    assert sent_emails == []


# --------------------------------------------------
# SUCCESSFUL PASSWORD RESET
# --------------------------------------------------

@pytest.mark.parametrize("account_fixture", [
    "customer",
    "provider",
])
def test_successful_password_reset(
    app, client, request, account_fixture, sent_emails
):
    account = request.getfixturevalue(account_fixture)

    old_login = login(client, account)
    assert old_login.status_code == 200

    old_token = old_login.get_json()["access_token"]

    with app.app_context():
        user = db.session.get(User, account["id"])
        previous_version = user.token_version

    recovery_token = request_reset(
        client, account, sent_emails
    )

    response = reset_password(client, recovery_token)

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Old password must no longer work.
    assert login(client, account).status_code == 401

    # New password must work.
    new_login = login(client, account, NEW_PASSWORD)
    assert new_login.status_code == 200

    # Previously issued JWT must be revoked.
    old_session = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {old_token}"
        }
    )

    assert old_session.status_code == 401

    # New JWT must remain valid.
    new_token = new_login.get_json()["access_token"]

    new_session = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {new_token}"
        }
    )

    assert new_session.status_code == 200

    with app.app_context():
        user = db.session.get(User, account["id"])

        assert user.token_version == previous_version + 1
        assert user.check_password(NEW_PASSWORD)

        record = PasswordResetToken.query.one()
        assert record.used_at is not None


# --------------------------------------------------
# TOKEN SECURITY
# --------------------------------------------------

def test_reset_token_cannot_be_reused(
    client, customer, sent_emails
):
    token = request_reset(client, customer, sent_emails)

    assert reset_password(client, token).status_code == 200

    second_attempt = reset_password(
        client,
        token,
        "AnotherSecurePassword2026!"
    )

    assert second_attempt.status_code == 400


def test_expired_token_is_rejected(
    app, client, customer, sent_emails
):
    token = request_reset(client, customer, sent_emails)

    with app.app_context():
        record = PasswordResetToken.query.one()

        record.expires_at = (
            datetime.now(timezone.utc)
            - timedelta(minutes=1)
        )

        db.session.commit()

    assert reset_password(client, token).status_code == 400
    assert login(client, customer).status_code == 200


def test_invalid_token_is_rejected(client):
    response = reset_password(client, "a" * 43)

    assert response.status_code == 400


def test_reset_invalidates_other_recovery_links(
    client, customer, sent_emails
):
    first_token = request_reset(
        client, customer, sent_emails
    )

    second_token = request_reset(
        client, customer, sent_emails
    )

    assert first_token != second_token

    assert reset_password(
        client, first_token
    ).status_code == 200

    assert reset_password(
        client, second_token
    ).status_code == 400


def test_password_change_invalidates_recovery_link(
    client, customer, customer_headers, sent_emails
):
    token = request_reset(client, customer, sent_emails)

    response = client.put(
        "/api/auth/change-password",
        headers=customer_headers,
        json={
            "current_password": customer["password"],
            "new_password": NEW_PASSWORD
        }
    )

    assert response.status_code == 200

    assert reset_password(
        client,
        token,
        "AnotherSecurePassword2026!"
    ).status_code == 400


@pytest.mark.parametrize("password", [
    "",
    "short",
    "a" * 73,
    "é" * 40,
])
def test_invalid_password_does_not_consume_token(
    app, client, customer, sent_emails, password
):
    token = request_reset(client, customer, sent_emails)

    response = reset_password(client, token, password)

    assert response.status_code == 400

    with app.app_context():
        record = PasswordResetToken.query.one()
        assert record.used_at is None


def test_current_password_cannot_be_reused(
    client, customer, sent_emails
):
    token = request_reset(client, customer, sent_emails)

    response = reset_password(
        client, token, customer["password"]
    )

    assert response.status_code == 400


# --------------------------------------------------
# EMAIL FAILURE AND RATE LIMITING
# --------------------------------------------------

def test_email_failure_invalidates_token(
    app, client, customer, monkeypatch
):
    def failed_delivery(recipient, token):
        raise RuntimeError("Simulated email failure")

    monkeypatch.setattr(
        "app.routes.auth.send_password_reset_email",
        failed_delivery
    )

    response = client.post(
        FORGOT_URL,
        json={"email": customer["email"]}
    )

    assert response.status_code == 200

    with app.app_context():
        record = PasswordResetToken.query.one()
        assert record.used_at is not None


def test_forgot_password_rate_limit(client):
    for _ in range(5):
        response = client.post(
            FORGOT_URL,
            json={"email": "unknown@example.com"}
        )

        assert response.status_code == 200

    response = client.post(
        FORGOT_URL,
        json={"email": "unknown@example.com"}
    )

    assert response.status_code == 429


def test_reset_password_rate_limit(client):
    for _ in range(10):
        response = reset_password(client, "a" * 43)

        assert response.status_code == 400

    response = reset_password(client, "a" * 43)

    assert response.status_code == 429