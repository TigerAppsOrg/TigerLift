import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import RideEditor from "../components/RideEditor";
import RideDetails from "../components/RideDetails";
import Button from "../components/Button";
import PopUpMessage from "../components/PopUpMessage";
import RideshareCard from "../components/lift/RideshareCard";
import RideCardSkeleton from "../components/lift/RideCardSkeleton";
import EmptyState from "../components/lift/EmptyState";
import ErrorBanner from "../components/lift/ErrorBanner";
import carIcon from "../assets/figma/car.svg";
import useAutoRefresh from "../utils/useAutoRefresh";
import useIsMobile from "../utils/useIsMobile";
import { getRideCardStatus } from "../utils/rides";
import { handleShowPopupMessage } from "../utils/utils";

// Your Rides, from Figma "My Rides" (desktop 57:1300, mobile 22:579) with
// its loading, empty and error states. Every ride uses the shared
// RideshareCard; poster-only extras (riders, requests to join) sit in a
// RideDetails panel under the card.

const HIGHLIGHT_MS = 2500;

// tags each ride with whether the user posted or requested it, sorted by arrival
const mergeRides = (posted, requested, newestFirst) =>
  [
    ...posted.map((ride) => ({ ...ride, kind: "posted" })),
    ...requested.map((ride) => ({ ...ride, kind: "requested" })),
  ].sort((a, b) => {
    const diff = new Date(a.arrival_time) - new Date(b.arrival_time);
    return newestFirst ? -diff : diff;
  });

const SECTION_HEADING =
  "font-display text-mobile-h2 md:text-desktop-h2 text-content-primary";
const GROUP_HEADING =
  "text-mobile-subhead md:text-desktop-subhead text-content-primary";

export default function MyRides() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const newRideId = searchParams.get("ride");
  const isMobile = useIsMobile();

  // null until the first successful load
  const [rides, setRides] = useState(null); // { netid, active, past }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showPastRides, setShowPastRides] = useState(false);

  const [editingRideId, setEditingRideId] = useState(null);
  const [cancelRequestRideId, setCancelRequestRideId] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null); // "rideid:netid"
  const [highlightKey, setHighlightKey] = useState(null);

  const [popupMessageInfo, setPopupMessageInfo] = useState({
    status: "",
    message: "",
  });
  const showPopup = (status, message) =>
    handleShowPopupMessage(setPopupMessageInfo, status, message);

  // on phones the editor can open far down the page; bring it into view
  useEffect(() => {
    if (editingRideId === null || !isMobile) return;
    document
      .querySelector('[data-testid="ride-editor"]')
      ?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [editingRideId, isMobile]);

  // fetch user's rides data from the server
  const fetchMyRidesData = async () => {
    try {
      const response = await fetch("/api/myrides");
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      setRides({
        netid: data.user_info?.netid,
        active: mergeRides(
          data.upcoming_posted_rides,
          data.upcoming_requested_rides,
          false,
        ),
        past: mergeRides(
          data.past_posted_rides,
          data.past_requested_rides,
          true,
        ),
      });
      setLoadError(false);
    } catch (error) {
      console.error("Error fetching rides:", error);
      setLoadError(true);
    }
  };

  // pick up changes made by other users, e.g. the poster removing this rider
  useAutoRefresh(fetchMyRidesData);

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchMyRidesData();
    } finally {
      setLoading(false);
    }
  };

  // load rides data, including when navigated to again from notifications
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // A message passed from another page (e.g. "Rideshare successfully
  // created!" from Schedule a Ride). Show it once, then clear it so a
  // refresh does not show it again.
  useEffect(() => {
    const flash = location.state?.flash;
    if (!flash) return;
    showPopup(flash.status, flash.message);
    navigate(location.pathname + location.search, {
      replace: true,
      state: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // After posting, /myrides?ride=<id> scrolls to the new ride and outlines
  // it briefly, then drops the parameter.
  useEffect(() => {
    if (!newRideId || !rides) return;
    const key = `posted-${newRideId}`;
    document
      .querySelector(`[data-ride-id="${key}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlightKey(key);
    const timer = setTimeout(() => {
      setHighlightKey(null);
      setSearchParams({}, { replace: true });
    }, HIGHLIGHT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newRideId, rides !== null]);

  // called by the editor after a save or delete finishes
  const handleEditDone = async (responseData) => {
    showPopup(responseData.success, responseData.message);
    await fetchMyRidesData();
    setEditingRideId(null);
  };

  // cancel user's ride request of rideid
  const handleCancelRideRequest = async (rideid) => {
    setCancelRequestRideId(rideid);
    try {
      const response = await fetch("/api/cancelriderequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideid }),
      });
      const responseData = await response.json();
      showPopup(responseData.success, responseData.message);
      await fetchMyRidesData();
    } catch (error) {
      console.error("Error during fetch:", error);
      showPopup(false, "Couldn't cancel your request. Try again.");
    }
    setCancelRequestRideId(null);
  };

  // accept or deny a request to join one of the user's rides
  const handleRespond = async (ride, netid, action) => {
    setRespondingTo(`${ride.id}:${netid}`);
    try {
      const response = await fetch("/api/respondtorequest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideid: ride.id, requester_id: netid, action }),
      });
      const responseData = await response.json();
      showPopup(responseData.success, responseData.message);
      await fetchMyRidesData();
    } catch (error) {
      console.error("Error during fetch:", error);
      showPopup(false, "Couldn't answer the request. Try again.");
    }
    setRespondingTo(null);
  };

  const getCardAction = (ride, isPast) => {
    if (isPast) return undefined;
    if (ride.kind === "posted") {
      return {
        label: "Edit",
        onClick: () => setEditingRideId(ride.id),
        disabled: editingRideId !== null,
      };
    }
    if (ride.request_status === "pending") {
      return cancelRequestRideId === ride.id
        ? { label: "Cancelling…", disabled: true }
        : {
            label: "Cancel request",
            variant: "outline",
            onClick: () => handleCancelRideRequest(ride.id),
            disabled: cancelRequestRideId !== null,
          };
    }
    return undefined;
  };

  const renderRide = (ride, isPast) => {
    const key = `${ride.kind}-${ride.id}`;

    if (!isPast && ride.kind === "posted" && ride.id === editingRideId) {
      return (
        <div key={key} data-ride-id={key}>
          <RideEditor
            ride={ride}
            onDone={handleEditDone}
            onCancel={() => setEditingRideId(null)}
          />
        </div>
      );
    }

    // getRideCardStatus shows a removed rider the ride as open or full, as
    // Home needs; here it keeps a "Removed" label like the other requests
    const status = isPast
      ? "past"
      : ride.kind === "requested" && ride.request_status === "removed"
        ? "requested"
        : getRideCardStatus(ride, rides.netid, ride.request_status);

    return (
      <div
        key={key}
        data-ride-id={key}
        className={`flex flex-col gap-2 scroll-mt-24 rounded-lg ${
          highlightKey === key
            ? "outline outline-2 outline-offset-2 outline-line-inverse"
            : ""
        }`}
      >
        <RideshareCard
          ride={ride}
          status={status}
          requestStatus={ride.request_status}
          action={getCardAction(ride, isPast)}
        />
        <RideDetails
          ride={ride}
          isPast={isPast}
          respondingTo={respondingTo}
          onRespond={handleRespond}
          // fills the grid row, so side-by-side panels end together
          className="flex-1"
        />
      </div>
    );
  };

  // Two columns on wide screens; a lone ride spans the full width, as in
  // Figma 57:1300.
  const renderGrid = (list, isPast) => (
    <div
      className={`grid grid-cols-1 gap-2 ${
        list.length > 1 ? "lg:grid-cols-2" : ""
      }`}
    >
      {list.map((ride) => renderRide(ride, isPast))}
    </div>
  );

  const renderGroup = (title, list) =>
    list.length > 0 && (
      <div className="flex flex-col gap-2">
        <h3 className={GROUP_HEADING}>
          {title} ({list.length})
        </h3>
        {renderGrid(list, false)}
      </div>
    );

  const renderUpcoming = () => {
    if (!rides) {
      if (loadError && !loading) {
        return (
          <ErrorBanner
            message="Couldn't load your rides. Check your connection."
            onRetry={loadData}
          />
        );
      }
      return (
        <div aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Loading your rides</span>
          <RideCardSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <RideCardSkeleton />
            <RideCardSkeleton />
          </div>
        </div>
      );
    }

    const posted = rides.active.filter((ride) => ride.kind === "posted");
    const requested = rides.active.filter((ride) => ride.kind === "requested");

    return (
      <>
        {loadError && (
          <ErrorBanner
            message="Couldn't refresh your rides. Check your connection."
            onRetry={loadData}
          />
        )}
        {rides.active.length === 0 ? (
          <EmptyState
            icon={carIcon}
            title="No upcoming rides"
            body="Rides you post or join will show up here."
            action={{ label: "Find a ride", to: "/allrides" }}
          />
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            {renderGroup("Rides you posted", posted)}
            {renderGroup("Rides you requested", requested)}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="px-gutter-mobile pt-4 pb-6 md:px-gutter md:py-12 flex flex-col gap-6 md:gap-12">
      {popupMessageInfo.message && (
        <PopUpMessage
          status={popupMessageInfo.status}
          message={popupMessageInfo.message}
        />
      )}
      <h1 className="sr-only">Your Rides</h1>

      <section
        aria-labelledby="upcoming-heading"
        className="flex flex-col gap-2 md:gap-4"
      >
        <h2 id="upcoming-heading" className={SECTION_HEADING}>
          Upcoming
        </h2>
        {renderUpcoming()}
      </section>

      {rides && rides.past.length > 0 && (
        <section
          aria-labelledby={showPastRides ? "activity-heading" : undefined}
          aria-label={showPastRides ? undefined : "Past rides"}
          className="flex flex-col gap-2 md:gap-4"
        >
          <Button
            variant="secondary"
            className="self-start max-md:self-stretch max-md:h-11"
            aria-expanded={showPastRides}
            onClick={() => setShowPastRides(!showPastRides)}
          >
            {showPastRides
              ? "Hide past rides"
              : `Show past rides (${rides.past.length})`}
          </Button>
          {showPastRides && (
            <div className="flex flex-col gap-2 md:gap-4 mt-4 md:mt-8">
              <h2 id="activity-heading" className={SECTION_HEADING}>
                Your Activity
              </h2>
              {renderGrid(rides.past, true)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
