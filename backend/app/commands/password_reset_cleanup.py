from datetime import datetime, timezone

import click

from flask import current_app
from flask.cli import with_appcontext
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import PasswordResetToken


@click.command("cleanup-password-reset-tokens")
@click.option(
    "--dry-run",
    is_flag=True,
    help="Preview expired recovery tokens without deleting them."
)
@with_appcontext
def cleanup_password_reset_tokens(dry_run):
    """Remove expired password recovery tokens."""

    cutoff = datetime.now(timezone.utc)

    try:
        expired_tokens = PasswordResetToken.query.filter(
            PasswordResetToken.expires_at <= cutoff
        )

        if dry_run:
            count = expired_tokens.count()

            click.echo(
                f"Dry run: {count} expired recovery token(s)."
            )
            click.echo("No records were deleted.")
            return

        deleted_count = expired_tokens.delete(
            synchronize_session=False
        )

        db.session.commit()

    except SQLAlchemyError as error:
        db.session.rollback()

        current_app.logger.error(
            "Password recovery token cleanup failed."
        )

        raise click.ClickException(
            "Unable to clean up recovery tokens."
        ) from error

    click.echo(
        f"Successfully deleted {deleted_count} "
        "expired recovery token(s)."
    )
