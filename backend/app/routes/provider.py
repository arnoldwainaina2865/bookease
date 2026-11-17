
from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func, case, or_
from datetime import datetime, timezone, time

from app.extensions import db
from app.models import (
    Provider,
    Service,
    Booking,
    User,
    BookingActivity,
    ProviderBusinessHours,
    record_booking_activity
)
from app.middleware.roles import roles_required


provider_bp = Blueprint(
    "provider",
    __name__,
    url_prefix="/api/provider"
)


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def get_current_provider():
    """Find the provider profile belonging to the logged-in user."""

    user_id = int(get_jwt_identity())

    return Provider.query.filter_by(user_id=user_id).first()


def serialize_provider(provider):
    """Convert a provider record into JSON-friendly data."""

    return {
        "id": provider.id,
        "user_id": provider.user_id,
        "business_name": provider.business_name,
        "description": provider.description,
        "category": provider.category,
        "business_phone": provider.business_phone,
        "location": provider.location,
        "is_verified": provider.is_verified,
        "is_available": provider.is_available
    }


def serialize_service(service):
    """Convert a service record into JSON-friendly data."""

    return {
        "id": service.id,
        "provider_id": service.provider_id,
        "name": service.name,
        "description": service.description,
        "price": str(service.price),
        "duration_minutes": service.duration_minutes,
        "is_active": service.is_active,
        "created_at": service.created_at.isoformat()
    }

def serialize_business_hours(hours):
    """Convert a business hours record into JSON-friendly data."""

    return {
        "day_of_week": hours.day_of_week,
        "opening_time": (
            hours.opening_time.strftime("%H:%M")
            if hours.opening_time else None
        ),
        "closing_time": (
            hours.closing_time.strftime("%H:%M")
            if hours.closing_time else None
        ),
        "is_closed": hours.is_closed
    }

# --------------------------------------------------
# PROVIDER BUSINESS PROFILE
# --------------------------------------------------

@provider_bp.route("/profile", methods=["GET"])
@roles_required("provider")
def get_provider_profile():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    return jsonify({
        "success": True,
        "message": "Provider profile retrieved successfully.",
        "provider": serialize_provider(provider)
    }), 200


@provider_bp.route("/profile", methods=["PUT"])
@roles_required("provider")
def update_provider_profile():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    allowed_fields = [
        "business_name",
        "description",
        "category",
        "business_phone",
        "location"
    ]

    unsupported_fields = set(data.keys()) - set(allowed_fields)

    if unsupported_fields:
        return jsonify({
            "success": False,
            "message": "Unsupported profile fields.",
            "fields": sorted(unsupported_fields)
        }), 400

    if not data:
        return jsonify({
            "success": False,
            "message": "Provide at least one field to update."
        }), 400

    required_fields = [
        "business_name",
        "category",
        "location"
    ]

    for field in allowed_fields:

        if field not in data:
            continue

        value = data[field]

        if value is not None and not isinstance(value, str):
            return jsonify({
                "success": False,
                "message": f"{field} must be a string."
            }), 400

        if field in required_fields:
            if not isinstance(value, str) or not value.strip():
                return jsonify({
                    "success": False,
                    "message": f"{field} cannot be empty."
                }), 400

        if value is not None:
            value = value.strip()

        setattr(provider, field, value or None)

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to update provider profile."
        }), 500

    return jsonify({
        "success": True,
        "message": "Provider profile updated successfully.",
        "provider": serialize_provider(provider)
    }), 200


# --------------------------------------------------
# PROVIDER BUSINESS HOURS
# --------------------------------------------------

@provider_bp.route("/business-hours", methods=["GET"])
@roles_required("provider")
def get_provider_business_hours():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    business_hours = ProviderBusinessHours.query.filter_by(
        provider_id=provider.id
    ).order_by(
        ProviderBusinessHours.day_of_week.asc()
    ).all()

    return jsonify({
        "success": True,
        "message": "Business hours retrieved successfully.",
        "is_configured": len(business_hours) == 7,
        "timezone": "Africa/Nairobi",
        "business_hours": [
            serialize_business_hours(hours)
            for hours in business_hours
        ]
    }), 200



@provider_bp.route("/business-hours", methods=["PUT"])
@roles_required("provider")
def update_provider_business_hours():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    business_hours = data.get("business_hours")

    # Require a complete weekly schedule
    if not isinstance(business_hours, list) or len(business_hours) != 7:
        return jsonify({
            "success": False,
            "message": "Provide business hours for all seven days."
        }), 400

    validated_hours = []
    seen_days = set()

    # Validate the entire schedule before saving
    for item in business_hours:

        if not isinstance(item, dict):
            return jsonify({
                "success": False,
                "message": "Each business hours entry must be an object."
            }), 400

        day = item.get("day_of_week")
        is_closed = item.get("is_closed")

        # Validate weekday
        if type(day) is not int or not 0 <= day <= 6:
            return jsonify({
                "success": False,
                "message": "day_of_week must be an integer between 0 and 6."
            }), 400

        # Prevent duplicate weekdays
        if day in seen_days:
            return jsonify({
                "success": False,
                "message": "Duplicate weekdays are not allowed."
            }), 400

        seen_days.add(day)

        # Validate closed/open status
        if not isinstance(is_closed, bool):
            return jsonify({
                "success": False,
                "message": "is_closed must be a boolean."
            }), 400

        opening_time = None
        closing_time = None

        if not is_closed:

            opening = item.get("opening_time")
            closing = item.get("closing_time")

            try:
                opening_time = datetime.strptime(
                    opening, "%H:%M"
                ).time()

                closing_time = datetime.strptime(
                    closing, "%H:%M"
                ).time()

            except (ValueError, TypeError):
                return jsonify({
                    "success": False,
                    "message": f"Day {day}: provide valid opening and closing times in HH:MM format."
                }), 400

            if opening_time >= closing_time:
                return jsonify({
                    "success": False,
                    "message": f"Day {day}: closing time must be after opening time."
                }), 400

        validated_hours.append({
            "day_of_week": day,
            "opening_time": opening_time,
            "closing_time": closing_time,
            "is_closed": is_closed
        })

    # Retrieve existing schedule
    existing_hours = {
        hours.day_of_week: hours
        for hours in ProviderBusinessHours.query.filter_by(
            provider_id=provider.id
        ).all()
    }

    try:

        for item in validated_hours:

            day = item["day_of_week"]

            hours = existing_hours.get(day)

            # Create a record if the weekday does not exist
            if hours is None:
                hours = ProviderBusinessHours(
                    provider_id=provider.id,
                    day_of_week=day
                )

                db.session.add(hours)

            # Update working hours
            hours.opening_time = item["opening_time"]
            hours.closing_time = item["closing_time"]
            hours.is_closed = item["is_closed"]

        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to update business hours."
        }), 500

    updated_hours = ProviderBusinessHours.query.filter_by(
        provider_id=provider.id
    ).order_by(
        ProviderBusinessHours.day_of_week.asc()
    ).all()

    return jsonify({
        "success": True,
        "message": "Business hours updated successfully.",
        "is_configured": len(updated_hours) == 7,
        "timezone": "Africa/Nairobi",
        "business_hours": [
            serialize_business_hours(hours)
            for hours in updated_hours
        ]
    }), 200



# --------------------------------------------------
# PROVIDER SERVICE MANAGEMENT
# --------------------------------------------------

@provider_bp.route("/services", methods=["GET"])
@roles_required("provider")
def get_provider_services():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    services = Service.query.filter_by(
        provider_id=provider.id
    ).order_by(
        Service.created_at.desc()
    ).all()

    return jsonify({
        "success": True,
        "message": "Provider services retrieved successfully.",
        "services": [
            serialize_service(service)
            for service in services
        ],
        "total_services": len(services)
    }), 200


@provider_bp.route("/services", methods=["POST"])
@roles_required("provider")
def create_provider_service():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    allowed_fields = {
        "name",
        "description",
        "price",
        "duration_minutes"
    }

    unsupported_fields = set(data.keys()) - allowed_fields

    if unsupported_fields:
        return jsonify({
            "success": False,
            "message": "Unsupported service fields.",
            "fields": sorted(unsupported_fields)
        }), 400

    # Validate service name
    name = data.get("name")

    if not isinstance(name, str) or not name.strip():
        return jsonify({
            "success": False,
            "message": "Service name is required."
        }), 400

    name = name.strip()

    if len(name) > 150:
        return jsonify({
            "success": False,
            "message": "Service name cannot exceed 150 characters."
        }), 400

    # Validate optional description
    description = data.get("description")

    if description is not None and not isinstance(description, str):
        return jsonify({
            "success": False,
            "message": "Service description must be a string."
        }), 400

    if description is not None:
        description = description.strip() or None

    # Validate service price
    raw_price = data.get("price")

    if isinstance(raw_price, bool) or raw_price is None:
        return jsonify({
            "success": False,
            "message": "A valid service price is required."
        }), 400

    try:
        price = Decimal(str(raw_price))

        if not price.is_finite() or price < 0:
            raise InvalidOperation

    except (InvalidOperation, ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Price must be a valid non-negative number."
        }), 400

    # Validate service duration
    duration = data.get("duration_minutes")

    if (
        isinstance(duration, bool)
        or not isinstance(duration, int)
        or duration <= 0
    ):
        return jsonify({
            "success": False,
            "message": "Duration must be a positive whole number of minutes."
        }), 400

    # Create service
    service = Service(
        provider_id=provider.id,
        name=name,
        description=description,
        price=price,
        duration_minutes=duration
    )

    try:
        db.session.add(service)
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to create service."
        }), 500

    return jsonify({
        "success": True,
        "message": "Service created successfully.",
        "service": serialize_service(service)
    }), 201


# --------------------------------------------------
# UPDATE PROVIDER SERVICE
# --------------------------------------------------

@provider_bp.route("/services/<int:service_id>", methods=["PUT"])
@roles_required("provider")
def update_provider_service(service_id):

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    service = Service.query.filter_by(
        id=service_id,
        provider_id=provider.id
    ).first()

    if not service:
        return jsonify({
            "success": False,
            "message": "Service not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    allowed_fields = {
        "name",
        "description",
        "price",
        "duration_minutes",
        "is_active"
    }

    unsupported_fields = set(data.keys()) - allowed_fields

    if unsupported_fields:
        return jsonify({
            "success": False,
            "message": "Unsupported service fields.",
            "fields": sorted(unsupported_fields)
        }), 400

    if not data:
        return jsonify({
            "success": False,
            "message": "Provide at least one field to update."
        }), 400

    # Validate and update service name
    if "name" in data:

        name = data["name"]

        if not isinstance(name, str) or not name.strip():
            return jsonify({
                "success": False,
                "message": "Service name cannot be empty."
            }), 400

        if len(name.strip()) > 150:
            return jsonify({
                "success": False,
                "message": "Service name cannot exceed 150 characters."
            }), 400

        service.name = name.strip()

    # Validate and update description
    if "description" in data:

        description = data["description"]

        if description is not None and not isinstance(description, str):
            return jsonify({
                "success": False,
                "message": "Description must be a string."
            }), 400

        service.description = description.strip() or None if description is not None else None

    # Validate and update price
    if "price" in data:

        raw_price = data["price"]

        if isinstance(raw_price, bool) or raw_price is None:
            return jsonify({
                "success": False,
                "message": "A valid price is required."
            }), 400

        try:
            price = Decimal(str(raw_price))

            if not price.is_finite() or price < 0:
                raise InvalidOperation

            service.price = price

        except (InvalidOperation, ValueError, TypeError):
            return jsonify({
                "success": False,
                "message": "Price must be a valid non-negative number."
            }), 400

    # Validate and update duration
    if "duration_minutes" in data:

        duration = data["duration_minutes"]

        if (
            isinstance(duration, bool)
            or not isinstance(duration, int)
            or duration <= 0
        ):
            return jsonify({
                "success": False,
                "message": "Duration must be a positive whole number."
            }), 400

        service.duration_minutes = duration

    # Validate and update active status
    if "is_active" in data:

        is_active = data["is_active"]

        if not isinstance(is_active, bool):
            return jsonify({
                "success": False,
                "message": "is_active must be true or false."
            }), 400

        service.is_active = is_active

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to update service."
        }), 500

    return jsonify({
        "success": True,
        "message": "Service updated successfully.",
        "service": serialize_service(service)
    }), 200


# --------------------------------------------------
# DEACTIVATE PROVIDER SERVICE
# --------------------------------------------------

@provider_bp.route("/services/<int:service_id>", methods=["DELETE"])
@roles_required("provider")
def deactivate_provider_service(service_id):

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    service = Service.query.filter_by(
        id=service_id,
        provider_id=provider.id
    ).first()

    if not service:
        return jsonify({
            "success": False,
            "message": "Service not found."
        }), 404

    if not service.is_active:
        return jsonify({
            "success": False,
            "message": "Service is already inactive."
        }), 400

    service.is_active = False

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to deactivate service."
        }), 500

    return jsonify({
        "success": True,
        "message": "Service deactivated successfully.",
        "service": serialize_service(service)
    }), 200


# --------------------------------------------------
# PROVIDER BOOKING MANAGEMENT
# --------------------------------------------------

def format_booking_datetime(value):
    """Return booking datetimes as ISO 8601 UTC strings."""

    if value.tzinfo is None:
        return value.isoformat() + "Z"

    return value.isoformat()


def serialize_provider_booking(booking):
    """Convert a booking and its related records into JSON."""

    customer = booking.customer
    service = booking.service
    provider = booking.provider

    return {
        "id": booking.id,
        "status": booking.status,
        "start_at": format_booking_datetime(booking.start_at),
        "end_at": format_booking_datetime(booking.end_at),
        "total_price": str(booking.total_price),
        "customer_notes": booking.customer_notes,
        "created_at": format_booking_datetime(booking.created_at),

        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone": customer.phone
        },

        "service": {
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "duration_minutes": service.duration_minutes
        },

        "provider": {
            "id": provider.id,
            "business_name": provider.business_name
        }
    }


# --------------------------------------------------
# GET ALL BOOKINGS FOR THE AUTHENTICATED PROVIDER
# --------------------------------------------------

@provider_bp.route("/bookings", methods=["GET"])
@roles_required("provider")
def get_provider_bookings():

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Read pagination parameters
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(
            50,
            max(1, int(request.args.get("per_page", 10)))
        )

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Page and per_page must be valid integers."
        }), 400

    # Optional booking status filter
    status = request.args.get("status", "").strip().lower()

    allowed_statuses = {
        "pending",
        "confirmed",
        "cancelled",
        "completed",
        "rejected"
    }

    if status and status not in allowed_statuses:
        return jsonify({
            "success": False,
            "message": "Invalid booking status.",
            "allowed_statuses": sorted(allowed_statuses)
        }), 400

    # Retrieve only bookings belonging to this provider
    query = Booking.query.filter_by(
        provider_id=provider.id
    )

    if status:
        query = query.filter_by(status=status)

    # Apply pagination
    pagination = query.order_by(
        Booking.start_at.desc()
    ).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    bookings = [
        serialize_provider_booking(booking)
        for booking in pagination.items
    ]

    return jsonify({
        "success": True,
        "message": "Provider bookings retrieved successfully.",
        "bookings": bookings,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_bookings": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_previous": pagination.has_prev
        }
    }), 200


# --------------------------------------------------
# GET ONE BOOKING BELONGING TO THE PROVIDER
# --------------------------------------------------

@provider_bp.route("/bookings/<int:booking_id>", methods=["GET"])
@roles_required("provider")
def get_provider_booking(booking_id):

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Restrict lookup to this provider's bookings
    booking = Booking.query.filter_by(
        id=booking_id,
        provider_id=provider.id
    ).first()

    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    return jsonify({
        "success": True,
        "message": "Booking details retrieved successfully.",
        "booking": serialize_provider_booking(booking)
    }), 200


# --------------------------------------------------
# GET BOOKING ACTIVITY TIMELINE
# --------------------------------------------------

@provider_bp.route(
    "/bookings/<int:booking_id>/activities",
    methods=["GET"]
)
@roles_required("provider")
def get_provider_booking_activities(booking_id):

    # Identify the authenticated provider.
    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Verify that the booking belongs to this provider.
    booking = Booking.query.filter_by(
        id=booking_id,
        provider_id=provider.id
    ).first()

    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    # Retrieve activities in chronological order.
    activities = BookingActivity.query.filter_by(
        booking_id=booking.id
    ).order_by(
        BookingActivity.created_at.asc(),
        BookingActivity.id.asc()
    ).all()

    # Format activities for the frontend.
    serialized_activities = [
        {
            "id": activity.id,
            "action": activity.action,
            "description": activity.description,
            "actor_user_id": activity.actor_user_id,
            "created_at": format_booking_datetime(
                activity.created_at
            )
        }
        for activity in activities
    ]

    return jsonify({
        "success": True,
        "message": "Booking activities retrieved successfully.",
        "booking_id": booking.id,
        "activities": serialized_activities
    }), 200



# --------------------------------------------------
# CONFIRM PROVIDER BOOKING
# --------------------------------------------------

@provider_bp.route(
    "/bookings/<int:booking_id>/confirm",
    methods=["PATCH"]
)
@roles_required("provider")
def confirm_provider_booking(booking_id):

    # Find the authenticated provider
    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Find the booking and verify ownership
    booking = Booking.query.filter_by(
        id=booking_id,
        provider_id=provider.id
    ).first()

    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    # Only pending bookings can be confirmed
    if booking.status != "pending":
        return jsonify({
            "success": False,
            "message": (
                f"Only pending bookings can be confirmed. "
                f"Current status: {booking.status}."
            )
        }), 400

    # Check whether another active booking overlaps this appointment
    conflicting_booking = Booking.query.filter(
        Booking.provider_id == provider.id,
        Booking.id != booking.id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.start_at < booking.end_at,
        Booking.end_at > booking.start_at
    ).first()

    if conflicting_booking:
        return jsonify({
            "success": False,
            "message": "This appointment overlaps another active booking.",
            "conflicting_booking": {
                "id": conflicting_booking.id,
                "start_at": format_booking_datetime(
                    conflicting_booking.start_at
                ),
                "end_at": format_booking_datetime(
                    conflicting_booking.end_at
                ),
                "status": conflicting_booking.status
            }
        }), 409


    # Confirm the booking
    booking.status = "confirmed"

    try:
        record_booking_activity(
            booking=booking,
            action="confirmed",
            actor_user_id=int(get_jwt_identity()),
            description="Booking was confirmed by the provider."
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to confirm booking."
        }), 500



    return jsonify({
        "success": True,
        "message": "Booking confirmed successfully.",
        "booking": serialize_provider_booking(booking)
    }), 200


# --------------------------------------------------
# REJECT PROVIDER BOOKING
# --------------------------------------------------

@provider_bp.route(
    "/bookings/<int:booking_id>/reject",
    methods=["PATCH"]
)
@roles_required("provider")
def reject_provider_booking(booking_id):

    # Identify the authenticated provider
    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Find the booking and verify ownership
    booking = Booking.query.filter_by(
        id=booking_id,
        provider_id=provider.id
    ).first()

    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    # Only pending bookings can be rejected
    if booking.status != "pending":
        return jsonify({
            "success": False,
            "message": (
                f"Only pending bookings can be rejected. "
                f"Current status: {booking.status}."
            )
        }), 400

    
    # Change booking status without deleting the record
    
    booking.status = "rejected"

    try:
        record_booking_activity(
            booking=booking,
            action="rejected",
            actor_user_id=int(get_jwt_identity()),
            description="Booking was rejected by the provider."
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to reject booking."
        }), 500

    return jsonify({
        "success": True,
        "message": "Booking rejected successfully.",
        "booking": serialize_provider_booking(booking)
    }), 200


# --------------------------------------------------
# COMPLETE PROVIDER BOOKING
# --------------------------------------------------

@provider_bp.route(
    "/bookings/<int:booking_id>/complete",
    methods=["PATCH"]
)
@roles_required("provider")
def complete_provider_booking(booking_id):

    # Identify the authenticated provider
    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Find the booking and verify ownership
    booking = Booking.query.filter_by(
        id=booking_id,
        provider_id=provider.id
    ).first()

    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    # Only confirmed bookings can be completed
    if booking.status != "confirmed":
        return jsonify({
            "success": False,
            "message": (
                "Only confirmed bookings can be completed. "
                f"Current status: {booking.status}."
            )
        }), 400

    # Get the current time in UTC
    now_utc = datetime.now(timezone.utc)

    # SQLite may return naive datetime objects.
    # Our existing booking implementation stores these as UTC.
    booking_end = booking.end_at

    if booking_end.tzinfo is None:
        booking_end = booking_end.replace(tzinfo=timezone.utc)
    else:
        booking_end = booking_end.astimezone(timezone.utc)

    # Ensure the appointment has ended
    if booking_end > now_utc:
        return jsonify({
            "success": False,
            "message": "This booking cannot be completed before its scheduled end time.",
            "scheduled_end_at": format_booking_datetime(booking.end_at),
            "current_time_utc": now_utc.isoformat()
        }), 400

    
    # Mark booking as completed
    booking.status = "completed"

    try:
        record_booking_activity(
            booking=booking,
            action="completed",
            actor_user_id=int(get_jwt_identity()),
            description="Booking was marked as completed by the provider."
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to complete booking."
        }), 500


    return jsonify({
        "success": True,
        "message": "Booking completed successfully.",
        "booking": serialize_provider_booking(booking)
    }), 200

# --------------------------------------------------
# PROVIDER DASHBOARD STATISTICS
# --------------------------------------------------

@provider_bp.route("/dashboard", methods=["GET"])
@roles_required("provider")
def provider_dashboard():

    # Get the authenticated provider
    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Base query: only this provider's bookings
    dashboard_query = db.session.query(
        func.count(Booking.id).label("total_bookings"),

        func.sum(
            case(
                (Booking.status == "pending", 1),
                else_=0
            )
        ).label("pending_bookings"),

        func.sum(
            case(
                (Booking.status == "confirmed", 1),
                else_=0
            )
        ).label("confirmed_bookings"),

        func.sum(
            case(
                (Booking.status == "completed", 1),
                else_=0
            )
        ).label("completed_bookings"),

        func.sum(
            case(
                (Booking.status == "cancelled", 1),
                else_=0
            )
        ).label("cancelled_bookings"),

        func.sum(
            case(
                (Booking.status == "rejected", 1),
                else_=0
            )
        ).label("rejected_bookings"),

        func.coalesce(
            func.sum(
                case(
                    (
                        Booking.status == "completed",
                        Booking.total_price
                    ),
                    else_=0
                )
            ),
            0
        ).label("total_earnings")

    ).filter(
        Booking.provider_id == provider.id
    )

    # Execute the aggregate query
    statistics = dashboard_query.one()

    # Convert earnings to a consistent decimal string
    total_earnings = Decimal(
        str(statistics.total_earnings)
    )

    # Retrieve the five most recent bookings
    recent_bookings = (
        Booking.query
        .filter_by(provider_id=provider.id)
        .order_by(
            Booking.created_at.desc(),
            Booking.id.desc()
        )
        .limit(5)
        .all()
    )

    # Prepare dashboard statistics
    dashboard_data = {
        "total_bookings": statistics.total_bookings or 0,
        "pending_bookings": statistics.pending_bookings or 0,
        "confirmed_bookings": statistics.confirmed_bookings or 0,
        "completed_bookings": statistics.completed_bookings or 0,
        "cancelled_bookings": statistics.cancelled_bookings or 0,
        "rejected_bookings": statistics.rejected_bookings or 0,
        "unsuccessful_bookings": (
            (statistics.cancelled_bookings or 0)
            + (statistics.rejected_bookings or 0)
        ),
        "total_earnings": f"{total_earnings:.2f}"
    }

    # Serialize recent bookings
    recent_bookings_data = [
        serialize_provider_booking(booking)
        for booking in recent_bookings
    ]

    return jsonify({
        "success": True,
        "message": "Provider dashboard retrieved successfully.",
        "provider": {
            "id": provider.id,
            "business_name": provider.business_name
        },
        "statistics": dashboard_data,
        "recent_bookings": recent_bookings_data
    }), 200

# --------------------------------------------------
# GET ALL CUSTOMERS FOR THE AUTHENTICATED PROVIDER
# --------------------------------------------------

@provider_bp.route("/customers", methods=["GET"])
@roles_required("provider")
def get_provider_customers():
    """Retrieve unique customers who have booked with this provider."""

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404

    # Read and validate pagination parameters.
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 10))

        if page < 1 or per_page < 1 or per_page > 50:
            raise ValueError

    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Invalid pagination parameters."
        }), 400

    # Optional search across customer details.
    search = request.args.get("search", "").strip()

    # Base query: customers who have booked with this provider.
    customers_query = (
        db.session.query(
            User.id.label("customer_id"),
            User.full_name,
            User.email,
            User.phone,
            User.is_active,
            func.count(Booking.id).label("total_bookings"),
            func.max(Booking.start_at).label("last_booking_at")
        )
        .join(
            Booking,
            Booking.customer_id == User.id
        )
        .filter(
            Booking.provider_id == provider.id,
            User.role == "customer"
        )
    )

    # Apply search when a search term is provided.
    if search:
        search_term = f"%{search}%"

        customers_query = customers_query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
                User.phone.ilike(search_term)
            )
        )

    # Group by customer to avoid duplicate records.
    customers_query = customers_query.group_by(
        User.id,
        User.full_name,
        User.email,
        User.phone,
        User.is_active
    )

    # Count the unique customers matching the query.
    total_customers = customers_query.count()

    # Retrieve the requested page.
    customers = (
        customers_query
        .order_by(
            func.max(Booking.start_at).desc(),
            User.full_name.asc()
        )
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    total_pages = (
        (total_customers + per_page - 1) // per_page
    )

    # Serialize customer records.
    customers_data = [
        {
            "id": customer.customer_id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone": customer.phone,
            "is_active": customer.is_active,
            "total_bookings": customer.total_bookings,
            "last_booking_at": (
                format_booking_datetime(customer.last_booking_at)
                if customer.last_booking_at
                else None
            )
        }
        for customer in customers
    ]

    return jsonify({
        "success": True,
        "message": "Provider customers retrieved successfully.",
        "customers": customers_data,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_customers": total_customers,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    }), 200

# --------------------------------------------------
# GET CUSTOMER PROFILE AND BOOKING HISTORY
# --------------------------------------------------

@provider_bp.route("/customers/<int:customer_id>", methods=["GET"])
@roles_required("provider")
def get_provider_customer_details(customer_id):
    """Retrieve one customer's profile and booking history."""

    provider = get_current_provider()

    if not provider:
        return jsonify({
            "success": False,
            "message": "Provider profile not found."
        }), 404



    # Verify that this customer has booked with this provider.
    customer = (
        User.query
        .join(
            Booking,
            Booking.customer_id == User.id
        )
        .filter(
            User.id == customer_id,
            User.role == "customer",
            Booking.provider_id == provider.id
        )
        .first()
    )

    if not customer:
        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    # Retrieve only bookings belonging to this provider
    # and this particular customer.
    bookings = (
        Booking.query
        .filter(
            Booking.customer_id == customer.id,
            Booking.provider_id == provider.id
        )
        .order_by(
            Booking.start_at.desc(),
            Booking.id.desc()
        )
        .all()
    )

    # Calculate customer statistics.
    completed_bookings = [
        booking for booking in bookings
        if booking.status == "completed"
    ]

    total_completed_spend = sum(
        (booking.total_price for booking in completed_bookings),
        Decimal("0.00")
    )

    customer_data = {
        "id": customer.id,
        "full_name": customer.full_name,
        "email": customer.email,
        "phone": customer.phone,
        "is_active": customer.is_active,
        "created_at": format_booking_datetime(customer.created_at)
    }

    statistics = {
        "total_bookings": len(bookings),
        "pending_bookings": sum(
            booking.status == "pending" for booking in bookings
        ),
        "confirmed_bookings": sum(
            booking.status == "confirmed" for booking in bookings
        ),
        "completed_bookings": len(completed_bookings),
        "cancelled_bookings": sum(
            booking.status == "cancelled" for booking in bookings
        ),
        "rejected_bookings": sum(
            booking.status == "rejected" for booking in bookings
        ),
        "total_completed_spend": f"{total_completed_spend:.2f}"
    }

    booking_history = [
        serialize_provider_booking(booking)
        for booking in bookings
    ]

    return jsonify({
        "success": True,
        "message": "Customer details retrieved successfully.",
        "customer": customer_data,
        "statistics": statistics,
        "bookings": booking_history
    }), 200
