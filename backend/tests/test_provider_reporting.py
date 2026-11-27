import csv
from io import StringIO

import pytest

from app.services.reporting_service import (
    safe_csv_value,
    generate_csv,
)



URL = "/api/provider/analytics/export"

PERIOD = (
    "&period=custom"
    "&start_date=2026-11-01"
    "&end_date=2026-11-07"
)


def download_report(client, headers, report):
    response = client.get(
        f"{URL}?report={report}{PERIOD}",
        headers=headers
    )

    assert response.status_code == 200
    assert response.mimetype == "text/csv"

    content = response.data.decode("utf-8-sig")

    return response, list(
        csv.DictReader(StringIO(content))
    )


def test_export_requires_authentication(client):
    assert client.get(URL).status_code == 401


def test_customer_cannot_export(
    client, customer_headers
):
    response = client.get(
        URL,
        headers=customer_headers
    )

    assert response.status_code == 403


@pytest.mark.parametrize("report", [
    "business",
    "services",
    "appointments",
    "customers",
])
def test_report_download_headers(
    client, provider_headers, report
):
    response, rows = download_report(
        client, provider_headers, report
    )

    assert "attachment" in response.headers[
        "Content-Disposition"
    ]

    assert (
        f"bookease-{report}-2026-11-01-2026-11-07.csv"
        in response.headers["Content-Disposition"]
    )

    assert response.headers["Cache-Control"] == "private, no-store"
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.data.startswith(b"\xef\xbb\xbf")


def test_business_report_totals(
    client, provider_headers, analytics_data
):
    _, rows = download_report(
        client, provider_headers, "business"
    )

    metrics = {
        row["Metric"]: row
        for row in rows
    }

    assert metrics["Total appointments"]["Current period"] == "5"

    assert (
        metrics["Completed booking value (KES)"]["Current period"]
        == "1200.00"
    )

    assert (
        metrics["Completed booking value (KES)"]["Previous period"]
        == "400.00"
    )


def test_service_report(
    client, provider_headers, analytics_data
):
    _, rows = download_report(
        client, provider_headers, "services"
    )

    assert len(rows) == 1
    assert rows[0]["Service"] == "Analytics Test Service"
    assert rows[0]["Appointments"] == "5"

    assert (
        rows[0]["Completed booking value (KES)"]
        == "1200.00"
    )


def test_appointment_report(
    client, provider_headers, analytics_data
):
    _, rows = download_report(
        client, provider_headers, "appointments"
    )

    assert len(rows) == 5

    assert rows[0]["Appointment date (EAT)"] == "2026-11-01"
    assert rows[0]["Appointment time (EAT)"] == "00:00"

    assert all(
        row["Service"] != "Private Other Service"
        for row in rows
    )

    assert all(
        row["Completed booking value (KES)"] == "0.00"
        for row in rows
        if row["Status"] != "completed"
    )


def test_customer_report(
    client, provider_headers, analytics_data
):
    _, rows = download_report(
        client, provider_headers, "customers"
    )

    metrics = {
        row["Metric"]: row["Value"]
        for row in rows
    }

    assert metrics["Unique customers"] == "2"
    assert metrics["New customers"] == "1"
    assert metrics["Returning customers"] == "1"
    assert metrics["Returning customer rate (%)"] == "50.0"


def test_export_provider_isolation(
    client, provider_headers, analytics_data
):
    response = client.get(
        f"{URL}?report=appointments{PERIOD}"
        f"&provider_id={analytics_data['other_provider_id']}",
        headers=provider_headers
    )

    assert response.status_code == 200

    content = response.data.decode("utf-8-sig")

    assert "Private Other Service" not in content
    assert "9000.00" not in content


def test_empty_appointment_report(
    client, provider_headers
):
    response, rows = download_report(
        client, provider_headers, "appointments"
    )

    assert rows == []
    assert "Booking ID" in response.data.decode("utf-8-sig")


def test_invalid_report_type(
    client, provider_headers
):
    response = client.get(
        URL + "?report=invalid",
        headers=provider_headers
    )

    assert response.status_code == 400


def test_invalid_report_dates(
    client, provider_headers
):
    response = client.get(
        URL + "?report=business&period=custom",
        headers=provider_headers
    )

    assert response.status_code == 400


@pytest.mark.parametrize("value", [
    "=SUM(1,2)",
    "+123",
    "-123",
    "@SUM(1,2)",
    "   =1+1",
    "\tExample",
    "\rExample",
    "\nExample",
])
def test_formula_injection_protection(value):
    assert safe_csv_value(value) == "'" + value


def test_safe_csv_values():
    assert safe_csv_value("Haircut") == "Haircut"
    assert safe_csv_value(500) == 500
    assert safe_csv_value(None) == ""


def test_csv_escaping():
    result = generate_csv(
        ["Service", "Value"],
        [('Haircut, "Premium"', 500)]
    )

    rows = list(csv.reader(
        StringIO(result.lstrip("\ufeff"))
    ))

    assert rows[1] == ['Haircut, "Premium"', "500"]
