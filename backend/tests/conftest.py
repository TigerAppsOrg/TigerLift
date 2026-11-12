import os
import sys
from datetime import datetime, timedelta, timezone

import pytest

# Point the app at a separate test database before it's imported, so tests
# never touch your real data. database.py reads DATABASE_URL at import time,
# and load_dotenv() doesn't override variables that are already set.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql:///tigerlift_test"
)
os.environ["EMAILS_ON"] = "False"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import app as tigerlift  # noqa: E402
import database  # noqa: E402

USERS = {
    "poster": {"netid": "poster", "displayname": "Pat Poster", "mail": "poster@princeton.edu"},
    "rider": {"netid": "rider", "displayname": "Rae Rider", "mail": "rider@princeton.edu"},
    "rider2": {"netid": "rider2", "displayname": "Sam Second", "mail": "rider2@princeton.edu"},
    "rider3": {"netid": "rider3", "displayname": "Tia Third", "mail": "rider3@princeton.edu"},
}


class Session:
    """A Flask test client that acts as one of the fake CAS users."""

    def __init__(self, client):
        self.client = client
        self.netid = None

    def as_user(self, netid):
        self.netid = netid
        return self

    def get(self, *args, **kwargs):
        return self.client.get(*args, **kwargs)

    def post(self, *args, **kwargs):
        return self.client.post(*args, **kwargs)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    database.database_setup()


@pytest.fixture(autouse=True)
def clean_tables():
    conn = database.connect()
    with conn.cursor() as cursor:
        cursor.execute("TRUNCATE Notifications, RideRequests, Rides RESTART IDENTITY CASCADE;")
    conn.commit()
    conn.close()


@pytest.fixture
def api(monkeypatch):
    session = Session(tigerlift.app.test_client())
    monkeypatch.setattr(tigerlift.app, "EMAILS_ON", False)
    monkeypatch.setattr(tigerlift._cas, "authenticate", lambda: USERS[session.netid])
    return session


@pytest.fixture
def ride_id(api):
    """Creates an upcoming ride posted by 'poster' with 2 seats."""
    place = lambda name: {
        "formatted_address": "1 Main St, Princeton, NJ 08540, USA",
        "name": name,
        "place_id": "place-" + name,
    }
    api.as_user("poster").post(
        "/api/addride",
        json={
            "capacity": 2,
            "origin": place("Frist"),
            "destination": place("EWR"),
            "arrival_time": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
            "note": "",
            # required once TIG-287 merges; ignored before that
            "phone_number": "6095551234",
        },
    )
    conn = database.connect()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM Rides ORDER BY id DESC LIMIT 1;")
        rid = cursor.fetchone()[0]
    conn.close()
    return rid
