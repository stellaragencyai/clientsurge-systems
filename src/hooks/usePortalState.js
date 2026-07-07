/**
 * usePortalState — React hook that fetches proof logs and runs
 * the PortalStateEngine to produce normalized card states.
 *
 * Returns:
 *   { portalState, loading, error, refresh }
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { normalizePortalState } from "@/lib/portalStateEngine";

export function usePortalState(portalContext) {
  const [portalState, setPortalState] = useState(null);
  const [proofLogs, setProofLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProofLogs = useCallback(async () => {
    if (!portalContext?.order?.id && !portalContext?.project?.client_email) return [];

    const query = {};
    if (portalContext?.order?.id) {
      query.order_id = portalContext.order.id;
    } else if (portalContext?.project?.client_email) {
      query.client_email = portalContext.project.client_email;
    }

    try {
      const logs = await base44.entities.AutomationProofLog.filter(query, "-tested_at", 50);
      return logs || [];
    } catch (err) {
      console.warn("[usePortalState] proof log fetch failed:", err?.message || err);
      return [];
    }
  }, [portalContext?.order?.id, portalContext?.project?.client_email]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const logs = await fetchProofLogs();
      setProofLogs(logs);
      const state = normalizePortalState(portalContext, logs);
      setPortalState(state);
    } catch (err) {
      const msg = err?.message || "Unable to load portal state.";
      setError(msg);
      // Still produce a fallback state so the portal never renders blank
      const fallback = normalizePortalState(portalContext, []);
      setPortalState(fallback);
    } finally {
      setLoading(false);
    }
  }, [portalContext, fetchProofLogs]);

  useEffect(() => {
    if (!portalContext) {
      setLoading(false);
      return;
    }
    refresh();
  }, [portalContext, refresh]);

  return { portalState, proofLogs, loading, error, refresh };
}