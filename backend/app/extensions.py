
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Database management
db = SQLAlchemy()

# Database migrations
migrate = Migrate()

# Password hashing
bcrypt = Bcrypt()

# JWT authentication
jwt = JWTManager()

# Authentication rate limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],
)
