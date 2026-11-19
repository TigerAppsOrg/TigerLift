import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PopUpMessage from "../components/PopUpMessage.jsx";
import RouteHeading from "../components/lift/RouteHeading.jsx";
import RideRequestCard from "../components/lift/RideRequestCard.jsx";
import Label from "../components/lift/Label.jsx";
import LiftButton, {
  liftButtonClasses,
} from "../components/lift/LiftButton.jsx";
import { ErrorState } from "../components/lift/PageStates.jsx";
import arrowLeftIcon from "../assets/figma/arrow-left.svg";
import menuIcon from "../assets/figma/menu.svg";
import useRidesData from "../utils/useRidesData";
import {
  cancelRequest,
  requestToJoin,
  respondToRequest,
} from "../utils/rideApi";
import {
  NOTE_MAX_LENGTH,
  formatPhoneNumber,
  getGoogleCalendarUrl,
  handleShowPopupMessage,
} from "../utils/utils";
import {
  findRide,
  formatRideDay,
  formatRideTime,
  getFirstName,
  getRiderNames,
  getSeatsOpen,
  getViewerRole,
  isRideFull,
} from "../utils/rides";

const sectionTitle = "font-semibold text-subhead-m md:text-subhead";

// Grey circle standing in for a profile photo, as in the design.
const AvatarPlaceholder = ({ className }) => (
  <span
    className={`block shrink-0 rounded-full bg-lift-muted ${className}`}
    aria-hidden="true"
  />
);

// "⋮" menu: copy the poster's email, add to calendar, manage the ride.
function RideMenu({ ride, role, posterFirstName, onCopied }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const copyEmail = async () => {
    setIsOpen(false);
    try {
      await navigator.clipboard.writeText(ride.admin_email);
      onCopied(true, "Email copied!");
    } catch {
      onCopied(false, "Couldn't copy the email.");
    }
  };

  const itemClasses =
    "block w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-lift-subtle";
  const isGoing = role === "poster" || role === "accepted";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="size-8 flex items-center justify-center rounded hover:bg-lift-subtle"
      >
        <img src={menuIcon} alt="" width="24" height="24" />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-10 min-w-[220px] py-1 bg-lift-surface border border-lift-border rounded-lg shadow-floating"
        >
          {role !== "poster" && (
            <button
              type="button"
              role="menuitem"
              onClick={copyEmail}
              className={itemClasses}
            >
              Copy {posterFirstName}’s email
            </button>
          )}
          {isGoing && (
            <a
              role="menuitem"
              href={getGoogleCalendarUrl(ride)}
              target="_blank"
              rel="noopener noreferrer"
              className={itemClasses}
              onClick={() => setIsOpen(false)}
            >
              Add to Google Calendar
            </a>
          )}
          {role === "poster" && (
            <Link role="menuitem" to="/myrides" className={itemClasses}>
              Manage in My Rides
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// The "Request Notes" box and Request to Join button.
function RequestForm({
  ride,
  posterFirstName,
  isAgain,
  onSubmit,
  isSubmitting,
}) {
  const [note, setNote] = useState("");
  const isFull = isRideFull(ride);

  if (isFull) {
    return (
      <div className="flex flex-col items-center gap-1">
        <LiftButton disabled className="w-full">
          Full
        </LiftButton>
        <p className="text-small-m md:text-sm md:leading-5 md:font-medium text-lift-secondary text-center">
          This rideshare is full. Check back in case a seat opens up.
        </p>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(note);
      }}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="request-note" className="flex flex-col">
          <span className={sectionTitle}>Request Notes</span>
          <span className="text-small-m md:text-sm md:leading-5 md:font-medium text-lift-secondary">
            Note will be sent to {posterFirstName}
          </span>
        </label>
        <textarea
          id="request-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX_LENGTH}
          rows={2}
          placeholder="Optional, e.g. how much luggage you have"
          className="w-full min-h-16 p-2.5 border border-lift-border-strong rounded-lg bg-lift-surface resize-y focus:outline focus:outline-2 focus:outline-lift-inverse placeholder:text-lift-secondary"
        />
        <p className="self-end text-small-m text-lift-secondary">
          {note.length}/{NOTE_MAX_LENGTH}
        </p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <LiftButton type="submit" className="w-full" loading={isSubmitting}>
          {isAgain ? "Request Again" : "Request to Join"}
        </LiftButton>
        <p className="text-[10px] leading-[14px] md:text-sm md:leading-5 md:font-medium text-lift-secondary text-center">
          Contact info is shared once {posterFirstName} accepts your request
        </p>
      </div>
    </form>
  );
}

// What the viewer can do with the ride, depending on who they are.
function ViewerActions({
  ride,
  role,
  posterFirstName,
  busy,
  onRequest,
  onCancel,
  onRespond,
  respondingTo,
}) {
  switch (role) {
    case "poster":
      return (
        <section
          className="flex flex-col gap-3"
          aria-labelledby="requests-heading"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="requests-heading" className={sectionTitle}>
              Requests to join
            </h2>
            <Link to="/myrides" className={liftButtonClasses("outline")}>
              Manage in My Rides
            </Link>
          </div>
          {ride.requested_riders.length === 0 ? (
            <p className="text-lift-secondary">
              No pending requests right now.
            </p>
          ) : (
            ride.requested_riders.map(([netid, fullName, , note]) => (
              <RideRequestCard
                key={netid}
                ride={ride}
                fullName={fullName}
                note={note}
                showRide={false}
                isResponding={respondingTo === netid}
                onRespond={(action) => onRespond(netid, action)}
              />
            ))
          )}
        </section>
      );

    case "pending":
      return (
        <div className="flex flex-col items-start gap-3">
          <Label size="small" tone="secondary">
            Request sent • Waiting for {posterFirstName}
          </Label>
          <LiftButton
            variant="outline"
            className="w-full"
            onClick={onCancel}
            loading={busy}
          >
            Cancel request
          </LiftButton>
        </div>
      );

    case "accepted":
      return (
        <Label size="small" tone="success" className="self-start">
          ✓ You’re in • {posterFirstName} accepted your request
        </Label>
      );

    case "rejected":
      return (
        <Label
          size="small"
          tone="secondary"
          className="self-start whitespace-normal"
        >
          Declined • {posterFirstName} couldn’t take you on this ride
        </Label>
      );

    case "removed":
      return (
        <div className="flex flex-col gap-4">
          <Label
            size="small"
            tone="secondary"
            className="self-start whitespace-normal"
          >
            You were removed from this ride. You can request to join again.
          </Label>
          <RequestForm
            ride={ride}
            posterFirstName={posterFirstName}
            isAgain
            onSubmit={onRequest}
            isSubmitting={busy}
          />
        </div>
      );

    default:
      return (
        <RequestForm
          ride={ride}
          posterFirstName={posterFirstName}
          onSubmit={onRequest}
          isSubmitting={busy}
        />
      );
  }
}

// Pickup location. The Figma map is left out for now (no Maps API key yet);
// this links to Google Maps instead, which needs no key.
function PickupCard({ ride, className = "" }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${ride.origin.name}, ${ride.origin.address}`
  )}&query_place_id=${encodeURIComponent(ride.origin.id)}`;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="text-label-m md:text-label font-medium">
        Pick up at: {ride.origin.name}
      </p>
      <p className="text-sm leading-5 text-lift-secondary break-words">
        {ride.origin.address}
      </p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm leading-5 font-medium underline hover:text-lift-secondary self-start"
      >
        Open in Google Maps
      </a>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse" aria-hidden="true">
      <div className="flex items-center gap-2">
        <div className="size-[34px] md:size-16 rounded-full bg-lift-subtle" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 bg-lift-subtle rounded" />
          <div className="h-4 w-24 bg-lift-subtle rounded" />
        </div>
      </div>
      <div className="h-10 w-3/4 bg-lift-subtle rounded" />
      <div className="h-10 w-2/3 bg-lift-subtle rounded" />
      <div className="h-24 w-full bg-lift-subtle rounded" />
    </div>
  );
}

// Ride Details: decide whether to join. Built from the Figma "Web" (58:1729)
// and "Mobile-Homepage" (23:1589) Ride Details frames.
export default function RideDetails() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { dashboard, myRides, isLoading, error, reload, refresh } =
    useRidesData();
  const [busy, setBusy] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null); // requester netid
  const [popupMessageInfo, setPopupMessageInfo] = useState({
    status: "",
    message: "",
  });

  const ride = findRide(rideId, dashboard, myRides);
  const showMessage = (success, message) =>
    handleShowPopupMessage(setPopupMessageInfo, success, message);

  const runAction = async (action) => {
    setBusy(true);
    const result = await action();
    showMessage(result.success, result.message);
    await refresh();
    setBusy(false);
  };

  const handleRespond = async (netid, action) => {
    setRespondingTo(netid);
    const result = await respondToRequest(ride, netid, action);
    showMessage(result.success, result.message);
    await refresh();
    setRespondingTo(null);
  };

  const goBack = () => {
    // back to wherever the user came from, or Home if they opened a link
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate("/allrides");
    }
  };

  let content;
  if (isLoading) {
    content = (
      <div className="md:bg-lift-surface md:border md:border-lift-border-strong md:rounded-lg md:p-5">
        <DetailsSkeleton />
        <span className="sr-only">Loading ride…</span>
      </div>
    );
  } else if (error) {
    content = <ErrorState message={error} onRetry={() => reload()} />;
  } else if (!ride) {
    content = (
      <div className="bg-lift-surface border border-lift-border rounded-lg p-6 flex flex-col items-start gap-3">
        <h1 className="font-display font-bold text-h2-m md:text-h3">
          This ride isn’t available
        </h1>
        <p className="text-lift-secondary">
          It may have already left, or the poster deleted it.
        </p>
        <Link to="/allrides" className={liftButtonClasses("primary")}>
          Find another ride
        </Link>
      </div>
    );
  } else {
    const role = getViewerRole(
      ride,
      dashboard.user_info.netid,
      dashboard.ridereqs
    );
    const posterFirstName = getFirstName(ride.admin_name);
    const riderNames = getRiderNames(ride);
    const seatsOpen = getSeatsOpen(ride);

    content = (
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <article className="flex flex-col gap-2.5 md:w-[682px] md:shrink md:bg-lift-surface md:border md:border-lift-border-strong md:rounded-lg md:p-5">
          <header className="flex items-center gap-2 md:h-16">
            <AvatarPlaceholder className="size-[34px] md:size-16" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-subhead-m md:text-subhead truncate">
                {role === "poster"
                  ? "Your Rideshare"
                  : `${posterFirstName}’s Rideshare`}
              </p>
              <p className="text-small-m font-semibold md:text-sm md:leading-5 md:font-medium text-lift-secondary">
                {formatRideDay(ride.arrival_time)}
              </p>
            </div>
            <RideMenu
              ride={ride}
              role={role}
              posterFirstName={posterFirstName}
              onCopied={showMessage}
            />
          </header>

          <div className="flex flex-col gap-4">
            <RouteHeading
              as="h1"
              from={ride.origin.name}
              to={ride.destination.name}
              arrow="large"
              className="font-display font-bold text-h2-m md:text-h2"
            />

            <PickupCard ride={ride} className="md:hidden" />

            <div className="flex flex-col gap-1 py-2">
              <p className="text-small-m md:text-sm md:leading-5 md:font-medium text-lift-secondary">
                Arrives by
              </p>
              <p className="font-display font-bold text-h2-m md:font-semibold md:text-h3">
                {formatRideTime(ride.arrival_time)}
              </p>
            </div>

            <section
              className="flex flex-col gap-2"
              aria-labelledby="riders-heading"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 id="riders-heading" className={sectionTitle}>
                  Riders
                </h2>
                <Label>
                  {seatsOpen === 0
                    ? "Full"
                    : `${seatsOpen} ${seatsOpen === 1 ? "seat" : "seats"} open`}
                </Label>
              </div>
              {riderNames.length === 0 ? (
                <p className="text-lift-secondary">No riders yet</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {riderNames.map((name, index) => (
                    <li key={index} className="flex items-center gap-4">
                      <AvatarPlaceholder className="size-[34px]" />
                      <span className="md:text-body-lg">
                        {getFirstName(name)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {ride.note && (
              <section
                className="flex flex-col gap-2"
                aria-labelledby="notes-heading"
              >
                <h2 id="notes-heading" className={sectionTitle}>
                  {role === "poster"
                    ? "Your Notes"
                    : `${posterFirstName}’s Notes`}
                </h2>
                <p className="text-small-m md:text-sm md:leading-5 md:font-medium break-words">
                  {ride.note}
                </p>
              </section>
            )}

            {ride.phone_number && (
              <section
                className="flex flex-col gap-1"
                aria-labelledby="contact-heading"
              >
                <h2 id="contact-heading" className={sectionTitle}>
                  Contact
                </h2>
                <p>
                  {role === "poster"
                    ? "Your number, shared with riders you accept: "
                    : `Text or call ${posterFirstName}: `}
                  <a
                    href={`tel:+1${ride.phone_number}`}
                    className="font-medium underline hover:text-lift-secondary"
                  >
                    {formatPhoneNumber(ride.phone_number)}
                  </a>
                </p>
              </section>
            )}

            <ViewerActions
              ride={ride}
              role={role}
              posterFirstName={posterFirstName}
              busy={busy}
              onRequest={(note) => runAction(() => requestToJoin(ride, note))}
              onCancel={() => runAction(() => cancelRequest(ride))}
              onRespond={handleRespond}
              respondingTo={respondingTo}
            />
          </div>
        </article>

        <aside className="hidden md:flex flex-1 min-w-0 bg-lift-surface border border-lift-border-strong rounded-lg p-5">
          <PickupCard ride={ride} />
        </aside>
      </div>
    );
  }

  return (
    <div className="text-lift-ink">
      <div className="max-w-[1312px] mx-auto px-5 md:px-8 lg:px-16 pt-8 md:pt-12 md:pb-12 flex flex-col gap-4">
        {popupMessageInfo.message && (
          <PopUpMessage
            status={popupMessageInfo.status}
            message={popupMessageInfo.message}
          />
        )}
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="self-start size-8 flex items-center justify-center rounded hover:bg-lift-subtle"
        >
          <img src={arrowLeftIcon} alt="" width="24" height="24" />
        </button>
        {content}
      </div>
    </div>
  );
}
