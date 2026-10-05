/**
 * useClientNotifications — Phase 4.5
 *
 * Single unified notification source for the client portal.
 * Replaces the separate notification derivation paths that existed in:
 *   - useLeadNotifications (real-time lead events)
 *   - ClientNotificationCenter (deployment/proof/exec logs)
 *   - ClientPortal.jsx inline notification building
 *
 * Sources:
 *   - Real-time Lead events (subscribe) — new lead, booked, replied, qualified
 *   - ClientDeployment — status changes, went_live
 *   - AutomationProofLog — automation verified
 *   - AutomationExecutionLog — failed executions
 *   - PortalState — billing blocked, action needed
 *   - Subscription — payment issues
 *   - Project — approval requested
 *
 * Read state: single localStorage key "cs_portal_notifications_read"
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

const STORAGE_KEY = "cs_portal_notifications_read";

function loadReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveReadIds(readSet) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...readSet]));
  } catch {
    // localStorage may be unavailable
  }
}

export function useClientNotifications({
  project,
  deployment,
  portalState,
  portalStateLoading,
  subscription,
} = {}) {
  const [leadNotifications, setLeadNotifications] = useState([]);
  const [systemNotifications, setSystemNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => loadReadIds());

  // ── Real-time lead event subscription ──
  useEffect(() => {
    let lastSeenLeads = {};

    const unsubscribe = base44.entities.Leads.subscribe((event) => {
      if (event.type === "create") {
        const lead = event.data;
        const notification = {
          id: `lead_new_${event.id}`,
          type: "new_lead",
          category: "lead",
          title: "New Lead",
          message: `${lead.full_name} from ${lead.business_name}`,
          timestamp: new Date().toISOString(),
        };
        setLeadNotifications((prev) => [notification, ...prev].slice(0, 50));
        toast.success(`New lead: ${lead.full_name}`, {
          description: `${lead.business_name} · ${lead.business_type || "Unknown"}`,
        });
      } else if (event.type === "update") {
        const lead = event.data;
        const oldStatus = lastSeenLeads[event.id]?.status;

        if (oldStatus && oldStatus !== lead.status) {
          if (lead.status === "Booked") {
            setLeadNotifications((prev) => [{
              id: `lead_booked_${event.id}_${Date.now()}`,
              type: "lead_booked",
              category: "lead",
              title: "Appointment Booked!",
              message: `${lead.full_name} booked an appointment`,
              timestamp: new Date().toISOString(),
            }, ...prev].slice(0, 50));
            toast.success("Appointment Booked!", { description: lead.full_name });
          } else if (lead.status === "Replied") {
            setLeadNotifications((prev) => [{
              id: `lead_replied_${event.id}_${Date.now()}`,
              type: "lead_replied",
              category: "lead",
              title: "Lead Replied",
              message: `${lead.full_name} replied to your message`,
              timestamp: new Date().toISOString(),
            }, ...prev].slice(0, 50));
            toast.info("Lead Replied", { description: lead.full_name });
          } else if (lead.status === "Qualified") {
            setLeadNotifications((prev) => [{
              id: `lead_qualified_${event.id}_${Date.now()}`,
              type: "lead_qualified",
              category: "lead",
              title: "Lead Qualified",
              message: `${lead.full_name} is now qualified`,
              timestamp: new Date().toISOString(),
            }, ...prev].slice(0, 50));
            toast.success("Lead Qualified", { description: lead.full_name });
          }
        }

        lastSeenLeads[event.id] = lead;
      }
    });

    return unsubscribe;
  }, []);

  // ── System notifications from deployment, proof logs, execution logs, portal state ──
  useEffect(() => {
    const deploymentId = deployment?.id || project?.client_deployment_id;
    if (!deploymentId) {
      setSystemNotifications([]);
      return;
    }

    let cancelled = false;

    const loadSystemNotifications = async () => {
      try {
        const [proofLogs, execLogs] = await Promise.all([
          fetchProofLogs(deploymentId),
          fetchExecLogs(deploymentId),
        ]);

        if (cancelled) return;

        const items = [];

        // 1. Deployment status updates
        if (deployment?.went_live_at) {
          items.push({
            id: `deploy_live_${deployment.id}`,
            type: "deployment_update",
            category: "system",
            title: "Your System Is Live",
            message: "Your automation system has been verified and is now live.",
            timestamp: deployment.went_live_at,
          });
        }
        if (deployment?.created_date && deployment?.deployment_status !== "live") {
          items.push({
            id: `deploy_created_${deployment.id}`,
            type: "deployment_update",
            category: "system",
            title: "Setup Started",
            message: "Your automation system setup has begun. We're configuring your modules.",
            timestamp: deployment.created_date,
          });
        }

        // 2. Automation verified (proof logs)
        for (const proof of proofLogs) {
          if (proof.status === "pass" && proof.tested_at) {
            const moduleName = (proof.service_key || "automation").replace(/_/g, " ");
            items.push({
              id: `proof_${proof.id}`,
              type: "automation_verified",
              category: "system",
              title: `${moduleName.replace(/\b\w/g, (c) => c.toUpperCase())} Verified`,
              message: "This automation module passed verification testing.",
              timestamp: proof.tested_at,
            });
          }
        }

        // 3. Action needed (from portal state)
        if (!portalStateLoading && portalState) {
          const billingCard = getCardState(portalState, "billing");
          if (billingCard.status === CARD_STATUS.BLOCKED) {
            items.push({
              id: "action_billing",
              type: "action_needed",
              category: "action",
              title: "Payment Method Needs Update",
              message: "Your subscription payment requires attention to keep your system running.",
              timestamp: new Date().toISOString(),
            });
          }

          if (project?.client_approval_status === "Requested") {
            items.push({
              id: "action_approval",
              type: "action_needed",
              category: "action",
              title: "Review Your System",
              message: "Your system is ready for your review and approval.",
              timestamp: project.updated_date || new Date().toISOString(),
            });
          }
        }

        // 4. System issue (failed events, deployment error)
        if (deployment?.deployment_status === "error") {
          items.push({
            id: `issue_deploy_${deployment.id}`,
            type: "system_issue",
            category: "issue",
            title: "System Issue Detected",
            message: "Our team is aware and actively working to resolve it.",
            timestamp: deployment.health_checked_at || deployment.updated_date || new Date().toISOString(),
          });
        }

        const failedExecs = execLogs.filter((e) => e.execution_status === "failed").slice(0, 3);
        for (const exec of failedExecs) {
          const moduleName = (exec.module_key || "automation").replace(/_/g, " ");
          items.push({
            id: `issue_exec_${exec.id}`,
            type: "system_issue",
            category: "issue",
            title: `${moduleName.replace(/\b\w/g, (c) => c.toUpperCase())} Issue`,
            message: "An automation encountered an issue. Our team has been notified.",
            timestamp: exec.completed_at || exec.started_at || exec.created_date,
          });
        }

        // 5. Subscription issue
        if (subscription && ["past_due", "unpaid", "canceled"].includes(subscription.status)) {
          items.push({
            id: "subscription_issue",
            type: "action_needed",
            category: "action",
            title: "Payment Method Needs Update",
            message: "Your subscription payment requires attention to keep your system running.",
            timestamp: new Date().toISOString(),
          });
        }

        // 6. Report available
        if (deployment?.deployment_status === "live" && project?.client_project_status === "Live") {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          items.push({
            id: "report_weekly",
            type: "report_available",
            category: "report",
            title: "Weekly Report Available",
            message: "Your weekly performance summary is ready to view.",
            timestamp: lastWeek.toISOString(),
          });
        }

        // Sort by timestamp descending
        items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (!cancelled) setSystemNotifications(items);
      } catch {
        if (!cancelled) setSystemNotifications([]);
      }
    };

    loadSystemNotifications();
    return () => { cancelled = true; };
  }, [deployment?.id, project?.client_deployment_id, project?.client_approval_status, project?.client_project_status, project?.updated_date, portalState, portalStateLoading, subscription?.status]);

  // ── Merge lead + system notifications ──
  const notifications = useMemo(() => {
    const all = [...leadNotifications, ...systemNotifications];
    all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return all;
  }, [leadNotifications, systemNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readIds.has(n.id)).length,
    [notifications, readIds]
  );

  const markAsRead = useCallback((notificationId) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(notificationId);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  const clearNotifications = useCallback(() => {
    setLeadNotifications([]);
    setSystemNotifications([]);
    setReadIds(new Set());
    saveReadIds(new Set());
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

async function fetchProofLogs(deploymentId) {
  try {
    return await base44.admin.entities.AutomationProofLog.filter(
      { client_deployment_id: deploymentId },
      "-tested_at",
      20
    ) || [];
  } catch {
    return [];
  }
}

async function fetchExecLogs(deploymentId) {
  try {
    return await base44.admin.entities.AutomationExecutionLog.filter(
      { client_deployment_id: deploymentId },
      "-created_date",
      30
    ) || [];
  } catch {
    return [];
  }
}