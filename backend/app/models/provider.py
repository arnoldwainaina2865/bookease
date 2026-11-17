
from datetime import datetime, timezone

from app.extensions import db


class Provider(db.Model):
    __tablename__ = "providers"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Link provider profile to a user account
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        unique=True,
        nullable=False
    )

    # Business information
    business_name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(db.Text, nullable=True)

    category = db.Column(
        db.String(100),
        nullable=False
    )

    # Contact and location
    business_phone = db.Column(
        db.String(20),
        nullable=True
    )

    location = db.Column(
        db.String(255),
        nullable=False
    )

    # Business status
    is_verified = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    is_available = db.Column(
        db.Boolean,
        default=True,
        nullable=False
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

    # Relationship with User
    user = db.relationship(
        "User",
        back_populates="provider_profile"
    )

    services = db.relationship(
    "Service",
    back_populates="provider",
    cascade="all, delete-orphan"
    )

    bookings = db.relationship(
    "Booking",
    back_populates="provider"
    )

    reviews = db.relationship(
    "Review",
    back_populates="provider"
    )

    business_hours = db.relationship(
        "ProviderBusinessHours",
        back_populates="provider",
        cascade="all, delete-orphan"
    )

    

    def __repr__(self):
        return f"<Provider {self.business_name}>"
