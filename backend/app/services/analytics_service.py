from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from zoneinfo import ZoneInfo

from app.extensions import db
from app.models import Booking, Service


REPORT_TIMEZONE = ZoneInfo("Africa/Nairobi")

STATUSES = (
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "rejected"
)

ZERO = Decimal("0.00")


def money(value):
    return str(Decimal(value).quantize(Decimal("0.01")))


def percentage(numerator, denominator):
    if not denominator:
        return 0.0

    return round(float(numerator / denominator * 100), 2)


def growth(current, previous):
    if not previous:
        return 0.0 if not current else None

    return round(float((current - previous) / previous * 100), 2)


def local_datetime(value):
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.astimezone(REPORT_TIMEZONE)


def utc_boundary(day):
    return datetime.combine(
        day,
        time.min,
        tzinfo=REPORT_TIMEZONE
    ).astimezone(timezone.utc)


def parse_reporting_period(args):
    today = datetime.now(REPORT_TIMEZONE).date()

    period = args.get("period", "30")

    if period == "custom":
        try:
            start = date.fromisoformat(args.get("start_date", ""))
            end = date.fromisoformat(args.get("end_date", ""))
        except (ValueError, TypeError):
            raise ValueError(
                "Valid start and end dates are required."
            )
    elif period in ("7", "30", "90"):
        end = today
        start = end - timedelta(days=int(period) - 1)
    else:
        raise ValueError(
            "Period must be 7, 30, 90 or custom."
        )

    if start > end:
        raise ValueError(
            "Start date must not be after end date."
        )

    days = (end - start).days + 1

    if days > 366:
        raise ValueError(
            "Reporting periods cannot exceed 366 days."
        )

    # Leave room for the equivalent previous period.
    if start.year < 1900 or end.year >= 9999:
        raise ValueError("Reporting dates are out of range.")

    return start, end


def fetch_bookings(provider_id, start, end):
    return (
        db.session.query(
            Booking.id,
            Booking.customer_id,
            Booking.service_id,
            Booking.start_at,
            Booking.status,
            Booking.total_price,
            Service.name.label("service_name")
        )
        .outerjoin(
            Service,
            (Service.id == Booking.service_id)
            & (Service.provider_id == provider_id)
        )
        .filter(
            Booking.provider_id == provider_id,
            Booking.start_at >= utc_boundary(start),
            Booking.start_at < utc_boundary(
                end + timedelta(days=1)
            )
        )
        .order_by(Booking.start_at, Booking.id)
        .all()
    )


def summarize(bookings):
    counts = Counter(row.status for row in bookings)

    completed = [
        row for row in bookings
        if row.status == "completed"
    ]

    revenue = sum(
        (row.total_price for row in completed),
        ZERO
    )

    total = len(bookings)

    customers = {
        row.customer_id for row in bookings
    }

    average = (
        revenue / len(completed)
        if completed else ZERO
    )

    return {
        "total_bookings": total,
        "completed_bookings": counts["completed"],
        "pending_bookings": counts["pending"],
        "confirmed_bookings": counts["confirmed"],
        "cancelled_bookings": counts["cancelled"],
        "rejected_bookings": counts["rejected"],
        "completed_booking_value": money(revenue),
        "average_booking_value": money(average),
        "unique_customers": len(customers),
        "completion_rate": percentage(
            counts["completed"], total
        ),
        "cancellation_rate": percentage(
            counts["cancelled"], total
        )
    }


def daily_trends(bookings, start, end):
    grouped = defaultdict(
        lambda: {
            "bookings": 0,
            "completed": 0,
            "revenue": ZERO
        }
    )

    for row in bookings:
        day = local_datetime(row.start_at).date()
        entry = grouped[day]

        entry["bookings"] += 1

        if row.status == "completed":
            entry["completed"] += 1
            entry["revenue"] += row.total_price

    results = []

    day = start

    while day <= end:
        entry = grouped[day]

        results.append({
            "date": day.isoformat(),
            "bookings": entry["bookings"],
            "completed": entry["completed"],
            "revenue": money(entry["revenue"])
        })

        day += timedelta(days=1)

    return results


def service_performance(bookings):
    grouped = {}

    for row in bookings:
        if row.service_id not in grouped:
            grouped[row.service_id] = {
                "service_id": row.service_id,
                "name": row.service_name or "Unavailable service",
                "bookings": 0,
                "completed": 0,
                "revenue": ZERO
            }

        entry = grouped[row.service_id]

        entry["bookings"] += 1

        if row.status == "completed":
            entry["completed"] += 1
            entry["revenue"] += row.total_price

    ranked = sorted(
        grouped.values(),
        key=lambda item: (
            -item["revenue"],
            -item["bookings"],
            item["service_id"]
        )
    )

    return [
        {
            **item,
            "revenue": money(item["revenue"]),
            "completion_rate": percentage(
                item["completed"],
                item["bookings"]
            )
        }
        for item in ranked
    ]


def customer_performance(provider_id, bookings, start):
    completed_customers = {
        row.customer_id
        for row in bookings
        if row.status == "completed"
    }

    all_customers = {
        row.customer_id for row in bookings
    }

    previous_customers = set()

    if completed_customers:
        previous_customers = {
            row.customer_id
            for row in (
                db.session.query(Booking.customer_id)
                .filter(
                    Booking.provider_id == provider_id,
                    Booking.status == "completed",
                    Booking.start_at < utc_boundary(start)
                )
                .distinct()
                .all()
            )
        }

    returning = completed_customers & previous_customers
    new = completed_customers - previous_customers

    return {
        "unique_customers": len(all_customers),
        "completed_customers": len(completed_customers),
        "new_customers": len(new),
        "returning_customers": len(returning),
        "returning_customer_rate": percentage(
            len(returning),
            len(completed_customers)
        )
    }


def operational_performance(bookings):
    hours = Counter()
    weekdays = Counter()
    heatmap = Counter()

    for row in bookings:
        if row.status not in (
            "pending", "confirmed", "completed"
        ):
            continue

        local = local_datetime(row.start_at)

        hours[local.hour] += 1
        weekdays[local.weekday()] += 1

        heatmap[
            (local.weekday(), local.hour)
        ] += 1

    names = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ]

    return {
        "hourly": [
            {
                "hour": hour,
                "label": f"{hour:02d}:00",
                "bookings": hours[hour]
            }
            for hour in range(24)
        ],
        "weekdays": [
            {
                "day": names[day],
                "bookings": weekdays[day]
            }
            for day in range(7)
        ],
        "heatmap": [
            {
                "day": day,
                "hour": hour,
                "bookings": heatmap[(day, hour)]
            }
            for day in range(7)
            for hour in range(24)
        ],
        "peak_hour": (
            min(hours, key=lambda h: (-hours[h], h))
            if hours else None
        ),
        "busiest_day": (
            names[min(
                weekdays,
                key=lambda d: (-weekdays[d], d)
            )]
            if weekdays else None
        )
    }


def build_provider_analytics(provider_id, start, end):
    days = (end - start).days + 1

    previous_end = start - timedelta(days=1)
    previous_start = start - timedelta(days=days)

    current_rows = fetch_bookings(
        provider_id, start, end
    )

    previous_rows = fetch_bookings(
        provider_id, previous_start, previous_end
    )

    current = summarize(current_rows)
    previous = summarize(previous_rows)

    comparison = {}

    for key in (
        "total_bookings",
        "completed_bookings",
        "unique_customers",
        "completed_booking_value",
        "average_booking_value"
    ):
        comparison[key] = growth(
            Decimal(str(current[key])),
            Decimal(str(previous[key]))
        )

    for metric in ("completion_rate", "cancellation_rate"):
        comparison[f"{metric}_change"] = (
            round(current[metric] - previous[metric], 2)
            if current["total_bookings"]
            and previous["total_bookings"]
            else None
        )

    current_trend = daily_trends(
        current_rows, start, end
    )

    previous_trend = daily_trends(
        previous_rows, previous_start, previous_end
    )

    for current_day, previous_day in zip(
        current_trend, previous_trend
    ):
        current_day["previous_date"] = previous_day["date"]
        current_day["previous_revenue"] = previous_day["revenue"]
        current_day["previous_bookings"] = previous_day["bookings"]

    status_counts = Counter(
        row.status for row in current_rows
    )

    return {
        "period": {
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "days": days,
            "timezone": "Africa/Nairobi",
            "previous_start_date": previous_start.isoformat(),
            "previous_end_date": previous_end.isoformat()
        },
        "overview": current,
        "previous_overview": previous,
        "comparison": comparison,
        "trends": current_trend,
        "booking_distribution": [
            {
                "status": status,
                "count": status_counts[status]
            }
            for status in STATUSES
        ],
        "services": service_performance(current_rows),
        "customers": customer_performance(
            provider_id, current_rows, start
        ),
        "operations": operational_performance(
            current_rows
        )
    }
