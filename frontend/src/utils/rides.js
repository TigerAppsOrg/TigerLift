import { getAirport } from "./utils";

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

// A ride's departure window, or null if it doesn't have one.
//   "full":    "4:00PM - 5:30PM" (Ride Details, as in Figma)
//   "compact": "4:00–5:30PM" (ride card), keeping both AM/PM when they differ
export const formatDepartureWindow = (ride, style = "full") => {
  if (!ride.departure_start || !ride.departure_end) return null;
  const start = formatRideTime(ride.departure_start);
  const end = formatRideTime(ride.departure_end);
  if (style === "full") return `${start} - ${end}`;
  const sameHalf = start.slice(-2) === end.slice(-2);
  return `${sameHalf ? start.slice(0, -2) : start}–${end}`;
};

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

// Names of accepted riders. current_riders entries are [netid, name, email].
export const getRiderNames = (ride) =>
  ride.current_riders.map((rider) => rider[1]);

// The viewer's relationship to a ride: "poster", a request status
// ("pending" | "accepted" | "rejected" | "removed"), or "none".
export const getViewerRole = (ride, netid, requestStatuses) => {
  if (ride.admin_netid === netid) return "poster";
  return ride.request_status || requestStatuses?.[ride.id] || "none";
};

// Quick-filter chips on Home. Each one is applied as a search term.
export const QUICK_FILTERS = ["JFK", "Junction", "Penn"];

// Text a ride can be found by: places (plus airport codes like "EWR"),
// the poster, and the day and time.
const getSearchText = (ride) => {
  const parts = [
    ride.admin_name,
    formatRideDay(ride.arrival_time),
    formatRideTime(ride.arrival_time),
    formatDepartureWindow(ride) || "",
  ];
  for (const location of [ride.origin, ride.destination]) {
    parts.push(location.name, location.address);
    const airport = getAirport(location);
    if (airport) parts.push(airport.code, airport.city);
  }
  return parts.join(" ").toLowerCase();
};

// True when every word of the query appears somewhere in the ride's text.
export const rideMatchesSearch = (ride, query) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const text = getSearchText(ride);
  return words.every((word) => text.includes(word));
};

// The user's next upcoming ride that they posted or were accepted on.
export const getNextTrip = (myRides) => {
  if (!myRides) return null;
  const trips = [
    ...myRides.upcoming_posted_rides,
    ...myRides.upcoming_requested_rides.filter(
      (ride) => ride.request_status === "accepted"
    ),
  ];
  trips.sort((a, b) => new Date(a.arrival_time) - new Date(b.arrival_time));
  return trips[0] || null;
};

// Finds a ride by id, preferring the copy from My Rides: it carries the
// poster's pending requests (for posters) and phone number (for accepted
// riders), which the dashboard leaves out.
export const findRide = (rideId, dashboard, myRides) => {
  const id = Number(rideId);
  const sources = [
    myRides?.upcoming_posted_rides,
    myRides?.upcoming_requested_rides,
    dashboard?.rides,
  ];
  for (const rides of sources) {
    const ride = rides?.find((r) => r.id === id);
    if (ride) return ride;
  }
  return null;
};

// Arrival time bounds for the Home filters, from antd date/time picker
// values (dayjs). As on the old search, a date without a time means the
// start of that day for "arrive after" and the end of it for "arrive before".
// Returns { after, before } as Dates, or null for an unset bound.
export const getArrivalBounds = ({
  afterDate,
  afterTime,
  beforeDate,
  beforeTime,
}) => {
  const atTime = (date, time) =>
    date.hour(time.hour()).minute(time.minute()).second(0).millisecond(0);
  return {
    after: afterDate
      ? (afterTime
          ? atTime(afterDate, afterTime)
          : afterDate.startOf("day")
        ).toDate()
      : null,
    before: beforeDate
      ? (beforeTime
          ? atTime(beforeDate, beforeTime)
          : beforeDate.endOf("day")
        ).toDate()
      : null,
  };
};

// True when a ride matches the Home filters. origin and destination are
// Google Places results, matched to the ride's stored place id (as the old
// /api/searchrides did); after and before are Dates from getArrivalBounds.
export const rideMatchesFilters = (
  ride,
  { origin, destination, after, before }
) => {
  if (origin && ride.origin.id !== origin.place_id) return false;
  if (destination && ride.destination.id !== destination.place_id) {
    return false;
  }
  const arrival = new Date(ride.arrival_time);
  if (after && arrival < after) return false;
  if (before && arrival > before) return false;
  return true;
};
