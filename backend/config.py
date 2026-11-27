
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv


# Load environment variables from the backend directory
BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


def get_required_env(name):
    """Retrieve a required environment variable."""
    value = os.getenv(name)

    if not value or not value.strip():
        raise RuntimeError(
            f"Missing required environment variable: {name}"
        )

    return value


class Config:
    # Flask security
    SECRET_KEY = get_required_env("SECRET_KEY")

    # Database connection
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "sqlite:///bookease.db"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT authentication
    JWT_SECRET_KEY = get_required_env("JWT_SECRET_KEY")

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

        # Password recovery
    PASSWORD_RESET_TOKEN_EXPIRES = timedelta(minutes=30)

    FRONTEND_URL = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173"
    ).rstrip("/")

    # Email delivery
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")

    SMTP_USE_TLS = (
        os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    )

    SMTP_TIMEOUT = 10

    # Profile picture storage
    AVATAR_UPLOAD_FOLDER = BASE_DIR / "instance" / "uploads" / "avatars"

    # Maximum uploaded image size: 5 MB
    AVATAR_MAX_FILE_SIZE = 5 * 1024 * 1024

    # Maximum decoded image dimensions
    AVATAR_MAX_PIXELS = 20_000_000

    # Supported image formats
    AVATAR_ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}

    # Processed avatar dimensions
    AVATAR_IMAGE_SIZE = (512, 512)

    # Processed image quality
    AVATAR_IMAGE_QUALITY = 85

        # Authentication rate limiting
    RATELIMIT_STORAGE_URI = os.getenv(
        "RATELIMIT_STORAGE_URI",
        "memory://"
    )

    RATELIMIT_HEADERS_ENABLED = True
