import { useEffect } from "react";
import IconButton from "./IconButton";
import LoadingIcon from "./LoadingIcon";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

export default function NotificationsModal({
  isOpen,
  isLoading,
  onClose,
  new_notifs,
  past_notifs,
  handleReadNotif,
  markAllRead,
  clearAll,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      // Disable scrolling on body when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Enable scrolling on body when modal is closed
      document.body.style.overflow = "auto";
    }

    // Cleanup when the component is unmounted or modal closes
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // If click outside Notifications modal, automatically close it
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // "ride_request" covers everything sent to a poster about their own ride
  // (new and canceled requests); it links to My Posted Rides.
  const getNotifType = (notif) => {
    if (notif.subject.includes("accepted")) {
      return "ride_accept";
    } else if (
      notif.subject.includes("requested to join") ||
      notif.subject.includes("canceled their request")
    ) {
      return "ride_request";
    } else if (notif.subject.includes("canceled")) {
      return "ride_cancellation";
    } else if (notif.subject.includes("changed arrival time")) {
      return "ride_timechange";
    }
  };

  const renderNotifs = (notifs, isNew) => {
    return notifs.length > 0 ? (
      <ul className="">
        <p className="text-md font-medium pb-2">
          {isNew ? "New notifications" : "Past notifications"}
        </p>
        <hr className="mb-2" />
        {notifs.map((notification, index) => (
          <div key={index}>
            <div
              className={`${
                !isNew && "opacity-50"
              } border-zinc-300 cursor-pointer hover:bg-zinc-200 rounded-lg p-2`}
            >
              <li
                onClick={() =>
                  handleReadNotif(notification, getNotifType(notification))
                }
              >
                <div className="flex flex-col gap-2">
                  <p className="font-semibold">{notification.subject}</p>
                  <p>{notification.message}</p>
                  <Button
                    className="text-theme_medium_2 hover:text-theme_dark_2 !text-sm"
                    onClick={() => navigate("/myrides")}
                  >
                    Go to My Rideshares
                  </Button>
                  <p className="text-sm text-zinc-500">
                    {new Date(notification.notification_time).toLocaleString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      }
                    )}
                  </p>
                </div>
              </li>
            </div>
            <hr className="my-2" />
          </div>
        ))}
      </ul>
    ) : (
      <p className="text-zinc-500 pb-2">No new notifications available.</p>
    );
  };

  return (
    <div>
      <div
        className="fixed inset-0 z-20 bg-zinc-800 bg-opacity-20 h-full"
        onClick={handleBackdropClick}
      ></div>
      {/* Mobile: fills the screen above the bottom tab bar (which stays
          visible, as in Figma's Alerts screen). Desktop: popover under the
          bell (position from Figma 57:1570). */}
      <div className="z-[25] fixed inset-x-0 top-0 bottom-tabbar flex flex-col md:absolute md:inset-auto md:w-[340px] md:top-[79px] md:right-[128px] md:h-[480px] bg-surface md:rounded-xl border-line md:border shadow-elevation-3">
        <div className="flex justify-between items-center p-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold flex gap-4 items-center">
            Notifications
            <Button
              onClick={markAllRead}
              className="text-theme_medium_2 hover:text-theme_dark_2 text-sm py-0 px-0 mt-0.5"
            >
              Mark All As Read
            </Button>
            <Button
              onClick={clearAll}
              className="text-theme_medium_2 hover:text-theme_dark_2 text-sm py-0 px-0 mt-0.5"
            >
              Clear
            </Button>
          </h2>
          <IconButton
            type="xmark"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
          ></IconButton>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0 w-full">
          {isLoading ? (
            <LoadingIcon carColor="bg-theme_medium_2" />
          ) : (
            <div>
              {renderNotifs(new_notifs, true)}
              {past_notifs.length > 0 && renderNotifs(past_notifs, false)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
