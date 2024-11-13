import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Input from "../components/Input";
import DateTimePicker from "../components/DateTimePicker";
import RideCard from "../components/RideCard.jsx";
import Pill from "../components/Pill.jsx";
import Button from "../components/Button.jsx";
import Modal from "../components/Modal.jsx";
import Dropdown from "../components/Dropdown.jsx";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export default function Dashboard() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    user_info: null,
    rides: [],
    locations: [],
    ridereqs: {},
  });

  const [loading, setLoading] = useState(true);
  const [ridesData, setRidesData] = useState([]);
  const [createRideModal, setCreateRideModal] = useState(false);
  const [searchRideModal, setSearchRideModal] = useState(false);

  const [capacity, setCapacity] = useState();
  const [origin, setOrigin] = useState();
  const [dest, setDest] = useState();
  const [date, setDate] = useState();
  const [time, setTime] = useState();

  const [searchDate, setSearchDate] = useState();
  const [searchTime, setSearchTime] = useState();

  const [locations, setLocations] = useState([]);

  const max_capacity_option = 5;
  const capacity_options = [];

  for (let i = 1; i < max_capacity_option + 1; i++) {
    let dict = { value: i, label: i };
    capacity_options.push(dict);
  }

  const searchRide = async () => {
    console.log(dashboardData);

    // const searchDetails = {
    //   origin: origin,
    //   destination: dest,
    // };

    // const queryParams = new URLSearchParams(searchDetails).toString();

    try {
      // const datePart = searchDate.format('YYYY-MM-DD');
      // const timePart = searchTime.format('HH:mm:ss');
      // const searchTime = `${datePart} ${timePart}`;

      const response = await fetch(
        `/api/searchrides?origin=${origin}
        &destination=${dest}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response);

      if (!response.ok) {
        throw new Error(`Failed to fetch rides: ${response.status}`);
      }

      // const data = await response.json();
      // console.log(data)
      // setRidesData(data);
      console.log("end of search ride");
    } catch (error) {
      console.error("Error during fetch:", error);
    }

    handleCloseSearchRideModal();
  };

  const createRide = async () => {
    const datePart = date.format("YYYY-MM-DD");
    const timePart = time.format("HH:mm:ss");
    const arrival_time = `${datePart} ${timePart}`;

    try {
      const response = await fetch("/api/addride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          capacity: capacity["label"],
          origin: origin["label"],
          destination: dest["label"],
          arrival_time: arrival_time,
        }),
      });
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    await fetchDashboardData();
    setLoading(false);
    handleCloseRideModal();
  };

  const handleOpenRideModal = async () => {
    setCreateRideModal(true);
  };

  const handleCloseRideModal = async () => {
    setCreateRideModal(false);
  };

  const handleOpenSearchRideModal = async () => {
    setSearchRideModal(true);
  };

  const handleCloseSearchRideModal = async () => {
    setSearchRideModal(false);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      // console.log(data.locations)
      setDashboardData(data);

      console.log(data.rides);

      data.rides.sort(
        (a, b) => new Date(b.arrival_time) - new Date(a.arrival_time)
      );
      setRidesData(data.rides);
      const tempLocations = [];
      for (const loc of data.locations) {
        let dict = { value: loc[1], label: loc[1] };
        tempLocations.push(dict);
      }
      setLocations(tempLocations);
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    setLoading(false);
  };

  const handleRideRequest = async (rideid) => {
    console.log("IN HANDLE RIDE REQUEST");

    try {
      const response = await fetch("/api/requestride", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rideid: rideid,
        }),
      });
      await fetchDashboardData();
      if (!response.ok) {
        console.error("Request failed:", response.status);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">
          Welcome, {dashboardData.user_info?.displayname}
        </h1>
      </div>

      <br />
      <br />

      <Link
        to="/myrides"
        className="inline-block bg-theme_dark_2 text-white px-4 py-2 rounded hover:text-theme_medium_1"
      >
        My Rides
      </Link>

      <Button
        className="bg-theme_dark_2 text-white px-4 py-2 rounded hover:text-theme_medium_1"
        onClick={() => handleOpenRideModal()}
      >
        Create a Ride
      </Button>

      <Button
        className="bg-theme_dark_2 text-white px-4 py-2 rounded hover:text-theme_medium_1"
        onClick={() => handleOpenSearchRideModal()}
      >
        Search
      </Button>

      <br />
      <br />

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : ridesData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {ridesData.map((ride) => (
            <RideCard
              key={ride.id}
              buttonText={
                ride.admin_netid === dashboardData.user_info.netid
                  ? "Cannot join your own ride"
                  : dashboardData.ridereqs[ride.id]
                  ? dashboardData.ridereqs[ride.id]
                  : ride.current_riders.length === ride.max_capacity
                  ? "Ride filled"
                  : "Request a Ride"
              }
              buttonOnClick={
                dashboardData.ridereqs[ride.id] ||
                ride.admin_netid === dashboardData.user_info.netid ||
                ride.current_riders.length === ride.max_capacity
                  ? () => {}
                  : () => handleRideRequest(ride.id)
              }
              buttonClassName={`${
                (dashboardData.ridereqs[ride.id] ||
                  ride.admin_netid === dashboardData.user_info.netid) &&
                "cursor-auto"
              } bg-theme_dark_1 text-white font-medium`}
            >
              <div>Origin: {ride.origin_name}</div>
              <div>Destination: {ride.destination_name}</div>
              <div>Arrival Time: {ride.arrival_time}</div>
              <div>Admin Name: {ride.admin_name}</div>
              <div>Admin Email: {ride.admin_email}</div>
              <div>
                Seats Taken: {ride.current_riders.length}/{ride.max_capacity}
              </div>
              <p>
                <strong>Current Riders:</strong>
                {ride.current_riders.map((rider) => (
                  <Pill>{rider[0] + " " + rider[1] + " " + rider[2]}</Pill>
                ))}
              </p>
            </RideCard>
          ))}
        </div>
      ) : (
        <p className="text-center">No rides available in this category.</p>
      )}

      {createRideModal && (
        <Modal
          isOpen={createRideModal}
          onClose={handleCloseRideModal}
          title={"Create a Ride"}
        >
          <div>
            <Dropdown
              inputValue={capacity}
              setInputValue={setCapacity}
              options={capacity_options}
              isClearable
              placeholder="Select capacity"
            ></Dropdown>

            <Dropdown
              inputValue={origin}
              setInputValue={setOrigin}
              options={locations}
              isClearable
              placeholder="Select starting point"
            ></Dropdown>

            <Dropdown
              inputValue={dest}
              setInputValue={setDest}
              options={locations}
              isClearable
              placeholder="Select destination"
            ></Dropdown>

            <DateTimePicker
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
            />
            <br />

            <Button
              className="bg-theme_dark_1 text-white px-4 py-2 rounded hover:text-theme_medium_1"
              onClick={createRide}
            >
              Submit
            </Button>
          </div>
        </Modal>
      )}
      {searchRideModal && (
        <Modal
          isOpen={searchRideModal}
          onClose={handleCloseSearchRideModal}
          title={"Search"}
        >
          <div>
            <Dropdown
              inputValue={origin}
              setInputValue={setOrigin}
              options={locations}
              isClearable
              placeholder="Select starting point"
            ></Dropdown>

            <Dropdown
              inputValue={dest}
              setInputValue={setDest}
              options={locations}
              isClearable
              placeholder="Select destination"
            ></Dropdown>

            <br />

            <DateTimePicker
              date={searchDate}
              setDate={setSearchDate}
              time={searchTime}
              setTime={setSearchTime}
            />

            <br />

            <Button
              className="bg-theme_dark_1 text-white px-4 py-2 rounded hover:text-theme_medium_1"
              onClick={searchRide}
            >
              Search
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
