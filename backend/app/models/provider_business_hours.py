
from app.extensions import db


class ProviderBusinessHours(db.Model):
    __tablename__ = "provider_business_hours"

    # Primary key
    id = db.Column(db.Integer, primary_key=True)

    # Link business hours to a provider
    provider_id = db.Column(
        db.Integer,
        db.ForeignKey("providers.id"),
        nullable=False,
        index=True
    )

    # Monday = 0, Sunday = 6
    day_of_week = db.Column(
        db.Integer,
        nullable=False
    )

    # Business opening and closing times
    opening_time = db.Column(
        db.Time,
        nullable=True
    )

    closing_time = db.Column(
        db.Time,
        nullable=True
    )

    # Whether the business is closed on this day
    is_closed = db.Column(
        db.Boolean,
        default=False,
        nullable=False
    )

    # Relationship with Provider
    provider = db.relationship(
        "Provider",
        back_populates="business_hours"
    )

    # Database constraints
    __table_args__ = (
        db.UniqueConstraint(
            "provider_id",
            "day_of_week",
            name="uq_provider_business_day"
        ),
        db.CheckConstraint(
            "day_of_week >= 0 AND day_of_week <= 6",
            name="ck_business_hours_valid_day"
        ),
        db.CheckConstraint(
            "is_closed OR (opening_time IS NOT NULL "
            "AND closing_time IS NOT NULL "
            "AND opening_time < closing_time)",
            name="ck_business_hours_valid_times"
        ),
    )

    def __repr__(self):
        return (
            f"<ProviderBusinessHours "
            f"provider={self.provider_id} "
            f"day={self.day_of_week}>"
        )
