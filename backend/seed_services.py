
from decimal import Decimal
from getpass import getpass

from app import create_app
from app.extensions import db
from app.models import User, Provider, Service


app = create_app()


def seed_services():
    with app.app_context():

        # Check whether the sample provider already exists
        existing_user = User.query.filter_by(
            email="elitecuts@bookease.test"
        ).first()

        if existing_user:
            print("Sample provider account already exists.")
            return

        # Securely request a password
        password = getpass("Enter sample provider password: ")
        confirm_password = getpass("Confirm password: ")

        if len(password) < 12:
            print("Password must contain at least 12 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        try:
            # 1. Create provider's user account
            provider_user = User(
                full_name="Elite Cuts Owner",
                email="elitecuts@bookease.test",
                phone="0700000001",
                role="provider"
            )

            provider_user.set_password(password)

            db.session.add(provider_user)
            db.session.flush()

            # 2. Create provider business profile
            provider = Provider(
                user_id=provider_user.id,
                business_name="Elite Cuts Barbershop",
                description="Professional barbering and grooming services.",
                category="Beauty & Grooming",
                business_phone="0700000001",
                location="Nairobi",
                is_verified=True,
                is_available=True
            )

            db.session.add(provider)
            db.session.flush()

            # 3. Create sample services
            services = [
                Service(
                    provider_id=provider.id,
                    name="Haircut",
                    description="Professional haircut and styling.",
                    price=Decimal("500.00"),
                    duration_minutes=30
                ),
                Service(
                    provider_id=provider.id,
                    name="Beard Trim",
                    description="Professional beard trimming and shaping.",
                    price=Decimal("300.00"),
                    duration_minutes=20
                ),
                Service(
                    provider_id=provider.id,
                    name="Haircut & Beard",
                    description="Complete haircut and beard grooming.",
                    price=Decimal("700.00"),
                    duration_minutes=45
                )
            ]

            db.session.add_all(services)
            db.session.commit()

            print("Sample provider and services created successfully!")
            print(f"Provider ID: {provider.id}")
            print(f"Services created: {len(services)}")

        except Exception:
            db.session.rollback()
            print("Unable to create sample provider and services.")
            raise


if __name__ == "__main__":
    seed_services()
