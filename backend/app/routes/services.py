from decimal import Decimal, InvalidOperation
import re

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from flask import Blueprint, jsonify, request

from app.models import (
    Service,
    Provider,
    Booking,
    ProviderBusinessHours
)
services_bp = Blueprint(
    "services",
    __name__,
    url_prefix="/api/services"
)


@services_bp.route("/", methods=["GET"])
def get_services():

    # Read optional filters from the URL
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    location = request.args.get("location", "").strip()

    # Read pagination parameters
    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(50, max(1, int(request.args.get("per_page", 10))))
    except ValueError:
        return jsonify({
            "success": False,
            "message": "Page and per_page must be valid integers."
        }), 400

    # Start with active services from available providers
    query = (
        Service.query
        .join(Provider)
        .filter(
            Service.is_active.is_(True),
            Provider.is_available.is_(True)
        )
    )

    # Search service names, descriptions and business names
    if search:
        query = query.filter(
            db_or_search(search)
        )

    # Filter by provider category
    if category:
        query = query.filter(
            Provider.category.ilike(f"%{category}%")
        )

    # Filter by provider location
    if location:
        query = query.filter(
            Provider.location.ilike(f"%{location}%")
        )


    # Validate optional price filters.
    def parse_price(name):
        raw = request.args.get(name, "").strip()

        if not raw:
            return None

        if not re.fullmatch(r"[0-9]{1,8}(?:\.[0-9]{1,2})?", raw):
            raise ValueError(
                f"{name} must be a non-negative price "
                "with at most two decimal places."
            )

        return Decimal(raw)

    try:
        min_price = parse_price("min_price")
        max_price = parse_price("max_price")

        if (
            min_price is not None
            and max_price is not None
            and min_price > max_price
        ):
            raise ValueError(
                "Minimum price cannot exceed maximum price."
            )

    except (ValueError, InvalidOperation) as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    if min_price is not None:
        query = query.filter(Service.price >= min_price)

    if max_price is not None:
        query = query.filter(Service.price <= max_price)

    sort = request.args.get("sort", "newest")

    sort_options = {
        "newest": Service.created_at.desc(),
        "price_asc": Service.price.asc(),
        "price_desc": Service.price.desc(),
        "name": Service.name.asc()
    }

    if sort not in sort_options:
        return jsonify({
            "success": False,
            "message": "Invalid sorting option."
        }), 400

    # Apply pagination
    pagination = query.order_by(
        sort_options[sort],
        Service.id.desc()
    ).paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    services = []

    for service in pagination.items:
        provider = service.provider

        services.append({
            "id": service.id,
            "name": service.name,
            "description": service.description,
            "price": str(service.price),
            "duration_minutes": service.duration_minutes,
            "provider": {
                "id": provider.id,
                "business_name": provider.business_name,
                "category": provider.category,
                "location": provider.location,
                "is_verified": provider.is_verified
            }
        })

    return jsonify({
        "success": True,
        "message": "Services retrieved successfully.",
        "services": services,
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total_services": pagination.total,
            "total_pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_previous": pagination.has_prev
        }
    }), 200


def db_or_search(search):
    from sqlalchemy import or_

    return or_(
        Service.name.ilike(f"%{search}%"),
        Service.description.ilike(f"%{search}%"),
        Provider.business_name.ilike(f"%{search}%")
    )


# --------------------------------------------------
# GET AVAILABLE APPOINTMENT SLOTS FOR A SERVICE
# --------------------------------------------------

@services_bp.route(
    "/<int:service_id>/availability",
    methods=["GET"]
)
def get_service_availability(service_id):

    business_timezone = ZoneInfo("Africa/Nairobi")
    slot_interval = 30

    # Retrieve and validate the requested date.
    date_value = request.args.get("date", "").strip()

    if not date_value:
        return jsonify({
            "success": False,
            "message": "An appointment date is required."
        }), 400

    try:
        appointment_date = datetime.strptime(
            date_value,
            "%Y-%m-%d"
        ).date()

        if appointment_date.isoformat() != date_value:
            raise ValueError("Invalid date format")

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Provide a valid date in YYYY-MM-DD format."
        }), 400

    now_local = datetime.now(business_timezone)

    # Reject dates in the past.
    if appointment_date < now_local.date():
        return jsonify({
            "success": False,
            "message": "Appointment dates cannot be in the past."
        }), 400

    # Retrieve an active service from an available provider.
    service = (
        Service.query
        .join(Provider)
        .filter(
            Service.id == service_id,
            Service.is_active.is_(True),
            Provider.is_available.is_(True)
        )
        .first()
    )

    if not service:
        return jsonify({
            "success": False,
            "message": "Service is unavailable or does not exist."
        }), 404

    provider = service.provider

    if service.duration_minutes <= 0:
        return jsonify({
            "success": False,
            "message": "This service has an invalid duration."
        }), 400

    # Retrieve the provider's weekly schedule.
    business_hours = ProviderBusinessHours.query.filter_by(
        provider_id=provider.id
    ).all()

    # Prepare common response information.
    result = {
        "success": True,
        "service_id": service.id,
        "provider_id": provider.id,
        "date": appointment_date.isoformat(),
        "timezone": "Africa/Nairobi",
        "duration_minutes": service.duration_minutes,
        "slot_interval_minutes": slot_interval,
        "is_configured": len(business_hours) == 7,
        "is_closed": None,
        "opening_time": None,
        "closing_time": None,
        "available_slots": []
    }

    # Preserve compatibility with unconfigured providers.
    if not business_hours:
        result["message"] = (
            "This provider has not configured business hours."
        )

        return jsonify(result), 200

    # Find the schedule for the requested weekday.
    day_of_week = appointment_date.weekday()

    day_hours = next(
        (
            hours for hours in business_hours
            if hours.day_of_week == day_of_week
        ),
        None
    )

    # Return an empty schedule for closed days.
    if not day_hours or day_hours.is_closed:
        result["is_closed"] = True
        result["message"] = (
            "This provider is closed on the selected day."
        )

        return jsonify(result), 200

    result["is_closed"] = False

    result["opening_time"] = (
        day_hours.opening_time.strftime("%H:%M")
    )

    result["closing_time"] = (
        day_hours.closing_time.strftime("%H:%M")
    )

    # Combine the appointment date with local working hours.
    opening_datetime = datetime.combine(
        appointment_date,
        day_hours.opening_time,
        tzinfo=business_timezone
    )

    closing_datetime = datetime.combine(
        appointment_date,
        day_hours.closing_time,
        tzinfo=business_timezone
    )

    # Convert business hours to UTC for database queries.
    opening_utc = opening_datetime.astimezone(
        timezone.utc
    ).replace(tzinfo=None)

    closing_utc = closing_datetime.astimezone(
        timezone.utc
    ).replace(tzinfo=None)

    # Retrieve all blocking bookings during business hours.
    existing_bookings = Booking.query.filter(
        Booking.provider_id == provider.id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.start_at < closing_utc,
        Booking.end_at > opening_utc
    ).all()

    service_duration = timedelta(
        minutes=service.duration_minutes
    )

    interval = timedelta(minutes=slot_interval)

    available_slots = []

    current_slot = opening_datetime

    # Generate appointment slots within business hours.
    while current_slot + service_duration <= closing_datetime:

        slot_end = current_slot + service_duration

        # Only consider future appointment times.
        if current_slot > now_local:

            slot_start_utc = current_slot.astimezone(
                timezone.utc
            ).replace(tzinfo=None)

            slot_end_utc = slot_end.astimezone(
                timezone.utc
            ).replace(tzinfo=None)

            # Check whether this slot overlaps any booking.
            has_overlap = any(
                booking.start_at < slot_end_utc
                and booking.end_at > slot_start_utc
                for booking in existing_bookings
            )

            if not has_overlap:
                available_slots.append({
                    "start_time": current_slot.strftime("%H:%M"),
                    "end_time": slot_end.strftime("%H:%M"),
                    "start_at": current_slot.isoformat(),
                    "end_at": slot_end.isoformat()
                })

        # Move to the next candidate starting time.
        current_slot += interval

    result["available_slots"] = available_slots

    result["message"] = (
        "Available appointment slots retrieved successfully."
        if available_slots
        else "No appointment slots are available on this date."
    )

    return jsonify(result), 200



# --------------------------------------------------
# PUBLIC MARKETPLACE SERIALIZATION
# --------------------------------------------------

def serialize_public_provider(provider):
    return {
        "id": provider.id,
        "business_name": provider.business_name,
        "category": provider.category,
        "location": provider.location,
        "is_verified": provider.is_verified
    }


def serialize_public_service(service):
    return {
        "id": service.id,
        "name": service.name,
        "description": service.description,
        "price": str(service.price),
        "duration_minutes": service.duration_minutes,
        "provider": serialize_public_provider(service.provider)
    }


# --------------------------------------------------
# GET AN INDIVIDUAL PUBLIC SERVICE
# --------------------------------------------------

@services_bp.route("/<int:service_id>", methods=["GET"])
def get_public_service(service_id):

    service = (
        Service.query
        .join(Provider)
        .filter(
            Service.id == service_id,
            Service.is_active.is_(True),
            Provider.is_available.is_(True)
        )
        .first()
    )

    if service is None:
        return jsonify({
            "success": False,
            "message": "Service is unavailable or does not exist."
        }), 404

    return jsonify({
        "success": True,
        "service": serialize_public_service(service)
    }), 200


# --------------------------------------------------
# GET A PUBLIC PROVIDER PROFILE
# --------------------------------------------------

@services_bp.route(
    "/providers/<int:provider_id>",
    methods=["GET"]
)
def get_public_provider(provider_id):

    provider = Provider.query.filter_by(
        id=provider_id,
        is_available=True
    ).first()

    if provider is None:
        return jsonify({
            "success": False,
            "message": "Business is unavailable or does not exist."
        }), 404

    services = (
        Service.query
        .filter_by(
            provider_id=provider.id,
            is_active=True
        )
        .order_by(Service.name.asc(), Service.id.asc())
        .all()
    )

    hours = (
        ProviderBusinessHours.query
        .filter_by(provider_id=provider.id)
        .order_by(ProviderBusinessHours.day_of_week.asc())
        .all()
    )

    profile = serialize_public_provider(provider)

    profile.update({
        "description": provider.description,
        "timezone": "Africa/Nairobi",
        "total_services": len(services)
    })

    business_hours = [
        {
            "day_of_week": row.day_of_week,
            "is_closed": row.is_closed,
            "opening_time": (
                row.opening_time.strftime("%H:%M")
                if row.opening_time and not row.is_closed
                else None
            ),
            "closing_time": (
                row.closing_time.strftime("%H:%M")
                if row.closing_time and not row.is_closed
                else None
            )
        }
        for row in hours
    ]

    return jsonify({
        "success": True,
        "provider": profile,
        "services": [
            serialize_public_service(service)
            for service in services
        ],
        "business_hours": business_hours
    }), 200
