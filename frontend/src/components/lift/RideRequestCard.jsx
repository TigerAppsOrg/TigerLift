import LiftButton from "./LiftButton";
import avatar from "../../assets/figma/avatar.svg";
import { getShortPlaceName } from "../../utils/utils";
import { formatRideDay, formatRideTime, getSeatsOpen } from "../../utils/rides";

// A pending request to join the user's ride, from the Figma "Ride Request"
// component (node 134:1140, State=Pending). Accept and Deny call
// onRespond("accept" | "reject"). The design's class year / college and
// "10m ago" aren't stored yet, so they're left out.
export default function RideRequestCard({
  ride,
  fullName,
  note,
  onRespond,
  isResponding = false,
  showRide = true,
}) {
  const seatsOpen = getSeatsOpen(ride);
  const isFull = seatsOpen === 0;

  return (
    <div className="bg-lift-surface border border-lift-border rounded-lg p-6 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <img src={avatar} alt="" width="48" height="48" className="shrink-0" />
        <p className="font-semibold text-subhead-m md:text-subhead min-w-0 break-words">
          {fullName} wants to join your ride
        </p>
      </div>

      {showRide && (
        <div className="bg-lift-subtle rounded-lg px-4 py-3 flex items-center gap-3">
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-sm leading-5 font-medium text-lift-secondary">
              YOUR RIDE
            </p>
            <p className="font-semibold text-subhead-m md:text-subhead break-words">
              {getShortPlaceName(ride.origin)} →{" "}
              {getShortPlaceName(ride.destination)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-sm leading-5 font-medium shrink-0">
            <p>
              {formatRideDay(ride.arrival_time).split(" • ")[0]} •{" "}
              {formatRideTime(ride.arrival_time)}
            </p>
            <p className="text-lift-secondary">
              {seatsOpen} of {ride.max_capacity} seats left
            </p>
          </div>
        </div>
      )}

      {note && <p className="break-words">“{note}”</p>}

      <div className="flex flex-wrap items-center gap-3 min-h-[52px]">
        <LiftButton
          className="px-8 py-4"
          onClick={() => onRespond("accept")}
          loading={isResponding}
          disabled={isFull}
        >
          Accept
        </LiftButton>
        <LiftButton
          variant="outline"
          className="px-4 self-stretch"
          onClick={() => onRespond("reject")}
          loading={isResponding}
        >
          Deny
        </LiftButton>
        {isFull && (
          <p className="text-sm text-lift-secondary">
            Your ride is full. Remove a rider or add seats in My Rides to
            accept.
          </p>
        )}
      </div>
    </div>
  );
}
