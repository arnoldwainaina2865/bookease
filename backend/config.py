
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
