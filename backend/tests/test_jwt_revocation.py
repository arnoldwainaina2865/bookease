
from app.extensions import db
from app.models import User


def test_jwt_revocation(app, client, customer):

    email = customer["email"]
    old_password = customer["password"]
    new_password = "NewPassword456!"

    # 1. Log in using the original password.
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": old_password
        }
    )

    assert response.status_code == 200, response.get_json()

    old_token = response.get_json()["access_token"]

    old_headers = {
        "Authorization": f"Bearer {old_token}"
    }

    print("PASS: Login successful")

    # 2. Verify the original JWT works.
    response = client.get(
        "/api/auth/me",
        headers=old_headers
    )

    assert response.status_code == 200

    print("PASS: Original JWT accepted")

    # 3. Record the original token version.
    with app.app_context():
        user = db.session.get(User, customer["id"])
        original_version = user.token_version

    # 4. Change the account password.
    response = client.put(
        "/api/auth/change-password",
        headers=old_headers,
        json={
            "current_password": old_password,
            "new_password": new_password
        }
    )

    assert response.status_code == 200, response.get_json()

    print("PASS: Password changed")

    # 5. Verify the original JWT has been revoked.
    response = client.get(
        "/api/auth/me",
        headers=old_headers
    )

    assert response.status_code == 401

    print("PASS: Old JWT revoked")

    # 6. Verify the original password is rejected.
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": old_password
        }
    )

    assert response.status_code == 401

    print("PASS: Old password rejected")

    # 7. Log in using the new password.
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": new_password
        }
    )

    assert response.status_code == 200, response.get_json()

    new_token = response.get_json()["access_token"]

    print("PASS: New password accepted")

    # 8. Verify the newly issued JWT works.
    response = client.get(
        "/api/auth/me",
        headers={
            "Authorization": f"Bearer {new_token}"
        }
    )

    assert response.status_code == 200

    print("PASS: New JWT accepted")

    # 9. Verify the token version increased.
    with app.app_context():
        user = db.session.get(User, customer["id"])

        assert user.token_version == original_version + 1

    print("PASS: Token version increased successfully")
