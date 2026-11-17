
from app.middleware.roles import roles_required
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from sqlalchemy.exc import IntegrityError

from app.extensions import db, bcrypt
from app.models import User, Provider

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
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
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
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }), 200

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():

    # Get the logged-in user's ID from the JWT
    user_id = get_jwt_identity()

    # Find the user in the database
    user = db.session.get(User, int(user_id))

    if not user:
        return jsonify({
            "success": False,
            "message": "User account not found."
        }), 404

    # Return the user's details
    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role
        }
    }), 200
