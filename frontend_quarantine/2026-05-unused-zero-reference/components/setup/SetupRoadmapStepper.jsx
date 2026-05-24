import { CheckCircle2, Loader2, CreditCard, ClipboardList, Settings, Globe, Zap } from "lucide-react";
import { motion } from "framer-motion";

// Maps workflow_stage values to which phase index is "in_progress" or "complete"
// Phase indices: 0=Payment, 1=Intake, 2=SystemConfig, 3=WebsiteBuilding, 4=GoLive

function derivePhaseStatuses(record) {
  if (!record) return ["pending", "pending", "pending", "pending", "pending"];

  const stage = record.workflow_stage;
  const activationStatus = record.activation_status;

  // Stage → phase progress mapping
  const stageOrder = [
    "intake_received",
    "website_building",
    "website_review",
    "website_approved",
    "website_live",
    "automation_setup",
    "automation_testing",
    "activation_ready",
    "activated",
  ];

  const stageIdx = stageOrder.indexOf(stage);

  // Phase 0: Payment — complete once we have any record (they paid to get here)
  const payment = "complete";

  // Phase 1: Intake — complete once past intake_received
  let intake = "pending";
  if (stageIdx >= 1) intake = "complete";
  else if (stage === "intake_received") intake = "in_progress";

  // Phase 2: System Configuration — in_progress during automation_setup/testing, complete after activation_ready or activated
  let systemConfig = "pending";
  if (stageIdx >= 7) systemConfig = "complete"; // activation_ready or activated
  else if (["automation_setup", "automation_testing"].includes(stage)) systemConfig = "in_progress";
  else if (stageIdx >= 1 && stageIdx < 5) systemConfig = "pending"; // waiting on website first

  // Phase 3: Website Building — in_progress during website stages, complete once website_live
  let website = "pending";
  if (stageIdx >= 5) website = "complete"; // automation_setup or beyond means website done
  else if (["website_building", "website_review", "website_approved"].includes(stage)) website = "in_progress";

  // Phase 4: Go-Live — complete when activated
  let goLive = "pending";
  if (activationStatus === "activated" || stage === "activated") goLive = "complete";
  else if (stage === "activation_ready" || activationStatus === "ready_for_approval") goLive = "in_progress";

  return [payment, intake, systemConfig, website, goLive];
}

const PHASES = [
  {
    key: "payment",
    label: "Payment Confirmed",
    icon: CreditCard,
    color: "#22c55e",
    desc: "Your payment has been processed and your account is active. We're ready to begin.",
  },
  {
    key: "intake",
    label: "Intake & Credentials",
    icon: ClipboardList,
    color: "#0088CC",
    desc: "We've collected your business details, branding assets, and configuration credentials.",
  },
  {
    key: "system_config",
    label: "System Configuration",
    icon: Settings,
    color: "#009DFF",
    desc: "Our team is setting up your automation systems — SMS, email sequences, booking flows, and follow-up rules.",
  },
  {
    key: "website",
    label: "Website Building",
    icon: Globe,
    color: "#003B8F",
    desc: "Your custom website is being designed, built, and reviewed by our team before launch.",
  },
  {
    key: "go_live",
    label: "Go-Live",
    icon: Zap,
    color: "#00AEEF",
    desc: "Everything is verified and activated. Your system is live and capturing leads automatically.",
  },
];

function PhaseIcon({ status, Icon, color }) {
  if (status === "complete") {
    return <CheckCircle2 style={{ width: "18px", height: "18px", color: "#22c55e" }} />;
  }
  if (status === "in_progress") {
    return <Loader2 style={{ width: "17px", height: "17px", color, animation: "roadmap-spin 1.1s linear infinite" }} />;
  }
  return <Icon style={{ width: "16px", height: "16px", color: "rgba(10,22,40,0.28)" }} />;
}

function PhaseBadge({ status }) {
  const cfg = {
    complete:    { label: "Complete",     bg: "rgba(34,197,94,0.1)",  color: "#15803d",  border: "rgba(34,197,94,0.3)" },
    in_progress: { label: "In Progress",  bg: "rgba(0,136,204,0.1)",  color: "#0088CC",  border: "rgba(0,136,204,0.3)" },
    pending:     { label: "Upcoming",     bg: "rgba(0,0,0,0.04)",     color: "rgba(10,22,40,0.38)", border: "rgba(0,0,0,0.08)" },
  }[status] || {};

  return (
    <span style={{
      fontSize: "10px", fontWeight: "700", padding: "2px 9px", borderRadius: "9999px",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: "0.05em", textTransform: "uppercase", flexShrink: 0,
    }}>
      {cfg.label}
    </span>
  );
}

export default function SetupRoadmapStepper({ record }) {
  const statuses = derivePhaseStatuses(record);
  const completedCount = statuses.filter(s => s === "complete").length;
  const pct = Math.round((completedCount / PHASES.length) * 100);
  const isLive = statuses[4] === "complete";
  const currentPhaseIdx = statuses.indexOf("in_progress");

  return (
    <div>
      {/* Progress header */}
      <div style={{
        background: "linear-gradient(135deg, #003B8F 0%, #006BB0 55%, #00AEEF 100%)",
        borderRadius: "20px 20px 0 0",
        padding: "24px 28px 22px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.2em", margin: "0 0 5px" }}>
              Installation Roadmap
            </p>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#ffffff", margin: 0, lineHeight: 1.2 }}>
              {isLive ? "🎉 You're Live!" : currentPhaseIdx >= 0 ? PHASES[currentPhaseIdx].label : "Getting Started"}
            </h2>
            {!isLive && (
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "5px 0 0" }}>
                {currentPhaseIdx >= 0
                  ? `Currently: ${PHASES[currentPhaseIdx].desc}`
                  : "Our team will begin setup shortly."}
              </p>
            )}
          </div>
          <div style={{
            flexShrink: 0, padding: "8px 16px", borderRadius: "9999px",
            background: isLive ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.14)",
            border: `1px solid ${isLive ? "rgba(34,197,94,0.45)" : "rgba(255,255,255,0.22)"}`,
            color: isLive ? "#4ade80" : "#ffffff",
            fontSize: "15px", fontWeight: "800",
          }}>
            {pct}%
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: "7px", borderRadius: "9999px", background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: "9999px",
              background: isLive
                ? "linear-gradient(90deg,#4ade80,#22c55e)"
                : "linear-gradient(90deg,#60c8ff,#ffffff)",
            }}
          />
        </div>

        {/* Phase dots */}
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          {PHASES.map((p, i) => (
            <div key={p.key} style={{
              flex: 1, height: "5px", borderRadius: "9999px",
              background: statuses[i] === "complete" ? "#4ade80"
                : statuses[i] === "in_progress" ? "#60c8ff"
                : "rgba(255,255,255,0.18)",
              transition: "background 0.4s",
            }} />
          ))}
        </div>
      </div>

      {/* Stepper body */}
      <div style={{ padding: "28px 28px 24px", background: "#ffffff", borderRadius: "0 0 20px 20px" }}>
        {PHASES.map((phase, idx) => {
          const status = statuses[idx];
          const isLast = idx === PHASES.length - 1;
          const Icon = phase.icon;
          const dimmed = status === "pending";

          return (
            <motion.div
              key={phase.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
              style={{ display: "flex", alignItems: "flex-start", gap: "16px", position: "relative", paddingBottom: isLast ? 0 : "8px" }}
            >
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  position: "absolute",
                  left: "19px", top: "44px",
                  width: "2px",
                  height: "calc(100% - 8px)",
                  background: status === "complete"
                    ? "rgba(0,174,239,0.35)"
                    : "rgba(0,0,0,0.07)",
                  borderRadius: "2px",
                  zIndex: 0,
                }} />
              )}

              {/* Icon bubble */}
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
                zIndex: 1,
                background: status === "complete"
                  ? "rgba(34,197,94,0.1)"
                  : status === "in_progress"
                    ? "rgba(0,136,204,0.1)"
                    : "rgba(0,0,0,0.04)",
                border: `1.5px solid ${
                  status === "complete" ? "rgba(34,197,94,0.35)"
                  : status === "in_progress" ? "rgba(0,136,204,0.35)"
                  : "rgba(0,0,0,0.08)"
                }`,
                boxShadow: status === "complete" ? "0 0 12px rgba(34,197,94,0.18)"
                  : status === "in_progress" ? "0 0 12px rgba(0,136,204,0.15)"
                  : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.3s",
              }}>
                <PhaseIcon status={status} Icon={Icon} color={phase.color} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: isLast ? 0 : "24px", opacity: dimmed ? 0.42 : 1, transition: "opacity 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span style={{
                    fontSize: "15px", fontWeight: "700",
                    color: status === "complete" ? "#0A1628"
                      : status === "in_progress" ? "#0088CC"
                      : "rgba(10,22,40,0.45)",
                  }}>
                    Phase {idx + 1}: {phase.label}
                  </span>
                  <PhaseBadge status={status} />
                </div>
                <p style={{ fontSize: "13px", color: "rgba(10,22,40,0.55)", margin: 0, lineHeight: 1.55 }}>
                  {phase.desc}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Footer note */}
        {!isLive && (
          <div style={{
            marginTop: "20px", padding: "14px 16px", borderRadius: "14px",
            background: "rgba(0,174,239,0.05)", border: "1px solid rgba(0,174,239,0.12)",
          }}>
            <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.6)", margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: "#0088CC" }}>Our team is handling everything.</strong>{" "}
              Most clients go live within 24–48 hours. You'll receive an email notification when each phase is complete.
            </p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes roadmap-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }` }} />
    </div>
  );
}