/**
 * DeploymentTimeline — Phase 4.5 (merged with OnboardingExperienceHub)
 *
 * Truthful customer timeline that combines:
 *   1. Stage header (current/next step cards + progress banner) — merged from OnboardingExperienceHub
 *   2. Event history (real deployment events, proof logs, audit logs)
 *
 * Sources:
 *   1. ClientDeployment record (created_date, went_live_at, status transitions)
 *   2. AutomationProofLog records (verification events)
 *   3. AuditLog records (admin actions like approve, pause, resume)
 *   4. AutomationExecutionLog records (execution milestones)
 *
 * Props:
 *   deployment      — ClientDeployment record (may be null — handled gracefully)
 *   project         — ClientProject record
 *   order           — PortalOrder record
 *   showStageHeader — boolean (default true) — render the current/next step banner
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, Loader2, Zap, ShieldCheck, AlertCircle, Rocket,
  Settings, ArrowRight, CreditCard, Phone, Mail, Calendar,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { getDeploymentDisplayStatus } from "@/lib/clientStatusLanguage";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

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

// ── Stage definitions (merged from OnboardingExperienceHub) ──
const ONBOARDING_STAGES = [
  {
    key: "payment",
    label: "Order Completed",
    icon: CreditCard,
    description: "Your payment was received and your account is active.",
    milestone: "Account activated",
    estimatedHours: 0,
    deploymentStatus: ["pending"],
  },
  {
    key: "onboarding",
    label: "Business Profile Created",
    icon: Settings,
    description: "We received your onboarding information and are building your profile.",
    milestone: "Business profile ready",
    estimatedHours: 2,
    deploymentStatus: ["onboarding"],
  },
  {
    key: "system_setup",
    label: "Automation System Configured",
    icon: Zap,
    description: "Your response templates, sequences, and routing rules are being set up.",
    milestone: "System configuration complete",
    estimatedHours: 24,
    deploymentStatus: ["configuring"],
  },
  {
    key: "connections",
    label: "SMS & Email Connected",
    icon: Phone,
    description: "Your dedicated SMS number and email automation are being connected.",
    milestone: "All integrations connected",
    estimatedHours: 24,
    deploymentStatus: ["configuring"],
  },
  {
    key: "testing",
    label: "Testing Your Automation System",
    icon: ShieldCheck,
    description: "We're running verification tests on each automation module.",
    milestone: "All modules verified",
    estimatedHours: 48,
    deploymentStatus: ["ready"],
  },
  {
    key: "go_live",
    label: "System Verified & Live",
    icon: Rocket,
    description: "Your system has passed all checks and is now live.",
    milestone: "Full system active",
    estimatedHours: 48,
    deploymentStatus: ["live"],
  },
];

function getStageIndex(deploymentStatus, project) {
  if (!deploymentStatus) {
    if (project?.step_live === "complete") return 5;
    if (project?.step_followup === "complete") return 4;
    if (project?.step_sms === "complete") return 3;
    if (project?.step_system_setup === "complete") return 2;
    if (project?.step_onboarding === "complete") return 1;
    return 0;
  }
  const map = {
    pending: 0, onboarding: 1, configuring: 2, ready: 4, live: 5, error: 2, paused: 2, cancelled: 0,
  };
  return map[deploymentStatus] ?? 0;
}

// ── Stage Header (merged from OnboardingExperienceHub) ──
function StageHeader({ deployment, project, portalState }) {
  const deploymentStatus = deployment?.deployment_status || null;
  const currentStageIndex = getStageIndex(deploymentStatus, project);
  const cardState = getCardState(portalState, "installation_progress");
  const isProofLive = cardState.status === CARD_STATUS.LIVE;

  const stages = ONBOARDING_STAGES.map((stage, idx) => ({
    ...stage,
    idx,
    completed: idx < currentStageIndex,
    current: idx === currentStageIndex,
    estimatedDate: new Date(
      (deployment?.created_date ? new Date(deployment.created_date).getTime() : Date.now()) +
      stage.estimatedHours * 3600000
    ),
    proofTimestamp: getStageProofTimestamp(stage.key, deployment),
  }));

  const completedStages = stages.filter((s) => s.completed);
  const currentStage = stages.find((s) => s.current);
  const nextStage = stages.find((s) => s.idx === currentStageIndex + 1);
  const progressPct = Math.round((completedStages.length / stages.length) * 100);
  const isLive = currentStageIndex === 5 && isProofLive;

  return (
    <div className="space-y-4">
      {/* Current Stage Banner */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: isLive
            ? "linear-gradient(135deg,#10B981 0%,#059669 100%)"
            : "linear-gradient(135deg,#003B8F 0%,#006BB0 55%,#00AEEF 100%)",
          boxShadow: "0 4px 24px rgba(0,59,143,0.12)",
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
              {isLive ? "System Status" : "Current Stage"}
            </p>
            <h2 className="text-xl font-bold text-white font-display mb-1.5">
              {isLive ? "🎉 Your System Is Live!" : currentStage?.label || "Getting Started"}
            </h2>
            <p className="text-sm text-white/75 leading-relaxed">
              {isLive
                ? "All automation modules are verified and running. Your system is now capturing and responding to leads."
                : currentStage?.description || "We're setting up your automation system."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className="px-4 py-1.5 rounded-full text-sm font-bold"
              style={{
                background: isLive ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.15)",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              {progressPct}%
            </div>
            <span className="text-[10px] text-white/60">
              {completedStages.length} of {stages.length} milestones
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: isLive
                ? "linear-gradient(90deg,#4ade80,#22c55e)"
                : "linear-gradient(90deg,#60c8ff,#ffffff)",
            }}
          />
        </div>
      </div>

      {/* Current + Next step cards */}
      {!isLive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Current */}
          <div className="rounded-xl bg-white border border-blue-100 p-5 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "#00AEEF12", border: "1px solid #00AEEF25" }}
              >
                <Loader2 className="w-4 h-4 text-[#00AEEF] animate-spin" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">In Progress</p>
                <h4 className="text-sm font-bold text-gray-900">Currently</h4>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">{currentStage?.label}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{currentStage?.description}</p>
            {currentStage?.estimatedDate && (
              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Est. completion: {format(currentStage.estimatedDate, "MMM d, h:mm a")}
              </p>
            )}
          </div>

          {/* Next */}
          {nextStage ? (
            <div className="rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "#D4AF3708", border: "1px solid #D4AF3720" }}
                >
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Up Next</p>
                  <h4 className="text-sm font-bold text-gray-900">Next Step</h4>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">{nextStage.label}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{nextStage.description}</p>
              {nextStage.estimatedDate && (
                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Est. milestone: {format(nextStage.estimatedDate, "MMM d, h:mm a")}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-white border border-green-100 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "#10B98108", border: "1px solid #10B98120" }}
                >
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Almost There</p>
                  <h4 className="text-sm font-bold text-gray-900">Final Verification</h4>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-1">Final verification in progress</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                All steps complete. We're running final checks before your system goes live.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getStageProofTimestamp(stageKey, deployment) {
  if (stageKey === "payment" && deployment?.created_date) return deployment.created_date;
  if (stageKey === "go_live" && deployment?.went_live_at) return deployment.went_live_at;
  return null;
}

export default function DeploymentTimeline({
  deployment,
  project,
  order,
  showStageHeader = true,
  portalState,
}) {
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
      const [proofLogs, execLogs, auditLogs] = await Promise.all([
        fetchProofLogs(dep),
        fetchExecutionLogs(dep),
        fetchAuditLogs(dep),
      ]);

      const timelineEvents = [];

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

      timelineEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setEvents(timelineEvents);
    } catch (err) {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProofLogs(dep) {
    try {
      return await base44.admin.entities.AutomationProofLog.filter(
        { client_deployment_id: dep.id },
        "-tested_at",
        50
      ) || [];
    } catch {
      return [];
    }
  }

  async function fetchExecutionLogs(dep) {
    try {
      return await base44.admin.entities.AutomationExecutionLog.filter(
        { client_deployment_id: dep.id },
        "-created_date",
        100
      ) || [];
    } catch {
      return [];
    }
  }

  async function fetchAuditLogs(dep) {
    try {
      return await base44.admin.entities.AuditLog.filter(
        { entity_id: dep.id },
        "-created_date",
        50
      ) || [];
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
    return null;
  }

  const deploymentDisplay = deployment ? getDeploymentDisplayStatus(deployment.deployment_status) : null;

  return (
    <div className="space-y-6">
      {/* Stage Header (merged from OnboardingExperienceHub) */}
      {showStageHeader && (
        <StageHeader deployment={deployment} project={project} portalState={portalState} />
      )}

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Project Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Real events from your deployment, verification logs, and admin actions.
        </p>
      </div>

      {/* Current deployment status banner */}
      {deployment && deploymentDisplay && (
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Event History</p>
          {events.length > 0 && (
            <span className="text-[10px] font-semibold text-gray-400">
              {events.length} milestone{events.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-8">
            <Loader2 className="w-4 h-4 text-[#0088CC] animate-spin" />
            <span className="text-sm text-gray-400">Loading timeline…</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">No Timeline Events Yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Timeline events will appear here as your deployment progresses through setup and verification.
              Events are recorded automatically from real system activity.
            </p>
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">{evt.label}</span>
                      {date && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {format(date, "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{evt.description}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{
                          background: eventInfo.color + "12",
                          color: eventInfo.color,
                        }}
                      >
                        Completed
                      </span>
                      {date && (
                        <span className="text-[10px] text-gray-400">
                          {formatDistanceToNow(date, { addSuffix: true })}
                        </span>
                      )}
                      {!isLast && events[idx + 1] && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <span className="text-gray-300">→</span>
                          Next: {events[idx + 1].label}
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-1 text-[9px] font-medium text-gray-300">
                      via {evt.source}
                    </span>
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