
import re
import warnings

from io import BytesIO
from pathlib import Path
from uuid import uuid4

from flask import current_app
from PIL import Image, ImageOps, UnidentifiedImageError


class AvatarValidationError(ValueError):
    """Raised when an uploaded profile picture is invalid."""


def get_avatar_directory():
    """Return the configured avatar storage directory."""

    directory = Path(
        current_app.config["AVATAR_UPLOAD_FOLDER"]
    )

    directory.mkdir(
        mode=0o700,
        parents=True,
        exist_ok=True
    )

    return directory


def save_avatar(uploaded_file):
    """Validate, process and save an uploaded profile picture."""

    if uploaded_file is None or not uploaded_file.filename:
        raise AvatarValidationError(
            "Please select a profile picture."
        )

    max_size = current_app.config["AVATAR_MAX_FILE_SIZE"]
    max_pixels = current_app.config["AVATAR_MAX_PIXELS"]
    allowed_formats = current_app.config["AVATAR_ALLOWED_FORMATS"]
    image_size = current_app.config["AVATAR_IMAGE_SIZE"]
    image_quality = current_app.config["AVATAR_IMAGE_QUALITY"]

    # Read only the permitted number of bytes plus one.
    file_data = uploaded_file.stream.read(max_size + 1)

    if not file_data:
        raise AvatarValidationError(
            "The uploaded file is empty."
        )

    if len(file_data) > max_size:
        raise AvatarValidationError(
            "Profile pictures must not exceed 5 MB."
        )

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning
            )

            with Image.open(BytesIO(file_data)) as image:

                # Validate the actual image format.
                if image.format not in allowed_formats:
                    raise AvatarValidationError(
                        "Only JPEG, PNG and WebP images are supported."
                    )

                # Reject excessively large decoded images.
                width, height = image.size

                if width * height > max_pixels:
                    raise AvatarValidationError(
                        "The image resolution is too large."
                    )

                # Reject animated images.
                if getattr(image, "is_animated", False):
                    raise AvatarValidationError(
                        "Animated profile pictures are not supported."
                    )

                # Decode the image to detect damaged files.
                image.load()

                # Correct image orientation.
                image = ImageOps.exif_transpose(image)

                # Convert to a consistent colour format.
                has_alpha = (
                    "A" in image.getbands()
                    or "transparency" in image.info
                )

                mode = "RGBA" if has_alpha else "RGB"
                image = image.convert(mode)

                # Centre-crop and resize to a square.
                processed_image = ImageOps.fit(
                    image,
                    image_size,
                    method=Image.Resampling.LANCZOS,
                    centering=(0.5, 0.5)
                )

                # Remove inherited metadata.
                clean_image = Image.new(
                    processed_image.mode,
                    processed_image.size
                )

                clean_image.paste(processed_image)

                # Encode the processed image as WebP.
                image_buffer = BytesIO()

                clean_image.save(
                    image_buffer,
                    format="WEBP",
                    quality=image_quality,
                    method=4
                )

    except AvatarValidationError:
        raise

    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning
    ) as error:
        raise AvatarValidationError(
            "The image resolution is too large."
        ) from error

    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError,
        ValueError
    ) as error:
        raise AvatarValidationError(
            "The uploaded file is not a valid image."
        ) from error

    # Never use the original uploaded filename.
    filename = f"{uuid4().hex}.webp"
    destination = get_avatar_directory() / filename

    # Save without overwriting an existing file.
    created = False

    try:
        with destination.open("xb") as output:
            created = True
            output.write(image_buffer.getvalue())

        destination.chmod(0o600)

    except OSError:
        if created:
            destination.unlink(missing_ok=True)
        raise

    return filename


def get_avatar_path(filename):
    """Return a safe path for a server-generated avatar filename."""

    if not isinstance(filename, str):
        return None

    if not re.fullmatch(r"[a-f0-9]{32}\.webp", filename):
        return None

    return get_avatar_directory() / filename


def delete_avatar(filename):
    """Remove an existing profile picture safely."""

    path = get_avatar_path(filename)

    if path is None:
        return False

    try:
        path.unlink()
        return True

    except FileNotFoundError:
        return False
