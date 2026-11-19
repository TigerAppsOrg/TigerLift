import CopyEmailButton from "../components/CopyEmailButton";

export const MAX_CAPACITY = 5;
export const NOTE_MAX_LENGTH = 300;

// Strips formatting from a US phone number; returns the 10 digits, or null if
// invalid. Mirrors normalize_phone_number in backend/app.py.
export const normalizePhoneNumber = (phoneNumber) => {
  let digits = phoneNumber.replace(/\D/g, "");
  if (digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
  if (
    digits.length !== 10 ||
    "01".includes(digits[0]) ||
    "01".includes(digits[3])
  )
    return null;
  return digits;
};

// Formats 10 stored digits as (609) 555-1234
export const formatPhoneNumber = (digits) =>
  `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;

// used in arrival time in ride cards
export const getFormattedDate = (date) => {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

export const inputStyling =
  "outline-1 outline-zinc-200 focus:outline-theme_medium_1 text-sm font-normal hover:outline-theme_medium_1";

export const autocompleteStyling =
  "w-full md:max-w-full min-w-[100px] px-3 py-2 outline outline-1 outline-zinc-200 rounded focus:outline-theme_medium_1 text-sm font-normal hover:outline-theme_medium_1";

export const capitalizeFirstLetter = (val) => {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
};

export const bigButtonStyling1 =
  "bg-theme_medium_1 text-white px-4 py-2 rounded-md hover:bg-theme_dark_1 hover:text-white text-center";

export const bigButtonStyling2 =
  "bg-theme_medium_2 text-white px-4 py-2 rounded-md hover:bg-theme_dark_2 hover:text-white text-center";

export const handleShowPopupMessage = (
  setPopupMessageInfo,
  status,
  message
) => {
  setPopupMessageInfo({ status: status, message: message });
  setTimeout(() => setPopupMessageInfo({ status: "", message: "" }), 1500);
};

// airports riders commonly travel to, matched against a location's name and
// address. Each gets its own color so e.g. PHL and EWR are hard to confuse.
// Zip codes are only used where they cover the airport alone.
const AIRPORTS = [
  {
    code: "PHL",
    city: "Philadelphia",
    short: "PHL Airport",
    name: "Philadelphia International Airport",
    match: /philadelphia international airport|\bPHL\b/i,
    className: "bg-emerald-100 text-emerald-900 border-emerald-400",
  },
  {
    code: "EWR",
    city: "Newark",
    short: "Newark Airport",
    name: "Newark Liberty International Airport",
    match: /newark liberty international airport|\bEWR\b|NJ 07114/i,
    className: "bg-amber-100 text-amber-900 border-amber-400",
  },
  {
    code: "JFK",
    city: "New York JFK",
    short: "JFK Airport",
    name: "John F. Kennedy International Airport",
    match: /kennedy international airport|NY 11430/i,
    className: "bg-indigo-100 text-indigo-900 border-indigo-400",
  },
  {
    code: "LGA",
    city: "New York LaGuardia",
    short: "LaGuardia Airport",
    name: "LaGuardia Airport",
    match: /laguardia airport|NY 11371/i,
    className: "bg-cyan-100 text-cyan-900 border-cyan-400",
  },
  {
    code: "TTN",
    city: "Trenton",
    short: "Trenton Airport",
    name: "Trenton-Mercer Airport",
    match: /trenton[- ]mercer airport/i,
    className: "bg-lime-100 text-lime-900 border-lime-500",
  },
];

// returns the airport a location ({ name, address }) is at, or null
export const getAirport = (location) => {
  if (!location) return null;
  const text = `${location.name || ""} ${location.address || ""}`;
  return AIRPORTS.find((airport) => airport.match.test(text)) || null;
};

// a short name for ride cards, e.g. "Newark Airport" instead of
// "Newark Liberty International Airport"
export const getShortPlaceName = (location) =>
  getAirport(location)?.short || location.name;

// The full name of an airport location, e.g. "Newark Liberty International
// Airport (EWR)" for airports the app knows, or the place's own name for any
// other place with "Airport" in its name. Null if the location isn't an
// airport.
export const getAirportFullName = (location) => {
  if (!location) return null;
  const airport = getAirport(location);
  if (airport) return `${airport.name} (${airport.code})`;
  const name = location.name || "";
  return /\bairport\b/i.test(name) ? name : null;
};

// a colored "✈ Philadelphia (PHL)" label for airport locations
export const renderAirportBadge = (location) => {
  const airport = getAirport(location);
  return (
    airport && (
      <span
        className={`inline-flex items-center gap-1 self-center px-2 py-0.5 my-1 rounded-full border text-sm font-semibold whitespace-nowrap ${airport.className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-4"
          aria-hidden="true"
        >
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
        </svg>
        {airport.city} ({airport.code})
      </span>
    )
  );
};

// the origin and destination formatting in ride cards
export const renderToAndFrom = (ride) => {
  return (
    <p className="text-xl flex items-center justify-center gap-2">
      <span className="flex text-center flex-col">
        <strong>{ride.origin["name"]}</strong>
        {renderAirportBadge(ride.origin)}
        <span className="text-sm">
          {ride.origin["address"].split(" ").slice(0, -2).join(" ")}
        </span>
      </span>
      →
      <span className="flex text-center flex-col">
        <strong>{ride.destination["name"]}</strong>
        {renderAirportBadge(ride.destination)}
        <span className="text-sm">
          {ride.destination["address"].split(" ").slice(0, -2).join(" ")}
        </span>
      </span>
    </p>
  );
};

// converts a Google Places result into the { address, name, id } shape rides store
export const placeToLocation = (place) => ({
  address: place.formatted_address,
  name: place.name,
  id: place.place_id,
});

export const renderRideNote = (ride) => {
  return (
    ride.note && (
      <div className="mb-0.5">
        <span className="font-semibold">Note:</span>
        <div className="py-2 px-3 bg-zinc-100 rounded-lg">
          <p className="break-words">{ride.note}</p>
        </div>
      </div>
    )
  );
};

// used in AllRides and MyRides to render ride card info
export const renderRideCardInfo = (ride, { showRiders = false } = {}) => {
  return (
    <>
      <div className="flex flex-col gap-2">
        {renderToAndFrom(ride)}
        <p className="mt-2 mb-1 text-center">
          <span className="px-3 py-1 bg-zinc-200 rounded-full whitespace-nowrap">
            Arrives by {getFormattedDate(new Date(ride.arrival_time))}
          </span>
        </p>
      </div>
      <hr className="border-1 my-3 border-theme_medium_1" />
      <p>
        <span className="font-semibold">Posted by:</span>{" "}
        <span>{ride.admin_name}</span>{" "}
        <CopyEmailButton
          copy={[ride.admin_email]}
          text="Copy Email"
          className="inline-flex text-theme_medium_2 hover:text-theme_dark_2 ml-1 mb-0.5 align-middle"
        />
      </p>
      <p>
        <span className="font-semibold">Seats Taken:</span>{" "}
        {ride.current_riders.length}/{ride.max_capacity}
      </p>
      {showRiders && (
        <p>
          <span className="font-semibold">Riders:</span>{" "}
          {ride.current_riders.length > 0 ? (
            ride.current_riders.map((rider) => rider[1]).join(", ")
          ) : (
            <span className="text-zinc-500">No riders yet</span>
          )}
        </p>
      )}
      {ride.phone_number && (
        <p>
          <span className="font-semibold">Phone:</span>{" "}
          <a
            href={`tel:+1${ride.phone_number}`}
            className="text-theme_medium_2 hover:text-theme_dark_2"
          >
            {formatPhoneNumber(ride.phone_number)}
          </a>
        </p>
      )}
      {renderRideNote(ride)}
    </>
  );
};

// used in AllRides for flipping origin/dest fields
export const flipFields = (
  origin,
  dest,
  originRef,
  destinationRef,
  setOrigin,
  setDest
) => {
  const tempOrigin = origin;

  setOrigin(dest);
  setDest(tempOrigin);

  if (originRef.current && destinationRef.current) {
    const tempOriginValue = originRef.current.value;
    originRef.current.value = destinationRef.current.value;
    destinationRef.current.value = tempOriginValue;
  }
};

// builds a Google Calendar prefilled event link for a ride (no API needed)
// event ends at the ride's arrival time and starts one hour before
export const getGoogleCalendarUrl = (ride) => {
  const toGoogleDate = (date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const end = new Date(ride.arrival_time);
  const start = new Date(end.getTime() - 60 * 60 * 1000);
  const riderNames = [
    ride.admin_name,
    ...(ride.current_riders || []).map((rider) => rider[1]),
  ];
  const details = `Riders: ${riderNames.join(", ")}\n\nRide page: ${
    window.location.origin
  }/myrides`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Rideshare to ${ride.destination["name"]}`,
    dates: `${toGoogleDate(start)}/${toGoogleDate(end)}`,
    location: `${ride.origin["name"]}, ${ride.origin["address"]}`,
    details: details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
