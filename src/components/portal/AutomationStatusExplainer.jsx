/**
 * AutomationStatusExplainer — human-readable explanations for each install status.
 * Eliminates client confusion about what "Configuring" or "Testing" actually means.
 */
const STATUS_EXPLAINERS = {
  Paid: {
    icon: "✅",
    color: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.25)",
    textColor: "#15803d",
    title: "Payment Confirmed",
    detail: "Your order has been received. Our team is preparing your installation workspace.",
  },
  "Ready for Install": {
    icon: "🔧",
    color: "rgba(0,174,239,0.08)",
    borderColor: "rgba(0,174,239,0.2)",
    textColor: "#0088CC",
    title: "Ready for Install",
    detail: "Your system configuration has been approved. Installation is queued and begins shortly.",
  },
  Configuring: {
    icon: "⚙️",
    color: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.25)",
    textColor: "#d97706",
    title: "Actively Configuring",
    detail:
      "Our team is customizing your SMS templates, verifying your business phone number, and wiring your lead routing logic. This usually takes 24–48 hours.",
  },
  Testing: {
    icon: "🧪",
    color: "rgba(139,92,246,0.08)",
    borderColor: "rgba(139,92,246,0.25)",
    textColor: "#7c3aed",
    title: "Running System Tests",
    detail:
      "We're executing test calls and test messages to verify your missed-call text-back, instant response, and booking flow work perfectly before going live.",
  },
  Live: {
    icon: "🚀",
    color: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.3)",
    textColor: "#15803d",
    title: "System Is Live!",
    detail:
      "Your automation system is fully active. Leads are now being captured, missed calls text back automatically, and your follow-up sequences are running.",
  },
  Error: {
    icon: "⚠️",
    color: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.25)",
    textColor: "#dc2626",
    title: "Setup Needs Attention",
    detail:
      "Our team has flagged a configuration issue that needs resolution. We'll contact you within 1 business day. You can also message us in the Support tab.",
  },
};

export default function AutomationStatusExplainer({ status, serviceName }) {
  const cfg = STATUS_EXPLAINERS[status] || STATUS_EXPLAINERS["Ready for Install"];

  return (
    <div
      className="flex items-start gap-3 rounded-xl px-4 py-3"
      style={{
        background: cfg.color,
        border: `1.5px solid ${cfg.borderColor}`,
      }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
      <div>
        {serviceName && (
          <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: cfg.textColor }}>
            {serviceName}
          </p>
        )}
        <p className="text-sm font-bold text-foreground">{cfg.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cfg.detail}</p>
      </div>
    </div>
  );
}