import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Phone,
  Mail,
  Calendar,
  RefreshCw,
  Star,
  CreditCard,
  Settings,
} from "lucide-react";

// ─── SETUP TRACK DEFINITIONS ─────────────────────────────────────────────────
// Each track maps to a provider/integration that must be configured.
// "derives_from" keys map to project step fields or order service install_status.

const PROVIDER_TRACKS = [
  {
    id: "payment",
    label: "Payment Confirmed",
    icon: CreditCard,
    color: "#22c55e",
    description: "Your payment has been processed and your account is active.",
    derives_from: "step_payment",
    group: "Account",
  },
  {
    id: "onboarding_form",
    label: "Onboarding Info Received",
    icon: Settings,
    color: "#0088CC",
    description: "We have your business details and are ready to configure your system.",
    derives_from: "step_onboarding",
    group: "Account",
  },
  {
    id: "twilio_sms",
    label: "Twilio SMS Line",
    icon: Phone,
    color: "#0088CC",
    description: "Your dedicated SMS number is provisioned and connected for instant lead response and missed-call text-back.",
    derives_from: "step_sms",
    group: "Connections",
  },
  {
    id: "email",
    label: "Email Automation",
    icon: Mail,
    color: "#009DFF",
    description: "Your email sequences are configured and ready to send follow-ups automatically.",
    derives_from: "step_email",
    group: "Connections",
  },
  {
    id: "calendar_booking",
    label: "Booking Flow & Calendar Sync",
    icon: Calendar,
    color: "#003B8F",
    description: "Your booking link is connected and the AI booking agent can route qualified leads directly to your calendar.",
    derives_from: "step_booking",
    group: "Connections",
  },
  {
    id: "system_setup",
    label: "Automation System Setup",
    icon: Zap,
    color: "#00AEEF",
    description: "Your full automation system is being configured — response templates, sequences, and routing rules.",
    derives_from: "step_system_setup",
    group: "Automations",
  },
  {
    id: "followup",
    label: "Follow-Up Sequences Active",
    icon: RefreshCw,
    color: "#0088CC",
    description: "Your multi-touch SMS and email follow-up sequences are loaded and running.",
    derives_from: "step_followup",
    group: "Automations",
  },
  {
    id: "review_request",
    label: "Review Request System",
    icon: Star,
    color: "#f59e0b",
    description: "Automatic review requests are configured to fire after completed appointments.",
    derives_from_service: "review_request",
    group: "Automations",
    optional: true,
  },
  {
    id: "go_live",
    label: "System Verified & Live",
    icon: Zap,
    color: "#22c55e",
    description: "Your entire system has been tested and verified. You are live.",
    derives_from: "step_live",
    group: "Launch",
  },
];

// ─── STEP STATUS RESOLVER ─────────────────────────────────────────────────────
function resolveStatus(track, project, order) {
  // Check project step field
  if (track.derives_from) {
    const val = project?.[track.derives_from];
    if (val === "complete") return "complete";
    if (val === "in_progress") return "in_progress";
    return "pending";
  }

  // Check order service install_status
  if (track.derives_from_service && order?.services) {
    const svc = order.services.find((s) => s.service_key === track.derives_from_service);
    if (!svc) return "not_purchased";
    const s = svc.install_status || "";
    if (s === "Live") return "complete";
    if (["Configuring", "Testing", "Ready for Install"].includes(s)) return "in_progress";
    if (s === "Error") return "error";
    if (s === "Paid") return "pending";
    return "pending";
  }

  return "pending";
}

// ─── STATUS ICON ─────────────────────────────────────────────────────────────
function StatusIcon({ status, color }) {
  if (status === "complete") return <CheckCircle2 style={{ width: "16px", height: "16px", color: "#22c55e" }} />;
  if (status === "in_progress") return <Loader2 style={{ width: "15px", height: "15px", color: color || "#0088CC", animation: "onb-spin 1.1s linear infinite" }} />;
  if (status === "error") return <AlertCircle style={{ width: "15px", height: "15px", color: "#ef4444" }} />;
  if (status === "not_purchased") return <Circle style={{ width: "15px", height: "15px", color: "rgba(0,0,0,0.18)" }} />;
  return <Circle style={{ width: "15px", height: "15px", color: "rgba(0,0,0,0.22)" }} />;
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    complete:      { label: "Done",        bg: "rgba(34,197,94,0.1)",   color: "#16a34a",  border: "rgba(34,197,94,0.3)"  },
    in_progress:   { label: "In Progress", bg: "rgba(0,174,239,0.1)",   color: "#0088CC",  border: "rgba(0,174,239,0.3)"  },
    error:         { label: "Error",       bg: "rgba(239,68,68,0.1)",   color: "#ef4444",  border: "rgba(239,68,68,0.3)"  },
    pending:       { label: "Pending",     bg: "rgba(0,0,0,0.04)",      color: "rgba(10,22,40,0.4)", border: "rgba(0,0,0,0.1)" },
    not_purchased: { label: "Not in plan", bg: "rgba(0,0,0,0.04)",      color: "rgba(10,22,40,0.35)", border: "rgba(0,0,0,0.08)" },
  };
  const cfg = map[status] || map.pending;
  return (
    <span style={{
      fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "9999px",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── SINGLE TRACK ROW ─────────────────────────────────────────────────────────
function TrackRow({ track, status, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = track.icon;
  const dimmed = status === "pending" || status === "not_purchased";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      style={{ position: "relative" }}
    >
      {/* Connector line */}
      {!isLast && (
        <div style={{
          position: "absolute",
          left: "18px", top: "44px",
          width: "2px",
          height: "calc(100% - 8px)",
          background: status === "complete" ? "rgba(0,174,239,0.3)" : "rgba(0,0,0,0.06)",
          borderRadius: "2px",
          zIndex: 0,
        }} />
      )}

      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: "flex", alignItems: "flex-start", gap: "14px",
          padding: "10px 4px 10px 0",
          cursor: "pointer",
          opacity: dimmed ? 0.5 : 1,
          transition: "opacity 0.2s",
          position: "relative", zIndex: 1,
        }}
      >
        {/* Icon bubble */}
        <div style={{
          width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
          background: status === "complete"
            ? "rgba(34,197,94,0.1)"
            : status === "in_progress"
              ? `rgba(0,136,204,0.1)`
              : status === "error"
                ? "rgba(239,68,68,0.08)"
                : "rgba(0,0,0,0.04)",
          border: `1.5px solid ${
            status === "complete" ? "rgba(34,197,94,0.35)"
            : status === "in_progress" ? "rgba(0,136,204,0.3)"
            : status === "error" ? "rgba(239,68,68,0.3)"
            : "rgba(0,0,0,0.08)"
          }`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {status === "complete" || status === "error" || status === "in_progress"
            ? <StatusIcon status={status} color={track.color} />
            : <Icon style={{ width: "15px", height: "15px", color: track.color }} />
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "#0A1628", lineHeight: 1.3 }}>
              {track.label}
            </span>
            {track.optional && (
              <span style={{ fontSize: "10px", color: "rgba(10,22,40,0.4)", fontWeight: "600" }}>optional</span>
            )}
            <StatusBadge status={status} />
          </div>
          {expanded && (
            <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.55)", margin: "4px 0 0", lineHeight: 1.5 }}>
              {track.description}
            </p>
          )}
        </div>

        {/* Chevron */}
        {expanded
          ? <ChevronUp style={{ width: "14px", height: "14px", color: "rgba(10,22,40,0.3)", flexShrink: 0, marginTop: "2px" }} />
          : <ChevronDown style={{ width: "14px", height: "14px", color: "rgba(10,22,40,0.3)", flexShrink: 0, marginTop: "2px" }} />
        }
      </div>
    </motion.div>
  );
}

// ─── GROUP SECTION ────────────────────────────────────────────────────────────
function GroupSection({ name, tracks, project, order }) {
  const statuses = tracks.map(t => resolveStatus(t, project, order));
  const doneCount = statuses.filter(s => s === "complete").length;
  const relevant = tracks.filter((_, i) => statuses[i] !== "not_purchased");
  const relevantDone = relevant.filter((_, i) => {
    const idx = tracks.indexOf(relevant[i]);
    return statuses[idx] === "complete";
  }).length;

  if (relevant.length === 0) return null;

  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <p style={{ fontSize: "10px", fontWeight: "800", color: "#0088CC", textTransform: "uppercase", letterSpacing: "0.18em", margin: 0 }}>
          {name}
        </p>
        <span style={{ fontSize: "11px", fontWeight: "700", color: relevantDone === relevant.length ? "#22c55e" : "rgba(10,22,40,0.4)" }}>
          {relevantDone}/{relevant.length}
        </span>
      </div>
      <div style={{ paddingLeft: "2px" }}>
        {tracks.map((track, i) => {
          const status = statuses[i];
          if (status === "not_purchased") return null;
          const isLast = i === tracks.length - 1 || tracks.slice(i + 1).every((_, j) => statuses[i + 1 + j] === "not_purchased");
          return <TrackRow key={track.id} track={track} status={status} index={i} isLast={isLast} />;
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function OnboardingTracker({ project, order }) {
  // Derive overall progress
  const allStatuses = PROVIDER_TRACKS.map(t => resolveStatus(t, project, order));
  const relevant = PROVIDER_TRACKS.filter((_, i) => allStatuses[i] !== "not_purchased");
  const done = relevant.filter((t, i) => {
    const idx = PROVIDER_TRACKS.indexOf(relevant[i]);
    return allStatuses[idx] === "complete";
  }).length;
  const inProgress = allStatuses.filter(s => s === "in_progress").length;
  const pct = relevant.length > 0 ? Math.round((done / relevant.length) * 100) : 0;
  const isLive = pct === 100;

  // Group tracks
  const groups = ["Account", "Connections", "Automations", "Launch"];

  return (
    <div style={{
      background: "#ffffff",
      border: "1.5px solid rgba(0,174,239,0.15)",
      borderRadius: "20px",
      overflow: "hidden",
      boxShadow: "0 4px 24px rgba(0,59,143,0.08)",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #003B8F 0%, #006BB0 55%, #00AEEF 100%)",
        padding: "22px 24px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 5px" }}>
              Setup Progress
            </p>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
              {isLive ? "🎉 Your System Is Live!" : inProgress > 0 ? "Setup In Progress" : "Onboarding Tracker"}
            </h3>
            {!isLive && (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "5px 0 0" }}>
                {inProgress > 0
                  ? `${inProgress} step${inProgress > 1 ? "s" : ""} currently being configured`
                  : `${relevant.length - done} step${relevant.length - done !== 1 ? "s" : ""} remaining before go-live`}
              </p>
            )}
          </div>
          <div style={{
            flexShrink: 0, padding: "8px 16px", borderRadius: "9999px",
            background: isLive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.14)",
            border: `1px solid ${isLive ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.22)"}`,
            color: isLive ? "#4ade80" : "#ffffff",
            fontSize: "14px", fontWeight: "800",
          }}>
            {pct}%
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: "6px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: "9999px",
              background: isLive
                ? "linear-gradient(90deg, #4ade80, #22c55e)"
                : "linear-gradient(90deg, #60c8ff, #ffffff)",
            }}
          />
        </div>

        {/* Step dots */}
        <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
          {relevant.map((track, i) => {
            const idx = PROVIDER_TRACKS.indexOf(track);
            const status = allStatuses[idx];
            return (
              <div
                key={track.id}
                title={track.label}
                style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  background: status === "complete" ? "#4ade80"
                    : status === "in_progress" ? "#60c8ff"
                    : status === "error" ? "#ef4444"
                    : "rgba(255,255,255,0.2)",
                  transition: "background 0.3s",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Body — grouped tracks */}
      <div style={{ padding: "20px 24px" }}>
        {groups.map(groupName => {
          const tracks = PROVIDER_TRACKS.filter(t => t.group === groupName);
          return (
            <GroupSection
              key={groupName}
              name={groupName}
              tracks={tracks}
              project={project}
              order={order}
            />
          );
        })}

        {/* Footer note */}
        {!isLive && (
          <div style={{
            marginTop: "16px", padding: "12px 16px", borderRadius: "14px",
            background: "rgba(0,174,239,0.05)", border: "1px solid rgba(0,174,239,0.12)",
          }}>
            <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.6)", margin: 0, lineHeight: 1.5 }}>
              <strong style={{ color: "#0088CC" }}>Our team is handling all of this.</strong>{" "}
              Most clients go live within 24–48 hours. You'll receive an email when each step is complete.
            </p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes onb-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      ` }} />
    </div>
  );
}