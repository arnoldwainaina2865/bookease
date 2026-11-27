import hashlib
from datetime import datetime, timedelta, timezone

import pytest

from app.extensions import db
from app.models import PasswordResetToken


LOGIN_URL = "/api/auth/login"
REGISTER_URL = "/api/auth/register"
CHANGE_URL = "/api/auth/change-password"
FORGOT_URL = "/api/auth/forgot-password"


def assert_rate_limited(response):
    assert response.status_code == 429
    assert response.is_json
    assert response.get_json()["success"] is False
    assert "Too many requests" in response.get_json()["message"]


def test_login_ip_rate_limit(client):
    for index in range(10):
        response = client.post(
            LOGIN_URL,
            json={
                "email": f"unknown{index}@example.test",
                "password": "IncorrectPassword"
            }
        )
        assert response.status_code == 401

    response = client.post(
        LOGIN_URL,
        json={
            "email": "another@example.test",
            "password": "IncorrectPassword"
        }
    )

    assert_rate_limited(response)


def test_login_account_rate_limit_across_ips(client):
    for index in range(10):
        response = client.post(
            LOGIN_URL,
            json={
                "email": "target@example.test",
                "password": "IncorrectPassword"
            },
            environ_overrides={
                "REMOTE_ADDR": f"192.0.2.{index + 1}"
            }
        )
        assert response.status_code == 401

    response = client.post(
        LOGIN_URL,
        json={
            "email": " TARGET@EXAMPLE.TEST ",
            "password": "IncorrectPassword"
        },
        environ_overrides={
            "REMOTE_ADDR": "192.0.2.20"
        }
    )

    assert_rate_limited(response)


def test_registration_rate_limit(client):
    for _ in range(5):
        response = client.post(
            REGISTER_URL,
            json={}
        )
        assert response.status_code == 400

    assert_rate_limited(
        client.post(REGISTER_URL, json={})
    )


def test_change_password_requires_authentication(client):
    response = client.put(
        CHANGE_URL,
        json={
            "current_password": "IncorrectPassword",
            "new_password": "NewSecurePassword123!"
        }
    )

    assert response.status_code == 401


def test_change_password_ip_rate_limit(
    client, customer_headers
):
    for _ in range(5):
        response = client.put(
            CHANGE_URL,
            headers=customer_headers,
            json={
                "current_password": "IncorrectPassword",
                "new_password": "NewSecurePassword123!"
            }
        )

        assert response.status_code == 401

    response = client.put(
        CHANGE_URL,
        headers=customer_headers,
        json={
            "current_password": "IncorrectPassword",
            "new_password": "NewSecurePassword123!"
        }
    )

    assert_rate_limited(response)


def test_change_password_account_limit_across_ips(
    client, customer_headers
):
    for index in range(5):
        response = client.put(
            CHANGE_URL,
            headers=customer_headers,
            json={
                "current_password": "IncorrectPassword",
                "new_password": "NewSecurePassword123!"
            },
            environ_overrides={
                "REMOTE_ADDR": f"192.0.2.{index + 1}"
            }
        )

        assert response.status_code == 401

    response = client.put(
        CHANGE_URL,
        headers=customer_headers,
        json={
            "current_password": "IncorrectPassword",
            "new_password": "NewSecurePassword123!"
        },
        environ_overrides={
            "REMOTE_ADDR": "192.0.2.20"
        }
    )

    assert_rate_limited(response)


@pytest.mark.parametrize(
    "password",
    ["a" * 73, "é" * 40]
)
def test_registration_rejects_oversized_password(
    client, password
):
    response = client.post(
        REGISTER_URL,
        json={
            "full_name": "Security Test",
            "email": "security@example.test",
            "password": password,
            "role": "customer"
        }
    )

    assert response.status_code == 400


@pytest.mark.parametrize(
    "password",
    ["a" * 73, "é" * 40]
)
def test_login_rejects_oversized_password(
    client, customer, password
):
    response = client.post(
        LOGIN_URL,
        json={
            "email": customer["email"],
            "password": password
        }
    )

    assert response.status_code == 401


@pytest.mark.parametrize(
    "password",
    ["a" * 73, "é" * 40]
)
def test_change_rejects_oversized_new_password(
    client, customer, customer_headers, password
):
    response = client.put(
        CHANGE_URL,
        headers=customer_headers,
        json={
            "current_password": customer["password"],
            "new_password": password
        }
    )

    assert response.status_code == 400


def test_change_rejects_oversized_current_password(
    client, customer_headers
):
    response = client.put(
        CHANGE_URL,
        headers=customer_headers,
        json={
            "current_password": "é" * 40,
            "new_password": "NewSecurePassword123!"
        }
    )

    assert response.status_code == 401


def test_recovery_account_throttling(
    app, client, customer, monkeypatch
):
    sent_emails = []

    monkeypatch.setattr(
        "app.routes.auth.send_password_reset_email",
        lambda email, token: sent_emails.append(email)
    )

    responses = []

    for index in range(4):
        response = client.post(
            FORGOT_URL,
            json={"email": customer["email"]},
            environ_overrides={
                "REMOTE_ADDR": f"192.0.2.{index + 1}"
            }
        )

        assert response.status_code == 200
        responses.append(response.get_json())

    assert len(sent_emails) == 3
    assert all(
        response == responses[0]
        for response in responses
    )

    with app.app_context():
        assert PasswordResetToken.query.count() == 3


def test_recovery_cleanup(app, customer):
    now = datetime.now(timezone.utc)

    with app.app_context():
        expired = PasswordResetToken(
            user_id=customer["id"],
            token_hash=hashlib.sha256(
                b"expired-test-token"
            ).hexdigest(),
            token_version=1,
            created_at=now - timedelta(hours=1),
            expires_at=now - timedelta(minutes=30)
        )

        valid = PasswordResetToken(
            user_id=customer["id"],
            token_hash=hashlib.sha256(
                b"valid-test-token"
            ).hexdigest(),
            token_version=1,
            created_at=now,
            expires_at=now + timedelta(minutes=30)
        )

        db.session.add_all([expired, valid])
        db.session.commit()

        valid_id = valid.id

    runner = app.test_cli_runner()

    preview = runner.invoke(
        args=[
            "cleanup-password-reset-tokens",
            "--dry-run"
        ]
    )

    assert preview.exit_code == 0

    with app.app_context():
        assert PasswordResetToken.query.count() == 2

    result = runner.invoke(
        args=["cleanup-password-reset-tokens"]
    )

    assert result.exit_code == 0

    with app.app_context():
        assert PasswordResetToken.query.count() == 1

        remaining = PasswordResetToken.query.one()
        assert remaining.id == valid_id
