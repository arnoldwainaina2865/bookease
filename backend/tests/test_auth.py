
from io import BytesIO
from secrets import token_urlsafe

import pytest

from PIL import Image

from app.extensions import db
from app.models import User, Provider


# --------------------------------------------------
# REGISTRATION TESTS
# --------------------------------------------------

def test_customer_registration(client):

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "New Customer",
            "email": "newcustomer@example.test",
            "phone": "0700000030",
            "password": token_urlsafe(24),
            "role": "customer"
        }
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["success"] is True
    assert data["user"]["role"] == "customer"
    assert data["user"]["avatar_url"] is None
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]


def test_provider_registration(app, client):

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "New Provider",
            "email": "newprovider@example.test",
            "phone": "0700000040",
            "password": token_urlsafe(24),
            "role": "provider",
            "business_name": "New Wellness Studio",
            "category": "Health & Wellness",
            "location": "Nairobi",
            "description": "Automated registration test."
        }
    )

    assert response.status_code == 201

    user = response.get_json()["user"]

    assert user["role"] == "provider"
    assert user["avatar_url"] is None

    with app.app_context():

        profile = Provider.query.filter_by(
            user_id=user["id"]
        ).first()

        assert profile is not None

        assert (
            profile.business_name
            == "New Wellness Studio"
        )


def test_duplicate_email_registration(
    client,
    customer
):

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Duplicate Customer",
            "email": customer["email"],
            "password": token_urlsafe(24),
            "role": "customer"
        }
    )

    assert response.status_code == 409


# --------------------------------------------------
# LOGIN TESTS
# --------------------------------------------------

@pytest.mark.parametrize(
    "account_fixture",
    ["customer", "provider"]
)
def test_successful_login(
    client,
    request,
    account_fixture
):

    account = request.getfixturevalue(
        account_fixture
    )

    response = client.post(
        "/api/auth/login",
        json={
            "email": account["email"],
            "password": account["password"]
        }
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["success"] is True
    assert data["access_token"]
    assert data["user"]["role"] == account["role"]
    assert data["user"]["avatar_url"] is None

    # Verify that the issued token actually works.
    profile_response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": (
                f"Bearer {data['access_token']}"
            )
        }
    )

    assert profile_response.status_code == 200

    assert (
        profile_response.get_json()["user"]["id"]
        == account["id"]
    )


def test_incorrect_password(client, customer):

    response = client.post(
        "/api/auth/login",
        json={
            "email": customer["email"],
            "password": "IncorrectPassword123!"
        }
    )

    assert response.status_code == 401

    assert "access_token" not in response.get_json()


def test_missing_login_credentials(client):

    response = client.post(
        "/api/auth/login",
        json={
            "email": "",
            "password": ""
        }
    )

    assert response.status_code == 400


def test_inactive_account_login(
    app,
    client,
    customer
):

    with app.app_context():

        user = db.session.get(
            User,
            customer["id"]
        )

        user.is_active = False

        db.session.commit()

    response = client.post(
        "/api/auth/login",
        json={
            "email": customer["email"],
            "password": customer["password"]
        }
    )

    assert response.status_code == 403

    assert "access_token" not in response.get_json()


# --------------------------------------------------
# PERSONAL PROFILE TESTS
# --------------------------------------------------

def test_update_customer_profile(
    client,
    customer_headers
):

    response = client.put(
        "/api/auth/me",
        headers=customer_headers,
        json={
            "full_name": "Updated Customer",
            "phone": "0700000090"
        }
    )

    assert response.status_code == 200

    user = response.get_json()["user"]

    assert user["full_name"] == "Updated Customer"
    assert user["phone"] == "0700000090"

    # Verify persistence in a separate request.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    user = response.get_json()["user"]

    assert user["full_name"] == "Updated Customer"
    assert user["phone"] == "0700000090"


@pytest.mark.parametrize(
    "payload",
    [
        {"full_name": ""},
        {"email": "changed@example.test"},
        {"role": "admin"},
        {"avatar_filename": "unauthorized.webp"}
    ]
)
def test_invalid_profile_updates(
    client,
    customer_headers,
    payload
):

    response = client.put(
        "/api/auth/me",
        headers=customer_headers,
        json=payload
    )

    assert response.status_code == 400


# --------------------------------------------------
# PROFILE AND AVATAR INTEGRATION
# --------------------------------------------------

def test_profile_update_preserves_avatar(
    client,
    customer_headers
):

    image = BytesIO()

    Image.new(
        "RGB",
        (800, 600),
        color=(35, 78, 61)
    ).save(image, format="PNG")

    image.seek(0)

    upload_response = client.post(
        "/api/auth/me/avatar",
        headers=customer_headers,
        data={
            "avatar": (image, "profile.png")
        },
        content_type="multipart/form-data"
    )

    assert upload_response.status_code == 200

    original_avatar = client.get(
        "/api/auth/me/avatar",
        headers=customer_headers
    )

    assert original_avatar.status_code == 200

    update_response = client.put(
        "/api/auth/me",
        headers=customer_headers,
        json={
            "full_name": "Updated Profile Name"
        }
    )

    assert update_response.status_code == 200

    user = update_response.get_json()["user"]

    assert user["full_name"] == "Updated Profile Name"
    assert user["avatar_url"] == "/api/auth/me/avatar"

    current_avatar = client.get(
        "/api/auth/me/avatar",
        headers=customer_headers
    )

    assert current_avatar.status_code == 200

    assert current_avatar.data == original_avatar.data


def test_login_returns_existing_avatar(
    client,
    customer,
    customer_headers
):

    image = BytesIO()

    Image.new(
        "RGB",
        (600, 600),
        color=(100, 150, 200)
    ).save(image, format="PNG")

    image.seek(0)

    response = client.post(
        "/api/auth/me/avatar",
        headers=customer_headers,
        data={
            "avatar": (image, "profile.png")
        },
        content_type="multipart/form-data"
    )

    assert response.status_code == 200

    response = client.post(
        "/api/auth/login",
        json={
            "email": customer["email"],
            "password": customer["password"]
        }
    )

    assert response.status_code == 200

    assert (
        response.get_json()["user"]["avatar_url"]
        == "/api/auth/me/avatar"
    )


# --------------------------------------------------
# INACTIVE ACCOUNT PROTECTION
# --------------------------------------------------

@pytest.mark.parametrize(
    "method",
    ["GET", "POST", "DELETE"]
)
def test_inactive_account_avatar_access(
    app,
    client,
    customer,
    customer_headers,
    method
):

    # Verify the token is valid before account deactivation.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    # Deactivate the account after the token has been issued.
    with app.app_context():

        user = db.session.get(
            User,
            customer["id"]
        )

        user.is_active = False

        db.session.commit()

    # Verify the previously valid token is now rejected.
    response = client.open(
        "/api/auth/me/avatar",
        method=method,
        headers=customer_headers
    )

    assert response.status_code == 401

    # Verify the revoked session cannot access the profile.
    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 401