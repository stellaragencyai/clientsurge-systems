import { CheckCircle2, Clock, Ban, AlertCircle } from "lucide-react";

const COMPONENTS_ADDED = [
  "First Launch Scope Summary",
  "Core Launch First warning",
  "Current Sprint Focus card",
  "Project Update Summary card",
  "Owner Attention Needed count",
  "Core System Health mini-card",
  "Setup ≠ Readiness reminder",
];

const WORKSTREAMS_IMPROVED = [
  "Evidence logging visibility — AutomationProofLog now surfaced in Proof Center",
  "Internal record exclusion — test/smoke/internal records quarantined from production metrics",
  "Blocked-from-green reasons — each capability shows exact blocker derived from data",
  "Readiness ordering — core launch items prioritized before later-scope features",
];

const STILL_BLOCKED = [
  "Speed-to-lead proof logs — no AutomationProofLog pass records yet",
  "Missed-call recovery — webhook route health and recovery evidence incomplete",
  "AI voice receptionist — transcript/summary evidence missing",
  "Review/referral — no evidence records for reactivation flow",
];

const ASANA_KEEP_INCOMPLETE = [
  "AI Voice Receptionist — blocked until transcript proof exists",
  "Lead Reactivation — blocked until evidence record created",
  "Nurture Sequence (14-day) — blocked until enrollment + step proof exists",
  "Public claim of 'fully automated' — blocked until all core items are green",
];

export default function ProgressSinceLastAudit() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Progress Since Last Audit</h3>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Admin Only</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProgressColumn
          title="Admin Components Added/Updated"
          items={COMPONENTS_ADDED}
          icon={CheckCircle2}
          color="#059669"
        />
        <ProgressColumn
          title="Workstreams Improved"
          items={WORKSTREAMS_IMPROVED}
          icon={CheckCircle2}
          color="#059669"
        />
        <ProgressColumn
          title="Still-Blocked Workstreams"
          items={STILL_BLOCKED}
          icon={Ban}
          color="#DC2626"
        />
        <ProgressColumn
          title="Should Remain Incomplete in Asana"
          items={ASANA_KEEP_INCOMPLETE}
          icon={AlertCircle}
          color="#D97706"
        />
      </div>
    </div>
  );
}

function ProgressColumn({ title, items, icon: Icon, color }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
            <Icon className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}