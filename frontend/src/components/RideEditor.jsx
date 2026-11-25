// Inline editor shown on Your Rides in place of a posted ride's card. Built
// from the design-system pieces: the ride card's surface (56:958), the Text
// Input (205:159), the Seat Stepper, Request Card Accept / Deny (132:1596)
// and the button set (10:574).
import { useState } from "react";
import dayjs from "dayjs";
import Autocomplete from "react-google-autocomplete";
import Button from "./Button";
import DateTimePicker from "./DateTimePicker";
import WarningModal from "./WarningModal";
import RouteHeading from "./lift/RouteHeading";
import SeatStepper from "./lift/SeatStepper";
import TextField from "./lift/TextField";
import chevronDown from "../assets/figma/chevron-down.svg";
import {
  MAX_CAPACITY,
  getShortPlaceName,
  placeToLocation,
  tapTargetInline,
} from "../utils/utils";
import { fromEasternWallTime, toEasternWallTime } from "../utils/easternTime";

const autocompleteOptions = {
  fields: ["formatted_address", "geometry", "name", "place_id"],
  types: ["establishment", "geocode"],
};

// dayjs's timezone plugin is not loaded, so go through Intl for ET
const formatForEmail = (dateTime) =>
  dayjs(toEasternWallTime(dateTime)).format("MMMM D, YYYY, h:mm A");

const LABEL =
  "text-mobile-small-bold md:text-desktop-small text-content-primary";
const HELPER = "text-mobile-small md:text-desktop-small text-content-secondary";
const SUBHEAD =
  "text-mobile-subhead md:text-desktop-subhead text-content-primary";
const INPUT =
  "w-full h-control max-md:h-11 px-4 bg-surface border border-line-strong rounded-lg text-mobile-body md:text-desktop-body text-content-primary placeholder:text-content-placeholder outline-none focus:border-2 focus:border-line-inverse";

export default function RideEditor({ ride, onDone, onCancel }) {
  const google_api_key = import.meta.env.VITE_GOOGLE_API_KEY;

  const [origin, setOrigin] = useState(ride.origin);
  const [destination, setDestination] = useState(ride.destination);
  // the pickers show and take Eastern time, like Schedule a Ride
  const [initialArrival] = useState(() =>
    dayjs(toEasternWallTime(ride.arrival_time)),
  );
  const [arrivalDate, setArrivalDate] = useState(initialArrival);
  const [arrivalTime, setArrivalTime] = useState(initialArrival);
  const [capacity, setCapacity] = useState(ride.max_capacity);
  const [note, setNote] = useState(ride.note || "");
  const [currentRiders, setCurrentRiders] = useState(ride.current_riders);
  const [requestedRiders, setRequestedRiders] = useState(ride.requested_riders);
  const [rejectedRiders, setRejectedRiders] = useState([]);

  const [isSaving, setIsSaving] = useState(false);
  const [warning, setWarning] = useState(null); // { title, message, buttonText, onConfirm? }
  const [deleteRideMessage, setDeleteRideMessage] = useState("");

  // location would affect people who already joined or asked to join
  const isLocationLocked =
    ride.current_riders.length > 0 || ride.requested_riders.length > 0;

  const locationChanged =
    origin?.id !== ride.origin.id || destination?.id !== ride.destination.id;
  const timeChanged =
    !dayjs(arrivalDate).isSame(initialArrival, "day") ||
    dayjs(arrivalTime).format("HH:mm") !== initialArrival.format("HH:mm");
  const capacityChanged = capacity !== ride.max_capacity;
  const noteChanged = note !== (ride.note || "");
  const ridersChanged =
    currentRiders.length !== ride.current_riders.length ||
    requestedRiders.length !== ride.requested_riders.length ||
    rejectedRiders.length !== 0;
  const hasChanges =
    locationChanged ||
    timeChanged ||
    capacityChanged ||
    noteChanged ||
    ridersChanged;
  const isValid =
    origin &&
    destination &&
    arrivalDate?.isValid?.() &&
    arrivalTime?.isValid?.();

  const handleCancel = () => {
    if (hasChanges) {
      setWarning({
        title: "Unsaved Changes",
        message: "You have unsaved changes. Do you want to discard them?",
        buttonText: "Discard Changes",
        onConfirm: onCancel,
      });
    } else {
      onCancel();
    }
  };

  const handleAcceptRider = (rider) => {
    if (currentRiders.length >= capacity) {
      setWarning({
        title: "Capacity Full",
        message: `The capacity for this rideshare is full. Please remove a rider before accepting another, or increase the capacity of the rideshare (maximum ${MAX_CAPACITY}).`,
        buttonText: "Okay",
      });
      return;
    }
    setCurrentRiders((prev) => [...prev, rider]);
    setRequestedRiders((prev) => prev.filter(([n]) => n !== rider[0]));
  };

  const handleRejectRider = (rider) => {
    setRejectedRiders((prev) => [...prev, rider]);
    setRequestedRiders((prev) => prev.filter(([n]) => n !== rider[0]));
  };

  // moves an accepted rider back to pending
  const handleRemoveRider = (rider) => {
    setCurrentRiders((prev) => prev.filter(([n]) => n !== rider[0]));
    setRequestedRiders((prev) => [...prev, rider]);
  };

  const postAndFinish = async (endpoint, body) => {
    setIsSaving(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const responseData = await response.json();
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
      await onDone(responseData);
    } catch (error) {
      console.error("Error during fetch:", error);
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    // picked in Eastern time, like when creating a ride
    const new_arrival_time = dayjs(
      fromEasternWallTime(
        `${arrivalDate.format("YYYY-MM-DD")}T${arrivalTime.format("HH:mm:ss")}`,
      ),
    );
    if (timeChanged && !new_arrival_time.isAfter(dayjs())) {
      setWarning({
        title: "Invalid Input",
        message: "Cannot enter a date in the past.",
        buttonText: "Okay",
      });
      return;
    }

    const toRider = ([requester_id, full_name, mail]) => ({
      requester_id,
      full_name,
      mail,
    });

    postAndFinish("/api/batchupdateriderequest", {
      rideid: ride.id,
      accepting_riders: currentRiders.map(toRider),
      rejecting_riders: rejectedRiders.map(toRider),
      pending_riders: requestedRiders.map(toRider),
      new_capacity: capacity,
      new_arrival_time: new_arrival_time.toISOString(),
      formatted_arrival_time: formatForEmail(new_arrival_time),
      origin_name: origin.name,
      destination_name: destination.name,
      changedTime: timeChanged,
      ...(locationChanged && {
        new_origin: origin,
        new_destination: destination,
      }),
      ...(noteChanged && { new_note: note }),
    });
  };

  const handleDelete = () => {
    setWarning({
      title: "Delete this Rideshare?",
      message: "Are you sure you want to delete this rideshare?",
      buttonText: "Delete Rideshare",
      onConfirm: () =>
        postAndFinish("/api/deleteride", {
          rideid: ride.id,
          formatted_arrival_time: formatForEmail(ride.arrival_time),
          deleteRideMessage: deleteRideMessage,
          current_riders: ride.current_riders,
          origin_name: ride.origin["name"],
          destination_name: ride.destination["name"],
        }),
    });
  };

  // any typing invalidates the location until a suggestion is picked
  const renderLocationInput = (label, location, setLocation) => {
    const id = `edit-${ride.id}-${label.toLowerCase()}`;
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={id} className={LABEL}>
          {label}
        </label>
        <Autocomplete
          id={id}
          className={INPUT}
          apiKey={google_api_key}
          defaultValue={location?.name}
          placeholder={label === "From" ? "Where from?" : "Where to?"}
          onPlaceSelected={(place) => {
            if (place?.place_id) setLocation(placeToLocation(place));
          }}
          onChange={() => setLocation(null)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          options={autocompleteOptions}
          aria-describedby={location ? undefined : `${id}-hint`}
        />
        {!location && (
          <p id={`${id}-hint`} className={HELPER}>
            Choose a place from the suggestions.
          </p>
        )}
      </div>
    );
  };

  const isDeleteWarning = warning?.title === "Delete this Rideshare?";
  const isInfoWarning =
    warning?.title === "Capacity Full" || warning?.title === "Invalid Input";

  const timeLabelId = `edit-${ride.id}-time-label`;

  return (
    <div
      data-testid="ride-editor"
      className="bg-surface border border-line-strong rounded-lg p-5 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-1">
        <p className={HELPER}>Editing your ride</p>
        {origin && destination ? (
          <RouteHeading
            from={getShortPlaceName(origin)}
            to={getShortPlaceName(destination)}
            className="font-display text-mobile-h3 md:text-desktop-h3"
          />
        ) : (
          <p className={SUBHEAD}>Choose both places</p>
        )}
      </div>

      {isLocationLocked ? (
        <p className="rounded-lg bg-status-info-bg text-status-info-text px-4 py-3 text-mobile-small md:text-desktop-small">
          Location is locked because people have joined or requested this ride.
          Changing it could send them to the wrong place.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {renderLocationInput("From", origin, setOrigin)}
          {renderLocationInput("To", destination, setDestination)}
        </div>
      )}

      <div
        role="group"
        aria-labelledby={timeLabelId}
        className="flex flex-col gap-2"
      >
        <p id={timeLabelId} className={LABEL}>
          Arrive by (Eastern time)
        </p>
        <DateTimePicker
          className="lift-picker"
          date={arrivalDate}
          setDate={setArrivalDate}
          time={arrivalTime}
          setTime={setArrivalTime}
          allowClear={false}
          suffixIcon={<img src={chevronDown} alt="" width="24" height="24" />}
          dateProps={{
            "aria-label": "Arrival date",
            format: ["ddd, MMM D", "M/D/YYYY", "YYYY-MM-DD"],
            popupClassName: "lift-picker-popup",
          }}
          timeProps={{
            "aria-label": "Arrival time",
            popupClassName: "lift-picker-popup",
          }}
        />
        {ride.current_riders.length > 0 && (
          <p className={HELPER}>
            Current riders will be emailed if you change the time.
          </p>
        )}
      </div>

      <SeatStepper
        value={capacity}
        onChange={setCapacity}
        min={Math.max(1, currentRiders.length)}
        max={MAX_CAPACITY}
        label="Seats"
        helper={`${currentRiders.length} taken`}
      />

      <TextField
        multiline
        counter
        label="Note to riders (optional)"
        placeholder="Add a note for riders"
        maxLength={200}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <p className={SUBHEAD}>Riders ({currentRiders.length})</p>
        {currentRiders.length > 0 ? (
          <ul className="flex flex-col divide-y divide-line-subtle">
            {currentRiders.map((rider) => (
              <li
                key={rider[0]}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="text-mobile-body md:text-desktop-body text-content-primary">
                  {rider[1]}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveRider(rider)}
                  aria-label={`Remove ${rider[1]}`}
                  className={`text-mobile-button text-content-secondary underline hover:text-content-primary ${tapTargetInline}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={HELPER}>No riders yet.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2.5 text-mobile-subhead md:text-desktop-subhead text-content-primary">
          {requestedRiders.length > 0 && (
            <span
              aria-hidden="true"
              className="inline-block size-6 shrink-0 rounded-full bg-fill-accent"
            />
          )}
          Requests to join ({requestedRiders.length})
        </p>
        {requestedRiders.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {requestedRiders.map((rider) => (
              <li
                key={rider[0]}
                className="bg-surface-subtle rounded-lg px-4 py-3 flex flex-col gap-2"
              >
                <p className={SUBHEAD}>{rider[1]} wants to join</p>
                {rider[3] && (
                  <p className="text-mobile-body md:text-desktop-body text-content-primary break-words">
                    “{rider[3]}”
                  </p>
                )}
                <div className="flex gap-3 max-md:flex-col">
                  <Button
                    variant="success"
                    onClick={() => handleAcceptRider(rider)}
                    aria-label={`Accept ${rider[1]}`}
                    className="max-md:w-full max-md:h-11"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handleRejectRider(rider)}
                    aria-label={`Deny ${rider[1]}`}
                    className="max-md:w-full max-md:h-11"
                  >
                    Deny
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={HELPER}>No requests to join.</p>
        )}
        <p className={HELPER}>
          Newly accepted riders are emailed when you save. You are responsible
          for coordinating logistics with them.
        </p>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-3 pt-2 border-t border-line-subtle">
        <Button
          variant="secondary"
          onClick={handleDelete}
          disabled={isSaving}
          className="max-md:h-11"
        >
          Delete ride
        </Button>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={isSaving}
            className="max-md:h-11"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!hasChanges || !isValid}
            loading={isSaving}
            className="max-md:h-11"
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {warning && (
        <WarningModal isOpen title={warning.title}>
          <div className="flex flex-col gap-3">
            <p>{warning.message}</p>
            {isDeleteWarning && ride.current_riders.length > 0 && (
              <div className="flex flex-col gap-4 pb-5">
                <p>
                  Please give a reason for deleting this rideshare. The riders
                  you have currently accepted will be notified.
                </p>
                <TextField
                  multiline
                  counter
                  label="Reason"
                  placeholder="List reason here."
                  maxLength={200}
                  value={deleteRideMessage}
                  onChange={(e) => setDeleteRideMessage(e.target.value)}
                />
              </div>
            )}
            <div className="flex items-center self-end gap-2 max-md:self-stretch">
              {!isInfoWarning && (
                <Button
                  variant="secondary"
                  className="max-md:flex-1 max-md:h-11"
                  onClick={() => {
                    setWarning(null);
                    setDeleteRideMessage("");
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              )}
              <Button
                variant={isInfoWarning ? "primary" : "danger"}
                className="max-md:flex-1 max-md:h-11"
                onClick={warning.onConfirm || (() => setWarning(null))}
                loading={isSaving}
                disabled={
                  isDeleteWarning &&
                  ride.current_riders.length > 0 &&
                  !deleteRideMessage
                }
              >
                {warning.buttonText}
              </Button>
            </div>
          </div>
        </WarningModal>
      )}
    </div>
  );
}
