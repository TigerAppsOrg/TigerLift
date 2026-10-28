import { useEffect, useRef } from "react";

// Calls refresh() when the user comes back to the tab, and every intervalMs
// while the tab is visible, so pages pick up changes made by other users
// (e.g. a poster accepting or removing a rider) without a manual reload.
export default function useAutoRefresh(refresh, intervalMs = 30000) {
  // keep the latest callback so it always sees current state
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        refreshRef.current();
      }
    };

    const intervalId = setInterval(refreshIfVisible, intervalMs);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [intervalMs]);
}
