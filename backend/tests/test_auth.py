def test_register_and_login_happy_path(client):
    register_payload = {
        "email": "alice@example.com",
        "password": "securePass1",
        "name": "Alice Example",
    }
    register_response = client.post("/auth/register", json=register_payload)
    assert register_response.status_code == 201
    body = register_response.json()
    assert body["email"] == "alice@example.com"
    assert body["name"] == "Alice Example"
    assert "id" in body
    assert "hashed_password" not in body
    assert "password" not in body

    login_response = client.post(
        "/auth/login",
        json={"email": "alice@example.com", "password": "securePass1"},
    )
    assert login_response.status_code == 200
    token_body = login_response.json()
    assert token_body["token_type"] == "bearer"
    assert token_body["access_token"]

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token_body['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "alice@example.com"


def test_register_duplicate_email_returns_409(client):
    payload = {
        "email": "dup@example.com",
        "password": "securePass1",
        "name": "Dup User",
    }
    assert client.post("/auth/register", json=payload).status_code == 201
    duplicate = client.post("/auth/register", json=payload)
    assert duplicate.status_code == 409
    assert "already exists" in duplicate.json()["detail"].lower()


def test_register_weak_password_rejected(client):
    response = client.post(
        "/auth/register",
        json={"email": "weak@example.com", "password": "short", "name": "Weak User"},
    )
    assert response.status_code == 422


def test_login_wrong_password_returns_401(client):
    client.post(
        "/auth/register",
        json={
            "email": "bob@example.com",
            "password": "securePass1",
            "name": "Bob Example",
        },
    )
    response = client.post(
        "/auth/login",
        json={"email": "bob@example.com", "password": "wrongPassword1"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
