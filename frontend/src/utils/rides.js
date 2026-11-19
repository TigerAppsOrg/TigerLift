const ET = "America/New_York";

// "Ryan Smith" -> "Ryan"
export const getFirstName = (displayName) =>
  (displayName || "").trim().split(/\s+/)[0] || "";

// "4:30PM", in Eastern time
export const formatRideTime = (time) =>
  new Date(time)
    .toLocaleTimeString("en-US", {
      timeZone: ET,
      hour: "numeric",
      minute: "2-digit",
    })
    .replace(" ", "");

// "Today • 10/27", "Tomorrow • 10/28" or "Thu • 10/30", in Eastern time
export const formatRideDay = (time) => {
  const date = new Date(time);
  const dayKey = (d) => d.toLocaleDateString("en-US", { timeZone: ET });
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  let label;
  if (dayKey(date) === dayKey(today)) {
    label = "Today";
  } else if (dayKey(date) === dayKey(tomorrow)) {
    label = "Tomorrow";
  } else {
    label = date.toLocaleDateString("en-US", {
      timeZone: ET,
      weekday: "short",
    });
  }

  const monthDay = date.toLocaleDateString("en-US", {
    timeZone: ET,
    month: "numeric",
    day: "numeric",
  });
  return `${label} • ${monthDay}`;
};

export const getSeatsOpen = (ride) =>
  Math.max(ride.max_capacity - ride.current_riders.length, 0);

export const isRideFull = (ride) => getSeatsOpen(ride) === 0;

export const isRidePast = (ride) => new Date(ride.arrival_time) <= new Date();

// The ride card state for a viewer:
//   "past" | "yours" | "requested" | "full" | "open"
// requestStatus is the viewer's request on this ride, if any (from
// /api/dashboard's ridereqs or a My Rides ride's request_status). A rider
// who was removed can request again, so they see the ride as open or full.
export const getRideCardStatus = (ride, viewerNetid, requestStatus) => {
  if (isRidePast(ride)) return "past";
  if (ride.admin_netid === viewerNetid) return "yours";
  if (requestStatus && requestStatus !== "removed") return "requested";
  return isRideFull(ride) ? "full" : "open";
};
