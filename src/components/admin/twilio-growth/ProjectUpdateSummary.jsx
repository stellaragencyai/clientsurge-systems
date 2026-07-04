import { CheckCircle2, Loader, Ban, ShieldAlert } from "lucide-react";

const COMPLETED = [
  "First Launch Scope Summary component",
  "Core Launch First warning",
  "Current Sprint Focus card",
  "Setup ≠ Readiness reminder banner",
  "Owner Attention Needed count",
  "Core System Health mini-card",
];

const IN_PROGRESS = [
  "Evidence logging proof records (AutomationProofLog)",
  "Missed-call webhook route health verification",
  "Internal record exclusion quarantine rules",
];

const BLOCKED = [
  "AI Voice Receptionist — no transcript/summary evidence",
  "Lead Reactivation — no evidence record",
  "Nurture Sequence — no enrollment + step proof",
  "Public 'fully automated' claim — core items not green",
];

export default function ProjectUpdateSummary() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-900">Project Update Summary</h3>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Admin Only</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <SummaryColumn title="Completed" items={COMPLETED} icon={CheckCircle2} color="#059669" />
        <SummaryColumn title="In Progress" items={IN_PROGRESS} icon={Loader} color="#D97706" />
        <SummaryColumn title="Blocked" items={BLOCKED} icon={Ban} color="#DC2626" />
      </div>

      <div
        className="rounded-lg p-3 flex items-start gap-2"
        style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}
      >
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-bold">Rule:</span> Build work must not be closed until app evidence supports it.
          Setup, configuration, or code completion alone is insufficient — proof records, delivery logs,
          and outcome data are required before marking any item complete.
        </p>
      </div>
    </div>
  );
}

function SummaryColumn({ title, items, icon: Icon, color }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{title}</p>
        <span className="ml-auto text-xs font-bold text-gray-600">{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
            <span className="text-gray-300 mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}