
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from flask_jwt_extended import decode_token
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import RevokedToken


# --------------------------------------------------
# TEST DATA HELPER
# --------------------------------------------------

def create_revocation_records(app, customer):

    now = datetime.now(timezone.utc)

    expiration_times = {
        "expired": now - timedelta(hours=2),
        "recently_expired": now - timedelta(seconds=10),
        "within_leeway": now - timedelta(minutes=2),
        "unexpired": now + timedelta(minutes=30)
    }

    identifiers = {}

    with app.app_context():

        for name, expires_at in expiration_times.items():

            jti = str(uuid4())

            record = RevokedToken(
                jti=jti,
                user_id=customer["id"],
                expires_at=expires_at
            )

            db.session.add(record)

            identifiers[name] = jti

        db.session.commit()

    return identifiers


# --------------------------------------------------
# DRY-RUN SAFETY
# --------------------------------------------------

def test_cleanup_dry_run_preserves_records(app, customer):

    create_revocation_records(app, customer)

    runner = app.test_cli_runner()

    result = runner.invoke(
        args=[
            "cleanup-revoked-tokens",
            "--dry-run"
        ]
    )

    assert result.exit_code == 0, result.output

    assert "Dry run: 2 expired" in result.output
    assert "No records were deleted." in result.output

    with app.app_context():
        assert RevokedToken.query.count() == 4


# --------------------------------------------------
# EXPIRED RECORD DELETION
# --------------------------------------------------

def test_cleanup_deletes_only_expired_records(app, customer):

    identifiers = create_revocation_records(app, customer)

    runner = app.test_cli_runner()

    result = runner.invoke(
        args=["cleanup-revoked-tokens"]
    )

    assert result.exit_code == 0, result.output
    assert "Successfully deleted 2" in result.output

    with app.app_context():

        remaining = {
            record.jti
            for record in RevokedToken.query.all()
        }

        assert remaining == {
            identifiers["recently_expired"],
            identifiers["unexpired"]
        }


# --------------------------------------------------
# JWT LEEWAY PROTECTION
# --------------------------------------------------

def test_cleanup_respects_jwt_leeway(app, customer):

    # Allow five minutes of JWT expiration leeway.
    app.config["JWT_DECODE_LEEWAY"] = 300

    identifiers = create_revocation_records(app, customer)

    runner = app.test_cli_runner()

    result = runner.invoke(
        args=["cleanup-revoked-tokens"]
    )

    assert result.exit_code == 0, result.output
    assert "Successfully deleted 1" in result.output

    with app.app_context():

        remaining = {
            record.jti
            for record in RevokedToken.query.all()
        }

        assert remaining == {
            identifiers["recently_expired"],
            identifiers["within_leeway"],
            identifiers["unexpired"]
        }


# --------------------------------------------------
# REPEATED CLEANUP
# --------------------------------------------------

def test_cleanup_can_be_repeated_safely(app, customer):

    create_revocation_records(app, customer)

    runner = app.test_cli_runner()

    first_result = runner.invoke(
        args=["cleanup-revoked-tokens"]
    )

    assert first_result.exit_code == 0
    assert "Successfully deleted 2" in first_result.output

    second_result = runner.invoke(
        args=["cleanup-revoked-tokens"]
    )

    assert second_result.exit_code == 0
    assert "Successfully deleted 0" in second_result.output

    with app.app_context():
        assert RevokedToken.query.count() == 2


# --------------------------------------------------
# DATABASE FAILURE AND ROLLBACK
# --------------------------------------------------

def test_cleanup_rolls_back_on_database_failure(
    app,
    customer,
    monkeypatch
):

    create_revocation_records(app, customer)

    def failing_commit(*args, **kwargs):

        raise SQLAlchemyError(
            "Simulated cleanup database failure"
        )

    runner = app.test_cli_runner()

    with monkeypatch.context() as patch:

        patch.setattr(
            db.session,
            "commit",
            failing_commit
        )

        result = runner.invoke(
            args=["cleanup-revoked-tokens"]
        )

        assert result.exit_code != 0

        assert (
            "Unable to clean up expired revocation records."
            in result.output
        )

    # Deleted records must be restored by rollback.
    with app.app_context():
        assert RevokedToken.query.count() == 4

    # Confirm cleanup works after database recovery.
    result = runner.invoke(
        args=["cleanup-revoked-tokens"]
    )

    assert result.exit_code == 0
    assert "Successfully deleted 2" in result.output

    with app.app_context():
        assert RevokedToken.query.count() == 2


# --------------------------------------------------
# ACTIVE REVOCATION PROTECTION
# --------------------------------------------------

def test_cleanup_preserves_revoked_access_token(
    app,
    client,
    customer,
    customer_headers
):

    create_revocation_records(app, customer)

    # Confirm the access token is initially valid.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    # Revoke the actual access token.
    response = client.post(
        "/api/auth/logout",
        headers=customer_headers
    )

    assert response.status_code == 200

    token = customer_headers["Authorization"].split(
        " ", 1
    )[1]

    with app.app_context():
        jti = decode_token(token)["jti"]

    # Run expired revocation cleanup.
    runner = app.test_cli_runner()

    result = runner.invoke(
        args=["cleanup-revoked-tokens"]
    )

    assert result.exit_code == 0, result.output
    assert "Successfully deleted 2" in result.output

    # The unexpired revocation must still exist.
    with app.app_context():

        assert RevokedToken.query.filter_by(
            jti=jti
        ).first() is not None

        assert RevokedToken.query.count() == 3

    # Cleanup must not restore access to the revoked JWT.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 401
    assert response.get_json()["msg"] == "Token has been revoked"
