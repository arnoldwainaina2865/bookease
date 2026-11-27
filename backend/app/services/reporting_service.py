import csv
from io import StringIO

from app.services.analytics_service import (
    build_provider_analytics,
    fetch_bookings,
    local_datetime,
    money,
)


REPORT_TYPES = (
    "business",
    "services",
    "appointments",
    "customers",
)


def safe_csv_value(value):
    """Prevent spreadsheet formula injection in text cells."""

    if value is None:
        return ""

    if not isinstance(value, str):
        return value

    stripped = value.lstrip()

    if (
        stripped.startswith(("=", "+", "-", "@"))
        or value.startswith(("\t", "\r", "\n"))
    ):
        return "'" + value

    return value


def generate_csv(headers, rows):
    """Generate an Excel-compatible UTF-8 CSV document."""

    output = StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow(headers)

    for row in rows:
        writer.writerow([
            safe_csv_value(value)
            for value in row
        ])

    return "\ufeff" + output.getvalue()


def business_report(analytics):
    overview = analytics["overview"]
    previous = analytics["previous_overview"]

    metrics = [
        ("Total appointments", "total_bookings"),
        ("Completed appointments", "completed_bookings"),
        ("Pending appointments", "pending_bookings"),
        ("Confirmed appointments", "confirmed_bookings"),
        ("Cancelled appointments", "cancelled_bookings"),
        ("Rejected appointments", "rejected_bookings"),
        ("Completed booking value (KES)", "completed_booking_value"),
        ("Average booking value (KES)", "average_booking_value"),
        ("Unique customers", "unique_customers"),
        ("Completion rate (%)", "completion_rate"),
        ("Cancellation rate (%)", "cancellation_rate"),
    ]

    return generate_csv(
        ["Metric", "Current period", "Previous period"],
        [
            (label, overview[key], previous[key])
            for label, key in metrics
        ]
    )


def services_report(analytics):
    return generate_csv(
        [
            "Service ID",
            "Service",
            "Appointments",
            "Completed appointments",
            "Completion rate (%)",
            "Completed booking value (KES)",
        ],
        [
            (
                row["service_id"],
                row["name"],
                row["bookings"],
                row["completed"],
                row["completion_rate"],
                row["revenue"],
            )
            for row in analytics["services"]
        ]
    )


def appointments_report(provider_id, start, end):
    bookings = fetch_bookings(provider_id, start, end)

    return generate_csv(
        [
            "Booking ID",
            "Customer ID",
            "Service",
            "Appointment date (EAT)",
            "Appointment time (EAT)",
            "Status",
            "Booking value (KES)",
            "Completed booking value (KES)",
        ],
        [
            (
                row.id,
                row.customer_id,
                row.service_name or "Unavailable service",
                local_datetime(row.start_at).strftime("%Y-%m-%d"),
                local_datetime(row.start_at).strftime("%H:%M"),
                row.status,
                money(row.total_price),
                money(
                    row.total_price
                    if row.status == "completed"
                    else 0
                ),
            )
            for row in bookings
        ]
    )


def customers_report(analytics):
    customers = analytics["customers"]

    return generate_csv(
        ["Metric", "Value"],
        [
            ("Unique customers", customers["unique_customers"]),
            ("Completed customers", customers["completed_customers"]),
            ("New customers", customers["new_customers"]),
            ("Returning customers", customers["returning_customers"]),
            (
                "Returning customer rate (%)",
                customers["returning_customer_rate"]
            ),
        ]
    )


def build_provider_report(provider_id, report_type, start, end):
    if report_type not in REPORT_TYPES:
        raise ValueError("Invalid report type.")

    if report_type == "appointments":
        return appointments_report(provider_id, start, end)

    analytics = build_provider_analytics(
        provider_id,
        start,
        end
    )

    generators = {
        "business": business_report,
        "services": services_report,
        "customers": customers_report,
    }

    return generators[report_type](analytics)
