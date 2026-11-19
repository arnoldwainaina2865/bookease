
from io import BytesIO
from pathlib import Path

import pytest

from PIL import Image

from app.extensions import db
from app.models import User


AVATAR_ENDPOINT = "/api/auth/me/avatar"


# --------------------------------------------------
# TEST HELPERS
# --------------------------------------------------

def create_test_image(
    image_format="PNG",
    color=(35, 78, 61),
    size=(800, 600)
):
    buffer = BytesIO()

    Image.new(
        "RGB",
        size,
        color=color
    ).save(buffer, format=image_format)

    buffer.seek(0)

    return buffer


def upload_image(client, headers, image=None):

    if image is None:
        image = create_test_image()

    return client.post(
        AVATAR_ENDPOINT,
        headers=headers,
        data={
            "avatar": (image, "profile.png")
        },
        content_type="multipart/form-data"
    )


def get_saved_filename(app, user_id):

    with app.app_context():

        user = db.session.get(User, user_id)

        return user.avatar_filename


def get_storage_path(app):

    return Path(app.config["AVATAR_UPLOAD_FOLDER"])


# --------------------------------------------------
# AUTHENTICATION TESTS
# --------------------------------------------------

@pytest.mark.parametrize(
    "method",
    ["GET", "POST", "DELETE"]
)
def test_unauthenticated_avatar_access(client, method):

    response = client.open(
        AVATAR_ENDPOINT,
        method=method
    )

    assert response.status_code == 401


def test_missing_avatar(client, customer_headers):

    response = client.get(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 404


# --------------------------------------------------
# VALID IMAGE UPLOAD TESTS
# --------------------------------------------------

@pytest.mark.parametrize(
    "image_format",
    ["JPEG", "PNG", "WEBP"]
)
def test_valid_image_upload(
    app,
    client,
    customer,
    customer_headers,
    image_format
):

    response = upload_image(
        client,
        customer_headers,
        create_test_image(image_format)
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["success"] is True
    assert data["user"]["avatar_url"] == AVATAR_ENDPOINT

    filename = get_saved_filename(
        app,
        customer["id"]
    )

    assert filename is not None
    assert filename.endswith(".webp")

    path = get_storage_path(app) / filename

    assert path.is_file()

    with Image.open(path) as image:

        assert image.format == "WEBP"
        assert image.size == (512, 512)


def test_provider_avatar_upload(
    app,
    client,
    provider,
    provider_headers
):

    response = upload_image(
        client,
        provider_headers
    )

    assert response.status_code == 200

    assert (
        response.get_json()["user"]["role"]
        == "provider"
    )

    assert get_saved_filename(
        app,
        provider["id"]
    ) is not None


# --------------------------------------------------
# AVATAR RETRIEVAL TESTS
# --------------------------------------------------

def test_retrieve_uploaded_avatar(
    client,
    customer_headers
):

    upload = upload_image(
        client,
        customer_headers
    )

    assert upload.status_code == 200

    response = client.get(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 200
    assert response.mimetype == "image/webp"

    with Image.open(BytesIO(response.data)) as image:

        assert image.format == "WEBP"
        assert image.size == (512, 512)


def test_avatar_privacy_headers(
    client,
    customer_headers
):

    assert upload_image(
        client,
        customer_headers
    ).status_code == 200

    response = client.get(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 200

    assert "private" in response.headers["Cache-Control"]
    assert "no-store" in response.headers["Cache-Control"]

    assert (
        response.headers["X-Content-Type-Options"]
        == "nosniff"
    )


def test_profile_contains_avatar_url(
    client,
    customer_headers
):

    assert upload_image(
        client,
        customer_headers
    ).status_code == 200

    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    assert (
        response.get_json()["user"]["avatar_url"]
        == AVATAR_ENDPOINT
    )


# --------------------------------------------------
# INVALID UPLOAD TESTS
# --------------------------------------------------

def test_missing_upload_file(
    client,
    customer_headers
):

    response = client.post(
        AVATAR_ENDPOINT,
        headers=customer_headers,
        data={},
        content_type="multipart/form-data"
    )

    assert response.status_code == 400


def test_empty_upload(
    client,
    customer_headers
):

    response = upload_image(
        client,
        customer_headers,
        BytesIO(b"")
    )

    assert response.status_code == 400


def test_invalid_image_upload(
    app,
    client,
    customer,
    customer_headers
):

    response = upload_image(
        client,
        customer_headers,
        BytesIO(b"This is not a valid image.")
    )

    assert response.status_code == 400

    assert get_saved_filename(
        app,
        customer["id"]
    ) is None


def test_unsupported_image_format(
    client,
    customer_headers
):

    response = upload_image(
        client,
        customer_headers,
        create_test_image("BMP")
    )

    assert response.status_code == 400


def test_oversized_image_upload(
    app,
    client,
    customer_headers
):

    oversized_file = BytesIO(
        b"x" * (
            app.config["AVATAR_MAX_FILE_SIZE"] + 1
        )
    )

    response = upload_image(
        client,
        customer_headers,
        oversized_file
    )

    assert response.status_code in (400, 413)


def test_request_size_limit(
    app,
    client,
    customer_headers
):

    oversized_file = BytesIO(
        b"x" * (
            app.config["AVATAR_MAX_FILE_SIZE"]
            + 128 * 1024
        )
    )

    response = upload_image(
        client,
        customer_headers,
        oversized_file
    )

    assert response.status_code == 413


# --------------------------------------------------
# AVATAR REPLACEMENT TESTS
# --------------------------------------------------

def test_replace_existing_avatar(
    app,
    client,
    customer,
    customer_headers
):

    first_response = upload_image(
        client,
        customer_headers
    )

    assert first_response.status_code == 200

    old_filename = get_saved_filename(
        app,
        customer["id"]
    )

    old_path = get_storage_path(app) / old_filename

    assert old_path.is_file()

    second_response = upload_image(
        client,
        customer_headers,
        create_test_image(color=(200, 100, 50))
    )

    assert second_response.status_code == 200

    new_filename = get_saved_filename(
        app,
        customer["id"]
    )

    assert new_filename != old_filename

    assert not old_path.exists()

    assert (
        get_storage_path(app) / new_filename
    ).is_file()

    assert len(list(get_storage_path(app).iterdir())) == 1


def test_invalid_replacement_preserves_avatar(
    app,
    client,
    customer,
    customer_headers
):

    assert upload_image(
        client,
        customer_headers
    ).status_code == 200

    old_filename = get_saved_filename(
        app,
        customer["id"]
    )

    response = upload_image(
        client,
        customer_headers,
        BytesIO(b"Invalid replacement")
    )

    assert response.status_code == 400

    assert get_saved_filename(
        app,
        customer["id"]
    ) == old_filename

    assert (
        get_storage_path(app) / old_filename
    ).is_file()


# --------------------------------------------------
# ACCOUNT ISOLATION TESTS
# --------------------------------------------------

def test_avatar_account_isolation(
    app,
    client,
    customer,
    provider,
    customer_headers,
    provider_headers
):

    customer_upload = upload_image(
        client,
        customer_headers,
        create_test_image(color=(255, 0, 0))
    )

    assert customer_upload.status_code == 200

    # Provider must not receive the customer's picture.
    response = client.get(
        AVATAR_ENDPOINT,
        headers=provider_headers
    )

    assert response.status_code == 404

    provider_upload = upload_image(
        client,
        provider_headers,
        create_test_image(color=(0, 0, 255))
    )

    assert provider_upload.status_code == 200

    customer_filename = get_saved_filename(
        app,
        customer["id"]
    )

    provider_filename = get_saved_filename(
        app,
        provider["id"]
    )

    assert customer_filename != provider_filename

    customer_image = client.get(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    provider_image = client.get(
        AVATAR_ENDPOINT,
        headers=provider_headers
    )

    assert customer_image.status_code == 200
    assert provider_image.status_code == 200
    assert customer_image.data != provider_image.data

    # Removing one avatar must not affect the other.
    response = client.delete(
        AVATAR_ENDPOINT,
        headers=provider_headers
    )

    assert response.status_code == 200

    assert get_saved_filename(
        app,
        customer["id"]
    ) == customer_filename

    assert (
        get_storage_path(app) / customer_filename
    ).is_file()


# --------------------------------------------------
# AVATAR REMOVAL TESTS
# --------------------------------------------------

def test_remove_existing_avatar(
    app,
    client,
    customer,
    customer_headers
):

    assert upload_image(
        client,
        customer_headers
    ).status_code == 200

    filename = get_saved_filename(
        app,
        customer["id"]
    )

    path = get_storage_path(app) / filename

    response = client.delete(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["success"] is True
    assert data["user"]["avatar_url"] is None

    assert get_saved_filename(
        app,
        customer["id"]
    ) is None

    assert not path.exists()

    response = client.get(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 404


def test_remove_missing_avatar(
    client,
    customer_headers
):

    response = client.delete(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 404
