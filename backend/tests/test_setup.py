
def test_health_endpoint(client):

    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.get_json()["success"] is True


def test_customer_authentication(
    client,
    customer,
    customer_headers
):

    response = client.get(
        "/api/auth/me",
        headers=customer_headers
    )

    assert response.status_code == 200

    user = response.get_json()["user"]

    assert user["id"] == customer["id"]
    assert user["role"] == "customer"
    assert user["avatar_url"] is None


def test_provider_authentication(
    client,
    provider,
    provider_headers
):

    response = client.get(
        "/api/auth/me",
        headers=provider_headers
    )

    assert response.status_code == 200

    user = response.get_json()["user"]

    assert user["id"] == provider["id"]
    assert user["role"] == "provider"
    assert user["avatar_url"] is None


def test_unauthenticated_profile_access(client):

    response = client.get("/api/auth/me")

    assert response.status_code == 401
