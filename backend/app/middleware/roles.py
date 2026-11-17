
from functools import wraps

from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User


def roles_required(*allowed_roles):
    """
    Restrict access to users with specific roles.

    Example:
        @roles_required("admin")
        @roles_required("provider", "admin")
    """

    def decorator(func):

        @wraps(func)
        @jwt_required()
        def wrapper(*args, **kwargs):

            # Get the authenticated user's ID from the JWT
            user_id = get_jwt_identity()

            # Retrieve the current user from the database
            user = db.session.get(User, int(user_id))

            if not user or not user.is_active:
                return jsonify({
                    "success": False,
                    "message": "User account not found or inactive."
                }), 403

            # Check whether the user has an allowed role
            if user.role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": "You do not have permission to access this resource."
                }), 403

            # Allow the request to continue
            return func(*args, **kwargs)

        return wrapper

    return decorator
