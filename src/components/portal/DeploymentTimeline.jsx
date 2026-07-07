/**
 * DeploymentTimeline — Phase 3.5
 *
 * Truthful customer timeline built from real deployment events, proof logs,
 * and audit logs. Does NOT create artificial timeline events.
 *
 * Sources:
 *   1. ClientDeployment record (created_date, went_live_at, status transitions)
 *   2. AutomationProofLog records (verification events)
 *   3. AuditLog records (admin actions like approve, pause, resume)
 *   4. AutomationExecutionLog records (execution milestones)
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Clock, Loader2, Zap, ShieldCheck, AlertCircle, Rocket, Settings } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getDeploymentDisplayStatus } from "@/lib/deploymentStatusModel";

const EVENT_ICON_MAP = {
  deployment_created: { icon: Settings, color: "#0088CC" },
  setup_started: { icon: Clock, color: "#6B7280" },
  access_requested: { icon: AlertCircle, color: "#F59E0B" },
  website_analyzed: { icon: Zap, color: "#0088CC" },
  automation_configured: { icon: Settings, color: "#0088CC" },
  testing_started: { icon: ShieldCheck, color: "#D4AF37" },
  automation_verified: { icon: CheckCircle2, color: "#10B981" },
  system_activated: { icon: Rocket, color: "#10B981" },
  deployment_paused: { icon: AlertCircle, color: "#F59E0B" },
  deployment_resumed: { icon: Clock, color: "#0088CC" },
  proof_verified: { icon: ShieldCheck, color: "#10B981" },
  admin_action: { icon: ShieldCheck, color: "#6B7280" },
  execution_completed: { icon: Zap, color: "#0088CC" },
};

export default function DeploymentTimeline({ deployment, project, order }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deployment?.id) {
      setLoading(false);
      return;
    }
    loadTimelineEvents(deployment);
  }, [deployment?.id]);

  async function loadTimelineEvents(dep) {
    try {
      // Fetch real events from multiple sources in parallel
      const [proofLogs, execLogs, auditLogs] = await Promise.all([
        fetchProofLogs(dep),
        fetchExecutionLogs(dep),
        fetchAuditLogs(dep),
      ]);

      // Build timeline from real data
      const timelineEvents = [];

      // 1. Deployment creation event (from deployment record itself)
      if (dep.created_date) {
        timelineEvents.push({
          id: `dep_created_${dep.id}`,
          type: "deployment_created",
          label: "Deployment Created",
          description: "Your automation system deployment was initialized.",
          timestamp: dep.created_date,
          source: "ClientDeployment",
        });
      }

      // 2. Proof verification events
      for (const proof of proofLogs) {
        if (proof.status === "pass" && proof.tested_at) {
          timelineEvents.push({
            id: `proof_${proof.id}`,
            type: "automation_verified",
            label: `${proof.service_key?.replace(/_/g, " ") || "Automation"} Verified`,
            description: "Automation module passed verification testing.",
            timestamp: proof.tested_at,
            source: "AutomationProofLog",
          });
        }
      }

      // 3. Execution milestones (first successful execution per module)
      const seenModules = new Set();
      for (const log of execLogs) {
        if (log.execution_status === "completed" && log.module_key && !seenModules.has(log.module_key)) {
          seenModules.add(log.module_key);
          timelineEvents.push({
            id: `exec_${log.id}`,
            type: "execution_completed",
            label: `${log.module_key.replace(/_/g, " ")} Executed`,
            description: `First successful automation execution (${log.trigger_event || "triggered"}).`,
            timestamp: log.completed_at || log.started_at || log.created_date,
            source: "AutomationExecutionLog",
          });
        }
      }

      // 4. Admin actions from audit logs
      for (const audit of auditLogs) {
        const actionLabel = mapAuditAction(audit);
        if (actionLabel) {
          timelineEvents.push({
            id: `audit_${audit.id}`,
            type: audit.action_type || "admin_action",
            label: actionLabel.label,
            description: actionLabel.description,
            timestamp: audit.created_date,
            source: "AuditLog",
          });
        }
      }

      // 5. Went live event
      if (dep.went_live_at) {
        timelineEvents.push({
          id: `went_live_${dep.id}`,
          type: "system_activated",
          label: "System Activated",
          description: "Your automation system went live.",
          timestamp: dep.went_live_at,
          source: "ClientDeployment",
        });
      }

      // Sort by timestamp descending (most recent first)
      timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setEvents(timelineEvents);
    } catch (err) {
      console.error("[DeploymentTimeline] Error loading events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProofLogs(dep) {
    try {
      const logs = await base44.asServiceRole.entities.AutomationProofLog.filter(
        { client_deployment_id: dep.id },
        "-tested_at",
        50
      );
      return logs || [];
    } catch {
      return [];
    }
  }

  async function fetchExecutionLogs(dep) {
    try {
      const logs = await base44.asServiceRole.entities.AutomationExecutionLog.filter(
        { client_deployment_id: dep.id },
        "-created_date",
        100
      );
      return logs || [];
    } catch {
      return [];
    }
  }

  async function fetchAuditLogs(dep) {
    try {
      const logs = await base44.asServiceRole.entities.AuditLog.filter(
        { entity_id: dep.id },
        "-created_date",
        50
      );
      return logs || [];
    } catch {
      return [];
    }
  }

  function mapAuditAction(audit) {
    const action = audit.action || "";
    if (action.includes("approve") || action.includes("activate")) {
      return { label: "Activation Approved", description: "Admin approved system activation." };
    }
    if (action.includes("pause")) {
      return { label: "System Paused", description: "Admin paused the deployment." };
    }
    if (action.includes("resume")) {
      return { label: "System Resumed", description: "Admin resumed the deployment." };
    }
    if (action.includes("retry")) {
      return { label: "Module Retry Initiated", description: "Admin triggered a module retry." };
    }
    return null; // Unknown actions are not shown — no artificial events
  }

  // ── Render ───────────────────────────────────────────────────
  const deploymentDisplay = getDeploymentDisplayStatus(deployment?.deployment_status);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Project Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Real events from your deployment, verification logs, and admin actions.
        </p>
      </div>

      {/* Current deployment status banner */}
      {deployment && (
        <div
          className="rounded-xl p-5 flex items-center gap-4"
          style={{
            background: deploymentDisplay.bg_color,
            border: `1px solid ${deploymentDisplay.color}30`,
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: deploymentDisplay.color + "20", border: `1px solid ${deploymentDisplay.color}40` }}
          >
            <ShieldCheck className="w-6 h-6" style={{ color: deploymentDisplay.color }} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">{deploymentDisplay.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Deployment ID: {deployment.id?.slice(-8)} · {deployment.industry_slug || "custom"} · {deployment.package_tier_key || "standard"}
            </p>
          </div>
        </div>
      )}

      {/* Timeline events */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Event History</p>

        {loading ? (
          <div className="flex items-center gap-2 py-8">
            <Loader2 className="w-4 h-4 text-[#0088CC] animate-spin" />
            <span className="text-sm text-gray-400">Loading timeline…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No events recorded yet.</p>
            <p className="text-xs text-gray-400 mt-1">Events will appear here as your deployment progresses.</p>
          </div>
        ) : (
          <div>
            {events.map((evt, idx) => {
              const eventInfo = EVENT_ICON_MAP[evt.type] || EVENT_ICON_MAP.admin_action;
              const Icon = eventInfo.icon;
              const date = evt.timestamp ? new Date(evt.timestamp) : null;
              const isLast = idx === events.length - 1;

              return (
                <div key={evt.id} className="flex items-start gap-3.5 relative" style={{ paddingBottom: isLast ? 0 : "24px" }}>
                  {!isLast && (
                    <div
                      className="absolute left-[17px] top-9 w-0.5"
                      style={{ height: "calc(100% - 16px)", background: "rgba(0,0,0,0.06)" }}
                    />
                  )}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                    style={{ background: eventInfo.color + "15", border: `1.5px solid ${eventInfo.color}40` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: eventInfo.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{evt.label}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {evt.source}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{evt.description}</p>
                    {date && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(date, "MMM d, yyyy 'at' h:mm a")} · {formatDistanceToNow(date, { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Timeline events are sourced from real deployment, proof, and audit records. No artificial events are shown.
      </p>
    </div>
  );
}