import {
  ShieldCheck, ShieldAlert, ShieldX, Info, Lock,
  CheckCircle2, AlertTriangle, XCircle, FileText,
} from "lucide-react";

const RULES = [
  {
    id: 1,
    title: "Complete means real data proves it",
    icon: ShieldCheck,
    tone: "green",
    detail:
      "A category or capability is only marked complete when actual stored records — AutomationProofLog passes, delivered CommunicationLog/CommunicationEvent entries, verified checklists — demonstrate success. No assumptions, no promises, no roadmap intentions.",
    example: "instant_lead_response = complete only if a delivered SMS exists for a real lead AND an AutomationProofLog pass record was created.",
  },
  {
    id: 2,
    title: "Partial means infrastructure exists but proof is incomplete",
    icon: ShieldAlert,
    tone: "amber",
    detail:
      "Yellow/partial means the plumbing is there — webhook URL set, provider enabled, checklist started — but the proof chain is broken or missing. Something was configured, but real delivery or a passing proof log has not been recorded.",
    example: "missed_call_webhook_url is set but no delivered SMS was logged for a real missed call → partial.",
  },
  {
    id: 3,
    title: "Missing means no usable implementation or evidence exists",
    icon: ShieldX,
    tone: "red",
    detail:
      "Red/missing means there is no evidence of a working implementation — no webhook, no provider configuration, no proof logs, and no delivery records. The feature has not been built or has not been exercised in production.",
    example: "lead_reactivation = missing if no AutomationProofLog pass and no CommunicationEvent tied to a reactivation flow.",
  },
  {
    id: 4,
    title: "A provider attempt is not the same as a successful outcome",
    icon: AlertTriangle,
    tone: "amber",
    detail:
      "A CommunicationLog with status=sent or queued proves only that a request was made to Twilio. It does not prove the recipient received the message. Only delivery_status=delivered (with a valid provider_message_id) counts as delivery proof.",
    example: "An SMS log with provider_message_id=null and status=sent is classified as weak evidence, not a successful outcome.",
  },
  {
    id: 5,
    title: "Internal/test records may be useful for QA but must not count as production proof",
    icon: Info,
    tone: "slate",
    detail:
      "Records from internal, smoke, or test environments — identified by email patterns, source tags, or quality_reason_codes — are excluded from production metrics. They are preserved in the database for debugging but never used to justify a complete status.",
    example: "A CommunicationLog tied to clientsurge-install.internal is quarantined and does not inflate delivery counts.",
  },
  {
    id: 6,
    title: "Customer-facing trust requires evidence records, checklist readiness, and no active blockers",
    icon: ShieldCheck,
    tone: "green",
    detail:
      "Before any capability is presented as trusted to clients, three conditions must hold simultaneously: (a) at least one AutomationProofLog pass exists, (b) the related AutomationChecklist shows configuration + test-lead + client-approved flags, and (c) no active blockers are present in the audit data. All three — not two, not one.",
    example: "A capability with a proof pass but a failed test_response_received flag stays partial until the checklist is also satisfied.",
  },
  {
    id: 7,
    title: "If proof is uncertain, the status must stay partial or missing",
    icon: ShieldAlert,
    tone: "amber",
    detail:
      "When evidence is ambiguous, stale, or contradictory, the system defaults to the more conservative status. Uncertainty never rounds up to complete. If a delivery record exists but cannot be tied to a real lead, or a proof log is pending, the capability remains partial at best.",
    example: "A CommunicationEvent with direction=outbound, status=sent, but no provider_message_id → weak proof → partial, never complete.",
  },
];

const TONE_STYLES = {
  green: { color: "#059669", bg: "rgba(5,150,105,0.04)", border: "rgba(5,150,105,0.18)", iconBg: "rgba(5,150,105,0.10)" },
  amber: { color: "#D97706", bg: "rgba(217,119,6,0.04)", border: "rgba(217,119,6,0.18)", iconBg: "rgba(217,119,6,0.10)" },
  red: { color: "#DC2626", bg: "rgba(220,38,38,0.03)", border: "rgba(220,38,38,0.16)", iconBg: "rgba(220,38,38,0.08)" },
  slate: { color: "#475569", bg: "rgba(71,85,105,0.03)", border: "rgba(71,85,105,0.16)", iconBg: "rgba(71,85,105,0.08)" },
};

const GLOSSARY = [
  { term: "Proof record", def: "An AutomationProofLog entry with status=pass tied to a specific service_key." },
  { term: "Delivery proof", def: "A CommunicationLog with delivery_status=delivered and a non-null provider_message_id." },
  { term: "Weak evidence", def: "A CommunicationLog/Event with status=sent or queued but no provider_message_id — attempt only, no delivery confirmation." },
  { term: "Test data", def: "Records with test/smoke/internal email patterns, source tags, or quality_reason_codes. Excluded from production metrics." },
  { term: "Active blocker", def: "A concrete issue preventing complete status — 404 webhook, missing agent IDs, failed checklist flag, etc." },
];

export default function TrustRulesPanel() {
  return (
    <div className="space-y-5">
      {/* Admin-only banner */}
      <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-slate-800">Admin-only reference — not customer-facing</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            These rules govern how the Twilio Growth Engine computes capability statuses. They are internal
            operational truth and must not be surfaced on public pages or shared with clients as guarantees.
          </p>
        </div>
      </div>

      {/* Intro */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Trust Rules — How Statuses Are Decided</h3>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          The status system never marks a capability complete unless real app data proves it. The seven rules below
          define the decision logic used by the audit function and every panel in this area. When in doubt, the
          system always defaults to the more conservative status.
        </p>
      </div>

      {/* Rule cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {RULES.map(rule => {
          const style = TONE_STYLES[rule.tone];
          const Icon = rule.icon;
          return (
            <div
              key={rule.id}
              className="rounded-xl border p-5"
              style={{ background: style.bg, borderColor: style.border, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: style.iconBg, border: `1px solid ${style.border}` }}
                >
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rule {rule.id}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">{rule.title}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{rule.detail}</p>
              {rule.example && (
                <div className="mt-3 rounded-lg bg-white/70 border border-gray-100 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Example</p>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{rule.example}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Glossary */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <h3 className="text-sm font-bold text-gray-900 mb-3">Glossary</h3>
        <div className="space-y-2.5">
          {GLOSSARY.map(g => (
            <div key={g.term} className="flex items-start gap-2">
              <span className="flex-shrink-0 text-xs font-bold text-gray-700 min-w-[120px]">{g.term}</span>
              <span className="text-xs text-gray-500 leading-relaxed">{g.def}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer reminder */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          These rules are enforced by the backend audit function. Changing a status label in the UI does not change
          the underlying data — if the records don't support "complete," the audit will reclassify it on the next
          refresh.
        </p>
      </div>
    </div>
  );
}