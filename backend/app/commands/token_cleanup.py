
from datetime import datetime, timedelta, timezone

import click

from flask import current_app
from flask.cli import with_appcontext
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import RevokedToken


@click.command("cleanup-revoked-tokens")
@click.option(
    "--dry-run",
    is_flag=True,
    help="Preview expired records without deleting them."
)
@with_appcontext
def cleanup_revoked_tokens(dry_run):

    """Remove expired JWT revocation records safely."""

    # Respect the configured JWT expiration leeway.
    configured_leeway = current_app.config.get(
        "JWT_DECODE_LEEWAY",
        0
    )

    if isinstance(configured_leeway, timedelta):
        leeway_seconds = configured_leeway.total_seconds()
    else:
        leeway_seconds = float(configured_leeway)

    leeway_seconds = max(0, leeway_seconds)

    # Include an additional safety margin.
    cutoff = datetime.now(timezone.utc) - timedelta(
        seconds=leeway_seconds + 60
    )

    try:

        expired_records = RevokedToken.query.filter(
            RevokedToken.expires_at < cutoff
        )

        # Preview without modifying the database.
        if dry_run:

            expired_count = expired_records.count()

            click.echo(
                f"Dry run: {expired_count} expired "
                "revocation record(s) eligible for deletion."
            )

            click.echo("No records were deleted.")

            return

        # Delete only records beyond the safe cutoff.
        deleted_count = expired_records.delete(
            synchronize_session=False
        )

        db.session.commit()

    except SQLAlchemyError as error:

        db.session.rollback()

        current_app.logger.exception(
            "Failed to clean up expired JWT revocations"
        )

        raise click.ClickException(
            "Unable to clean up expired revocation records."
        ) from error

    click.echo(
        f"Successfully deleted {deleted_count} expired "
        "revocation record(s)."
    )
