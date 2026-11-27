from datetime import timedelta

import pytest

from flask_jwt_extended import (
    create_access_token,
    decode_token
)

from app.extensions import db
from app.models import User, RevokedToken
from sqlalchemy.exc import SQLAlchemyError

from app import create_app
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier


def test_individual_session_revocation(app, client, customer):

    credentials = {
        "email": customer["email"],
        "password": customer["password"]
    }

    # Record the original account token version.
    with app.app_context():
        user = db.session.get(User, customer["id"])
        original_version = user.token_version

    # Create the first authenticated session.
    response_a = client.post(
        "/api/auth/login",
        json=credentials
    )

    assert response_a.status_code == 200

    token_a = response_a.get_json()["access_token"]

    headers_a = {
        "Authorization": f"Bearer {token_a}"
    }

    print("PASS: Session A created successfully")

    # Create a second session for the same account.
    response_b = client.post(
        "/api/auth/login",
        json=credentials
    )

    assert response_b.status_code == 200

    token_b = response_b.get_json()["access_token"]

    headers_b = {
        "Authorization": f"Bearer {token_b}"
    }

    print("PASS: Session B created successfully")

    # Verify that both tokens have different identifiers.
    with app.app_context():
        jti_a = decode_token(token_a)["jti"]
        jti_b = decode_token(token_b)["jti"]

    assert jti_a != jti_b

    print("PASS: Both sessions have unique JWT identifiers")

    # Verify that both sessions are initially valid.
    response = client.get(
        "/api/auth/me",
        headers=headers_a
    )

    assert response.status_code == 200

    response = client.get(
        "/api/auth/me",
        headers=headers_b
    )

    assert response.status_code == 200

    print("PASS: Both sessions are initially authenticated")

    # Log out only Session A.
    response = client.post(
        "/api/auth/logout",
        headers=headers_a
    )

    assert response.status_code == 200, response.get_json()
    assert response.get_json()["success"] is True

    print("PASS: Session A logged out successfully")

    # Verify that the revoked token cannot be reused.
    response = client.get(
        "/api/auth/me",
        headers=headers_a
    )

    assert response.status_code == 401

    print("PASS: Session A token is revoked")

    # Verify that Session B remains authenticated.
    response = client.get(
        "/api/auth/me",
        headers=headers_b
    )

    assert response.status_code == 200

    print("PASS: Session B remains authenticated")

    # Verify the persisted revocation record.
    with app.app_context():
        revoked_token = RevokedToken.query.filter_by(
            jti=jti_a
        ).first()

        assert revoked_token is not None
        assert revoked_token.user_id == customer["id"]
        assert revoked_token.revoked_at is not None
        assert revoked_token.expires_at is not None

        assert RevokedToken.query.filter_by(
            jti=jti_b
        ).first() is None

        assert RevokedToken.query.count() == 1

    print("PASS: Only Session A is recorded as revoked")

    # Verify that ordinary logout does not change token_version.
    with app.app_context():
        user = db.session.get(User, customer["id"])

        assert user.token_version == original_version

    print("PASS: Account token version remains unchanged")

    # Reject repeated logout using the revoked token.
    response = client.post(
        "/api/auth/logout",
        headers=headers_a
    )

    assert response.status_code == 401

    print("PASS: Repeated logout with revoked token rejected")

    # Verify that the user can sign in again.
    response = client.post(
        "/api/auth/login",
        json=credentials
    )

    assert response.status_code == 200

    new_token = response.get_json()["access_token"]

    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {new_token}"
        }
    )

    assert response.status_code == 200

    print("PASS: New login works after secure logout")


# --------------------------------------------------
# UNAUTHENTICATED LOGOUT
# --------------------------------------------------

def test_logout_requires_authentication(app, client):

    response = client.post("/api/auth/logout")

    assert response.status_code == 401

    with app.app_context():
        assert RevokedToken.query.count() == 0


# --------------------------------------------------
# PROVIDER SESSION REVOCATION
# --------------------------------------------------

def test_provider_logout(app, client, provider, provider_headers):

    # Confirm the provider session is initially valid.
    response = client.get(
        "/api/auth/me",
        headers=provider_headers
    )

    assert response.status_code == 200

    # Revoke the provider's current session.
    response = client.post(
        "/api/auth/logout",
        headers=provider_headers
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Verify the revoked token cannot be reused.
    response = client.get(
        "/api/auth/me",
        headers=provider_headers
    )

    assert response.status_code == 401

    with app.app_context():
        revoked_token = RevokedToken.query.filter_by(
            user_id=provider["id"]
        ).one()

        assert revoked_token.expires_at is not None
        assert revoked_token.revoked_at is not None


# --------------------------------------------------
# ADMINISTRATOR SESSION REVOCATION
# --------------------------------------------------

def test_admin_logout(app, client):

    with app.app_context():

        admin = User(
            full_name="Test Administrator",
            email="admin@example.test",
            phone="0700000030",
            role="admin",
            is_active=True
        )

        admin.set_password("BookEaseAdminTest123!")

        db.session.add(admin)
        db.session.commit()

        admin_id = admin.id

        token = create_access_token(
            identity=str(admin.id),
            additional_claims={
                "token_version": admin.token_version
            }
        )

        jti = decode_token(token)["jti"]

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = client.post(
        "/api/auth/logout",
        headers=headers
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # Reusing the revoked JWT must fail.
    response = client.post(
        "/api/auth/logout",
        headers=headers
    )

    assert response.status_code == 401

    with app.app_context():
        revoked_token = RevokedToken.query.filter_by(
            jti=jti
        ).one()

        assert revoked_token.user_id == admin_id
        assert RevokedToken.query.count() == 1


# --------------------------------------------------
# EXPIRED JWT HANDLING
# --------------------------------------------------

def test_logout_rejects_expired_token(app, client, customer):

    with app.app_context():

        user = db.session.get(User, customer["id"])

        expired_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "token_version": user.token_version
            },
            expires_delta=timedelta(minutes=-5)
        )

    response = client.post(
        "/api/auth/logout",
        headers={
            "Authorization": f"Bearer {expired_token}"
        }
    )

    assert response.status_code == 401

    # Verify the response expected by the frontend.
    assert response.get_json()["msg"] == "Token has expired"

    # Expired tokens do not need a revocation record.
    with app.app_context():
        assert RevokedToken.query.count() == 0


# --------------------------------------------------
# MALFORMED JWT HANDLING
# --------------------------------------------------

@pytest.mark.parametrize(
    "invalid_token",
    [
        "invalid-token",
        "invalid.invalid.invalid"
    ]
)
def test_logout_rejects_malformed_token(
    app,
    client,
    invalid_token
):

    response = client.post(
        "/api/auth/logout",
        headers={
            "Authorization": f"Bearer {invalid_token}"
        }
    )

    assert response.status_code == 422

    with app.app_context():
        assert RevokedToken.query.count() == 0


# --------------------------------------------------
# REVOCATION PERSISTENCE
# --------------------------------------------------

def test_logout_revocation_persists_after_app_restart(
    app,
    client,
    customer,
    customer_headers
):

    # Confirm the original session is authenticated.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    # Revoke the current session.
    response = client.post(
        "/api/auth/logout",
        headers=customer_headers
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    token = customer_headers["Authorization"].split(" ", 1)[1]

    with app.app_context():

        jti = decode_token(token)["jti"]

        assert RevokedToken.query.filter_by(
            jti=jti
        ).first() is not None

        # Release the original database connections.
        db.session.remove()
        db.engine.dispose()

    # Recreate the application using the same test
    # database and JWT signing configuration.
    restarted_app = create_app({
        "TESTING": True,
        "SECRET_KEY": app.config["SECRET_KEY"],
        "JWT_SECRET_KEY": app.config["JWT_SECRET_KEY"],
        "SQLALCHEMY_DATABASE_URI": (
            app.config["SQLALCHEMY_DATABASE_URI"]
        ),
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "AVATAR_UPLOAD_FOLDER": (
            app.config["AVATAR_UPLOAD_FOLDER"]
        )
    })

    try:

        restarted_client = restarted_app.test_client()

        # The previously revoked token must remain invalid.
        response = restarted_client.get(
            "/api/auth/me",
            headers=customer_headers
        )

        assert response.status_code == 401
        assert response.get_json()["msg"] == "Token has been revoked"

        # Confirm the revocation record still exists.
        with restarted_app.app_context():

            revoked_token = RevokedToken.query.filter_by(
                jti=jti
            ).one()

            assert revoked_token.user_id == customer["id"]

        # Verify that a fresh login still works.
        response = restarted_client.post(
            "/api/auth/login",
            json={
                "email": customer["email"],
                "password": customer["password"]
            }
        )

        assert response.status_code == 200

        new_token = response.get_json()["access_token"]

        response = restarted_client.get(
            "/api/auth/me",
            headers={
                "Authorization": f"Bearer {new_token}"
            }
        )

        assert response.status_code == 200

    finally:

        with restarted_app.app_context():
            db.session.remove()
            db.engine.dispose()


# --------------------------------------------------
# DATABASE FAILURE HANDLING
# --------------------------------------------------

def test_logout_handles_database_failure(
    app,
    client,
    customer_headers,
    monkeypatch
):

    # Confirm the session is initially authenticated.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    def failing_commit(*args, **kwargs):
        raise SQLAlchemyError(
            "Simulated logout database failure"
        )

    # Temporarily simulate a database commit failure.
    with monkeypatch.context() as patch:

        patch.setattr(
            db.session,
            "commit",
            failing_commit
        )

        response = client.post(
            "/api/auth/logout",
            headers=customer_headers
        )

        # The server must not falsely report success.
        assert response.status_code == 500

        data = response.get_json()

        assert data["success"] is False

        assert data["message"] == (
            "Unable to log out securely. Please try again."
        )

    # Verify that the failed transaction was rolled back.
    with app.app_context():
        assert RevokedToken.query.count() == 0

    # The token remains valid because revocation failed.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    # Retry after restoring normal database behaviour.
    response = client.post(
        "/api/auth/logout",
        headers=customer_headers
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    # The token must now be revoked.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 401

    with app.app_context():
        assert RevokedToken.query.count() == 1


# --------------------------------------------------
# CONCURRENT LOGOUT REQUESTS
# --------------------------------------------------

def test_concurrent_logout_same_token(
    app,
    client,
    customer,
    customer_headers
):

    # Verify that the original token is valid.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    token = customer_headers["Authorization"].split(" ", 1)[1]

    with app.app_context():

        jti = decode_token(token)["jti"]

        user = db.session.get(User, customer["id"])

        original_version = user.token_version

        assert RevokedToken.query.count() == 0

    # Synchronize both logout requests.
    barrier = Barrier(2)

    def send_logout_request():

        # Each thread must use its own Flask test client.
        with app.test_client() as thread_client:

            barrier.wait(timeout=10)

            response = thread_client.post(
                "/api/auth/logout",
                headers=dict(customer_headers)
            )

            return {
                "status_code": response.status_code,
                "data": response.get_json()
            }

    # Execute two logout requests concurrently.
    with ThreadPoolExecutor(max_workers=2) as executor:

        future_a = executor.submit(send_logout_request)
        future_b = executor.submit(send_logout_request)

        result_a = future_a.result(timeout=20)
        result_b = future_b.result(timeout=20)

    results = [result_a, result_b]

    status_codes = [
        result["status_code"]
        for result in results
    ]

    # At least one request must successfully revoke the JWT.
    assert 200 in status_codes

    # The second request may succeed through duplicate
    # handling or be rejected because the JWT is revoked.
    assert all(
        status in (200, 401)
        for status in status_codes
    ), results

    for result in results:

        if result["status_code"] == 200:
            assert result["data"]["success"] is True

    # Verify that only one revocation record exists.
    with app.app_context():

        revoked_token = RevokedToken.query.filter_by(
            jti=jti
        ).one()

        assert revoked_token.user_id == customer["id"]

        assert RevokedToken.query.count() == 1

        # Individual logout must not revoke every session.
        user = db.session.get(User, customer["id"])

        assert user.token_version == original_version

    # The revoked JWT must no longer authenticate requests.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 401
