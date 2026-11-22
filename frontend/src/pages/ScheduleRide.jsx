import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Autocomplete from "react-google-autocomplete";
import DateTimePicker from "../components/DateTimePicker.jsx";
import Button from "../components/Button.jsx";
import IconButton from "../components/IconButton.jsx";
import RideshareCard from "../components/lift/RideshareCard.jsx";
import TextField from "../components/lift/TextField.jsx";
import SeatStepper from "../components/lift/SeatStepper.jsx";
import ErrorBanner from "../components/lift/ErrorBanner.jsx";
import chevronDown from "../assets/figma/chevron-down.svg";
import switchIcon from "../assets/figma/switch.svg";
import {
  MAX_CAPACITY,
  NOTE_MAX_LENGTH,
  normalizePhoneNumber,
  placeToLocation,
  flipFields,
  getAirportFullName,
} from "../utils/utils";
import { fromEasternWallTime } from "../utils/easternTime";

// Schedule a Ride, from Figma "Create a Rideshare" (desktop 56:1029) and
// "Schedule a Ride" (mobile 20:218). Posts to /api/addride, then sends the
// poster to the new ride on Your Rides.

const AUTOCOMPLETE_OPTIONS = {
  fields: ["formatted_address", "geometry", "name", "place_id"],
  types: ["establishment", "geocode"], // businesses and addresses
};

const DEFAULT_SEATS = 3;

// The picked date and time read as Eastern time, which the label promises
// and the ride cards display, whatever the browser's time zone. Null unless
// both parts are set and valid.
const getArrivalDate = (date, time) => {
  if (!date || !time || !date.isValid() || !time.isValid()) return null;
  return fromEasternWallTime(
    `${date.format("YYYY-MM-DD")}T${time.format("HH:mm:ss")}`,
  );
};

// Figma's Day selector shows a friendly day ("Today"); the later formats
// still let desktop users type a date.
const DATE_FORMAT = ["ddd, MMM D", "M/D/YYYY", "YYYY-MM-DD"];

const validate = ({ origin, destination, date, time, phone }) => {
  const errors = {};
  if (!origin?.place_id) errors.origin = "Choose where the ride starts.";
  if (!destination?.place_id) {
    errors.destination = errors.origin
      ? "Choose where the ride starts and ends."
      : "Choose where the ride ends.";
  } else if (origin?.place_id && origin.place_id === destination.place_id) {
    errors.destination = "Pick two different places.";
  }
  if (!date || !date.isValid()) errors.dateTime = "Pick a date.";
  else if (!time || !time.isValid()) errors.dateTime = "Pick a time.";
  else if (getArrivalDate(date, time) <= new Date())
    errors.dateTime = "Pick a time in the future.";
  if (!phone.trim() || !normalizePhoneNumber(phone))
    errors.phone = "Enter a valid 10-digit phone number.";
  return errors;
};

// Under a chosen place: the airport's full name (so PHL and EWR are hard to
// confuse) or the place's address.
function PlaceDetail({ place }) {
  if (!place?.place_id) return null;
  const airportName = getAirportFullName(placeToLocation(place));
  return (
    <p className="flex items-center gap-1 text-mobile-small md:text-desktop-small text-content-secondary">
      {airportName && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
      )}
      <span>{airportName || place.formatted_address}</span>
    </p>
  );
}

function LocationRow({
  id,
  label,
  placeholder,
  inputRef,
  place,
  onSelect,
  onClear,
  errorId,
  className = "",
  children,
}) {
  return (
    <div
      className={`relative flex flex-col gap-1 p-4 pr-14 md:px-6 md:py-4 md:pr-16 ${className}`}
    >
      <label
        htmlFor={id}
        className="text-mobile-small-bold md:text-desktop-small text-content-primary"
      >
        {label}
      </label>
      <Autocomplete
        id={id}
        ref={inputRef}
        apiKey={import.meta.env.VITE_GOOGLE_API_KEY}
        options={AUTOCOMPLETE_OPTIONS}
        placeholder={placeholder}
        onPlaceSelected={onSelect}
        // typing again means the chosen place no longer matches the text
        onChange={onClear}
        // Enter picks a suggestion; don't let it submit the form
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        className="w-full min-w-0 text-ellipsis bg-transparent border-0 p-0 outline-none font-display text-mobile-h3 md:text-desktop-h3 text-content-primary placeholder:text-content-placeholder"
      />
      <PlaceDetail place={place} />
      {children}
    </div>
  );
}

export default function ScheduleRide({ user }) {
  const navigate = useNavigate();

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [seats, setSeats] = useState(DEFAULT_SEATS);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const originRef = useRef(null);
  const destinationRef = useRef(null);
  const phoneRef = useRef(null);

  const clearError = (...fields) =>
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      fields.forEach((field) => delete next[field]);
      return next;
    });

  const swapPlaces = () => {
    flipFields(
      origin,
      destination,
      originRef,
      destinationRef,
      setOrigin,
      setDestination,
    );
    clearError("origin", "destination");
  };

  const goBack = () => {
    // React Router keeps the history index; with nothing to go back to,
    // e.g. after opening /schedule directly, go home instead.
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/allrides");
  };

  const focusFirstError = (found) => {
    const target = found.origin
      ? originRef.current
      : found.destination
        ? destinationRef.current
        : found.dateTime
          ? document.getElementById(
              !date || !date.isValid() ? "schedule-date" : "schedule-time",
            )
          : found.phone
            ? phoneRef.current
            : null;
    target?.focus();
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (submitting) return;

    const found = validate({ origin, destination, date, time, phone });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitError("");
      focusFirstError(found);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/addride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capacity: seats,
          origin,
          destination,
          arrival_time: getArrivalDate(date, time).toISOString(),
          note,
          phone_number: phone,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        navigate(data.ride_id ? `/myrides?ride=${data.ride_id}` : "/myrides", {
          state: { flash: { status: true, message: data.message } },
        });
        return;
      }
      setSubmitError(data.message || "Couldn't post your ride. Try again.");
    } catch (error) {
      console.error("Error posting ride:", error);
      setSubmitError("Couldn't post your ride. Check your connection.");
    }
    setSubmitting(false);
  };

  const arrival = getArrivalDate(date, time);
  const preview =
    origin?.place_id && destination?.place_id && arrival
      ? {
          origin: placeToLocation(origin),
          destination: placeToLocation(destination),
          arrival_time: arrival.toISOString(),
          max_capacity: seats,
          current_riders: [],
          admin_name: user?.displayname || "",
        }
      : null;

  // the destination message covers both when both are missing
  const locationError = errors.destination || errors.origin;
  const LOCATION_ERROR_ID = "schedule-location-error";
  const DATETIME_ERROR_ID = "schedule-datetime-error";
  const pickerA11y = (label) => ({
    "aria-label": label,
    "aria-invalid": errors.dateTime ? true : undefined,
    "aria-describedby": errors.dateTime ? DATETIME_ERROR_ID : undefined,
  });

  return (
    <div className="px-gutter-mobile pt-4 md:px-gutter md:py-12">
      {/* two columns only once there is room for the form and the preview;
          tablets keep the single centered form */}
      <div className="md:max-w-[718px] md:mx-auto lg:max-w-none lg:grid lg:grid-cols-[minmax(0,718fr)_minmax(0,570fr)] lg:gap-6 lg:items-start">
        <form
          noValidate
          onSubmit={submit}
          className="flex flex-col gap-6 py-8 md:bg-surface md:border md:border-line-strong md:rounded-lg md:px-5"
        >
          <div className="flex items-center justify-center gap-6 md:justify-start">
            <IconButton
              type="back"
              onClick={goBack}
              ariaLabel="Back"
              className="max-md:hidden size-8 text-content-primary hover:bg-surface-subtle"
            />
            <h1 className="font-display text-mobile-h2 md:text-desktop-h2 text-content-primary">
              Schedule a ride
            </h1>
          </div>

          <div className="flex flex-col gap-2">
            <div
              className={`bg-surface rounded-lg ${
                locationError
                  ? "border-2 border-status-danger"
                  : "border border-line-strong"
              }`}
            >
              <LocationRow
                id="schedule-origin"
                label="From"
                placeholder="Where from?"
                inputRef={originRef}
                place={origin}
                onSelect={(place) => {
                  setOrigin(place);
                  clearError("origin", "destination");
                }}
                onClear={() => origin && setOrigin(null)}
                errorId={errors.origin ? LOCATION_ERROR_ID : undefined}
              />
              <LocationRow
                id="schedule-destination"
                label="To"
                placeholder="Where to?"
                inputRef={destinationRef}
                place={destination}
                onSelect={(place) => {
                  setDestination(place);
                  clearError("destination");
                }}
                onClear={() => destination && setDestination(null)}
                errorId={errors.destination ? LOCATION_ERROR_ID : undefined}
                className="border-t border-line"
              >
                {/* Figma Icon/Switch on a lime circle, centred on the divider */}
                <button
                  type="button"
                  onClick={swapPlaces}
                  aria-label="Swap origin and destination"
                  className="absolute top-0 right-1 md:right-4 -translate-y-1/2 flex items-center justify-center size-11 md:size-8 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-line-inverse"
                >
                  <span className="flex items-center justify-center size-8 p-1 rounded-full bg-fill-accent hover:bg-fill-accent-pressed">
                    <img src={switchIcon} alt="" width="24" height="24" />
                  </span>
                </button>
              </LocationRow>
            </div>
            {locationError && (
              <p
                id={LOCATION_ERROR_ID}
                className="text-mobile-small text-status-danger-text"
              >
                {locationError}
              </p>
            )}
          </div>

          <div
            role="group"
            aria-labelledby="schedule-arrival-label"
            className="flex flex-col gap-2.5"
          >
            <p
              id="schedule-arrival-label"
              className="text-mobile-body md:text-desktop-body text-content-primary"
            >
              Arrive by (Eastern time)
            </p>
            <DateTimePicker
              className="lift-picker"
              date={date}
              setDate={(value) => {
                setDate(value);
                clearError("dateTime");
              }}
              time={time}
              setTime={(value) => {
                setTime(value);
                clearError("dateTime");
              }}
              datePlaceholder="Date"
              timePlaceholder="Time"
              dateId="schedule-date"
              timeId="schedule-time"
              status={errors.dateTime ? "error" : undefined}
              suffixIcon={
                <img src={chevronDown} alt="" width="24" height="24" />
              }
              dateProps={{
                ...pickerA11y("Arrival date"),
                format: DATE_FORMAT,
                popupClassName: "lift-picker-popup",
              }}
              timeProps={{
                ...pickerA11y("Arrival time"),
                popupClassName: "lift-picker-popup",
              }}
            />
            {errors.dateTime && (
              <p
                id={DATETIME_ERROR_ID}
                className="text-mobile-small text-status-danger-text"
              >
                {errors.dateTime}
              </p>
            )}
          </div>

          <SeatStepper
            value={seats}
            onChange={setSeats}
            min={1}
            max={MAX_CAPACITY}
            label="Seats open"
            helper="Not counting you"
          />

          <TextField
            ref={phoneRef}
            label="Phone number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            placeholder="(609) 555-1234"
            helper="Only shown to riders you accept"
            error={errors.phone}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError("phone");
            }}
          />

          <TextField
            multiline
            counter
            label="Note (optional)"
            placeholder="Add a note for riders"
            maxLength={NOTE_MAX_LENGTH}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {submitError && (
            <ErrorBanner
              message={submitError}
              retryLabel="Try again"
              onRetry={() => submit()}
            />
          )}

          {/* right on desktop (ticket); centered on phones (Figma 20:218) */}
          <div className="flex justify-center md:justify-end">
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              className="max-md:h-11"
            >
              {submitting ? "Posting…" : "Post ride"}
            </Button>
          </div>
        </form>

        {/* Figma's Preview card (128:1242). The shared card draws the only
            border; "open" shows it without a status pill, as in Figma. */}
        <aside
          aria-labelledby="schedule-preview-label"
          className="max-lg:hidden flex flex-col gap-2"
        >
          <p
            id="schedule-preview-label"
            className="text-desktop-body text-content-primary"
          >
            Preview
          </p>
          {preview ? (
            <RideshareCard ride={preview} status="open" />
          ) : (
            <p className="bg-surface border border-line-strong rounded-lg p-5 text-desktop-small text-content-secondary">
              Pick where and when to preview your ride.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
