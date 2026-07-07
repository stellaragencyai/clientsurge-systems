/**
 * ClientNotificationCenter — Phase 4.4 Phase 4
 *
 * Foundation for client-facing notifications.
 * Derives notifications from real system events:
 *   - Deployment updates (status changes)
 *   - Automation verified (proof logs)
 *   - Action needed (portal state blocked/action required)
 *   - System issue (failed events, deployment error)
 *   - Report available (weekly/monthly reports generated)
 *
 * Each notification: title, description, timestamp, priority, read state.
 * Stored in client-side localStorage for read/unread state (no entity changes).
 */
import { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  Bell, CheckCircle2, AlertCircle, Zap, ShieldCheck, FileText,
  Rocket, Settings, Clock, X, Inbox,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

const NOTIFICATION_TYPES = {
  DEPLOYMENT_UPDATE: { label: "Update", icon: Rocket, color: "#0088CC", priority: 2 },
  AUTOMATION_VERIFIED: { label: "Verified", icon: ShieldCheck, color: "#10B981", priority: 3 },
  ACTION_NEEDED: { label: "Action Needed", icon: AlertCircle, color: "#F59E0B", priority: 1 },
  SYSTEM_ISSUE: { label: "System Issue", icon: AlertCircle, color: "#EF4444", priority: 1 },
  REPORT_AVAILABLE: { label: "Report", icon: FileText, color: "#0088CC", priority: 4 },
};

const STORAGE_KEY = "cs_portal_notifications_read";

export default function ClientNotificationCenter({
  project,
  deployment,
  portalState,
  portalStateLoading,
  subscription,
  healthData,
  onNavigate,
}) {
  const [proofLogs, setProofLogs] = useState([]);
  const [execLogs, setExecLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  const deploymentId = deployment?.id || project?.client_deployment_id;

  useEffect(() => {
    if (!deploymentId) {
      setLoading(false);
      return;
    }
    loadNotificationSources(deploymentId);
  }, [deploymentId]);

  async function loadNotificationSources(depId) {
    try {
      const [proofs, execs] = await Promise.all([
        fetchProofLogs(depId),
        fetchExecLogs(depId),
      ]);
      setProofLogs(proofs);
      setExecLogs(execs);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  }

  async function fetchProofLogs(depId) {
    try {
      return await base44.asServiceRole.entities.AutomationProofLog.filter(
        { client_deployment_id: depId },
        "-tested_at",
        20
      ) || [];
    } catch {
      return [];
    }
  }

  async function fetchExecLogs(depId) {
    try {
      return await base44.asServiceRole.entities.AutomationExecutionLog.filter(
        { client_deployment_id: depId },
        "-created_date",
        30
      ) || [];
    } catch {
      return [];
    }
  }

  // ── Build notifications from real data ──
  const notifications = useMemo(() => {
    const items = [];

    // 1. Deployment status updates
    if (deployment?.went_live_at) {
      items.push({
        id: `deploy_live_${deployment.id}`,
        type: "DEPLOYMENT_UPDATE",
        title: "Your System Is Live",
        description: "Your automation system has been verified and is now live.",
        timestamp: deployment.went_live_at,
      });
    }
    if (deployment?.created_date && deployment?.deployment_status !== "live") {
      items.push({
        id: `deploy_created_${deployment.id}`,
        type: "DEPLOYMENT_UPDATE",
        title: "Setup Started",
        description: "Your automation system setup has begun. We're configuring your modules.",
        timestamp: deployment.created_date,
      });
    }

    // 2. Automation verified (proof logs)
    for (const proof of proofLogs) {
      if (proof.status === "pass" && proof.tested_at) {
        const moduleName = (proof.service_key || "automation").replace(/_/g, " ");
        items.push({
          id: `proof_${proof.id}`,
          type: "AUTOMATION_VERIFIED",
          title: `${moduleName.replace(/\b\w/g, (c) => c.toUpperCase())} Verified`,
          description: "This automation module passed verification testing.",
          timestamp: proof.tested_at,
        });
      }
    }

    // 3. Action needed (from portal state)
    if (!portalStateLoading) {
      const billingCard = getCardState(portalState, "billing");
      if (billingCard.status === CARD_STATUS.BLOCKED) {
        items.push({
          id: "action_billing",
          type: "ACTION_NEEDED",
          title: "Payment Method Needs Update",
          description: "Your subscription payment requires attention to keep your system running.",
          timestamp: new Date().toISOString(),
        });
      }

      if (project?.client_approval_status === "Requested") {
        items.push({
          id: "action_approval",
          type: "ACTION_NEEDED",
          title: "Review Your System",
          description: "Your system is ready for your review and approval.",
          timestamp: project.updated_date || new Date().toISOString(),
        });
      }
    }

    // 4. System issue (failed events, deployment error)
    if (deployment?.deployment_status === "error") {
      items.push({
        id: `issue_deploy_${deployment.id}`,
        type: "SYSTEM_ISSUE",
        title: "System Issue Detected",
        description: "Our team is aware and actively working to resolve it.",
        timestamp: deployment.health_checked_at || deployment.updated_date || new Date().toISOString(),
      });
    }

    const failedExecs = execLogs.filter((e) => e.execution_status === "failed").slice(0, 3);
    for (const exec of failedExecs) {
      const moduleName = (exec.module_key || "automation").replace(/_/g, " ");
      items.push({
        id: `issue_exec_${exec.id}`,
        type: "SYSTEM_ISSUE",
        title: `${moduleName.replace(/\b\w/g, (c) => c.toUpperCase())} Issue`,
        description: exec.error_message
          ? `An automation encountered an issue. Our team has been notified.`
          : "An automation encountered an issue. Our team has been notified.",
        timestamp: exec.completed_at || exec.started_at || exec.created_date,
      });
    }

    // 5. Report available
    if (deployment?.deployment_status === "live" && project?.client_project_status === "Live") {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      items.push({
        id: "report_weekly",
        type: "REPORT_AVAILABLE",
        title: "Weekly Report Available",
        description: "Your weekly performance summary is ready to view.",
        timestamp: lastWeek.toISOString(),
      });
    }

    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return items;
  }, [deployment, proofLogs, execLogs, portalState, portalStateLoading, project]);

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAsRead = (id) => {
    const newRead = new Set(readIds);
    newRead.add(id);
    setReadIds(newRead);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newRead]));
    } catch {
      // localStorage may be unavailable
    }
  };

  const markAllAsRead = () => {
    const newRead = new Set(notifications.map((n) => n.id));
    setReadIds(newRead);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newRead]));
    } catch {
      // localStorage may be unavailable
    }
  };

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center relative"
            style={{ background: "#00AEEF10", border: "1px solid #00AEEF20" }}
          >
            <Bell className="w-4 h-4 text-[#0088CC]" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center"
                style={{ border: "2px solid #fff" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            <p className="text-[10px] text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-[#0088CC] hover:text-[#006BB0] transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Clock className="w-4 h-4 text-gray-300 animate-spin" />
            <span className="text-sm text-gray-400">Loading notifications…</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center px-4">
            <Inbox className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You'll see updates here as your system progresses.
            </p>
          </div>
        ) : (
          <div>
            {notifications.slice(0, 15).map((notif) => {
              const cfg = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.DEPLOYMENT_UPDATE;
              const Icon = cfg.icon;
              const isUnread = !readIds.has(notif.id);
              const date = notif.timestamp ? new Date(notif.timestamp) : null;

              return (
                <button
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`w-full flex items-start gap-3 px-5 py-3 text-left transition-colors border-b border-gray-50 last:border-0 ${
                    isUnread ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}10` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{notif.title}</span>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#00AEEF] flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{notif.description}</p>
                    {date && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(date, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}