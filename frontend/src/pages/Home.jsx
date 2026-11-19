import { useEffect, useMemo, useRef, useState } from "react";
import Autocomplete from "react-google-autocomplete";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PopUpMessage from "../components/PopUpMessage.jsx";
import RideshareCard from "../components/lift/RideshareCard.jsx";
import RideRequestCard from "../components/lift/RideRequestCard.jsx";
import CreateRideModal from "../components/CreateRideModal.jsx";
import DateTimePicker from "../components/DateTimePicker.jsx";
import Label from "../components/lift/Label.jsx";
import LiftButton from "../components/lift/LiftButton.jsx";
import {
  RideCardSkeleton,
  ErrorState,
} from "../components/lift/PageStates.jsx";
import searchIcon from "../assets/figma/search.svg";
import useRidesData, { notifyRidesChanged } from "../utils/useRidesData";
import useIsMobile from "../utils/useIsMobile";
import { respondToRequest } from "../utils/rideApi";
import { getShortPlaceName, handleShowPopupMessage } from "../utils/utils";
import {
  QUICK_FILTERS,
  formatRideTime,
  getFirstName,
  getNextTrip,
  getArrivalBounds,
  getRideCardStatus,
  rideMatchesFilters,
  rideMatchesSearch,
} from "../utils/rides";

// autocomplete options for the origin / destination filters
const autocompleteOptions = {
  fields: ["formatted_address", "geometry", "name", "place_id"],
  types: ["establishment", "geocode"], // This will show both businesses and addresses
};

const filterInputClasses =
  "w-full min-w-0 px-3 py-2 max-md:min-h-11 bg-lift-surface border border-lift-border-strong rounded-lg text-sm max-md:text-base focus:outline focus:outline-2 focus:outline-lift-inverse placeholder:text-lift-secondary";

const filterLabelClasses =
  "text-small-m font-semibold md:text-sm md:leading-5 md:font-medium";

// The card's button for each card state: everything leads to Ride Details,
// where the user requests to join or manages the ride.
const getCardAction = (ride, status, requestStatus) => {
  const to = `/rides/${ride.id}`;
  switch (status) {
    case "full":
      return { label: "Full", disabled: true };
    case "yours":
      return { label: "Open", to };
    case "requested":
      return { label: "Open", to, variant: "outline" };
    default:
      return {
        label:
          requestStatus === "removed" ? "Request Again" : "Request to Join",
        to,
      };
  }
};

// Home: find a ride. Built from the Figma "Web" (53:579) and
// "Mobile-Homepage" (10:603) frames.
export default function Home({ user_info }) {
  const { dashboard, myRides, isLoading, error, reload, refresh } =
    useRidesData();
  const [query, setQuery] = useState("");
  // place and arrival-time filters, behind the "Filters" button
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [originFilter, setOriginFilter] = useState(null);
  const [destinationFilter, setDestinationFilter] = useState(null);
  const [afterDate, setAfterDate] = useState(null);
  const [afterTime, setAfterTime] = useState(null);
  const [beforeDate, setBeforeDate] = useState(null);
  const [beforeTime, setBeforeTime] = useState(null);
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const google_api_key = import.meta.env.VITE_GOOGLE_API_KEY;
  const isMobile = useIsMobile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null); // "rideid:netid" in progress
  const [popupMessageInfo, setPopupMessageInfo] = useState({
    status: "",
    message: "",
  });

  const rides = useMemo(() => dashboard?.rides || [], [dashboard]);
  const filters = useMemo(
    () => ({
      origin: originFilter,
      destination: destinationFilter,
      ...getArrivalBounds({ afterDate, afterTime, beforeDate, beforeTime }),
    }),
    [
      originFilter,
      destinationFilter,
      afterDate,
      afterTime,
      beforeDate,
      beforeTime,
    ]
  );
  const activeFilterCount = [
    originFilter,
    destinationFilter,
    afterDate,
    beforeDate,
  ].filter(Boolean).length;
  const visibleRides = useMemo(
    () =>
      rides.filter(
        (ride) =>
          rideMatchesSearch(ride, query) && rideMatchesFilters(ride, filters)
      ),
    [rides, query, filters]
  );

  const clearFilters = () => {
    setOriginFilter(null);
    setDestinationFilter(null);
    setAfterDate(null);
    setAfterTime(null);
    setBeforeDate(null);
    setBeforeTime(null);
    if (originInputRef.current) originInputRef.current.value = "";
    if (destinationInputRef.current) destinationInputRef.current.value = "";
  };

  const clearSearchAndFilters = () => {
    setQuery("");
    clearFilters();
  };
  const nextTrip = getNextTrip(myRides);

  // pending requests to join the user's upcoming rides
  const pendingRequests = (myRides?.upcoming_posted_rides || []).flatMap(
    (ride) =>
      ride.requested_riders.map(([netid, fullName, , note]) => ({
        ride,
        netid,
        fullName,
        note,
      }))
  );

  // a quick-filter chip is "on" when its word is the whole search
  const activeChip = QUICK_FILTERS.find(
    (chip) => chip.toLowerCase() === query.trim().toLowerCase()
  );

  const handleRespond = async (pendingRequest, action) => {
    setRespondingTo(`${pendingRequest.ride.id}:${pendingRequest.netid}`);
    const result = await respondToRequest(
      pendingRequest.ride,
      pendingRequest.netid,
      action
    );
    handleShowPopupMessage(setPopupMessageInfo, result.success, result.message);
    await refresh();
    setRespondingTo(null);
  };

  // The nav bar's "Create a rideshare" button (desktop) and + button (mobile)
  // navigate here with state { openCreate: true }. Open the form, then clear
  // that state so a refresh or back navigation does not reopen it.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (location.state?.openCreate) {
      setIsCreateOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // after the create form submits: refresh open pages, show the result
  const handleRideCreated = (responseData) => {
    handleShowPopupMessage(
      setPopupMessageInfo,
      responseData.success,
      responseData.message
    );
    if (responseData.success) {
      notifyRidesChanged();
    }
  };

  return (
    <div className="text-lift-ink md:pb-24">
      {popupMessageInfo.message && (
        <PopUpMessage
          status={popupMessageInfo.status}
          message={popupMessageInfo.message}
        />
      )}

      <CreateRideModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleRideCreated}
      />

      {nextTrip && (
        <Link
          to={`/rides/${nextTrip.id}`}
          className="flex items-center justify-center gap-2 flex-wrap min-h-12 px-4 py-3 bg-lift-accent hover:bg-lift-accent-pressed text-sm leading-5 font-medium text-center"
        >
          You have an upcoming trip!
          <span className="underline">
            {formatRideTime(nextTrip.arrival_time)} to{" "}
            {getShortPlaceName(nextTrip.destination)}
          </span>
        </Link>
      )}

      <div className="max-w-[1184px] mx-auto px-5 md:px-8 pt-8 md:pt-24 flex flex-col gap-6 md:gap-9">
        <section className="flex flex-col gap-4 md:gap-6">
          <h1 className="font-display font-extrabold text-display-m md:text-display break-words">
            Where to, {getFirstName(user_info?.displayname) || "there"}?
          </h1>

          <div className="flex items-stretch gap-2">
            <div className="flex flex-1 min-w-0 items-center gap-2 px-3 py-4 md:p-4 border border-lift-inverse rounded-lg bg-lift-surface focus-within:outline focus-within:outline-2 focus-within:outline-lift-inverse">
              <img src={searchIcon} alt="" width="24" height="24" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                // shorter on phones, where the Filters button shares the row
                placeholder={
                  isMobile ? "Search rides…" : "Search rides and times..."
                }
                aria-label="Search rides by place, poster, day or time"
                className="flex-1 min-w-0 bg-transparent outline-none text-small-m font-semibold md:text-sm md:leading-5 md:font-medium placeholder:text-lift-ink"
              />
            </div>
            <LiftButton
              variant={activeFilterCount > 0 ? "primary" : "outline"}
              className="h-auto rounded-lg shrink-0 max-md:px-4"
              onClick={() => setFiltersOpen(!filtersOpen)}
              aria-expanded={filtersOpen}
              aria-controls="ride-filters"
            >
              Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
            </LiftButton>
          </div>

          {/* Place and arrival-time filters, like the old search. Kept mounted
              (just hidden) so the place inputs keep their text. */}
          <div
            id="ride-filters"
            className={`${filtersOpen ? "flex" : "hidden"} bg-lift-surface border border-lift-border rounded-lg p-4 md:p-5 flex-col gap-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className={filterLabelClasses}>Origin</span>
                <Autocomplete
                  apiKey={google_api_key}
                  options={autocompleteOptions}
                  placeholder="Any origin"
                  className={filterInputClasses}
                  ref={originInputRef}
                  onPlaceSelected={(place) =>
                    place?.place_id && setOriginFilter(place)
                  }
                  // clearing the text clears the filter
                  onChange={(e) => !e.target.value && setOriginFilter(null)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={filterLabelClasses}>Destination</span>
                <Autocomplete
                  apiKey={google_api_key}
                  options={autocompleteOptions}
                  placeholder="Any destination"
                  className={filterInputClasses}
                  ref={destinationInputRef}
                  onPlaceSelected={(place) =>
                    place?.place_id && setDestinationFilter(place)
                  }
                  onChange={(e) =>
                    !e.target.value && setDestinationFilter(null)
                  }
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className={filterLabelClasses}>Arrive after</span>
                <DateTimePicker
                  date={afterDate}
                  setDate={setAfterDate}
                  time={afterTime}
                  setTime={setAfterTime}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className={filterLabelClasses}>Arrive before</span>
                <DateTimePicker
                  date={beforeDate}
                  setDate={setBeforeDate}
                  time={beforeTime}
                  setTime={setBeforeTime}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-small-m md:text-sm md:leading-5 text-lift-secondary">
                Pick a place from the suggestions. A date without a time covers
                the whole day.
              </p>
              {activeFilterCount > 0 && (
                <LiftButton variant="outline" onClick={clearFilters}>
                  Clear filters
                </LiftButton>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1" aria-label="Quick filters">
            {QUICK_FILTERS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(activeChip === chip ? "" : chip)}
                aria-pressed={activeChip === chip}
                className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-lift-inverse"
              >
                <Label
                  size="chip"
                  tone={activeChip === chip ? "active" : "neutral"}
                >
                  {chip}
                </Label>
              </button>
            ))}
          </div>
        </section>

        {pendingRequests.length > 0 && (
          <section
            className="flex flex-col gap-2"
            aria-labelledby="requests-heading"
          >
            <h2
              id="requests-heading"
              className="font-display font-bold text-h2-m md:font-semibold md:text-h3"
            >
              Requests to join your rides
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingRequests.map((pendingRequest) => {
                const key = `${pendingRequest.ride.id}:${pendingRequest.netid}`;
                return (
                  <RideRequestCard
                    key={key}
                    ride={pendingRequest.ride}
                    fullName={pendingRequest.fullName}
                    note={pendingRequest.note}
                    isResponding={respondingTo === key}
                    onRespond={(action) =>
                      handleRespond(pendingRequest, action)
                    }
                  />
                );
              })}
            </div>
          </section>
        )}

        <section
          className="flex flex-col gap-2"
          aria-labelledby="rides-heading"
        >
          <div className="flex items-center justify-between">
            <h2
              id="rides-heading"
              className="font-display font-bold text-h2-m md:text-h2"
            >
              Rideshares
            </h2>
            {!isLoading && !error && (
              <p className="text-small-m font-semibold md:text-body-lg md:font-normal">
                {visibleRides.length}{" "}
                {visibleRides.length === 1 ? "ride" : "rides"}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <RideCardSkeleton key={i} />
              ))}
              <span className="sr-only">Loading rideshares…</span>
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={() => reload()} />
          ) : visibleRides.length === 0 ? (
            <div className="bg-lift-surface border border-dashed border-lift-border-strong rounded-lg p-8 flex flex-col items-center gap-3 text-center">
              {query.trim() || activeFilterCount > 0 ? (
                <>
                  <p className="font-semibold text-subhead-m md:text-subhead">
                    {query.trim()
                      ? `No rides match “${query.trim()}”`
                      : "No rides match your filters"}
                  </p>
                  <p className="text-lift-secondary">
                    Try a different place, day or time.
                  </p>
                  <LiftButton variant="outline" onClick={clearSearchAndFilters}>
                    {activeFilterCount > 0
                      ? "Clear search and filters"
                      : "Clear search"}
                  </LiftButton>
                </>
              ) : (
                <>
                  <p className="font-semibold text-subhead-m md:text-subhead">
                    No upcoming rideshares yet
                  </p>
                  <p className="text-lift-secondary">
                    Post one with “Create a rideshare” and others can join you.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleRides.map((ride) => {
                const requestStatus = dashboard.ridereqs[ride.id];
                const status = getRideCardStatus(
                  ride,
                  dashboard.user_info.netid,
                  requestStatus
                );
                return (
                  <RideshareCard
                    key={ride.id}
                    ride={ride}
                    status={status}
                    requestStatus={requestStatus}
                    action={getCardAction(ride, status, requestStatus)}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
