
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

# Database management
db = SQLAlchemy()

# Database migrations
migrate = Migrate()

# Password hashing
bcrypt = Bcrypt()

# JWT authentication
jwt = JWTManager()
