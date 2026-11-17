
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import (
    User,
    Service,
    Booking,
    ProviderBusinessHours,
    record_booking_activity
)
from app.middleware.roles import roles_required


customer_bp = Blueprint(
    "customer",
    __name__,
    url_prefix="/api/customer"
)


# ============================================================
# 1. GET CUSTOMER PROFILE
# ============================================================

@customer_bp.route("/profile", methods=["GET"])
@roles_required("customer")
def get_customer_profile():

    user_id = get_jwt_identity()
    customer = db.session.get(User, int(user_id))

    if not customer:
        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    return jsonify({
        "success": True,
        "message": "Customer profile retrieved successfully.",
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone": customer.phone,
            "role": customer.role,
            "created_at": customer.created_at.isoformat()
        }
    }), 200


# ============================================================
# 2. UPDATE CUSTOMER PROFILE
# ============================================================

@customer_bp.route("/profile", methods=["PUT"])
@roles_required("customer")
def update_customer_profile():

    user_id = get_jwt_identity()
    customer = db.session.get(User, int(user_id))

    if not customer:
        return jsonify({
            "success": False,
            "message": "Customer not found."
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    full_name = data.get("full_name")
    phone = data.get("phone")

    # Validate full name
    if full_name is not None:

        if not isinstance(full_name, str) or not full_name.strip():
            return jsonify({
                "success": False,
                "message": "Full name must be a valid, non-empty string."
            }), 400

        if len(full_name.strip()) > 120:
            return jsonify({
                "success": False,
                "message": "Full name cannot exceed 120 characters."
            }), 400

    # Validate phone number
    if phone is not None:

        if not isinstance(phone, str):
            return jsonify({
                "success": False,
                "message": "Phone number must be a string."
            }), 400

        phone = phone.strip()

        if phone and len(phone) > 20:
            return jsonify({
                "success": False,
                "message": "Phone number cannot exceed 20 characters."
            }), 400

        if phone:
            existing_user = User.query.filter(
                User.phone == phone,
                User.id != customer.id
            ).first()

            if existing_user:
                return jsonify({
                    "success": False,
                    "message": "This phone number is already registered."
                }), 409

    # Update customer details
    if full_name is not None:
        customer.full_name = full_name.strip()

    if phone is not None:
        customer.phone = phone or None

    try:
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "An error occurred while updating your profile."
        }), 500

    return jsonify({
        "success": True,
        "message": "Customer profile updated successfully.",
        "customer": {
            "id": customer.id,
            "full_name": customer.full_name,
            "email": customer.email,
            "phone": customer.phone,
            "role": customer.role,
            "created_at": customer.created_at.isoformat()
        }
    }), 200


# ============================================================
# 3. CREATE CUSTOMER BOOKING
# ============================================================

@customer_bp.route("/bookings", methods=["POST"])
@roles_required("customer")
def create_booking():

    # Identify the authenticated customer
    user_id = get_jwt_identity()
    customer = db.session.get(User, int(user_id))

    if not customer:
        return jsonify({
            "success": False,
            "message": "Customer account not found."
        }), 404

    # Read request data
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "message": "A valid JSON request body is required."
        }), 400

    service_id = data.get("service_id")
    start_at = data.get("start_at")
    customer_notes = data.get("customer_notes")

    # Validate service ID
    try:
        service_id = int(service_id)

        if service_id <= 0:
            raise ValueError

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "A valid service_id is required."
        }), 400

    # Validate appointment date and time
    if not isinstance(start_at, str) or not start_at.strip():
        return jsonify({
            "success": False,
            "message": "Appointment start date and time are required."
        }), 400

    try:
        appointment_start = datetime.fromisoformat(
            start_at.replace("Z", "+00:00")
        )

        # Require an explicit timezone
        if appointment_start.tzinfo is None:
            raise ValueError

        # Convert appointment time to UTC
        appointment_start = appointment_start.astimezone(
            timezone.utc
        ).replace(tzinfo=None)

    except ValueError:
        return jsonify({
            "success": False,
            "message": "Provide a valid ISO 8601 date and time with a timezone."
        }), 400

    # Validate customer notes
    if customer_notes is not None:

        if not isinstance(customer_notes, str):
            return jsonify({
                "success": False,
                "message": "Customer notes must be a string."
            }), 400

        customer_notes = customer_notes.strip()

        if len(customer_notes) > 1000:
            return jsonify({
                "success": False,
                "message": "Customer notes cannot exceed 1000 characters."
            }), 400

    # Ensure appointment is in the future
    current_time = datetime.now(timezone.utc).replace(tzinfo=None)

    if appointment_start <= current_time:
        return jsonify({
            "success": False,
            "message": "Appointment must be scheduled for a future date and time."
        }), 400

    # Retrieve selected service
    service = db.session.get(Service, service_id)

    if not service or not service.is_active:
        return jsonify({
            "success": False,
            "message": "The selected service does not exist or is unavailable."
        }), 404

    # Retrieve service provider
    provider = service.provider

    if not provider or not provider.is_available:
        return jsonify({
            "success": False,
            "message": "This service provider is currently unavailable."
        }), 400

    # Calculate appointment end time
    appointment_end = appointment_start + timedelta(
        minutes=service.duration_minutes
    )


    # Validate appointment against provider business hours
    business_hours = ProviderBusinessHours.query.filter_by(
        provider_id=provider.id
    ).all()

    if business_hours:

        # Convert stored UTC appointment times to East Africa Time
        business_timezone = ZoneInfo("Africa/Nairobi")

        local_start = appointment_start.replace(
            tzinfo=timezone.utc
        ).astimezone(business_timezone)

        local_end = appointment_end.replace(
            tzinfo=timezone.utc
        ).astimezone(business_timezone)

        # Identify the requested day of the week
        day_of_week = local_start.weekday()

        weekly_schedule = {
            hours.day_of_week: hours
            for hours in business_hours
        }

        day_hours = weekly_schedule.get(day_of_week)

        # Reject appointments on closed days
        if not day_hours or day_hours.is_closed:
            return jsonify({
                "success": False,
                "message": "This provider is closed on the selected day."
            }), 400

        # Construct opening and closing datetime values
        opening_datetime = datetime.combine(
            local_start.date(),
            day_hours.opening_time,
            tzinfo=business_timezone
        )

        closing_datetime = datetime.combine(
            local_start.date(),
            day_hours.closing_time,
            tzinfo=business_timezone
        )

        # Ensure the entire appointment fits within business hours
        if (
            local_start < opening_datetime
            or local_end > closing_datetime
        ):
            return jsonify({
                "success": False,
                "message": (
                    "Your appointment must fit within the provider's "
                    f"business hours of "
                    f"{day_hours.opening_time.strftime('%H:%M')} - "
                    f"{day_hours.closing_time.strftime('%H:%M')} EAT."
                )
            }), 400


    # Check for overlapping bookings
    overlapping_booking = Booking.query.filter(
        Booking.provider_id == provider.id,
        Booking.status.in_(["pending", "confirmed"]),
        Booking.start_at < appointment_end,
        Booking.end_at > appointment_start
    ).first()

    if overlapping_booking:
        return jsonify({
            "success": False,
            "message": "This provider already has a booking during the selected time."
        }), 409

    # Create new booking
    booking = Booking(
        customer_id=customer.id,
        provider_id=provider.id,
        service_id=service.id,
        start_at=appointment_start,
        end_at=appointment_end,
        status="pending",
        total_price=service.price,
        customer_notes=customer_notes
    )

    
    try:
        # Save the booking first to generate its database ID.
        db.session.add(booking)
        db.session.flush()

        # Record the booking creation event.
        record_booking_activity(
            booking=booking,
            action="created",
            actor_user_id=customer.id,
            description=(
                f"{customer.full_name} created a booking "
                f"for {service.name}."
            )
        )

        # Save the booking and activity together.
        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "An error occurred while creating your booking."
        }), 500


    # Return successful booking response
    return jsonify({
        "success": True,
        "message": "Booking created successfully.",
        "booking": {
            "id": booking.id,
            "service": service.name,
            "provider": provider.business_name,
            "start_at": appointment_start.isoformat() + "Z",
            "end_at": appointment_end.isoformat() + "Z",
            "status": booking.status,
            "total_price": str(booking.total_price),
            "customer_notes": booking.customer_notes
        }
    }), 201
@customer_bp.route("/bookings", methods=["GET"])
@roles_required("customer")
def get_customer_bookings():

    # Get the logged-in customer's ID from the JWT
    customer_id = int(get_jwt_identity())

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

    # Start with bookings belonging to the logged-in customer
    bookings_query = Booking.query.filter_by(
        customer_id=customer_id
    )

    # Apply an optional status filter
    status = request.args.get("status", "").strip().lower()

    allowed_statuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "rejected"
    ]

    if status:
        if status not in allowed_statuses:
            return jsonify({
                "success": False,
                "message": "Invalid booking status."
            }), 400

        bookings_query = bookings_query.filter_by(
            status=status
        )

    # Apply pagination after filtering
    pagination = (
        bookings_query
        .order_by(Booking.start_at.desc())
        .paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    )

    bookings = []

    # Format each booking for the API response
    for booking in pagination.items:

        start_at = booking.start_at
        end_at = booking.end_at

        # SQLite stores our UTC datetimes without timezone information.
        # Add Z to identify these timestamps as UTC.
        if start_at.tzinfo is None:
            start_at = start_at.isoformat() + "Z"
        else:
            start_at = start_at.astimezone(timezone.utc).isoformat().replace(
                "+00:00", "Z"
            )

        if end_at.tzinfo is None:
            end_at = end_at.isoformat() + "Z"
        else:
            end_at = end_at.astimezone(timezone.utc).isoformat().replace(
                "+00:00", "Z"
            )

        bookings.append({
            "id": booking.id,
            "service": booking.service.name,
            "provider": booking.provider.business_name,
            "start_at": start_at,
            "end_at": end_at,
            "status": booking.status,
            "total_price": str(booking.total_price),
            "customer_notes": booking.customer_notes
        })

    return jsonify({
        "success": True,
        "message": "Customer bookings retrieved successfully.",
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

@customer_bp.route("/bookings/<int:booking_id>/cancel", methods=["PATCH"])
@roles_required("customer")
def cancel_customer_booking(booking_id):

    # Get the authenticated customer's ID
    customer_id = int(get_jwt_identity())

    # Find the requested booking
    booking = db.session.get(Booking, booking_id)

    # Check whether the booking exists
    if not booking:
        return jsonify({
            "success": False,
            "message": "Booking not found."
        }), 404

    # Ensure the booking belongs to the logged-in customer
    if booking.customer_id != customer_id:
        return jsonify({
            "success": False,
            "message": "You are not authorized to cancel this booking."
        }), 403

    # Only pending and confirmed bookings can be cancelled
    if booking.status not in ["pending", "confirmed"]:
        return jsonify({
            "success": False,
            "message": f"Bookings with status '{booking.status}' cannot be cancelled."
        }), 400

    
    # Prevent cancellation within 24 hours of the appointment.
    now = datetime.now(timezone.utc)

    # Booking times are stored in UTC.
    appointment_start = booking.start_at

    # SQLite may return a naive datetime even when UTC is intended.
    if appointment_start.tzinfo is None:
        appointment_start = appointment_start.replace(tzinfo=timezone.utc)
    else:
        appointment_start = appointment_start.astimezone(timezone.utc)

    cancellation_deadline = appointment_start - timedelta(hours=24)

    if now >= cancellation_deadline:
        return jsonify({
            "success": False,
            "message": (
                "This booking cannot be cancelled within "
                "24 hours of the appointment."
            )
        }), 400


    # Update the booking status
    booking.status = "cancelled"

    try:
        record_booking_activity(
            booking=booking,
            action="cancelled",
            actor_user_id=customer_id,
            description="Booking was cancelled by the customer."
        )

        db.session.commit()

    except Exception:
        db.session.rollback()

        return jsonify({
            "success": False,
            "message": "Unable to cancel booking. Please try again."
        }), 500


    return jsonify({
        "success": True,
        "message": "Booking cancelled successfully.",
        "booking": {
            "id": booking.id,
            "service": booking.service.name,
            "provider": booking.provider.business_name,
            "start_at": booking.start_at.isoformat() + "Z",
            "end_at": booking.end_at.isoformat() + "Z",
            "status": booking.status,
            "total_price": str(booking.total_price)
        }
    }), 200