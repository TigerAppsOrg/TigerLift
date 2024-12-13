import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DateTimePicker from "../components/DateTimePicker.jsx";
import RideCard from "../components/RideCard.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Dropdown from "../components/Dropdown.jsx";
import IconButton from "../components/IconButton.jsx";
import dayjs from "dayjs";
import PopUpMessage from "../components/PopUpMessage.jsx";
import LoadingIcon from "../components/LoadingIcon.jsx";
import Autocomplete from "react-google-autocomplete";
import CopyEmailButton from "../components/CopyEmailButton.jsx";
import CustomTextArea from "../components/TextArea.jsx";
import WarningModal from "../components/WarningModal.jsx";

import {
  getFormattedDate,
  MAX_CAPACITY,
  autocompleteStyling,
} from "../utils/utils.js";

export default function AllRides() {
  const google_api_key = import.meta.env.VITE_GOOGLE_API_KEY;

  const [pendingRideId, setPendingRideId] = useState([]);

  const [dashboardData, setDashboardData] = useState({
    user_info: null,
    rides: [],
    ridereqs: {},
  });

  const [loading, setLoading] = useState(true);
  const [ridesData, setRidesData] = useState([]);
  const [createRideModal, setCreateRideModal] = useState(false);

  const [popupMessageInfo, setPopupMessageInfo] = useState({
    status: "",
    message: "",
  });
  const [showValidationModal, setShowValidationModal] = useState(false);

  const [capacity, setCapacity] = useState("");
  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const isInitialRender = useRef(true);

  const [origin, setOrigin] = useState(null);
  const [dest, setDest] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [rideNote, setRideNote] = useState("");
  const [isCreatingRide, setIsCreatingRide] = useState(false);

  const searchOriginRef = useRef(null);
  const searchDestinationRef = useRef(null);
  const [searchOrigin, setSearchOrigin] = useState(null);
  const [searchDest, setSearchDest] = useState(null);
  const [startSearchDate, setStartSearchDate] = useState();
  const [startSearchTime, setStartSearchTime] = useState();
  const [endSearchDate, setEndSearchDate] = useState();
  const [endSearchTime, setEndSearchTime] = useState();

  const autocompleteOptions = {
    // componentRestrictions: { country: "us" },
    fields: ["formatted_address", "geometry", "name", "place_id"],
    types: ["establishment", "geocode"], // This will show both businesses and addresses
  };

  const [inSearch, setInSearch] = useState(false);

  const [locations, setLocations] = useState([]); // delete this later

  const capacity_options = [];

  const capitalizeFirstLetter = (val) => {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  for (let i = 1; i < MAX_CAPACITY + 1; i++) {
    let dict = { value: i, label: i };
    capacity_options.push(dict);
  }

  const handleShowPopupMessage = (status, message) => {
    setPopupMessageInfo({ status: status, message: message });
    setTimeout(() => setPopupMessageInfo({ status: "", message: "" }), 1500);
  };

  const flipCreateRideFields = () => {
    const tempOrigin = origin;

    setOrigin(dest);
    setDest(tempOrigin);

    if (originRef.current && destinationRef.current) {
      const tempOriginValue = originRef.current.value;
      originRef.current.value = destinationRef.current.value;
      destinationRef.current.value = tempOriginValue;
      console.log(originRef.current.value);
      console.log(destinationRef.current.value);
    }

    console.log("Locations flipped!");
  };

  const flipSearchFields = () => {
    const tempSearchOrigin = searchOrigin;

    setSearchOrigin(searchDest);
    setSearchDest(tempSearchOrigin);

    if (searchOriginRef.current && searchDestinationRef.current) {
      const tempSearchOriginValue = searchOriginRef.current.value;
      searchOriginRef.current.value = searchDestinationRef.current.value;
      searchDestinationRef.current.value = tempSearchOriginValue;
    }
  };

  const searchRide = async () => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }


    console.log("in search ride. search origin: ", searchOrigin);

    
    

    if (!searchOrigin && !searchDest && !startSearchDate && !endSearchDate) {
      /*
      alert(
        "You must provide at least one of origin, destination, start date, or end date."
      );
      */
     console.log("dash data fetch 1");
      fetchDashboardData();
     return;
    }
    setLoading(true);
    try {
      console.log("test, am in dashboard searchride");

      console.log("startSearchDate: " + startSearchDate);
      console.log("endSearchDate: " + endSearchDate);

      let start_search_time_string = null;
      let arrival_time_string = null;
      let start_search_time_iso = null;
      let arrival_time_iso = null;

      if (startSearchDate != null) {
        if (startSearchTime != null) {
          start_search_time_string = `${startSearchDate.format(
            "YYYY-MM-DD"
          )}T${startSearchTime.format("HH:mm:ss")}`;
        } else if (startSearchTime == null) {
          const today = dayjs().format("YYYY-MM-DD");
          console.log("today:", today);
          console.log("startsearchdate:", startSearchDate.format("YYYY-MM-DD"));
          if (startSearchDate.format("YYYY-MM-DD") === today) {
            start_search_time_string = `${startSearchDate.format(
              "YYYY-MM-DD"
            )}T${dayjs().format("HH:mm:ss")}`; // defaults to current time to show only upcoming rides if date is today
          } else {
            start_search_time_string = `${startSearchDate.format(
              "YYYY-MM-DD"
            )}T00:00:00`; // defaults to midnight to show all times on this day
          }
        }

        start_search_time_iso = new Date(
          start_search_time_string
        ).toISOString();
      }

      if (endSearchDate != null) {
        if (endSearchTime != null) {
          arrival_time_string = `${endSearchDate.format(
            "YYYY-MM-DD"
          )}T${endSearchTime.format("HH:mm:ss")}`;
        } else if (endSearchTime == null) {
          arrival_time_string = `${endSearchDate.format(
            "YYYY-MM-DD"
          )}T23:59:00`; // defaults to 11:59pm to include all rides on that day
        }

        arrival_time_iso = new Date(arrival_time_string).toISOString();
      }

      console.log("arrive after iso: " + start_search_time_iso);
      console.log("arrive before iso: " + arrival_time_iso);

      const params = new URLSearchParams({
        ...(searchOrigin && { origin: searchOrigin.place_id }),
        ...(searchDest && { destination: searchDest.place_id }),
        ...(start_search_time_string && {
          start_search_time: start_search_time_iso,
        }),
        ...(arrival_time_string && { arrival_time: arrival_time_iso }),
      });

      console.log("params: " + params.toString());

      const response = await fetch(`/api/searchrides?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch rides: ${response.status}`);
      }
      const data = await response.json();
      setRidesData(data.rides);
      setInSearch(true);
      setLoading(false);
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  const checkCreateRideParams = async () => {
    const now = new Date();

    const parsedDate = dayjs(date);
    const parsedTime = dayjs(time);

    if (!parsedDate.isValid() || !parsedTime.isValid()) {
      console.error("Invalid date or time provided:", date, time);
      setShowValidationModal(true); // Show validation error
      return;
    }

    const arrival_time_string = `${date.format("YYYY-MM-DD")}T${time.format(
      "HH:mm:ss"
    )}`;

    const arrival_time_iso = new Date(arrival_time_string);

    if (
      !capacity ||
      !origin ||
      !dest ||
      !date ||
      !time ||
      capacity === "" ||
      origin === "" ||
      dest === "" ||
      date === "" ||
      time === "" ||
      now.getTime() >= arrival_time_iso.getTime()
    ) {
      console.log("SHOWING");
      setShowValidationModal(true); // Show the validation modal
      return;
    } else {
      createRide();
    }
  };

  const createRide = async () => {
    setIsCreatingRide(true);
    const arrival_time_string = `${date.format("YYYY-MM-DD")}T${time.format(
      "HH:mm:ss"
    )}`;
    const arrival_time_iso = new Date(arrival_time_string).toISOString();
    try {
      const response = await fetch("/api/addride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capacity: capacity["label"],
          origin: origin, // .name,
          destination: dest, // .name,
          arrival_time: arrival_time_iso,
          note: rideNote,
        }),
      });
      const responseData = await response.json();
      handleCloseRideModal();
      resetSearch();
      setInSearch(false);
      handleShowPopupMessage(responseData.success, responseData.message);
      console.log("dash data fetch 2");
      await fetchDashboardData();
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    setLoading(false);
    setIsCreatingRide(false);
  };

  const handleOpenRideModal = async () => {
    setCreateRideModal(true);
  };

  const handleCloseRideModal = async () => {
    setCreateRideModal(false);
    setCapacity("");
    setOrigin("");
    setDest("");
    setDate("");
    setTime("");
    setRideNote("");
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      setDashboardData(data);
      console.log(data.rides);
      setRidesData(data.rides);
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    setLoading(false);
  };

  const handleRideRequest = async (
    rideid,
    origin,
    destination,
    arrival_time
  ) => {
    console.log("IN HANDLE RIDE REQUEST");

    setPendingRideId((prev) => [...prev, rideid]);
    try {
      console.log("ARRIVAL TIME DASHBOARD ", arrival_time);

      const formattedArrivalTime = dayjs(arrival_time)
        .tz("America/New_York")
        .format("MMMM D, YYYY, h:mm A");

      const response = await fetch("/api/requestride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideid: rideid,
          origin_name: origin["name"],
          destination_name: destination["name"],
          formatted_arrival_time: formattedArrivalTime,
        }),
      });
      console.log("dash data fetch 3");
      await fetchDashboardData();
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    if (searchOrigin || searchDest || startSearchDate || endSearchDate) {
      searchRide();
    }
    setPendingRideId((prev) => prev.filter((id) => id !== rideid));
  };

  const resetSearch = async () => {
    if (searchOriginRef.current.value) {
      searchOriginRef.current.value = "";
    }
    if (searchDestinationRef.current.value) {
      searchDestinationRef.current.value = "";
    }
    setSearchOrigin("");
    setSearchDest("");
    setStartSearchDate(null);
    setStartSearchTime(null);
    setEndSearchDate(null);
    setEndSearchTime(null);
    setLoading(true);
    setInSearch(false);
    console.log("dash data fetch 4");
    await fetchDashboardData();
    setLoading(false);
  };

  
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    console.log("dash data fetch 5");
    fetchDashboardData();
  }, []);

  useEffect(() => {
    searchRide();
  }, [searchOrigin, searchDest, startSearchDate, endSearchDate, startSearchTime, endSearchTime]);

/*
  useEffect(() => {

    if ((startSearchTime && startSearchDate) || (endSearchTime && endSearchDate)) {
      searchRide();
    }

  }, [
    startSearchDate,
    endSearchDate,
    startSearchTime,
    endSearchTime,
  ]);*/

  return (
    <div className="p-8 pb-14">
      {popupMessageInfo.message && (
        <PopUpMessage
          status={popupMessageInfo.status}
          message={popupMessageInfo.message}
        />
      )}
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <Link
            to="/myrides"
            className="hidden md:inline-block bg-theme_medium_1 text-white px-4 py-2 rounded-md hover:bg-theme_dark_1 hover:text-white"
          >
            My Rideshares
          </Link>
          <Button
            className="bg-theme_medium_1 text-white px-4 py-2 hover:bg-theme_dark_1 rounded-md"
            onClick={() => handleOpenRideModal()}
          >
            Create a Rideshare
          </Button>
        </div>
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            inSearch
              ? "lg:grid-cols-[9fr,5fr,5fr,2.5fr]"
              : "lg:grid-cols-[9fr,5fr,5fr]"
          } items-center justify-between pb-4 sm:space-x-3`}
        >
          <div className="grid grid-cols-[5fr,1fr] gap-2 md:flex justify-center mb-3 md:mb-0">
            <div>
              <p className="font-medium mb-1">Origin</p>
              <Autocomplete
                key={"searchOrigin"}
                id={"searchOrigin"}
                className={autocompleteStyling}
                apiKey={google_api_key}
                placeholder="Enter origin"
                onPlaceSelected={(place) => {
                  console.log("setting origin to: ", place);
                  // if enter is hit
                  if (place.name == "") {
                    console.log("setting origin name to null");
                    setSearchOrigin(null);
                  }
                  else {
                    setSearchOrigin(place);
                  }
                }}
                // if user deletes input from field
                onChange={(e) => {
                  if (!e.target.value) {
                    setSearchOrigin(null);
                  }
                }}
                options={autocompleteOptions}
                ref={searchOriginRef}
              />
            </div>
            <IconButton
              className="flex-none mt-[27px] w-9 h-9 hover:bg-theme_medium_2"
              type="flip"
              onClick={flipSearchFields}
            ></IconButton>
            <div className="flex flex-col">
              <p className="font-medium mb-1">Destination</p>
              <Autocomplete
                key={"searchDestination"}
                id={"searchDest"}
                className={autocompleteStyling}
                apiKey={google_api_key}
                placeholder="Enter destination"
                onPlaceSelected={(place) => {
                  console.log("setting dest to: ", place);
                  if (place.name == "") {
                    console.log("setting dest name to null");
                    setSearchDest(null);
                  }
                  else {
                    setSearchDest(place);
                  }
                }}
                // if user deletes input from field
                onChange={(e) => {
                  if (!e.target.value) {
                    setSearchDest(null);
                  }
                }}
                options={autocompleteOptions}
                ref={searchDestinationRef}
              />
            </div>
          </div>
          <div className="flex justify-start md:justify-center mb-2 sm:mb-0">
            <div className="flex flex-col">
              <p className="font-medium mb-1">Arrive After</p>
              <DateTimePicker
                date={startSearchDate}
                //setDate={setStartSearchDate}
                setDate={(value) => {
                  setStartSearchDate(value);
                  if (value === null) {
                    console.log("start date cleared");
                    //searchRide();
                    setStartSearchDate(null);
                    console.log("start date state:", startSearchDate.format("YYYY-MM-DD"));
                  }
                }}
                time={startSearchTime}
                //setTime={setStartSearchTime}
                setTime={(value) => {
                  setStartSearchTime(value);
                  if (value === null) {
                    console.log("start time cleared");
                    //searchRide();
                    setStartSearchTime(null);
                    console.log("start time state:", startSearchTime.format("HH:mm:ss"));
                  }
                }}
              />
            </div>
          </div>
          <div className="flex justify-start md:justify-center">
            <div className="flex flex-col">
              <p className="font-medium mb-1">Arrive Before</p>
              <DateTimePicker
                date={endSearchDate}
                //setDate={setEndSearchDate}
                setDate={(value) => {
                  setEndSearchDate(value);
                  if (value === null) {
                    console.log("end date cleared");
                    //searchRide();
                    setEndSearchDate(null);
                    console.log("end date state:", endSearchDate.format("YYYY-MM-DD"));
                  }
                }}
                time={endSearchTime}
                //setTime={setEndSearchTime}
                setTime={(value) => {
                  setEndSearchTime(value);
                  if (value === null) {
                    console.log("end time cleared");
                    //searchRide();
                    setEndSearchTime(null);
                    console.log("end time state:", endSearchTime.format("HH:mm:ss"));
                  }
                }}
              />
            </div>
          </div>
          {inSearch && (
            <div>
              <Button
                onClick={resetSearch}
                className="text-theme_dark_1 px-4 py-2 hover:text-theme_medium_1 font-medium mt-6"
              >
                Clear Search Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingIcon carColor="bg-theme_medium_2" />
      ) : (
        <div>
          <h3 className="text-lg font-medium mt-2 mb-3">
            Upcoming & available rideshares ({ridesData.length})
          </h3>
          {ridesData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {ridesData.map((ride) => (
                <RideCard
                  key={ride.id}
                  buttonText={
                    ride.admin_netid === dashboardData.user_info.netid
                      ? ""
                      : dashboardData.ridereqs[ride.id] !== undefined &&
                        dashboardData.ridereqs[ride.id] !== null
                      ? "Status: " +
                        capitalizeFirstLetter(dashboardData.ridereqs[ride.id])
                      : "Request to Join"
                  }
                  buttonOnClick={
                    dashboardData.ridereqs[ride.id] ||
                    ride.admin_netid === dashboardData.user_info.netid ||
                    ride.current_riders.length === ride.max_capacity
                      ? () => {}
                      : () =>
                          handleRideRequest(
                            ride.id,
                            ride.origin,
                            ride.destination,
                            ride.arrival_time
                          )
                  }
                  buttonClassName={`${
                    ride.admin_netid === dashboardData.user_info.netid
                      ? "cursor-auto"
                      : dashboardData.ridereqs[ride.id]
                      ? "cursor-auto"
                      : "bg-theme_medium_1 text-white hover:bg-theme_dark_1"
                  }`}
                  buttonStatus={dashboardData.ridereqs[ride.id]}
                  buttonLoading={pendingRideId.includes(ride.id)}
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-xl flex items-center justify-center gap-2">
                      <span className="flex text-center flex-col">
                        <strong>{ride.origin["name"]}</strong>
                        <span className="text-sm">
                          {ride.origin["address"]
                            .split(" ")
                            .slice(0, -2)
                            .join(" ")}
                        </span>
                      </span>
                      →
                      <span className="flex text-center flex-col">
                        <strong>{ride.destination["name"]}</strong>
                        <span className="text-sm">
                          {ride.destination["address"]
                            .split(" ")
                            .slice(0, -2)
                            .join(" ")}
                        </span>
                      </span>
                    </p>
                    <p className="mt-2 mb-1 text-center">
                      <span className="px-3 py-1 bg-zinc-200 rounded-full whitespace-nowrap">
                        Arrives by{" "}
                        {getFormattedDate(new Date(ride.arrival_time))}
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
                  {ride.note && (
                    <div className="mb-0.5">
                      <span className="font-semibold">Note:</span>
                      <div className="py-2 px-3 bg-zinc-100 rounded-lg">
                        <p className="break-words">{ride.note}</p>
                      </div>
                    </div>
                  )}
                </RideCard>
              ))}
            </div>
          ) : (
            <p className="text-center">No rides available in this category.</p>
          )}
        </div>
      )}

      {createRideModal && (
        <Modal
          isOpen={createRideModal}
          onClose={handleCloseRideModal}
          title={"Create a Rideshare"}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-medium">Capacity</p>
                <p className="text-sm text-zinc-500 mb-1">
                  Number of people you'd like to rideshare with, not including
                  yourself
                </p>
                <Dropdown
                  inputValue={capacity}
                  setInputValue={setCapacity}
                  options={capacity_options}
                  isClearable
                  placeholder="Select capacity"
                />
              </div>
              <div className="flex flex-col">
                <p className="font-medium mb-1">Origin & Destination</p>
                <div className="flex items-center space-x-2 w-full justify-between">
                  <Autocomplete
                    key={"createOrigin"}
                    className={autocompleteStyling}
                    apiKey={google_api_key}
                    placeholder="Enter origin"
                    onPlaceSelected={(place) => {
                      setOrigin(place); // Store selected place details in state
                    }}
                    options={autocompleteOptions}
                    ref={originRef}
                  />
                  <IconButton
                    className="flex-none w-9 h-9 hover:bg-theme_light_1"
                    type="flip"
                    onClick={flipCreateRideFields}
                  ></IconButton>
                  <Autocomplete
                    key={"createDestination"}
                    className={autocompleteStyling}
                    apiKey={google_api_key}
                    placeholder="Enter destination"
                    onPlaceSelected={(place) => {
                      setDest(place); // Store selected place details in state
                    }}
                    options={autocompleteOptions}
                    ref={destinationRef}
                  />
                </div>
              </div>
              <div>
                <p className="font-medium mb-1">Arrival Time (in ET)</p>
                <DateTimePicker
                  date={date}
                  setDate={setDate}
                  time={time}
                  setTime={setTime}
                />
              </div>
              <div>
                <p className="font-medium mb-1">Optional Note to Riders</p>
                <CustomTextArea
                  placeholder={
                    "Add an optional note here, such as a suggested time to meet up, if you're flexible with the arrival time, or anything else. (Max 200 characters)."
                  }
                  inputValue={rideNote}
                  setInputValue={setRideNote}
                  maxLength={200}
                />
              </div>
            </div>
            <Button
              className="self-start bg-theme_dark_1 py-1.5 px-3 text-white hover:bg-theme_medium_1"
              onClick={checkCreateRideParams}
              loading={isCreatingRide}
            >
              Submit
            </Button>
          </div>
        </Modal>
      )}
      {showValidationModal && (
        <WarningModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          title={"Missing Fields"}
        >
          <div className="flex flex-col gap-3">
            <p>You must provide all fields to create a ride.</p>
            <div className="flex self-end">
              <Button
                onClick={() => setShowValidationModal(false)}
                className="bg-theme_medium_1 text-white hover:bg-theme_dark_1"
              >
                Okay
              </Button>
            </div>
          </div>
        </WarningModal>
      )}
    </div>
  );
}