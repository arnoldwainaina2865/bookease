from datetime import time
from decimal import Decimal

import pytest

from app.extensions import db
from app.models import (
    Provider,
    Service,
    ProviderBusinessHours
)


@pytest.fixture
def catalogue(app, provider):
    with app.app_context():
        provider_id = provider["provider_id"]

        records = [
            Service(
                provider_id=provider_id,
                name="Basic Haircut",
                price=Decimal("500.00"),
                duration_minutes=30,
                is_active=True
            ),
            Service(
                provider_id=provider_id,
                name="Premium Haircut",
                price=Decimal("1500.00"),
                duration_minutes=60,
                is_active=True
            ),
            Service(
                provider_id=provider_id,
                name="Hidden Service",
                price=Decimal("100.00"),
                duration_minutes=20,
                is_active=False
            )
        ]

        db.session.add_all(records)

        db.session.add(
            ProviderBusinessHours(
                provider_id=provider_id,
                day_of_week=0,
                opening_time=time(9, 0),
                closing_time=time(17, 0),
                is_closed=False
            )
        )

        db.session.commit()

        return {
            "provider_id": provider_id,
            "basic": records[0].id,
            "premium": records[1].id,
            "hidden": records[2].id
        }


def test_public_catalogue(client, catalogue):
    response = client.get("/api/services/")

    assert response.status_code == 200

    data = response.get_json()

    assert data["pagination"]["total_services"] == 2

    ids = {row["id"] for row in data["services"]}

    assert catalogue["hidden"] not in ids


def test_minimum_price(client, catalogue):
    response = client.get(
        "/api/services/?min_price=1000"
    )

    assert response.status_code == 200

    services = response.get_json()["services"]

    assert len(services) == 1
    assert services[0]["id"] == catalogue["premium"]


def test_maximum_price(client, catalogue):
    response = client.get(
        "/api/services/?max_price=500"
    )

    assert response.status_code == 200

    services = response.get_json()["services"]

    assert len(services) == 1
    assert services[0]["id"] == catalogue["basic"]


def test_price_range(client, catalogue):
    response = client.get(
        "/api/services/?min_price=500&max_price=1500"
    )

    assert response.status_code == 200
    assert len(response.get_json()["services"]) == 2


@pytest.mark.parametrize("query", [
    "min_price=-1",
    "max_price=NaN",
    "min_price=Infinity",
    "min_price=abc",
    "min_price=10.123",
    "min_price=1000&max_price=500",
    "sort=invalid"
])
def test_invalid_filters(client, catalogue, query):
    response = client.get(f"/api/services/?{query}")

    assert response.status_code == 400


@pytest.mark.parametrize("sort,expected", [
    ("price_asc", ["basic", "premium"]),
    ("price_desc", ["premium", "basic"])
])
def test_price_sorting(client, catalogue, sort, expected):
    response = client.get(
        f"/api/services/?sort={sort}"
    )

    assert response.status_code == 200

    ids = [
        row["id"]
        for row in response.get_json()["services"]
    ]

    assert ids == [catalogue[key] for key in expected]


def test_filter_before_pagination(client, catalogue):
    response = client.get(
        "/api/services/?min_price=1000&per_page=1"
    )

    data = response.get_json()

    assert response.status_code == 200
    assert data["pagination"]["total_services"] == 1
    assert data["services"][0]["id"] == catalogue["premium"]


def test_individual_service(client, catalogue):
    response = client.get(
        f"/api/services/{catalogue['basic']}"
    )

    assert response.status_code == 200
    assert response.get_json()["service"]["name"] == "Basic Haircut"


def test_inactive_service_hidden(client, catalogue):
    response = client.get(
        f"/api/services/{catalogue['hidden']}"
    )

    assert response.status_code == 404


def test_missing_service(client):
    assert client.get("/api/services/999999").status_code == 404


def test_public_provider_profile(client, catalogue):
    response = client.get(
        f"/api/services/providers/{catalogue['provider_id']}"
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["provider"]["total_services"] == 2
    assert len(data["services"]) == 2
    assert data["business_hours"][0]["opening_time"] == "09:00"
    assert data["business_hours"][0]["closing_time"] == "17:00"

    for field in [
        "user_id",
        "email",
        "password_hash",
        "business_phone",
        "token_version"
    ]:
        assert field not in data["provider"]


def test_unavailable_provider(app, client, catalogue):
    with app.app_context():
        provider = db.session.get(
            Provider,
            catalogue["provider_id"]
        )

        provider.is_available = False
        db.session.commit()

    assert client.get(
        f"/api/services/providers/{catalogue['provider_id']}"
    ).status_code == 404

    assert client.get(
        f"/api/services/{catalogue['basic']}"
    ).status_code == 404

    response = client.get("/api/services/")

    assert response.get_json()["services"] == []


def test_missing_provider(client):
    response = client.get("/api/services/providers/999999")

    assert response.status_code == 404
