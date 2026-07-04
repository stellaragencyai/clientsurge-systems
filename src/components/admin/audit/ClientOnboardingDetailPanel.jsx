import {
  Workflow,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <p className="text-lg font-bold" style={{ color: color || "#000", fontFamily: "Montserrat, sans-serif" }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

const STATE_COLORS = {
  "Intake received": "#6b7280",
  "Setup authorization needed": "#d97706",
  "Website scan needed": "#d97706",
  "Blueprint needed": "#d97706",
  "Client approval needed": "#d97706",
  "Access needed": "#d97706",
  "Simulation needed": "#d97706",
  "Ready for activation": "#0ea5e9",
  Live: "#16a34a",
  Blocked: "#dc2626",
};

const ENTITY_LABELS = {
  setup_authorization: "Setup Authorization",
  activation_wizard_session: "Activation Wizard",
  website_intelligence_scan: "Website Intelligence Scan",
  ai_install_blueprint: "AI Install Blueprint",
  ai_business_profile: "AI Business Profile",
  smart_access_request: "Smart Access Request",
  simulation_run: "Simulation Run",
  onboarding_orchestration: "Onboarding Orchestration",
  client_installation_os: "Client Installation OS",
};

export default function ClientOnboardingDetailPanel({ detail }) {
  if (!detail) return null;
  const counts = detail.entity_counts || {};
  const chain = detail.chain_validation;
  const state = detail.onboarding_state || "Intake received";
  const stateColor = STATE_COLORS[state] || "#6b7280";

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Workflow className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Client Onboarding Detail
        </h3>
      </div>

      {/* Onboarding state banner */}
      <div className="mb-4 rounded-xl p-3" style={{ background: `${stateColor}15`, border: `1px solid ${stateColor}40` }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Onboarding State</span>
          <span className="text-sm font-bold" style={{ color: stateColor, fontFamily: "Montserrat, sans-serif" }}>{state}</span>
        </div>
      </div>

      {/* Entity count pills */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mb-4">
        {Object.entries(ENTITY_LABELS).map(([key, label]) => (
          <StatPill key={key} label={label} value={counts[key] || 0} color={counts[key] > 0 ? "#16a34a" : "#6b7280"} />
        ))}
      </div>

      {/* Chain validation */}
      {chain ? (
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Onboarding Chain — Latest Paid Order
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <ChainStep label="Paid Order" passed={true} />
            <ChainStep label="Orchestration" passed={chain.has_orchestration} />
            <ChainStep label="Install OS" passed={chain.has_install_os} />
            <ChainStep label="Setup Auth" passed={chain.has_setup_authorization} />
            <ChainStep label="Website Scan" passed={chain.has_website_scan} />
            <ChainStep label="AI Blueprint" passed={chain.has_ai_blueprint} />
            <ChainStep label="AI Profile" passed={chain.has_ai_business_profile} />
            <ChainStep label="Access Request" passed={chain.has_smart_access_request} />
            <ChainStep label="Simulation" passed={chain.has_simulation_run} />
            <ChainStep label="Live" passed={chain.install_os_live} />
          </div>
          {chain.install_os_stage && (
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Install OS Stage</span>
              <span className="font-semibold text-foreground">{chain.install_os_stage}</span>
            </div>
          )}
          {chain.install_os_activation_status && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-muted-foreground">Activation Status</span>
              <span className="font-semibold text-foreground">{chain.install_os_activation_status}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border p-3">
          <p className="text-xs text-muted-foreground italic">No production-trusted paid order found to validate onboarding chain.</p>
        </div>
      )}
    </div>
  );
}

function ChainStep({ label, passed }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2 py-1.5" style={{ background: passed ? "rgba(22,163,74,0.08)" : "rgba(220,38,38,0.06)" }}>
      {passed ? <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: "#16a34a" }} /> : <XCircle className="w-3 h-3 flex-shrink-0" style={{ color: "#dc2626" }} />}
      <span className="text-[10px] font-semibold" style={{ color: passed ? "#16a34a" : "#dc2626" }}>{label}</span>
    </div>
  );
}