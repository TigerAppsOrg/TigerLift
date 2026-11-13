import { Link } from "react-router-dom";
import RouteHeading from "./RouteHeading";
import Label from "./Label";
import { liftButtonClasses } from "./LiftButton";
import { getAirportFullName, getShortPlaceName } from "../../utils/utils";
import {
  formatRideDay,
  formatRideTime,
  getFirstName,
  getSeatsOpen,
} from "../../utils/rides";

// Status pill (top right) for each card state. "requested" depends on the
// viewer's request.
const REQUEST_LABELS = {
  pending: { text: "Requested", tone: "neutral" },
  accepted: { text: "You're in", tone: "success" },
  rejected: { text: "Declined", tone: "secondary" },
};

const getStatusLabel = (status, requestStatus) => {
  switch (status) {
    case "full":
      return { text: "Full", tone: "neutral" };
    case "yours":
      return { text: "Your ride", tone: "neutral" };
    case "requested":
      return REQUEST_LABELS[requestStatus] || REQUEST_LABELS.pending;
    case "past":
      return { text: "Past", tone: "secondary" };
    default:
      return null;
  }
};

// "✈ Newark Liberty International Airport (EWR)" for each airport end of
// the route, so PHL and EWR are hard to mix up.
function AirportNames({ ride }) {
  const names = [
    ...new Set(
      [ride.origin, ride.destination].map(getAirportFullName).filter(Boolean)
    ),
  ];
  if (names.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5">
      {names.map((name) => (
        <li
          key={name}
          className="flex items-center gap-1 text-small-m font-semibold md:text-sm md:leading-5 md:font-medium text-lift-secondary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4 shrink-0"
            aria-hidden="true"
          >
            <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
          <span>{name}</span>
        </li>
      ))}
    </ul>
  );
}

// The card's main button. Pass `to` for a link or `onClick` for a button.
function CardAction({ action, className }) {
  const variant = action.disabled ? "disabled" : action.variant || "primary";
  const classes = liftButtonClasses(variant, className);
  if (action.to && !action.disabled) {
    return (
      <Link to={action.to} className={classes}>
        {action.label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      className={classes}
    >
      {action.label}
    </button>
  );
}

/**
 * Ride card from the Figma "Rideshare" component (node 56:958).
 *
 * Props:
 *   ride           a ride from /api/dashboard or /api/myrides
 *   status         "open" | "full" | "yours" | "requested" | "past"
 *                  (see getRideCardStatus in utils/rides.js)
 *   requestStatus  for "requested": "pending" | "accepted" | "rejected"
 *   action         { label, to?, onClick?, variant?, disabled? }, the main
 *                  button; variant is "primary" (default) or "outline".
 *                  Leave it out for no button.
 *
 * Open, full, yours and requested use the main card layout (Figma Default
 * on mobile, Variant2 on desktop). Past uses the compact layout (Variant3).
 */
export default function RideshareCard({
  ride,
  status = "open",
  requestStatus,
  action,
}) {
  const statusLabel = getStatusLabel(status, requestStatus);
  const seatsOpen = getSeatsOpen(ride);
  const from = getShortPlaceName(ride.origin);
  const to = getShortPlaceName(ride.destination);

  if (status === "past") {
    return (
      <article className="bg-lift-surface border border-lift-border rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <RouteHeading
            from={from}
            to={to}
            className="font-semibold text-subhead-m md:text-subhead min-w-0"
          />
          <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
            <p className="font-semibold text-subhead-m md:text-subhead">
              Arrives {formatRideTime(ride.arrival_time)}
            </p>
            <p className="text-small-m font-semibold md:text-sm md:leading-5 md:font-medium text-lift-secondary">
              {formatRideDay(ride.arrival_time)}
            </p>
          </div>
        </div>
        <AirportNames ride={ride} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          {action && (
            <CardAction
              action={{ variant: "outline", ...action }}
              className="px-4"
            />
          )}
          {statusLabel && (
            <Label size="small" tone={statusLabel.tone}>
              {statusLabel.text}
            </Label>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="bg-lift-surface border border-lift-border rounded-lg p-5 flex flex-col gap-6">
      {/* the status pill drops below the time on narrow cards */}
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex flex-col">
          <p className="font-display font-bold text-h2-m md:font-semibold md:text-h3 whitespace-nowrap">
            Arrives {formatRideTime(ride.arrival_time)}
          </p>
          <p className="text-small-m font-semibold md:text-sm md:leading-5 md:font-medium text-lift-secondary">
            {formatRideDay(ride.arrival_time)}
          </p>
        </div>
        {statusLabel && (
          <Label tone={statusLabel.tone}>{statusLabel.text}</Label>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <RouteHeading
          from={from}
          to={to}
          className="font-display font-bold text-h2-m md:font-semibold md:text-h3"
        />
        <AirportNames ride={ride} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-small-m font-semibold md:text-sm md:leading-5 md:font-medium text-lift-secondary">
          {getFirstName(ride.admin_name)} •{" "}
          {seatsOpen === 0
            ? `${ride.max_capacity} of ${ride.max_capacity} seats taken`
            : `${seatsOpen} of ${ride.max_capacity} ${
                ride.max_capacity === 1 ? "seat" : "seats"
              } open`}
        </p>
        {action && (
          <CardAction
            action={status === "full" ? { disabled: true, ...action } : action}
            className="w-full md:min-h-[52px]"
          />
        )}
      </div>
    </article>
  );
}
