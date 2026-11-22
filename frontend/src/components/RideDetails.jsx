import Button from "./Button";
import CopyEmailButton from "./CopyEmailButton";
import {
  formatPhoneNumber,
  getGoogleCalendarUrl,
  tapTargetInline,
} from "../utils/utils";

// The extras under a ride's shared card on Your Rides: riders, incoming
// requests (with Accept / Deny styled like the Figma Request Card 132:1596),
// contact details, the calendar link and the note.

const LINK = `underline text-content-primary hover:text-content-secondary ${tapTargetInline}`;
const COPY = `inline-flex items-center text-content-secondary hover:text-content-primary ${tapTargetInline}`;

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-mobile-small-bold md:text-desktop-small text-content-secondary">
        {title}
      </p>
      {children}
    </div>
  );
}

// Figma's "Requests" heading: a lime dot (fill-accent) and a subhead, so
// new requests stand out right where they are answered
function RequestsHeading({ count }) {
  return (
    <p className="flex items-center gap-2.5 text-mobile-subhead md:text-desktop-subhead text-content-primary">
      <span
        aria-hidden="true"
        className="inline-block size-6 shrink-0 rounded-full bg-fill-accent"
      />
      Requests to join ({count})
    </p>
  );
}

function Note({ note }) {
  if (!note) return null;
  return (
    <Section title="Note">
      <p className="text-mobile-body md:text-desktop-body text-content-primary break-words">
        “{note}”
      </p>
    </Section>
  );
}

function CalendarLink({ ride }) {
  return (
    <a
      href={getGoogleCalendarUrl(ride)}
      target="_blank"
      rel="noopener noreferrer"
      className={`self-start ${LINK}`}
    >
      Add to Google Calendar
    </a>
  );
}

const riderNames = (ride) =>
  ride.current_riders.map((rider) => rider[1]).join(", ");

function PostedDetails({ ride, respondingTo, onRespond }) {
  const riders = ride.current_riders;
  const requests = ride.requested_riders || [];
  const isFull = riders.length >= ride.max_capacity;

  return (
    <>
      <Section title={`Riders (${riders.length} of ${ride.max_capacity})`}>
        {riders.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {riders.map(([netid, fullName, email]) => (
              <li
                key={netid}
                className="flex flex-wrap items-center justify-between gap-x-3"
              >
                <span className="text-mobile-body md:text-desktop-body text-content-primary">
                  {fullName}
                </span>
                <CopyEmailButton
                  copy={[email]}
                  text="Copy Email"
                  className={COPY}
                />
              </li>
            ))}
            <li>
              <CopyEmailButton
                copy={riders.map((rider) => rider[2])}
                text="Copy All Rider Emails"
                className={COPY}
              />
            </li>
          </ul>
        ) : (
          <p className="text-mobile-small md:text-desktop-small text-content-secondary">
            No riders yet.
          </p>
        )}
      </Section>

      {requests.length > 0 && (
        <div className="flex flex-col gap-2">
          <RequestsHeading count={requests.length} />
          <ul className="flex flex-col gap-3">
            {requests.map(([netid, fullName, , note]) => {
              const key = `${ride.id}:${netid}`;
              const busy = respondingTo === key;
              return (
                <li
                  key={netid}
                  className="bg-surface rounded-lg px-4 py-3 flex flex-col gap-2"
                >
                  <p className="text-mobile-subhead md:text-desktop-subhead text-content-primary">
                    {fullName} wants to join
                  </p>
                  {note && (
                    <p className="text-mobile-body md:text-desktop-body text-content-primary break-words">
                      “{note}”
                    </p>
                  )}
                  <div className="flex gap-3 max-md:flex-col">
                    <Button
                      variant="success"
                      onClick={() => onRespond(ride, netid, "accept")}
                      disabled={isFull || respondingTo !== null}
                      loading={busy}
                      className="max-md:w-full max-md:h-11"
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => onRespond(ride, netid, "reject")}
                      disabled={respondingTo !== null}
                      className="max-md:w-full max-md:h-11"
                    >
                      Deny
                    </Button>
                  </div>
                  {isFull && (
                    <p className="text-mobile-small md:text-desktop-small text-content-secondary">
                      Ride is full. Edit to add seats.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {ride.phone_number && (
        <p className="text-mobile-small md:text-desktop-small text-content-secondary">
          Your phone {formatPhoneNumber(ride.phone_number)}, shown to riders you
          accept
        </p>
      )}
      <Note note={ride.note} />
      <CalendarLink ride={ride} />
    </>
  );
}

function RequestedDetails({ ride }) {
  const accepted = ride.request_status === "accepted";
  return (
    <>
      {ride.request_status === "removed" && (
        <p className="text-mobile-small md:text-desktop-small text-status-danger-text">
          You were removed from this ride. You can request it again from Home.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3">
        <p className="text-mobile-body md:text-desktop-body text-content-primary">
          Posted by {ride.admin_name}
        </p>
        <CopyEmailButton
          copy={[ride.admin_email]}
          text="Copy Email"
          className={COPY}
        />
      </div>
      {/* the card already shows the open seats; list riders only if any */}
      {ride.current_riders.length > 0 && (
        <Section title="Riders">
          <p className="text-mobile-body md:text-desktop-body text-content-primary">
            {riderNames(ride)}
          </p>
        </Section>
      )}
      {accepted && ride.phone_number && (
        <p className="text-mobile-body md:text-desktop-body text-content-primary">
          Phone:{" "}
          <a href={`tel:+1${ride.phone_number}`} className={LINK}>
            {formatPhoneNumber(ride.phone_number)}
          </a>
        </p>
      )}
      <Note note={ride.note} />
      {accepted && <CalendarLink ride={ride} />}
    </>
  );
}

function PastDetails({ ride }) {
  return (
    <p className="text-mobile-small md:text-desktop-small text-content-secondary">
      {ride.kind === "posted"
        ? ride.current_riders.length > 0
          ? `You posted this ride. Rode with: ${riderNames(ride)}`
          : "You posted this ride. No riders."
        : `Posted by ${ride.admin_name}.`}
    </p>
  );
}

/**
 * Props:
 *   ride          a /api/myrides ride tagged with kind "posted" | "requested"
 *   isPast        whether it is a past ride
 *   respondingTo  "rideid:netid" of the request being answered, or null
 *   onRespond     (ride, netid, "accept" | "reject") for incoming requests
 */
export default function RideDetails({ ride, isPast, respondingTo, onRespond }) {
  return (
    <div className="bg-surface-subtle rounded-lg px-4 py-3 flex flex-col gap-3">
      {isPast ? (
        <PastDetails ride={ride} />
      ) : ride.kind === "posted" ? (
        <PostedDetails
          ride={ride}
          respondingTo={respondingTo}
          onRespond={onRespond}
        />
      ) : (
        <RequestedDetails ride={ride} />
      )}
    </div>
  );
}
