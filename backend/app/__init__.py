
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from app.extensions import db, migrate, bcrypt, jwt, limiter
from app.models import (
    User,
    Provider,
    Service,
    Booking,
    Review,
    BookingActivity,
    RevokedToken
)
from app.routes.auth import auth_bp
from app.routes.customer import customer_bp
from app.routes.services import services_bp
from app.routes.provider import provider_bp
from app.commands.token_cleanup import cleanup_revoked_tokens


def create_app(test_config=None):
    # Create Flask application
    app = Flask(__name__)

    # Load default configuration
    app.config.from_object(Config)

    # Apply optional testing configuration
    if test_config is not None:
        app.config.update(test_config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)


    # Register maintenance CLI commands.
    app.cli.add_command(cleanup_revoked_tokens)

    # Reject individually revoked JWTs and tokens belonging
    # to inactive, deleted, or outdated user sessions.
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        user_id = jwt_payload.get("sub")
        token_version = jwt_payload.get("token_version")
        jti = jwt_payload.get("jti")

        # Reject tokens without a valid JWT identifier.
        if not isinstance(jti, str) or not jti or len(jti) > 36:
            return True

        # Reject tokens without valid version information.
        if type(token_version) is not int or token_version < 1:
            return True

        # Validate the user identity.
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return True

        user = db.session.get(User, user_id)

        # Reject deleted or inactive accounts.
        if user is None or not user.is_active:
            return True

        # Reject tokens issued before a session version change.
        if user.token_version != token_version:
            return True

        # Reject individually revoked access tokens.
        revoked_token = RevokedToken.query.filter_by(
            jti=jti
        ).first()

        return revoked_token is not None
    # Allow frontend communication
    CORS(app)

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(services_bp)
    app.register_blueprint(provider_bp)

    # Health-check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "success": True,
            "message": "BookEase API is running!"
        }), 200

    return app
