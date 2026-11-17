
from datetime import datetime, timezone

from app.extensions import db, bcrypt


class User(db.Model):
    __tablename__ = "users"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Personal information
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )
    phone = db.Column(
        db.String(20),
        unique=True,
        nullable=True
    )

    # Authentication
    password_hash = db.Column(db.String(255), nullable=False)

    # Account management
    role = db.Column(
        db.String(20),
        nullable=False,
        default="customer",
        index=True
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    provider_profile = db.relationship(
    "Provider",
    back_populates="user",
    uselist=False
    )

    bookings = db.relationship(
    "Booking",
    back_populates="customer",
    foreign_keys="Booking.customer_id"
    )

    reviews = db.relationship(
    "Review",
    back_populates="customer"
    )

    # Password hashing
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(
            password
        ).decode("utf-8")

    # Password verification
    def check_password(self, password):
        return bcrypt.check_password_hash(
            self.password_hash,
            password
        )

    # Object representation
    def __repr__(self):
        return f"<User {self.email}>"
