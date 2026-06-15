import { CheckCircle2, Clock, AlertTriangle, Ban, Settings, TestTube } from "lucide-react";
import { getPackageAutomations, getDisplayServiceName } from "@/lib/dashboardHelpers";

const STATUS_CONFIG = {
  NotIncluded: { icon: Ban, color: "#9ca3af", label: "Not Included", bg: "rgba(156,163,175,0.06)" },
  SetupPending: { icon: Settings, color: "#8b5cf6", label: "Setup Pending", bg: "rgba(139,92,246,0.06)" },
  Testing: { icon: TestTube, color: "#0088CC", label: "Testing", bg: "rgba(0,136,204,0.06)" },
  Live: { icon: CheckCircle2, color: "#22c55e", label: "Live", bg: "rgba(34,197,94,0.06)" },
  NeedsAttention: { icon: AlertTriangle, color: "#ef4444", label: "Needs Attention", bg: "rgba(239,68,68,0.06)" },
};

function resolveAutomationStatus(automationKey, services, failedEvents) {
  // Check if a matching service exists in the order
  const svc = (services || []).find(
    (s) => {
      const sk = (s?.service_key || "").toLowerCase().replace(/[_\s-]+/g, "_");
      const ak = automationKey.toLowerCase().replace(/[_\s-]+/g, "_");
      return sk === ak || sk.includes(ak) || ak.includes(sk);
    }
  );

  if (!svc) return "SetupPending";

  const status = svc.install_status || "Paid";
  if (status === "Live") return "Live";
  if (status === "Testing") return "Testing";
  if (status === "Error") return "NeedsAttention";

  // Check for failed events related to this service
  const hasFailedEvents = (failedEvents || []).some((e) => {
    const svcKey = e?.service_key || e?.metadata_json || "";
    return svcKey.includes(automationKey) && e.status === "failed";
  });
  if (hasFailedEvents) return "NeedsAttention";

  return "SetupPending";
}

export default function ActiveAutomationsPanel({ packageKey, services = [], failedEvents = [], isAdmin = false }) {
  const automations = getPackageAutomations(packageKey);

  if (automations.length === 0) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary mb-3">Active Automations</p>
        <p className="text-[13px] text-muted-foreground">No automation package detected for this account.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary mb-4">Active Automations</p>

      <div className="space-y-2.5">
        {automations.map((auto) => {
          const resolved = resolveAutomationStatus(auto.key, services, failedEvents);
          const config = STATUS_CONFIG[resolved] || STATUS_CONFIG.SetupPending;
          const Icon = config.icon;

          return (
            <div
              key={auto.key}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl"
              style={{ background: config.bg, border: `1px solid ${config.color}18` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: config.color }} />
                <span className="text-[12px] font-semibold text-foreground truncate">{auto.label}</span>
              </div>
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.08em] flex-shrink-0 ml-2 px-2 py-0.5 rounded-full"
                style={{ color: config.color, background: `${config.color}12` }}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}