
from datetime import datetime, timezone

from app.extensions import db


class RevokedToken(db.Model):
    __tablename__ = "revoked_tokens"

    # Primary key
    id = db.Column(
        db.Integer,
        primary_key=True
    )

    # Unique JWT identifier
    jti = db.Column(
        db.String(36),
        unique=True,
        nullable=False,
        index=True
    )

    # Associated user account
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Time the token was revoked
    revoked_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Original JWT expiration time
    expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        index=True
    )

    def __repr__(self):
        return f"<RevokedToken {self.id}>"
