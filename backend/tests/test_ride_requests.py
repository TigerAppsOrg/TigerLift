"""
Tests for the ride request lifecycle: request, accept, reject, remove,
re-request and cancel, checking what both the rider and poster see and
which notifications each one gets.
"""

RIDER = {"requester_id": "rider", "full_name": "Rae Rider", "mail": "rider@princeton.edu"}
RIDER2 = {"requester_id": "rider2", "full_name": "Sam Second", "mail": "rider2@princeton.edu"}


# --- helpers ---------------------------------------------------------------


def request_ride(api, netid, ride_id, note=""):
    return api.as_user(netid).post(
        "/api/requestride",
        json={
            "rideid": ride_id,
            "origin_name": "Frist",
            "destination_name": "EWR",
            "formatted_arrival_time": "soon",
            "note": note,
        },
    )


def save_manage_modal(api, ride_id, current=(), rejected=(), requests=()):
    """Sends what the poster's Manage Rideshare modal sends on Save."""
    return api.as_user("poster").post(
        "/api/batchupdateriderequest",
        json={
            "rideid": ride_id,
            "accepting_riders": list(current),
            "rejecting_riders": [{"requester_id": r["requester_id"]} for r in rejected],
            "pending_riders": list(requests),
            "new_capacity": None,
            "new_arrival_time": None,
            "formatted_arrival_time": "soon",
            "origin_name": "Frist",
            "destination_name": "EWR",
            "changedTime": False,
        },
    )


def rider_status(api, netid, ride_id):
    """The request status the rider sees on the dashboard and in My Rides."""
    dashboard = api.as_user(netid).get("/api/dashboard").get_json()["ridereqs"]
    my_rides = api.as_user(netid).get("/api/myrides").get_json()
    in_my_rides = [r for r in my_rides["upcoming_requested_rides"] if r["id"] == ride_id]
    dashboard_status = dashboard.get(str(ride_id))
    my_rides_status = in_my_rides[0]["request_status"] if in_my_rides else None
    assert dashboard_status == my_rides_status, "dashboard and My Rides disagree"
    return my_rides_status


def poster_lists(api, ride_id):
    """(current rider netids, pending requester netids) for the poster."""
    rides = api.as_user("poster").get("/api/myrides").get_json()["upcoming_posted_rides"]
    ride = next(r for r in rides if r["id"] == ride_id)
    return (
        [r[0] for r in ride["current_riders"]],
        [r[0] for r in ride["requested_riders"]],
    )


def notification_subjects(api, netid):
    response = api.as_user(netid).get("/api/notifications")
    assert response.status_code == 200
    data = response.get_json()
    return [n[3] for n in data["new_notifs"] + data["past_notifs"]]


# --- bug: removed rider still shows "Accepted" -----------------------------


def test_accept_then_remove_updates_rider_status(api, ride_id):
    request_ride(api, "rider", ride_id)
    save_manage_modal(api, ride_id, current=[RIDER])
    assert rider_status(api, "rider", ride_id) == "accepted"
    assert poster_lists(api, ride_id) == (["rider"], [])

    # Poster clicks X on the accepted rider (moving them back to Requests to
    # Join in the modal) and saves.
    save_manage_modal(api, ride_id, requests=[RIDER])

    assert rider_status(api, "rider", ride_id) == "removed"
    assert poster_lists(api, ride_id) == ([], [])
    assert "🚗 You were removed from a Rideshare" in notification_subjects(api, "rider")


def test_remove_then_reject_before_saving_rejects_rider(api, ride_id):
    request_ride(api, "rider", ride_id)
    save_manage_modal(api, ride_id, current=[RIDER])

    save_manage_modal(api, ride_id, rejected=[RIDER])

    assert rider_status(api, "rider", ride_id) == "rejected"
    assert poster_lists(api, ride_id) == ([], [])
    assert "🚗 Your request to join a Rideshare was declined" in notification_subjects(
        api, "rider"
    )


def test_saving_modal_only_notifies_riders_whose_status_changed(api, ride_id):
    request_ride(api, "rider", ride_id)
    request_ride(api, "rider2", ride_id)

    # rider2 stays in Requests to Join while the poster accepts rider
    save_manage_modal(api, ride_id, current=[RIDER], requests=[RIDER2])

    assert rider_status(api, "rider2", ride_id) == "pending"
    assert notification_subjects(api, "rider2") == []


# --- bug: cancelled request doesn't notify the poster ----------------------


def test_cancel_notifies_poster_and_clears_pending_list(api, ride_id):
    request_ride(api, "rider", ride_id)
    assert poster_lists(api, ride_id) == ([], ["rider"])

    response = api.as_user("rider").post("/api/cancelriderequest", json={"rideid": ride_id})

    assert response.get_json()["success"]
    assert poster_lists(api, ride_id) == ([], [])
    assert rider_status(api, "rider", ride_id) is None
    assert any("canceled their request" in s for s in notification_subjects(api, "poster"))


def test_cannot_cancel_after_being_accepted(api, ride_id):
    request_ride(api, "rider", ride_id)
    save_manage_modal(api, ride_id, current=[RIDER])

    response = api.as_user("rider").post("/api/cancelriderequest", json={"rideid": ride_id})

    assert response.status_code == 400
    assert rider_status(api, "rider", ride_id) == "accepted"


# --- re-requesting ---------------------------------------------------------


def test_removed_rider_can_request_again_with_new_note(api, ride_id):
    request_ride(api, "rider", ride_id, note="first")
    save_manage_modal(api, ride_id, current=[RIDER])
    save_manage_modal(api, ride_id, requests=[RIDER])

    response = request_ride(api, "rider", ride_id, note="second try")

    assert response.get_json()["success"]
    assert rider_status(api, "rider", ride_id) == "pending"
    rides = api.as_user("poster").get("/api/myrides").get_json()["upcoming_posted_rides"]
    assert rides[0]["requested_riders"] == [
        ["rider", "Rae Rider", "rider@princeton.edu", "second try"]
    ]


def test_rejected_rider_cannot_request_again(api, ride_id):
    request_ride(api, "rider", ride_id)
    save_manage_modal(api, ride_id, rejected=[RIDER])

    response = request_ride(api, "rider", ride_id)

    assert response.status_code == 400
    assert rider_status(api, "rider", ride_id) == "rejected"


def test_request_note_too_long_is_rejected(api, ride_id):
    response = request_ride(api, "rider", ride_id, note="x" * 301)

    assert response.status_code == 400
    assert rider_status(api, "rider", ride_id) is None


# --- dashboard Accept/Reject buttons ---------------------------------------


def test_respond_to_request_accept_and_reject(api, ride_id):
    request_ride(api, "rider", ride_id)
    request_ride(api, "rider2", ride_id)

    accept = api.as_user("poster").post(
        "/api/respondtorequest",
        json={"rideid": ride_id, "requester_id": "rider", "action": "accept"},
    )
    reject = api.as_user("poster").post(
        "/api/respondtorequest",
        json={"rideid": ride_id, "requester_id": "rider2", "action": "reject"},
    )

    assert accept.get_json()["success"] and reject.get_json()["success"]
    assert rider_status(api, "rider", ride_id) == "accepted"
    assert rider_status(api, "rider2", ride_id) == "rejected"
    assert poster_lists(api, ride_id) == (["rider"], [])


def test_respond_to_request_only_for_own_ride(api, ride_id):
    request_ride(api, "rider", ride_id)

    response = api.as_user("rider2").post(
        "/api/respondtorequest",
        json={"rideid": ride_id, "requester_id": "rider", "action": "accept"},
    )

    assert response.status_code == 403
    assert rider_status(api, "rider", ride_id) == "pending"


def test_cannot_accept_past_capacity(api, ride_id):
    # the ride has 2 seats
    request_ride(api, "rider", ride_id)
    request_ride(api, "rider2", ride_id)
    request_ride(api, "rider3", ride_id)
    save_manage_modal(api, ride_id, current=[RIDER, RIDER2])

    response = api.as_user("poster").post(
        "/api/respondtorequest",
        json={"rideid": ride_id, "requester_id": "rider3", "action": "accept"},
    )

    assert response.status_code == 400
    assert poster_lists(api, ride_id) == (["rider", "rider2"], ["rider3"])


# --- notifications panel ---------------------------------------------------


def test_clear_notifications(api, ride_id):
    request_ride(api, "rider", ride_id)
    assert notification_subjects(api, "poster") != []

    response = api.as_user("poster").post("/api/clearnotifications")

    assert response.get_json()["success"]
    assert notification_subjects(api, "poster") == []


# --- the "done when" cycle -------------------------------------------------


def test_full_request_accept_remove_rerequest_cancel_cycle(api, ride_id):
    request_ride(api, "rider", ride_id, note="Can I bring a suitcase?")
    assert rider_status(api, "rider", ride_id) == "pending"
    assert poster_lists(api, ride_id) == ([], ["rider"])

    save_manage_modal(api, ride_id, current=[RIDER])
    assert rider_status(api, "rider", ride_id) == "accepted"
    assert poster_lists(api, ride_id) == (["rider"], [])

    save_manage_modal(api, ride_id, requests=[RIDER])
    assert rider_status(api, "rider", ride_id) == "removed"
    assert poster_lists(api, ride_id) == ([], [])

    request_ride(api, "rider", ride_id)
    assert rider_status(api, "rider", ride_id) == "pending"
    assert poster_lists(api, ride_id) == ([], ["rider"])

    api.as_user("rider").post("/api/cancelriderequest", json={"rideid": ride_id})
    assert rider_status(api, "rider", ride_id) is None
    assert poster_lists(api, ride_id) == ([], [])

    assert notification_subjects(api, "rider") == [
        "🚗 You were removed from a Rideshare",
        "🚗 Your request to join a Rideshare was accepted!",
    ]
    assert notification_subjects(api, "poster") == [
        "🚗 Rae Rider canceled their request to join your Rideshare",
        "🚗 Rae Rider requested to join your Rideshare!",
        "🚗 Rae Rider requested to join your Rideshare!",
    ]
