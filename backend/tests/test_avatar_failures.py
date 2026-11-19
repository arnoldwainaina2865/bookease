
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from app.extensions import db
from app.models import User


AVATAR_URL = "/api/auth/me/avatar"


def make_image(color=(45, 95, 70)):
    buffer = BytesIO()
    Image.new("RGB", (600, 600), color).save(
        buffer,
        format="PNG"
    )
    buffer.seek(0)
    return buffer


def upload(client, headers, color=(45, 95, 70)):
    return client.post(
        AVATAR_URL,
        headers=headers,
        data={
            "avatar": (
                make_image(color),
                "avatar.png"
            )
        },
        content_type="multipart/form-data"
    )


def stored_filename(app, user_id):
    with app.app_context():
        user = db.session.get(User, user_id)
        return user.avatar_filename


def stored_files(app):
    directory = Path(
        app.config["AVATAR_UPLOAD_FOLDER"]
    )

    if not directory.exists():
        return set()

    return {
        path.name
        for path in directory.iterdir()
        if path.is_file()
    }


# --------------------------------------------------
# DATABASE FAILURE DURING FIRST UPLOAD
# --------------------------------------------------

def test_upload_commit_failure_removes_new_file(
    app,
    client,
    customer,
    customer_headers
):
    with patch.object(
        db.session,
        "commit",
        side_effect=RuntimeError("Simulated commit failure")
    ):
        response = upload(
            client,
            customer_headers
        )

    assert response.status_code == 500
    assert response.get_json()["success"] is False

    assert stored_filename(
        app,
        customer["id"]
    ) is None

    assert stored_files(app) == set()


# --------------------------------------------------
# DATABASE FAILURE DURING REPLACEMENT
# --------------------------------------------------

def test_replacement_commit_failure_preserves_old_avatar(
    app,
    client,
    customer,
    customer_headers
):
    first = upload(
        client,
        customer_headers
    )

    assert first.status_code == 200

    old_filename = stored_filename(
        app,
        customer["id"]
    )

    original_response = client.get(
        AVATAR_URL,
        headers=customer_headers
    )

    assert original_response.status_code == 200
    original_bytes = original_response.data

    with patch.object(
        db.session,
        "commit",
        side_effect=RuntimeError("Simulated commit failure")
    ):
        response = upload(
            client,
            customer_headers,
            color=(150, 40, 80)
        )

    assert response.status_code == 500

    assert stored_filename(
        app,
        customer["id"]
    ) == old_filename

    assert stored_files(app) == {old_filename}

    current_response = client.get(
        AVATAR_URL,
        headers=customer_headers
    )

    assert current_response.status_code == 200
    assert current_response.data == original_bytes


# --------------------------------------------------
# DATABASE FAILURE DURING DELETION
# --------------------------------------------------

def test_delete_commit_failure_preserves_avatar(
    app,
    client,
    customer,
    customer_headers
):
    first = upload(
        client,
        customer_headers
    )

    assert first.status_code == 200

    filename = stored_filename(
        app,
        customer["id"]
    )

    with patch.object(
        db.session,
        "commit",
        side_effect=RuntimeError("Simulated commit failure")
    ):
        response = client.delete(
            AVATAR_URL,
            headers=customer_headers
        )

    assert response.status_code == 500

    assert stored_filename(
        app,
        customer["id"]
    ) == filename

    assert stored_files(app) == {filename}

    response = client.get(
        AVATAR_URL,
        headers=customer_headers
    )

    assert response.status_code == 200


# --------------------------------------------------
# FILE STORAGE FAILURE
# --------------------------------------------------

def test_storage_failure_returns_server_error(
    app,
    client,
    customer,
    customer_headers
):
    with patch(
        "app.routes.auth.save_avatar",
        side_effect=OSError("Simulated disk failure")
    ):
        response = upload(
            client,
            customer_headers
        )

    assert response.status_code == 500
    assert response.get_json()["success"] is False

    assert stored_filename(
        app,
        customer["id"]
    ) is None

    assert stored_files(app) == set()


# --------------------------------------------------
# FAILURE TO REMOVE OLD FILE
# --------------------------------------------------

def test_old_file_cleanup_failure_does_not_break_replacement(
    app,
    client,
    customer,
    customer_headers
):
    first = upload(
        client,
        customer_headers
    )

    assert first.status_code == 200

    old_filename = stored_filename(
        app,
        customer["id"]
    )

    with patch(
        "app.routes.auth.delete_avatar",
        side_effect=OSError("Simulated cleanup failure")
    ):
        response = upload(
            client,
            customer_headers,
            color=(100, 150, 200)
        )

    assert response.status_code == 200

    new_filename = stored_filename(
        app,
        customer["id"]
    )

    assert new_filename != old_filename
    assert new_filename in stored_files(app)

    response = client.get(
        AVATAR_URL,
        headers=customer_headers
    )

    assert response.status_code == 200

    # Cleanup failure can leave an orphaned old file.
    assert old_filename in stored_files(app)


# --------------------------------------------------
# FAILURE TO REMOVE FILE DURING DELETE
# --------------------------------------------------

def test_file_cleanup_failure_does_not_restore_deleted_reference(
    app,
    client,
    customer,
    customer_headers
):
    first = upload(
        client,
        customer_headers
    )

    assert first.status_code == 200

    filename = stored_filename(
        app,
        customer["id"]
    )

    with patch(
        "app.routes.auth.delete_avatar",
        side_effect=OSError("Simulated cleanup failure")
    ):
        response = client.delete(
            AVATAR_URL,
            headers=customer_headers
        )

    assert response.status_code == 200

    assert stored_filename(
        app,
        customer["id"]
    ) is None

    assert filename in stored_files(app)

    response = client.get(
        AVATAR_URL,
        headers=customer_headers
    )

    assert response.status_code == 404
