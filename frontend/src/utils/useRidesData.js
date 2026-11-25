import { useCallback, useEffect, useState } from "react";
import useAutoRefresh from "./useAutoRefresh";

// Fired after the user creates a ride (from the navbar) so open pages refresh.
export const RIDES_CHANGED_EVENT = "tigerlift:rides-changed";

export const notifyRidesChanged = () =>
  window.dispatchEvent(new Event(RIDES_CHANGED_EVENT));

const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} failed: ${response.status}`);
  }
  return response.json();
};

// Loads everything Home and Ride Details need: all upcoming rides with the
// user's request statuses (/api/dashboard) and the user's own rides
// (/api/myrides). Refreshes in the background like the other pages.
export default function useRidesData() {
  const [dashboard, setDashboard] = useState(null);
  const [myRides, setMyRides] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent: refresh without showing loading or replacing data with an error
  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const [dashboardData, myRidesData] = await Promise.all([
        fetchJson("/api/dashboard"),
        fetchJson("/api/myrides"),
      ]);
      setDashboard(dashboardData);
      setMyRides(myRidesData);
      setError(null);
    } catch (err) {
      console.error("Error loading rides:", err);
      if (!silent) {
        setError(
          "We couldn't load rideshares. Check your connection and try again."
        );
      }
    }
    if (!silent) {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const refresh = () => load({ silent: true });
    window.addEventListener(RIDES_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(RIDES_CHANGED_EVENT, refresh);
  }, [load]);

  useAutoRefresh(() => load({ silent: true }));

  return {
    dashboard,
    myRides,
    isLoading,
    error,
    reload: load,
    refresh: () => load({ silent: true }),
  };
}
