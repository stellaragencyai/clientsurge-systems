/**
 * usePortalState — React hook that fetches proof logs + execution logs
 * and runs the PortalStateEngine to produce normalized card states.
 *
 * Phase 3.5: Now also fetches AutomationExecutionLog records for
 * secondary proof resolution (fallback hierarchy priority 3).
 *
 * Returns:
 *   { portalState, proofLogs, executionLogs, loading, error, refresh }
 */
import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { normalizePortalState } from "@/lib/portalStateEngine";

export function usePortalState(portalContext) {
  const [portalState, setPortalState] = useState(null);
  const [proofLogs, setProofLogs] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
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

  const fetchExecutionLogs = useCallback(async () => {
    // Phase 3.5: Prefer execution logs from server-side context (fetched by
    // getClientPortalContext using service role to bypass RLS), since
    // AutomationExecutionLog RLS requires client_id matching which most
    // portal users don't have on their User record.
    const contextLogs = portalContext?.health?.execution_logs;
    if (Array.isArray(contextLogs) && contextLogs.length > 0) {
      return contextLogs;
    }

    // Fallback: direct entity fetch (works for admin users)
    const deploymentId = portalContext?.deployment?.id;
    const clientId = portalContext?.order?.client_id || portalContext?.project?.client_id;
    if (!deploymentId && !clientId) return [];

    try {
      const query = {};
      if (deploymentId) {
        query.client_deployment_id = deploymentId;
      } else if (clientId) {
        query.client_id = clientId;
      }
      const logs = await base44.entities.AutomationExecutionLog.filter(
        query, "-started_at", 50
      );
      return logs || [];
    } catch (err) {
      console.warn("[usePortalState] execution log fetch failed:", err?.message || err);
      return [];
    }
  }, [
    portalContext?.health?.execution_logs,
    portalContext?.deployment?.id,
    portalContext?.order?.client_id,
    portalContext?.project?.client_id,
  ]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logs, execLogs] = await Promise.all([fetchProofLogs(), fetchExecutionLogs()]);
      setProofLogs(logs);
      setExecutionLogs(execLogs);
      const state = normalizePortalState(portalContext, logs, execLogs);
      setPortalState(state);
    } catch (err) {
      const msg = err?.message || "Unable to load portal state.";
      setError(msg);
      // Still produce a fallback state so the portal never renders blank
      const fallback = normalizePortalState(portalContext, [], []);
      setPortalState(fallback);
    } finally {
      setLoading(false);
    }
  }, [portalContext, fetchProofLogs, fetchExecutionLogs]);

  useEffect(() => {
    if (!portalContext) {
      setLoading(false);
      return;
    }
    refresh();
  }, [portalContext, refresh]);

  return { portalState, proofLogs, executionLogs, loading, error, refresh };
}