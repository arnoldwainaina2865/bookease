
from datetime import datetime, timezone
from decimal import Decimal

from app.extensions import db


class Service(db.Model):
    __tablename__ = "services"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Link service to its provider
    provider_id = db.Column(
        db.Integer,
        db.ForeignKey("providers.id"),
        nullable=False,
        index=True
    )

    # Service information
    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    # Pricing and duration
    price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    duration_minutes = db.Column(
        db.Integer,
        nullable=False
    )

    # Availability
    is_active = db.Column(
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

    # Relationship with Provider
    provider = db.relationship(
        "Provider",
        back_populates="services"
    )

    bookings = db.relationship(
    "Booking",
    back_populates="service"
    )

    def __repr__(self):
        return f"<Service {self.name}>"
