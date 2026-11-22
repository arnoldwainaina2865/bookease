
from app.middleware.roles import roles_required
from flask import (
    Blueprint,
    request,
    jsonify,
    current_app,
    send_file
)

from werkzeug.exceptions import RequestEntityTooLarge
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from sqlalchemy.exc import IntegrityError

from app.extensions import db, bcrypt
from app.models import User, Provider
from sqlalchemy import update
from app.services.avatar_service import (
    save_avatar,
    get_avatar_path,
    delete_avatar,
    AvatarValidationError
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")



@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    # Common account information
    full_name = data.get("full_name", "")
    email = data.get("email", "")
    password = data.get("password", "")
    phone = data.get("phone")

    role = data.get("role", "customer")

    # Normalize and validate text fields
    if not all(isinstance(value, str) for value in [
        full_name, email, password, role
    ]):
        return jsonify({
            "success": False,
            "message": "Invalid account information."
        }), 400

    full_name = full_name.strip()
    email = email.strip().lower()
    role = role.strip().lower()

    if role not in ("customer", "provider"):
        return jsonify({
            "success": False,
            "message": "Account role must be customer or provider."
        }), 400

    if not full_name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Full name, email and password are required."
        }), 400

    if len(full_name) > 120 or len(email) > 255:
        return jsonify({
            "success": False,
            "message": "Name or email exceeds the allowed length."
        }), 400

    if len(password) < 8 or len(password) > 72:
        return jsonify({
            "success": False,
            "message": "Password must contain between 8 and 72 characters."
        }), 400

    # Validate optional phone number
    if phone is not None:
        if not isinstance(phone, str):
            return jsonify({
                "success": False,
                "message": "Phone number must be a string."
            }), 400

        phone = phone.strip() or None

        if phone and len(phone) > 20:
            return jsonify({
                "success": False,
                "message": "Phone number is too long."
            }), 400

    # Provider business information
    business_name = None
    category = None
    location = None
    description = None

    if role == "provider":
        business_name = data.get("business_name", "")
        category = data.get("category", "")
        location = data.get("location", "")
        description = data.get("description", "")

        if not all(isinstance(value, str) for value in [
            business_name, category, location, description
        ]):
            return jsonify({
                "success": False,
                "message": "Invalid business information."
            }), 400

        business_name = business_name.strip()
        category = category.strip()
        location = location.strip()
        description = description.strip() or None

        if not business_name or not category or not location:
            return jsonify({
                "success": False,
                "message": "Business name, category and location are required."
            }), 400

        if (
            len(business_name) > 150
            or len(category) > 100
            or len(location) > 255
        ):
            return jsonify({
                "success": False,
                "message": "Business information exceeds the allowed length."
            }), 400

    # Check for existing email
    if User.query.filter_by(email=email).first():
        return jsonify({
            "success": False,
            "message": "An account with this email already exists."
        }), 409

    # Check for existing phone
    if phone and User.query.filter_by(phone=phone).first():
        return jsonify({
            "success": False,
            "message": "An account with this phone number already exists."
        }), 409

    # Create user and optional provider profile
    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        role=role
    )

    user.set_password(password)

    try:
        db.session.add(user)
        db.session.flush()

        if role == "provider":
            provider = Provider(
                user_id=user.id,
                business_name=business_name,
                category=category,
                location=location,
                description=description,
                business_phone=phone,
                is_verified=False
            )

            db.session.add(provider)

        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "An account with these details already exists."
        }), 409

    except Exception:
        db.session.rollback()
        raise

    return jsonify({
        "success": True,
        "message": "Account created successfully!",
        "user": serialize_personal_profile(user)
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)

    # Ensure the request contains valid JSON.
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "Invalid request data."
        }), 400

    email = data.get("email")
    password = data.get("password")

    # Validate the supplied credentials.
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    email = email.strip().lower()

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    # Find the account using its email address.
    user = User.query.filter_by(email=email).first()

    # Verify the password.
    if not user or not user.check_password(password):
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # Prevent inactive accounts from signing in.
    if not user.is_active:
        return jsonify({
            "success": False,
            "message": "Your account is inactive. Please contact support."
        }), 403

    # Generate a JWT access token.
    access_token = create_access_token(
        identity=str(user.id)
    )

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "access_token": access_token,
        "user": serialize_personal_profile(user)
    }), 200

# --------------------------------------------------
# PERSONAL PROFILE SERIALIZER
# --------------------------------------------------


def serialize_personal_profile(user):
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "avatar_url": (
            "/api/auth/me/avatar"
            if user.avatar_filename
            else None
        ),
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat()
    }


# --------------------------------------------------
# GET AUTHENTICATED USER PROFILE
# --------------------------------------------------

@auth_bp.route("/me", methods=["GET"])
@roles_required("customer", "provider", "admin")
def get_current_user():

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    return jsonify({
        "success": True,
        "user": serialize_personal_profile(user)
    }), 200


# --------------------------------------------------
# UPDATE AUTHENTICATED USER PROFILE
# --------------------------------------------------

@auth_bp.route("/me", methods=["PUT"])
@roles_required("customer", "provider")
def update_current_user():

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    data = request.get_json(silent=True)

    # Validate request body
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    # Allow only editable personal information
    allowed_fields = {"full_name", "phone"}

    unsupported_fields = set(data.keys()) - allowed_fields

    if unsupported_fields:
        return jsonify({
            "success": False,
            "message": "Unsupported profile fields.",
            "fields": sorted(unsupported_fields)
        }), 400

    if not data:
        return jsonify({
            "success": False,
            "message": "Provide at least one field to update."
        }), 400

    # Prepare values before updating the database
    full_name = user.full_name
    phone = user.phone

    # Validate full name
    if "full_name" in data:

        value = data["full_name"]

        if not isinstance(value, str) or not value.strip():
            return jsonify({
                "success": False,
                "message": "Full name cannot be empty."
            }), 400

        full_name = value.strip()

        if len(full_name) > 120:
            return jsonify({
                "success": False,
                "message": "Full name cannot exceed 120 characters."
            }), 400

    # Validate personal phone number
    if "phone" in data:

        value = data["phone"]

        if value is not None and not isinstance(value, str):
            return jsonify({
                "success": False,
                "message": "Phone number must be a string or null."
            }), 400

        phone = value.strip() or None if value is not None else None

        if phone and len(phone) > 20:
            return jsonify({
                "success": False,
                "message": "Phone number cannot exceed 20 characters."
            }), 400

        if phone:
            existing_user = User.query.filter(
                User.phone == phone,
                User.id != user.id
            ).first()

            if existing_user:
                return jsonify({
                    "success": False,
                    "message": "This phone number is already registered."
                }), 409

    # Apply validated changes
    user.full_name = full_name
    user.phone = phone

    try:
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "These profile details are already registered."
        }), 409

    except Exception:
        db.session.rollback()
        raise

    return jsonify({
        "success": True,
        "message": "Personal profile updated successfully.",
        "user": serialize_personal_profile(user)
    }), 200


# --------------------------------------------------
# AVATAR CLEANUP HELPER
# --------------------------------------------------

def cleanup_avatar(filename):
    """Remove an unused avatar without interrupting the response."""

    if not filename:
        return

    try:
        delete_avatar(filename)

    except OSError:
        current_app.logger.exception(
            "Unable to clean up an avatar file."
        )


# --------------------------------------------------
# UPLOAD OR REPLACE AUTHENTICATED USER AVATAR
# --------------------------------------------------

@auth_bp.route("/me/avatar", methods=["POST"])
@roles_required("customer", "provider")
def upload_current_user_avatar():

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    # Allow additional space for multipart request overhead.
    request.max_content_length = (
        current_app.config["AVATAR_MAX_FILE_SIZE"]
        + 64 * 1024
    )

    try:
        uploaded_file = request.files.get("avatar")

        new_filename = save_avatar(uploaded_file)

    except RequestEntityTooLarge:
        return jsonify({
            "success": False,
            "message": "Profile pictures must not exceed 5 MB."
        }), 413

    except AvatarValidationError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    except OSError:
        current_app.logger.exception(
            "Unable to store uploaded avatar."
        )

        return jsonify({
            "success": False,
            "message": "Unable to save your profile picture."
        }), 500


    previous_filename = user.avatar_filename

    # Update only if the avatar has not changed
    # since this request originally read it.
    try:
        condition = (
            User.avatar_filename.is_(None)
            if previous_filename is None
            else User.avatar_filename == previous_filename
        )

        result = db.session.execute(
            update(User)
            .where(
                User.id == user_id,
                condition
            )
            .values(
                avatar_filename=new_filename
            )
        )

        if result.rowcount != 1:
            db.session.rollback()

            # This request lost the update race.
            # Remove its newly created image.
            cleanup_avatar(new_filename)

            return jsonify({
                "success": False,
                "message": (
                    "Your profile picture was changed "
                    "by another request. Please try again."
                )
            }), 409

        db.session.commit()

    except Exception:
        db.session.rollback()

        cleanup_avatar(new_filename)

        current_app.logger.exception(
            "Unable to update avatar database record."
        )

        return jsonify({
            "success": False,
            "message": "Unable to update your profile picture."
        }), 500

    # Refresh the ORM object after the conditional update.
    db.session.refresh(user)


    # Remove the previous file only after a successful commit.
    cleanup_avatar(previous_filename)

    return jsonify({
        "success": True,
        "message": "Profile picture updated successfully.",
        "user": serialize_personal_profile(user)
    }), 200


# --------------------------------------------------
# RETRIEVE AUTHENTICATED USER AVATAR
# --------------------------------------------------

@auth_bp.route("/me/avatar", methods=["GET"])
@roles_required("customer", "provider")
def get_current_user_avatar():

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    path = get_avatar_path(user.avatar_filename)

    if path is None or not path.is_file():
        return jsonify({
            "success": False,
            "message": "Profile picture not found."
        }), 404

    response = send_file(
        path,
        mimetype="image/webp",
        conditional=False,
        etag=False,
        max_age=0
    )

    # Prevent private profile pictures from being cached.
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"

    return response


# --------------------------------------------------
# REMOVE AUTHENTICATED USER AVATAR
# --------------------------------------------------

@auth_bp.route("/me/avatar", methods=["DELETE"])
@roles_required("customer", "provider")
def remove_current_user_avatar():

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    previous_filename = user.avatar_filename

    if not previous_filename:
        return jsonify({
            "success": False,
            "message": "No profile picture to remove."
        }), 404


    # Remove the database reference only if the avatar
    # has not changed since this request read it.
    try:
        result = db.session.execute(
            update(User)
            .where(
                User.id == user_id,
                User.avatar_filename == previous_filename
            )
            .values(avatar_filename=None)
        )

        if result.rowcount != 1:
            db.session.rollback()

            return jsonify({
                "success": False,
                "message": (
                    "Your profile picture was changed "
                    "by another request. Please try again."
                )
            }), 409

        db.session.commit()

    except Exception:
        db.session.rollback()

        current_app.logger.exception(
            "Unable to remove avatar database reference."
        )

        return jsonify({
            "success": False,
            "message": "Unable to remove your profile picture."
        }), 500

    # Refresh the user after the conditional update.
    db.session.refresh(user)


    # Delete the file after the database commit succeeds.
    cleanup_avatar(previous_filename)

    return jsonify({
        "success": True,
        "message": "Profile picture removed successfully.",
        "user": serialize_personal_profile(user)
    }), 200


# --------------------------------------------------
# CHANGE PASSWORD
# --------------------------------------------------

@auth_bp.route("/change-password", methods=["PUT"])
@roles_required("customer", "provider", "admin")
def change_password():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not isinstance(current_password, str) or not isinstance(new_password, str):
        return jsonify({
            "success": False,
            "message": "Current password and new password are required."
        }), 400

    if not current_password or not new_password:
        return jsonify({
            "success": False,
            "message": "Current password and new password are required."
        }), 400

    if len(new_password) < 8 or len(new_password) > 72:
        return jsonify({
            "success": False,
            "message": "New password must contain between 8 and 72 characters."
        }), 400

    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)

    if not user or not user.is_active:
        return jsonify({
            "success": False,
            "message": "User account not found or inactive."
        }), 403

    if not user.check_password(current_password):
        return jsonify({
            "success": False,
            "message": "Current password is incorrect."
        }), 401

    if user.check_password(new_password):
        return jsonify({
            "success": False,
            "message": "New password must be different from your current password."
        }), 400

    try:
        user.set_password(new_password)
        db.session.commit()

    except Exception:
        db.session.rollback()
        current_app.logger.exception("Failed to update account password")

        return jsonify({
            "success": False,
            "message": "Unable to update password. Please try again."
        }), 500

    return jsonify({
        "success": True,
        "message": "Password changed successfully."
    }), 200
