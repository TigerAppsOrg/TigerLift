import { useRef, useState } from "react";
import Autocomplete from "react-google-autocomplete";
import { Input } from "antd";
import Modal from "./Modal.jsx";
import Dropdown from "./Dropdown.jsx";
import IconButton from "./IconButton.jsx";
import DateTimePicker from "./DateTimePicker.jsx";
import CustomTextArea from "./TextArea.jsx";
import WarningModal from "./WarningModal.jsx";
import LiftButton from "./lift/LiftButton.jsx";
import {
  MAX_CAPACITY,
  NOTE_MAX_LENGTH,
  autocompleteStyling,
  flipFields,
  normalizePhoneNumber,
  placeToLocation,
  renderToAndFrom,
} from "../utils/utils";

// autocomplete options for location input
const autocompleteOptions = {
  fields: ["formatted_address", "geometry", "name", "place_id"],
  types: ["establishment", "geocode"], // This will show both businesses and addresses
};

// make capacity dropdown options
const capacityOptions = Array.from({ length: MAX_CAPACITY }, (_, i) => ({
  value: i + 1,
  label: i + 1,
}));

// "Create a Rideshare" form. Opened from the navbar on any page.
// onCreated(responseData) is called after the server responds.
export default function CreateRideModal({ isOpen, onClose, onCreated }) {
  const google_api_key = import.meta.env.VITE_GOOGLE_API_KEY; // Google API key from environment variables

  const originRef = useRef(null);
  const destinationRef = useRef(null);

  const [origin, setOrigin] = useState(null);
  const [capacity, setCapacity] = useState("");
  const [dest, setDest] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [rideNote, setRideNote] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isCreatingRide, setIsCreatingRide] = useState(false);

  // validation warning, e.g. for a missing field
  const [validationModal, setValidationModal] = useState(null); // { title, message }

  // Closes the modal and resets the form
  const handleClose = () => {
    setCapacity("");
    setOrigin(null);
    setDest(null);
    setDate("");
    setTime("");
    setRideNote("");
    setPhoneNumber("");
    originRef.current = null;
    destinationRef.current = null;
    onClose();
  };

  const onChange = (e, setFunction) => {
    if (!e.target.value) {
      setFunction(null);
    }
  };

  // Checks if all necessary fields are filled in before creating the ride
  const checkCreateRideParams = () => {
    let arrivalTime = null;
    if (date && time) {
      arrivalTime = new Date(
        `${date.format("YYYY-MM-DD")}T${time.format("HH:mm:ss")}`
      );
    }

    if (arrivalTime && Date.now() >= arrivalTime.getTime()) {
      setValidationModal({
        title: "Invalid Input",
        message: "Cannot enter a date in the past.",
      });
      return;
    }

    if (
      !capacity ||
      !origin ||
      !dest ||
      !date ||
      !time ||
      !phoneNumber.trim() ||
      !date.isValid() ||
      !time.isValid()
    ) {
      setValidationModal({
        title: "Missing fields",
        message: "You must provide all fields to create a ride.",
      });
      return;
    }

    if (!normalizePhoneNumber(phoneNumber)) {
      setValidationModal({
        title: "Invalid Input",
        message: "Please enter a valid 10-digit phone number.",
      });
      return;
    }

    createRide(arrivalTime);
  };

  // Creates ride by making API call to /addride
  const createRide = async (arrivalTime) => {
    setIsCreatingRide(true);
    let responseData = {
      success: false,
      message: "Failed to create rideshare.",
    };
    try {
      const response = await fetch("/api/addride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capacity: capacity["label"],
          origin: origin,
          destination: dest,
          arrival_time: arrivalTime.toISOString(),
          note: rideNote,
          phone_number: phoneNumber,
        }),
      });
      responseData = await response.json();
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    setIsCreatingRide(false);
    if (responseData.success) {
      handleClose();
    }
    onCreated(responseData);
  };

  return (
    <>
      {/* Modal returns early before its hooks when closed, so only mount it
          while open */}
      {isOpen && (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={"Create a Rideshare"}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="font-medium">Capacity</p>
                <p className="text-sm text-lift-secondary mb-1">
                  Number of people you&apos;d like to rideshare with, not
                  including yourself
                </p>
                <Dropdown
                  inputValue={capacity}
                  setInputValue={setCapacity}
                  options={capacityOptions}
                  isClearable
                  placeholder="Select capacity"
                />
              </div>
              <div className="flex flex-col">
                <p className="font-medium mb-1">Origin & Destination</p>
                <div className="flex items-center space-x-2 w-full justify-between max-md:grid max-md:grid-cols-[1fr_auto] max-md:gap-2 max-md:space-x-0">
                  <Autocomplete
                    key={"createOrigin"}
                    className={autocompleteStyling}
                    apiKey={google_api_key}
                    placeholder="Enter origin"
                    onPlaceSelected={(place) => {
                      setOrigin(place); // Store selected place details in state
                    }}
                    onChange={(e) => onChange(e, setOrigin)}
                    options={autocompleteOptions}
                    ref={originRef}
                  />
                  <IconButton
                    className="flex-none w-9 h-9 hover:bg-lift-subtle max-md:col-start-2 max-md:row-start-1 max-md:row-span-2 max-md:self-center"
                    type="flip"
                    ariaLabel="Swap origin and destination"
                    onClick={() =>
                      flipFields(
                        origin,
                        dest,
                        originRef,
                        destinationRef,
                        setOrigin,
                        setDest
                      )
                    }
                  ></IconButton>
                  <Autocomplete
                    key={"createDestination"}
                    className={`${autocompleteStyling} max-md:col-start-1`}
                    apiKey={google_api_key}
                    placeholder="Enter destination"
                    onPlaceSelected={(place) => {
                      setDest(place); // Store selected place details in state
                    }}
                    onChange={(e) => onChange(e, setDest)}
                    options={autocompleteOptions}
                    ref={destinationRef}
                  />
                </div>
                {/* preview so riders can confirm e.g. PHL vs EWR before posting */}
                {origin?.formatted_address && dest?.formatted_address && (
                  <div className="mt-3 py-2 rounded-lg bg-lift-subtle">
                    {renderToAndFrom({
                      origin: placeToLocation(origin),
                      destination: placeToLocation(dest),
                    })}
                  </div>
                )}
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
                <p className="font-medium">Phone Number</p>
                <p className="text-sm text-lift-secondary mb-1">
                  Only shown to riders you accept
                </p>
                <Input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className="max-md:!h-11"
                  placeholder="(609) 555-1234"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  maxLength={20}
                />
              </div>
              <div>
                <p className="font-medium mb-1">Optional Note to Riders</p>
                <CustomTextArea
                  placeholder={`Add an optional note here, such as a suggested time to meet up, if you're flexible with the arrival time, or anything else. (Max ${NOTE_MAX_LENGTH} characters).`}
                  inputValue={rideNote}
                  setInputValue={setRideNote}
                  maxLength={NOTE_MAX_LENGTH}
                />
              </div>
            </div>
            <LiftButton
              className="self-end max-md:self-stretch"
              onClick={checkCreateRideParams}
              loading={isCreatingRide}
            >
              Create rideshare
            </LiftButton>
          </div>
        </Modal>
      )}
      {validationModal && (
        <WarningModal
          isOpen={!!validationModal}
          onClose={() => setValidationModal(null)}
          title={validationModal.title}
        >
          <div className="flex flex-col gap-3">
            <p>{validationModal.message}</p>
            <LiftButton
              className="self-end max-md:self-stretch"
              onClick={() => setValidationModal(null)}
            >
              Okay
            </LiftButton>
          </div>
        </WarningModal>
      )}
    </>
  );
}
