import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Real-time alerts hook with 3-second polling
 * Fetches new alerts and returns them with delta updates
 */
export function useRealtimeAlerts(options = {}) {
  const {
    pollInterval = 3000,
    autoRead = false,
    onNewAlert = null,
  } = options;

  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("connecting"); // connecting, live, offline
  const lastFetchRef = useRef(new Date(Date.now() - 60000)); // Start with last 60s
  const pollingRef = useRef(null);
  const retryCountRef = useRef(0);

  const fetchAlerts = async () => {
    try {
      setStatus("connecting");
      const now = new Date();
      
      // Fetch only alerts created since last fetch (delta)
      const deltaAlerts = await base44.entities.Alert.filter(
        { created_date: { $gt: lastFetchRef.current.toISOString() } },
        "-created_date",
        50
      );

      if (deltaAlerts.length > 0) {
        setAlerts((prev) => [...deltaAlerts, ...prev]);
        if (onNewAlert && deltaAlerts.length > 0) {
          deltaAlerts.forEach((alert) => onNewAlert(alert));
        }
        retryCountRef.current = 0;
      }

      lastFetchRef.current = now;
      setStatus("live");
      setError(null);
    } catch (err) {
      console.error("[useRealtimeAlerts] Fetch failed:", err);
      setError(err.message);
      
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      retryCountRef.current += 1;
      const backoffMs = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 30000);
      
      // Retry after backoff
      setTimeout(() => {
        if (pollingRef.current) {
          fetchAlerts();
        }
      }, backoffMs);

      setStatus("offline");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAlerts();

    // Start polling
    pollingRef.current = setInterval(() => {
      fetchAlerts();
    }, pollInterval);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [pollInterval]);

  const markAsRead = async (alertId) => {
    try {
      await base44.entities.Alert.update(alertId, {
        read_status: true,
        read_at: new Date().toISOString(),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, read_status: true } : a))
      );
    } catch (err) {
      console.error("[useRealtimeAlerts] Mark as read failed:", err);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await base44.entities.Alert.delete(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (err) {
      console.error("[useRealtimeAlerts] Dismiss failed:", err);
    }
  };

  return {
    alerts,
    isLoading,
    error,
    status,
    markAsRead,
    dismissAlert,
    refetch: fetchAlerts,
  };
}