
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from PIL import Image
from sqlalchemy import update

import app.routes.auth as auth_routes

from app.extensions import db
from app.models import User
from app.services.avatar_service import save_avatar


AVATAR_URL = "/api/auth/me/avatar"


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def make_avatar():
    """Create a valid PNG image in memory."""

    buffer = BytesIO()

    Image.new(
        "RGB",
        (100, 100),
        "green"
    ).save(
        buffer,
        format="PNG"
    )

    buffer.seek(0)

    return buffer


def upload_avatar(client, headers):
    """Upload an avatar through the authenticated API."""

    return client.post(
        AVATAR_URL,
        headers=headers,
        data={
            "avatar": (
                make_avatar(),
                "avatar.png"
            )
        },
        content_type="multipart/form-data"
    )


def current_avatar_filename(app, user_id):
    """Read the current avatar filename from the database."""

    with app.app_context():

        db.session.expire_all()

        user = db.session.get(
            User,
            user_id
        )

        return user.avatar_filename


def avatar_files(app):
    """Return the filenames stored in the test avatar directory."""

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
# TEST 1: DATABASE-LEVEL OPTIMISTIC CONCURRENCY
# --------------------------------------------------

def test_conditional_avatar_update_rejects_stale_filename(
    app,
    customer
):
    """
    Verify that a conditional database update rejects
    an outdated avatar filename.
    """

    user_id = customer["id"]

    with app.app_context():

        original = db.session.get(
            User,
            user_id
        ).avatar_filename

        assert original is None

        # Simulate request A successfully updating
        # the avatar filename.
        first_update = db.session.execute(
            update(User)
            .where(
                User.id == user_id,
                User.avatar_filename.is_(None)
            )
            .values(
                avatar_filename="a" * 32 + ".webp"
            )
        )

        assert first_update.rowcount == 1

        db.session.commit()

        # Simulate request B attempting an update
        # based on the original, now-stale value.
        stale_update = db.session.execute(
            update(User)
            .where(
                User.id == user_id,
                User.avatar_filename.is_(None)
            )
            .values(
                avatar_filename="b" * 32 + ".webp"
            )
        )

        assert stale_update.rowcount == 0

        db.session.rollback()
        db.session.expire_all()

        current = db.session.get(
            User,
            user_id
        )

        assert current.avatar_filename == (
            "a" * 32 + ".webp"
        )


# --------------------------------------------------
# TEST 2: STALE AVATAR UPLOAD RETURNS HTTP 409
# --------------------------------------------------

def test_stale_upload_returns_409_and_removes_losing_file(
    app,
    client,
    customer,
    customer_headers
):
    """
    Simulate another request updating the avatar
    while the current request processes its upload.

    The losing request must return HTTP 409 and
    remove its newly uploaded file.
    """

    competing_filename = "a" * 32 + ".webp"

    original_save_avatar = save_avatar

    def competing_save(uploaded_file):

        # Save the image belonging to the current request.
        losing_filename = original_save_avatar(
            uploaded_file
        )

        # Simulate a competing request committing
        # a different avatar filename.
        with app.app_context():

            db.session.execute(
                update(User)
                .where(
                    User.id == customer["id"]
                )
                .values(
                    avatar_filename=competing_filename
                )
            )

            db.session.commit()

        return losing_filename

    with patch.object(
        auth_routes,
        "save_avatar",
        side_effect=competing_save
    ):

        response = upload_avatar(
            client,
            customer_headers
        )

    # The original request must detect the conflict.
    assert response.status_code == 409

    response_data = response.get_json()

    assert response_data["success"] is False

    # The competing database update must survive.
    assert current_avatar_filename(
        app,
        customer["id"]
    ) == competing_filename

    # The losing request must clean up its file.
    assert avatar_files(app) == set()


# --------------------------------------------------
# TEST 3: STALE AVATAR DELETION RETURNS HTTP 409
# --------------------------------------------------

def test_stale_delete_returns_409_and_preserves_new_avatar(
    app,
    client,
    customer,
    customer_headers
):
    """
    Simulate a competing avatar replacement before
    the current DELETE request performs its update.

    The stale DELETE must return HTTP 409 without
    clearing the newer database reference.
    """

    # Upload an initial avatar.
    first_response = upload_avatar(
        client,
        customer_headers
    )

    assert first_response.status_code == 200

    old_filename = current_avatar_filename(
        app,
        customer["id"]
    )

    assert old_filename is not None

    replacement_filename = "b" * 32 + ".webp"

    original_execute = db.session.execute

    competing_update_done = False

    def competing_execute(statement, *args, **kwargs):

        nonlocal competing_update_done

        if not competing_update_done:

            competing_update_done = True

            # Simulate another request changing
            # the avatar before DELETE continues.
            original_execute(
                update(User)
                .where(
                    User.id == customer["id"]
                )
                .values(
                    avatar_filename=replacement_filename
                )
            )

            db.session.commit()

        return original_execute(
            statement,
            *args,
            **kwargs
        )

    with patch.object(
        db.session,
        "execute",
        side_effect=competing_execute
    ):

        response = client.delete(
            AVATAR_URL,
            headers=customer_headers
        )

    # The stale DELETE must be rejected.
    assert response.status_code == 409

    response_data = response.get_json()

    assert response_data["success"] is False

    # The newer avatar reference must remain.
    assert current_avatar_filename(
        app,
        customer["id"]
    ) == replacement_filename

    # A stale DELETE must not remove the old file.
    assert old_filename in avatar_files(app)
