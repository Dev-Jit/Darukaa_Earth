import os

import pytest
from app.api.deps import get_db
from app.db.base_class import Base
from app.main import app
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

SQLITE_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def _postgres_test_url() -> str:
    return os.getenv(
        "TEST_DATABASE_URL",
        "postgresql+psycopg2://postgres:postgres@localhost:5433/daruka_earth",
    )


def postgres_available() -> bool:
    try:
        engine = create_engine(_postgres_test_url(), pool_pre_ping=True)
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        engine.dispose()
        return True
    except Exception:
        return False


@pytest.fixture()
def db_session():
    Base.metadata.create_all(bind=SQLITE_ENGINE, tables=[User.__table__])
    session_local = sessionmaker(autocommit=False, autoflush=False, bind=SQLITE_ENGINE)
    session = session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=SQLITE_ENGINE, tables=[User.__table__])


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client):
    payload = {
        "email": "owner@example.com",
        "password": "securePass1",
        "name": "Project Owner",
    }
    client.post("/auth/register", json=payload)
    login = client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def pg_engine():
    if not postgres_available():
        pytest.skip("PostgreSQL + PostGIS required for geospatial API tests")
    engine = create_engine(_postgres_test_url(), pool_pre_ping=True)
    with engine.connect() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        connection.commit()
    Base.metadata.create_all(bind=engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def pg_db_session(pg_engine):
    connection = pg_engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection, autocommit=False, autoflush=False)()
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(session_obj, trans):
        nonlocal nested
        if trans.nested and not trans._parent.nested:
            session_obj.expire_all()
            nested = connection.begin_nested()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def pg_client(pg_db_session):
    def override_get_db():
        try:
            yield pg_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def pg_auth_headers(pg_client):
    payload = {
        "email": "geo-owner@example.com",
        "password": "securePass1",
        "name": "Geo Owner",
    }
    pg_client.post("/auth/register", json=payload)
    login = pg_client.post(
        "/auth/login",
        json={"email": payload["email"], "password": payload["password"]},
    )
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


VALID_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [77.2090, 28.6139],
            [77.2190, 28.6139],
            [77.2190, 28.6239],
            [77.2090, 28.6239],
            [77.2090, 28.6139],
        ]
    ],
}


INVALID_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [77.0, 28.0],
            [77.1, 28.1],
            [77.1, 28.0],
            [77.0, 28.1],
            [77.0, 28.0],
        ]
    ],
}
