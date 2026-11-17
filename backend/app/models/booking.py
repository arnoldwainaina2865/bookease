
from datetime import datetime, timezone

from app.extensions import db


class Booking(db.Model):
    __tablename__ = "bookings"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Customer who made the booking
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Provider receiving the booking
    provider_id = db.Column(
        db.Integer,
        db.ForeignKey("providers.id"),
        nullable=False,
        index=True
    )

    # Service being booked
    service_id = db.Column(
        db.Integer,
        db.ForeignKey("services.id"),
        nullable=False
    )

    # Appointment schedule
    start_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        index=True
    )

    end_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )

    # Booking information
    status = db.Column(
        db.String(20),
        nullable=False,
        default="pending",
        index=True
    )

    total_price = db.Column(
        db.Numeric(10, 2),
        nullable=False
    )

    customer_notes = db.Column(
        db.Text,
        nullable=True
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

    # Relationships
    customer = db.relationship(
        "User",
        back_populates="bookings",
        foreign_keys=[customer_id]
    )

    provider = db.relationship(
        "Provider",
        back_populates="bookings"
    )

    service = db.relationship(
        "Service",
        back_populates="bookings"
    )

    # Ensure the appointment ends after it starts
    __table_args__ = (
        db.CheckConstraint(
            "end_at > start_at",
            name="check_booking_time"
        ),
        db.CheckConstraint(
            "total_price >= 0",
            name="check_booking_price"
        ),
    )

    review = db.relationship(
    "Review",
    back_populates="booking",
    uselist=False
    )

    def __repr__(self):
        return f"<Booking {self.id} - {self.status}>"
