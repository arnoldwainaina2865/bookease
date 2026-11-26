
import re
import stat

from io import BytesIO
from pathlib import Path

import pytest

from PIL import Image, PngImagePlugin

from app.extensions import db
from app.models import User


AVATAR_ENDPOINT = "/api/auth/me/avatar"


# --------------------------------------------------
# TEST HELPERS
# --------------------------------------------------

def create_image(
    image_format="PNG",
    size=(800, 600),
    **save_options
):

    buffer = BytesIO()

    image = Image.new(
        "RGB",
        size,
        color=(35, 78, 61)
    )

    image.save(
        buffer,
        format=image_format,
        **save_options
    )

    buffer.seek(0)

    return buffer


def upload_avatar(
    client,
    headers,
    image,
    filename="profile.png"
):

    return client.post(
        AVATAR_ENDPOINT,
        headers=headers,
        data={
            "avatar": (image, filename)
        },
        content_type="multipart/form-data"
    )


def get_avatar_filename(app, user_id):

    with app.app_context():

        user = db.session.get(User, user_id)

        return user.avatar_filename


def get_avatar_directory(app):

    return Path(
        app.config["AVATAR_UPLOAD_FOLDER"]
    )


# --------------------------------------------------
# MALICIOUS FILENAME PROTECTION
# --------------------------------------------------

@pytest.mark.parametrize(
    "filename",
    [
        "../../outside.png",
        "/tmp/outside.png",
        "..\\..\\outside.png",
        "profile.php.png",
        "profile.html"
    ]
)
def test_untrusted_upload_filename(
    app,
    client,
    customer,
    customer_headers,
    filename
):

    response = upload_avatar(
        client,
        customer_headers,
        create_image(),
        filename
    )

    assert response.status_code == 200

    saved_filename = get_avatar_filename(
        app,
        customer["id"]
    )

    # Only server-generated filenames are allowed.
    assert re.fullmatch(
        r"[a-f0-9]{32}\.webp",
        saved_filename
    )

    directory = get_avatar_directory(app)

    saved_path = directory / saved_filename

    assert saved_path.is_file()

    assert (
        saved_path.resolve().parent
        == directory.resolve()
    )

    assert list(directory.iterdir()) == [
        saved_path
    ]

    # Internal storage details must not be exposed.
    user = response.get_json()["user"]

    assert "avatar_filename" not in user
    assert saved_filename not in response.get_data(
        as_text=True
    )


# --------------------------------------------------
# EXCESSIVE IMAGE RESOLUTION
# --------------------------------------------------

def test_excessive_image_resolution(
    app,
    client,
    customer,
    customer_headers
):

    image = create_image(
        size=(5000, 5000)
    )

    response = upload_avatar(
        client,
        customer_headers,
        image
    )

    assert response.status_code == 400

    assert get_avatar_filename(
        app,
        customer["id"]
    ) is None

    directory = get_avatar_directory(app)

    assert (
        not directory.exists()
        or not list(directory.iterdir())
    )


# --------------------------------------------------
# ANIMATED IMAGE REJECTION
# --------------------------------------------------

def test_animated_webp_rejected(
    app,
    client,
    customer,
    customer_headers
):

    first_frame = Image.new(
        "RGB",
        (128, 128),
        color="red"
    )

    second_frame = Image.new(
        "RGB",
        (128, 128),
        color="blue"
    )

    buffer = BytesIO()

    first_frame.save(
        buffer,
        format="WEBP",
        save_all=True,
        append_images=[second_frame],
        duration=100,
        loop=0
    )

    buffer.seek(0)

    # Confirm the test image really is animated.
    with Image.open(buffer) as image:
        assert image.is_animated
        assert image.n_frames == 2

    buffer.seek(0)

    response = upload_avatar(
        client,
        customer_headers,
        buffer,
        "animated.webp"
    )

    assert response.status_code == 400

    assert get_avatar_filename(
        app,
        customer["id"]
    ) is None


# --------------------------------------------------
# IMAGE METADATA REMOVAL
# --------------------------------------------------

@pytest.mark.parametrize(
    "image_format",
    ["JPEG", "PNG"]
)
def test_image_metadata_removed(
    client,
    customer_headers,
    image_format
):

    if image_format == "JPEG":

        exif = Image.Exif()
        exif[315] = "Private Test Author"
        exif[271] = "Private Camera Manufacturer"

        buffer = create_image(
            image_format="JPEG",
            exif=exif
        )

    else:

        metadata = PngImagePlugin.PngInfo()

        metadata.add_text(
            "Author",
            "Private Test Author"
        )

        buffer = create_image(
            image_format="PNG",
            pnginfo=metadata
        )

    # Verify metadata exists in the original.
    with Image.open(buffer) as original:

        if image_format == "JPEG":
            assert original.getexif().get(315)
        else:
            assert original.info.get("Author")

    buffer.seek(0)

    response = upload_avatar(
        client,
        customer_headers,
        buffer
    )

    assert response.status_code == 200

    response = client.get(
        AVATAR_ENDPOINT,
        headers=customer_headers
    )

    assert response.status_code == 200

    with Image.open(
        BytesIO(response.data)
    ) as processed:

        assert processed.format == "WEBP"
        assert processed.size == (512, 512)

        assert not processed.getexif()
        assert "exif" not in processed.info
        assert "Author" not in processed.info
        assert "xmp" not in processed.info

    assert b"Private Test Author" not in response.data


# --------------------------------------------------
# PRIVATE STORAGE PERMISSIONS
# --------------------------------------------------

def test_private_avatar_permissions(
    app,
    client,
    customer,
    customer_headers
):

    response = upload_avatar(
        client,
        customer_headers,
        create_image()
    )

    assert response.status_code == 200

    filename = get_avatar_filename(
        app,
        customer["id"]
    )

    directory = get_avatar_directory(app)
    file_path = directory / filename

    directory_permissions = stat.S_IMODE(
        directory.stat().st_mode
    )

    file_permissions = stat.S_IMODE(
        file_path.stat().st_mode
    )

    assert directory_permissions == 0o700
    assert file_permissions == 0o600


# --------------------------------------------------
# CORRUPTED IMAGE REJECTION
# --------------------------------------------------

def test_truncated_image_rejected(
    app,
    client,
    customer,
    customer_headers
):

    original = create_image()

    original_bytes = original.getvalue()

    corrupted = BytesIO(
        original_bytes[:32]
    )

    response = upload_avatar(
        client,
        customer_headers,
        corrupted
    )

    assert response.status_code == 400

    assert get_avatar_filename(
        app,
        customer["id"]
    ) is None


# --------------------------------------------------
# PROTECTION AGAINST PUBLIC FILE ACCESS
# --------------------------------------------------

def test_avatar_not_publicly_accessible(
    app,
    client,
    customer,
    customer_headers
):

    response = upload_avatar(
        client,
        customer_headers,
        create_image()
    )

    assert response.status_code == 200

    filename = get_avatar_filename(
        app,
        customer["id"]
    )

    public_paths = [
        f"/static/avatars/{filename}",
        f"/uploads/avatars/{filename}",
        f"/instance/uploads/avatars/{filename}"
    ]

    for path in public_paths:

        response = client.get(path)

        assert response.status_code == 404


# --------------------------------------------------
# ADMINISTRATOR AVATAR ACCESS RESTRICTIONS
# --------------------------------------------------

@pytest.mark.parametrize(
    "method",
    ["GET", "POST", "DELETE"]
)
def test_administrator_cannot_access_avatar(
    app,
    client,
    method
):
    from flask_jwt_extended import create_access_token

    from app.extensions import db
    from app.models import User

    with app.app_context():
        admin = User(
            full_name="Test Administrator",
            email="admin-avatar@example.test",
            role="admin",
            is_active=True
        )

        admin.set_password("TestAdminPassword123!")

        db.session.add(admin)
        db.session.commit()

        token = create_access_token(
            identity=str(admin.id),
            additional_claims={
                "token_version": admin.token_version
            }
        )

    response = client.open(
        "/api/auth/me/avatar",
        method=method,
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response.status_code == 403
