
from datetime import datetime, timezone

from app.extensions import db


class BookingActivity(db.Model):
    __tablename__ = "booking_activities"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    booking_id = db.Column(
        db.Integer,
        db.ForeignKey("bookings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    actor_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    action = db.Column(
        db.String(30),
        nullable=False,
        index=True
    )

    description = db.Column(
        db.Text,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    def __repr__(self):
        return (
            f"<BookingActivity "
            f"{self.id} - Booking {self.booking_id} - "
            f"{self.action}>"
        )


def record_booking_activity(
    booking,
    action,
    actor_user_id,
    description
):
    """
    Add an activity to the current database session.

    The calling route is responsible for committing.
    """

    activity = BookingActivity(
        booking_id=booking.id,
        actor_user_id=actor_user_id,
        action=action,
        description=description,
        created_at=datetime.now(timezone.utc)
    )

    db.session.add(activity)

    return activity
