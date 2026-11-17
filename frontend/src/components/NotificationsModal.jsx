import { useEffect, useRef } from "react";
import IconButton from "./IconButton";
import LoadingIcon from "./LoadingIcon";
import { useNavigate } from "react-router-dom";
import Button from "./Button";

export default function NotificationsModal({
  id,
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
  const panelRef = useRef(null);
  const headingId = `${id}-title`;

  // Move focus into the panel when it opens (Escape handling and focus
  // return live in Navbar, which owns the toggle buttons).
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

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
      <ul>
        <p className="text-desktop-small text-content-secondary pb-2">
          {isNew ? "New notifications" : "Past notifications"}
        </p>
        <hr className="mb-2 border-line-subtle" />
        {notifs.map((notification, index) => (
          <div key={index}>
            <div
              className={`${
                !isNew && "opacity-50"
              } cursor-pointer hover:bg-surface-subtle rounded-control p-2`}
            >
              <li
                onClick={() =>
                  handleReadNotif(notification, getNotifType(notification))
                }
              >
                <div className="flex flex-col gap-2">
                  <p className="text-desktop-body font-semibold text-content-primary">
                    {notification.subject}
                  </p>
                  <p className="text-desktop-body text-content-secondary">
                    {notification.message}
                  </p>
                  <Button
                    className="self-start !px-0 !py-0 text-content-accent hover:text-content-primary underline-offset-2 hover:underline text-desktop-small whitespace-nowrap"
                    onClick={() => navigate("/myrides")}
                  >
                    Go to My Rideshares
                  </Button>
                  <p className="text-desktop-small text-content-placeholder">
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
            <hr className="my-2 border-line-subtle" />
          </div>
        ))}
      </ul>
    ) : (
      <p className="text-desktop-body text-content-secondary pb-2">No new notifications available.</p>
    );
  };

  return (
    <div>
      <div
        className="hidden md:block fixed inset-0 z-20 bg-surface-scrim opacity-40 h-full"
        onClick={handleBackdropClick}
      ></div>
      {/* Mobile: full screen under the bottom tab bar, which stays visible
          on top (as in Figma's Alerts screen); the list is padded to clear
          it. Desktop: popover under the bell (position from Figma 57:1570),
          over a backdrop that closes it. */}
      <div
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="z-[25] fixed inset-0 flex flex-col md:absolute md:inset-auto md:w-[340px] md:top-[79px] md:right-[128px] md:h-[480px] bg-surface text-content-primary md:rounded-control border-line md:border shadow-elevation-3 focus:outline-none"
      >
        <div className="flex justify-between items-center gap-3 p-4 border-b border-line-subtle">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 min-w-0">
            <h2
              id={headingId}
              className="text-mobile-subhead md:text-desktop-subhead font-display text-content-primary"
            >
              Notifications
            </h2>
            <div className="flex gap-4">
              <Button
                onClick={markAllRead}
                className="!px-0 !py-0 text-content-accent hover:text-content-primary underline-offset-2 hover:underline text-desktop-small whitespace-nowrap"
              >
                Mark all as read
              </Button>
              <Button onClick={clearAll} className="!px-0 !py-0 text-content-accent hover:text-content-primary underline-offset-2 hover:underline text-desktop-small whitespace-nowrap">
                Clear
              </Button>
            </div>
          </div>
          <IconButton
            type="xmark"
            onClick={onClose}
            ariaLabel="Close notifications"
            className="shrink-0 text-icon-muted hover:text-icon-primary hover:bg-surface-subtle"
          ></IconButton>
        </div>
        <div className="p-4 pb-[calc(theme(spacing.tabbar)+theme(spacing.10))] md:pb-4 overflow-y-auto flex-1 min-h-0 w-full">
          {isLoading ? (
            <LoadingIcon carColor="bg-fill-primary" />
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
