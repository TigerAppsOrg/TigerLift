"""
Tests for posting a ride: /api/addride returns the new ride's id, rejects
invalid input without creating a ride, and both posted and requested rides
show up under the user's /api/myrides.
"""

from datetime import datetime, timedelta, timezone


def place(name):
    return {
        "formatted_address": "1 Main St, Princeton, NJ 08540, USA",
        "name": name,
        "place_id": "place-" + name,
    }


def ride_body(**overrides):
    body = {
        "capacity": 3,
        "origin": place("Frist"),
        "destination": place("PHL"),
        "arrival_time": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "note": "Meet at the front steps",
        "phone_number": "(609) 555-1234",
    }
    body.update(overrides)
    return body


def test_addride_returns_new_ride_id(api):
    response = api.as_user("poster").post("/api/addride", json=ride_body())

    assert response.status_code == 200
    data = response.get_json()
    assert data["success"] is True
    assert isinstance(data["ride_id"], int)

    my_rides = api.as_user("poster").get("/api/myrides").get_json()
    posted_ids = [ride["id"] for ride in my_rides["upcoming_posted_rides"]]
    assert data["ride_id"] in posted_ids


def test_addride_rejects_invalid_phone(api):
    response = api.as_user("poster").post(
        "/api/addride", json=ride_body(phone_number="123")
    )

    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert "ride_id" not in data

    my_rides = api.as_user("poster").get("/api/myrides").get_json()
    assert my_rides["upcoming_posted_rides"] == []


def test_requested_ride_shows_under_my_rides(api, ride_id):
    api.as_user("rider").post(
        "/api/requestride",
        json={
            "rideid": ride_id,
            "origin_name": "Frist",
            "destination_name": "EWR",
            "formatted_arrival_time": "soon",
            "note": "",
        },
    )

    my_rides = api.as_user("rider").get("/api/myrides").get_json()
    requested = [
        ride for ride in my_rides["upcoming_requested_rides"] if ride["id"] == ride_id
    ]
    assert len(requested) == 1
    assert requested[0]["request_status"] == "pending"
