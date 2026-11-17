
from datetime import datetime, timezone

from app.extensions import db


class Review(db.Model):
    __tablename__ = "reviews"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Customer who submitted the review
    customer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    # Provider being reviewed
    provider_id = db.Column(
        db.Integer,
        db.ForeignKey("providers.id"),
        nullable=False,
        index=True
    )

    # Related completed booking
    booking_id = db.Column(
        db.Integer,
        db.ForeignKey("bookings.id"),
        unique=True,
        nullable=False
    )

    # Review information
    rating = db.Column(
        db.Integer,
        nullable=False
    )

    comment = db.Column(
        db.Text,
        nullable=True
    )

    # Timestamp
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
        back_populates="reviews"
    )

    provider = db.relationship(
        "Provider",
        back_populates="reviews"
    )

    booking = db.relationship(
        "Booking",
        back_populates="review"
    )

    # Rating validation
    __table_args__ = (
        db.CheckConstraint(
            "rating >= 1 AND rating <= 5",
            name="check_review_rating"
        ),
    )

    def __repr__(self):
        return f"<Review {self.id} - {self.rating}/5>"
