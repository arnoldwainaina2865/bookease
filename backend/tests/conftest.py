
from pathlib import Path
from secrets import token_hex

import pytest

from flask_jwt_extended import create_access_token

from app import create_app
from app.extensions import db
from app.models import User, Provider


TEST_PASSWORD = "BookEaseTestPassword123!"


# --------------------------------------------------
# ISOLATED FLASK APPLICATION
# --------------------------------------------------

@pytest.fixture
def app(tmp_path):

    database_path = tmp_path / "test.db"
    avatar_directory = tmp_path / "avatars"

    application = create_app({
        "TESTING": True,
        "SECRET_KEY": token_hex(32),
        "JWT_SECRET_KEY": token_hex(32),
        "SQLALCHEMY_DATABASE_URI": (
            f"sqlite:///{database_path}"
        ),
        "SQLALCHEMY_TRACK_MODIFICATIONS": False,
        "AVATAR_UPLOAD_FOLDER": avatar_directory
    })

    with application.app_context():

        # Verify database isolation before creating tables.
        assert Path(
            db.engine.url.database
        ).resolve() == database_path.resolve()

        db.create_all()

    try:
        yield application

    finally:
        with application.app_context():
            db.session.remove()
            db.engine.dispose()


# --------------------------------------------------
# FLASK TEST CLIENT
# --------------------------------------------------

@pytest.fixture
def client(app):
    return app.test_client()


# --------------------------------------------------
# TEST CUSTOMER ACCOUNT
# --------------------------------------------------

@pytest.fixture
def customer(app):

    with app.app_context():

        user = User(
            full_name="Test Customer",
            email="customer@example.test",
            phone="0700000010",
            role="customer",
            is_active=True
        )

        user.set_password(TEST_PASSWORD)

        db.session.add(user)
        db.session.commit()

        return {
            "id": user.id,
            "email": user.email,
            "password": TEST_PASSWORD,
            "role": user.role
        }


# --------------------------------------------------
# TEST PROVIDER ACCOUNT
# --------------------------------------------------

@pytest.fixture
def provider(app):

    with app.app_context():

        user = User(
            full_name="Test Provider",
            email="provider@example.test",
            phone="0700000020",
            role="provider",
            is_active=True
        )

        user.set_password(TEST_PASSWORD)

        db.session.add(user)
        db.session.flush()

        provider_profile = Provider(
            user_id=user.id,
            business_name="Test Wellness Studio",
            category="Health & Wellness",
            location="Nairobi",
            business_phone="0700000020",
            description="Automated testing provider.",
            is_verified=True,
            is_available=True
        )

        db.session.add(provider_profile)
        db.session.commit()

        return {
            "id": user.id,
            "provider_id": provider_profile.id,
            "email": user.email,
            "password": TEST_PASSWORD,
            "role": user.role
        }


# --------------------------------------------------
# CUSTOMER AUTHORIZATION HEADERS
# --------------------------------------------------

@pytest.fixture
def customer_headers(app, customer):

    with app.app_context():

        user = db.session.get(User, customer["id"])

        token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "token_version": user.token_version
            }
        )

    return {
        "Authorization": f"Bearer {token}"
    }

# --------------------------------------------------
# PROVIDER AUTHORIZATION HEADERS
# --------------------------------------------------

@pytest.fixture
def provider_headers(app, provider):

    with app.app_context():

        user = db.session.get(User, provider["id"])

        token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "token_version": user.token_version
            }
        )

    return {
        "Authorization": f"Bearer {token}"
    }
