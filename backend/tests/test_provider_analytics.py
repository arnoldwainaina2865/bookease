from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app.extensions import db
from app.models import Booking, Provider, Service, User


URL = "/api/provider/analytics"

CUSTOM_PERIOD = (
    "?period=custom"
    "&start_date=2026-11-01"
    "&end_date=2026-11-07"
)




def get_analytics(client, headers, query=CUSTOM_PERIOD):
    response = client.get(
        URL + query,
        headers=headers
    )

    assert response.status_code == 200
    assert response.get_json()["success"] is True

    return response.get_json()["analytics"]


def test_analytics_requires_authentication(client):
    assert client.get(URL).status_code == 401


def test_customer_cannot_access_analytics(
    client, customer_headers
):
    response = client.get(
        URL,
        headers=customer_headers
    )

    assert response.status_code == 403


def test_overview(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)
    overview = data["overview"]

    assert overview["total_bookings"] == 5
    assert overview["completed_bookings"] == 2
    assert overview["confirmed_bookings"] == 1
    assert overview["cancelled_bookings"] == 1
    assert overview["pending_bookings"] == 1
    assert overview["rejected_bookings"] == 0
    assert overview["unique_customers"] == 2


def test_financial_metrics_use_historical_prices(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)
    overview = data["overview"]

    assert overview["completed_booking_value"] == "1200.00"
    assert overview["average_booking_value"] == "600.00"


def test_completion_and_cancellation_rates(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)

    assert data["overview"]["completion_rate"] == 40.0
    assert data["overview"]["cancellation_rate"] == 20.0


def test_previous_period_comparison(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)

    assert data["period"]["previous_start_date"] == "2026-10-25"
    assert data["period"]["previous_end_date"] == "2026-10-31"

    assert data["previous_overview"]["total_bookings"] == 1

    comparison = data["comparison"]

    assert comparison["completed_booking_value"] == 200.0
    assert comparison["total_bookings"] == 400.0
    assert comparison["completion_rate_change"] == -60.0


def test_daily_trends_and_timezone_boundaries(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)
    trends = data["trends"]

    assert len(trends) == 7

    assert trends[0]["date"] == "2026-11-01"
    assert trends[0]["bookings"] == 1
    assert trends[0]["revenue"] == "500.00"

    assert trends[1]["revenue"] == "700.00"

    assert trends[-1]["date"] == "2026-11-07"
    assert trends[-1]["bookings"] == 1
    assert trends[-1]["revenue"] == "0.00"

    assert sum(row["bookings"] for row in trends) == 5


def test_booking_distribution(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)

    distribution = {
        row["status"]: row["count"]
        for row in data["booking_distribution"]
    }

    assert distribution == {
        "pending": 1,
        "confirmed": 1,
        "completed": 2,
        "cancelled": 1,
        "rejected": 0
    }


def test_service_performance(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)

    assert len(data["services"]) == 1

    service = data["services"][0]

    assert service["service_id"] == analytics_data["service_id"]
    assert service["bookings"] == 5
    assert service["completed"] == 2
    assert service["revenue"] == "1200.00"
    assert service["completion_rate"] == 40.0


def test_customer_insights(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)
    customers = data["customers"]

    assert customers["unique_customers"] == 2
    assert customers["completed_customers"] == 2
    assert customers["new_customers"] == 1
    assert customers["returning_customers"] == 1
    assert customers["returning_customer_rate"] == 50.0


def test_operational_analytics(
    client, provider_headers, analytics_data
):
    data = get_analytics(client, provider_headers)
    operations = data["operations"]

    assert len(operations["hourly"]) == 24
    assert len(operations["weekdays"]) == 7
    assert len(operations["heatmap"]) == 168

    assert operations["peak_hour"] == 11
    assert operations["hourly"][11]["bookings"] == 2

    assert sum(
        cell["bookings"]
        for cell in operations["heatmap"]
    ) == 4


def test_provider_isolation(
    client, provider_headers, analytics_data
):
    query = (
        CUSTOM_PERIOD
        + f"&provider_id={analytics_data['other_provider_id']}"
    )

    data = get_analytics(
        client, provider_headers, query
    )

    assert data["overview"]["total_bookings"] == 5
    assert data["overview"]["completed_booking_value"] == "1200.00"

    assert all(
        row["name"] != "Private Other Service"
        for row in data["services"]
    )


def test_empty_analytics(
    client, provider_headers
):
    data = get_analytics(client, provider_headers)

    assert data["overview"]["total_bookings"] == 0
    assert data["overview"]["completed_booking_value"] == "0.00"
    assert data["overview"]["average_booking_value"] == "0.00"
    assert data["overview"]["completion_rate"] == 0.0

    assert data["services"] == []
    assert data["operations"]["peak_hour"] is None
    assert data["operations"]["busiest_day"] is None

    assert data["comparison"]["completion_rate_change"] is None
    assert len(data["trends"]) == 7


def test_growth_without_previous_activity(
    client, provider_headers, analytics_data
):
    data = get_analytics(
        client,
        provider_headers,
        "?period=custom"
        "&start_date=2026-10-28"
        "&end_date=2026-10-28"
    )

    assert data["overview"]["total_bookings"] == 1
    assert data["previous_overview"]["total_bookings"] == 0
    assert data["comparison"]["total_bookings"] is None
    assert data["comparison"]["completion_rate_change"] is None


@pytest.mark.parametrize("period", ["7", "30", "90"])
def test_predefined_periods(
    client, provider_headers, period
):
    data = get_analytics(
        client,
        provider_headers,
        f"?period={period}"
    )

    assert data["period"]["days"] == int(period)
    assert len(data["trends"]) == int(period)


@pytest.mark.parametrize("query", [
    "?period=invalid",
    "?period=custom",
    "?period=custom&start_date=invalid&end_date=2026-11-07",
    "?period=custom&start_date=2026-11-07&end_date=2026-11-01",
    "?period=custom&start_date=2024-01-01&end_date=2026-01-01",
    "?period=custom&start_date=0001-01-01&end_date=0001-01-02"
])
def test_invalid_reporting_periods(
    client, provider_headers, query
):
    response = client.get(
        URL + query,
        headers=provider_headers
    )

    assert response.status_code == 400
    assert response.get_json()["success"] is False
