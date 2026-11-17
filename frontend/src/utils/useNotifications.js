import { useState, useEffect } from "react";
import useAutoRefresh from "./useAutoRefresh";

const toNotif = (row) => ({
  id: row[0],
  message: row[1],
  notification_time: row[2],
  subject: row[3],
  status: row[4],
});

// Notification data for the nav bar: loads on mount, refreshes in the
// background (useAutoRefresh), and exposes the read / mark-all / clear
// actions. Moved out of Navbar.jsx unchanged (TIG-340).
export default function useNotifications() {
  const [isLoading, setIsLoading] = useState(false);
  const [newNotifications, setNewNotifications] = useState([]);
  const [pastNotifications, setPastNotifications] = useState([]);

  // silent: refresh without showing the loading icon (used for auto-refresh)
  const fetchNotifs = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data_response = await response.json();
      setNewNotifications(data_response.new_notifs.map(toNotif));
      setPastNotifications(data_response.past_notifs.map(toNotif));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      if (!silent) {
        alert("Failed to load notifications.");
      }
    }
  };

  useAutoRefresh(() => fetchNotifs(true));

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleReadNotif = async (notif) => {
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

  const clearAll = async () => {
    try {
      const response = await fetch("/api/clearnotifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`Failed to clear notifications`);
      }
    } catch (error) {
      console.error(error);
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

  return {
    newNotifications,
    pastNotifications,
    isLoading,
    hasUnread: newNotifications.length > 0,
    fetchNotifs,
    handleReadNotif,
    markAllRead,
    clearAll,
  };
}
