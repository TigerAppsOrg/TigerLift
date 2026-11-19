"""
Tests for a ride's optional departure window ("leave between 4:00 and
5:30PM"), set when creating a ride.
"""

from datetime import datetime, timedelta, timezone

import pytest


def iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def create_ride(api, **extra):
    place = lambda name: {
        "formatted_address": "1 Main St, Princeton, NJ 08540, USA",
        "name": name,
        "place_id": "place-" + name,
    }
    return api.as_user("poster").post(
        "/api/addride",
        json={
            "capacity": 2,
            "origin": place("Frist"),
            "destination": place("EWR"),
            "note": "",
            "phone_number": "6095551234",
            **extra,
        },
    )


@pytest.fixture
def arrival():
    return (datetime.now(timezone.utc) + timedelta(days=3)).replace(
        microsecond=0
    )


def test_ride_with_departure_window_is_returned(api, arrival):
    start, end = arrival - timedelta(hours=2), arrival - timedelta(hours=1)

    response = create_ride(
        api,
        arrival_time=iso(arrival),
        departure_start=iso(start),
        departure_end=iso(end),
    )

    assert response.get_json()["success"]
    for netid, path, key in [
        ("rider", "/api/dashboard", "rides"),
        ("poster", "/api/myrides", "upcoming_posted_rides"),
    ]:
        ride = api.as_user(netid).get(path).get_json()[key][0]
        assert parse(ride["departure_start"]) == start
        assert parse(ride["departure_end"]) == end


def test_ride_without_departure_window_still_works(api, arrival):
    response = create_ride(api, arrival_time=iso(arrival))

    assert response.get_json()["success"]
    ride = api.as_user("rider").get("/api/dashboard").get_json()["rides"][0]
    assert ride["departure_start"] is None
    assert ride["departure_end"] is None


@pytest.mark.parametrize(
    "start_offset, end_offset, message",
    [
        (-2, None, "both a start and end"),  # only a start
        (-1, -2, "start before it ends"),  # backwards
        (-2, 1, "end by the arrival time"),  # ends after arriving
    ],
)
def test_invalid_departure_window_is_rejected(
    api, arrival, start_offset, end_offset, message
):
    window = {"departure_start": iso(arrival + timedelta(hours=start_offset))}
    if end_offset is not None:
        window["departure_end"] = iso(arrival + timedelta(hours=end_offset))

    response = create_ride(api, arrival_time=iso(arrival), **window)

    assert response.status_code == 400
    assert message in response.get_json()["message"]
    assert api.as_user("rider").get("/api/dashboard").get_json()["rides"] == []


def test_past_departure_window_is_rejected(api):
    now = datetime.now(timezone.utc)
    response = create_ride(
        api,
        arrival_time=iso(now + timedelta(hours=1)),
        departure_start=iso(now - timedelta(hours=2)),
        departure_end=iso(now - timedelta(hours=1)),
    )

    assert response.status_code == 400
    assert "past" in response.get_json()["message"]


def parse(http_date):
    """Flask returns datetimes as RFC 1123 strings in UTC."""
    return datetime.strptime(http_date, "%a, %d %b %Y %H:%M:%S %Z").replace(
        tzinfo=timezone.utc
    )
