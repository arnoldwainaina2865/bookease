
from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from app.extensions import db, migrate, bcrypt, jwt
from app.models import (
    User,
    Provider,
    Service,
    Booking,
    Review,
    BookingActivity
)
from app.routes.auth import auth_bp
from app.routes.customer import customer_bp
from app.routes.services import services_bp
from app.routes.provider import provider_bp

def create_app():
    # Create Flask application
    app = Flask(__name__)

    # Load configuration
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # Allow frontend communication
    CORS(app)

    #Register authentication routes
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
