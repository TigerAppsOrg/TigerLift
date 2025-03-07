import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import IconButton from "./IconButton";
import NotificationsModal from "./NotificationsModal";
import CarIcon from "./CarIcon";
import { bigButtonStyling2 } from "../utils/utils";

export default function Navbar({ user_info }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isNotifsLoading, setIsNotifsLoading] = useState(false);
  const [newNotifications, setNewNotifications] = useState([]);
  const [pastNotifications, setPastNotifications] = useState([]);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [myRidesViewType, setMyRidesViewType] = useState("");

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const navigateTo = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const fetchNotifs = async () => {
    setIsNotifsLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data_response = await response.json();

      // Make each array into dictionary
      const new_notifs = data_response.new_notifs.map((row) => ({
        id: row[0],
        message: row[1],
        notification_time: row[2],
        subject: row[3],
        status: row[4],
      }));
      const past_notifs = data_response.past_notifs.map((row) => ({
        id: row[0],
        message: row[1],
        notification_time: row[2],
        subject: row[3],
        status: row[4],
      }));
      setNewNotifications(new_notifs);
      setPastNotifications(past_notifs);
      setIsNotifsLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      alert("Failed to load notifications.");
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleCloseNotificationsModal = () => {
    setShowNotificationsModal(false);
  };

  const handleReadNotif = async (notif, notif_type) => {
    if (notif_type === "ride_request") {
      navigate("/myrides", { state: { viewType: "posted" } });
    } else {
      navigate("/myrides", { state: { viewType: "requested" } });
    }
    setShowNotificationsModal(false);
    if (notif.status !== "read") {
      try {
        const response = await fetch("/api/readnotification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notif_id: notif.id,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to mark notification as read: ${response.status}`
          );
        }
      } catch (error) {
        console.error(error);
      }
    }
    await fetchNotifs();
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/markallread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read`);
      }
    } catch (error) {
      console.error(error);
    }
    await fetchNotifs();
  };

  return (
    <div>
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-0 h-full bg-white w-full z-30 flex flex-col justify-between p-8">
          <div className="flex flex-col gap-6 w-full">
            <div className="relative w-full items-center">
              <h2 className="text-center text-xl font-medium">Menu</h2>
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                <IconButton
                  type="xmark"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:bg-zinc-100"
                />
              </div>
            </div>
            <hr className="py-1" />
            <div className="flex flex-col gap-5">
              <button
                onClick={() => {
                  setMyRidesViewType("");
                  navigateTo("/allrides");
                }}
                className={`${
                  isActive("/allrides") ? "bg-theme_light_1 font-medium" : ""
                } text-lg rounded-md py-3 hover:bg-theme_light_1`}
              >
                All Rideshares
              </button>
              <button
                onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
                className={`${
                  isActive("/myrides") ? "bg-theme_light_1 font-medium" : ""
                } text-lg rounded-md py-3 hover:bg-theme_light_1`}
              >
                <div className="relative items-center">
                  My Rideshares
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isSubMenuOpen ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 15.75 7.5-7.5 7.5 7.5"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
              {isSubMenuOpen && (
                <div className="flex flex-col gap-4 pl-8">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setMyRidesViewType("posted");
                      navigate("/myrides", { state: { viewType: "posted" } });
                    }}
                    className={`${
                      isActive("/myrides") && myRidesViewType === "posted"
                        ? "bg-theme_light_2 font-medium"
                        : ""
                    } text-lg rounded-md py-3 hover:bg-theme_light_2`}
                  >
                    My Posted Rideshares
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setMyRidesViewType("requested");
                      navigate("/myrides", {
                        state: { viewType: "requested" },
                      });
                    }}
                    className={`${
                      isActive("/myrides") && myRidesViewType === "requested"
                        ? "bg-theme_light_2 font-medium"
                        : ""
                    } text-lg rounded-md py-3 hover:bg-theme_light_2`}
                  >
                    My Requested Rideshares
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-medium text-lg text-center">
              {user_info.displayname}
            </p>
            <a href="/api/logout" className={`${bigButtonStyling2}`}>
              Log out
            </a>
          </div>
        </div>
      )}

      <NotificationsModal
        isOpen={showNotificationsModal}
        isLoading={isNotifsLoading}
        onClose={handleCloseNotificationsModal}
        new_notifs={newNotifications}
        past_notifs={pastNotifications}
        handleReadNotif={handleReadNotif}
        markAllRead={markAllRead}
      />

      <nav className="bg-theme_medium_2">
        <div className="w-full">
          <div className="flex h-14 items-center justify-between px-4 md:px-8">
            {/* Left Side - Dashboard and Logo */}
            <div className="md:hidden absolute">
              <IconButton
                type="hamburger"
                onClick={() => setIsMobileMenuOpen(true)}
                className="hover:bg-theme_light_1"
              />
            </div>
            <div className="flex flex-1 items-center justify-center md:items-stretch md:justify-start">
              <div className="flex shrink-0 items-center"></div>
              <div className="flex space-x-4">
                <a
                  href="/"
                  className="group rounded-md theme_medium_1 text-3xl font-medium text-black"
                  aria-current="page"
                >
                  <div className="flex gap-5 items-center pl-3">
                    <CarIcon />
                    TigerLift
                  </div>
                </a>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <IconButton
                  onClick={() =>
                    setShowNotificationsModal(!showNotificationsModal)
                  }
                  type="notification"
                  className={`${
                    showNotificationsModal ? "bg-theme_light_2" : ""
                  } relative hover:bg-theme_light_2 z-[21]`}
                />
                {newNotifications.length > 0 && (
                  <div className="absolute top-2 right-2.5 z-[22]">
                    <svg
                      width="7"
                      height="7"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="3.5" cy="3.5" r="3.5" fill="#6EE7B7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="hidden md:flex items-center gap-4">
                <p className="font-medium text-lg">{user_info.displayname}</p>
                <a
                  href="/api/logout"
                  className="bg-theme_dark_2 text-white px-4 py-2 rounded-md self-end hover:bg-theme_light_2 hover:text-theme_dark_2"
                >
                  Log out
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
