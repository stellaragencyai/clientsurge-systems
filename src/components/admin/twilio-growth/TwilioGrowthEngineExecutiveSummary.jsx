import { CheckCircle2, AlertTriangle, XCircle, Ban, ArrowRight } from "lucide-react";

export default function TwilioGrowthEngineExecutiveSummary({ data }) {
  if (!data) return null;

  const caps = data.capabilities || [];
  const green = caps.filter(c => c.status === "green");
  const yellow = caps.filter(c => c.status === "yellow");
  const red = caps.filter(c => c.status === "red");

  // Biggest blocker: first red capability's first blocker, or first yellow's
  const firstRed = red[0];
  const firstYellow = yellow[0];
  const biggestBlockerCap = firstRed || firstYellow;
  const biggestBlocker = biggestBlockerCap?.blockers?.[0] || (data.proof_logs_empty ? "AutomationProofLog is empty — no go-live proof evidence exists." : "No active blockers detected.");

  // Next best action: from the first non-green capability
  const nextActionCap = biggestBlockerCap;
  const nextBestAction = nextActionCap?.next_action || (green.length === caps.length ? "All capabilities proven. Maintain monitoring." : "Review the capability matrix for next steps.");

  const readyList = green.length > 0 ? green.map(c => c.label).join(", ") : "None yet.";
  const partialList = yellow.length > 0 ? yellow.map(c => c.label).join(", ") : "None.";
  const notReadyList = red.length > 0 ? red.map(c => c.label).join(", ") : "None.";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
      <h3 className="text-sm font-bold text-gray-900 mb-4">Executive Summary — Admin Only</h3>
      <p className="text-[11px] text-gray-400 mb-4">Generated from current audit data. Does not overstate readiness.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <SummaryTile icon={CheckCircle2} color="#059669" label="Proven / Working" value={green.length} items={readyList} />
        <SummaryTile icon={AlertTriangle} color="#D97706" label="Partially Built" value={yellow.length} items={partialList} />
        <SummaryTile icon={XCircle} color="#DC2626" label="Not Ready" value={red.length} items={notReadyList} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <Ban className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Biggest Blocker</p>
            <p className="text-sm text-gray-900 mt-0.5 leading-snug">{biggestBlocker}</p>
            {biggestBlockerCap && <p className="text-[11px] text-gray-400 mt-1">Capability: {biggestBlockerCap.label}</p>}
          </div>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Next Best Action</p>
            <p className="text-sm text-gray-900 mt-0.5 leading-snug">{nextBestAction}</p>
            {nextActionCap && <p className="text-[11px] text-gray-400 mt-1">Capability: {nextActionCap.label}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ icon: Icon, color, label, value, items }) {
  return (
    <div className="rounded-lg border border-gray-100 p-4" style={{ background: `${color}06` }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color }} />
        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-[11px] text-gray-500 mt-1 leading-snug line-clamp-2">{items}</p>
    </div>
  );
}