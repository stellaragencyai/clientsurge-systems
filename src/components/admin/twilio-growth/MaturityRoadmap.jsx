import { computePhase, PHASE_CONFIG, PHASE_ADVANCE_ACTIONS } from "./capabilityPhase";

const PHASE_ORDER = [4, 3, 2, 1, 0];

const PHASE_DESCRIPTIONS = {
  0: "No usable implementation or evidence found. The capability has not been built or exercised.",
  1: "Configuration or schema exists (webhook URL, provider flag, checklist started) but no real activity has been logged.",
  2: "Activity exists — SMS logs, communication events, or checklist progress — but no formal proof record has been created.",
  3: "AutomationProofLog records exist but have not all passed, or active blockers remain.",
  4: "Proof records pass and no active blockers. The capability is trusted for production use.",
};

export default function MaturityRoadmap({ data }) {
  if (!data) return null;
  const capabilities = data.capabilities || [];
  const grouped = {};
  for (const p of PHASE_ORDER) grouped[p] = [];
  for (const cap of capabilities) {
    const phase = computePhase(cap, data);
    grouped[phase].push(cap);
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-2">
        <span className="text-blue-600 font-bold text-sm flex-shrink-0">📊</span>
        <div>
          <p className="text-xs font-bold text-blue-800 mb-0.5">Maturity Roadmap — Admin Only</p>
          <p className="text-xs text-blue-700">
            Capabilities grouped by implementation phase. Each phase shows what's needed to advance to the next.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {PHASE_ORDER.map(p => {
          const cfg = PHASE_CONFIG[p];
          const count = grouped[p].length;
          return (
            <div key={p} className="rounded-lg border p-2.5 text-center" style={{ background: cfg.bg, borderColor: cfg.border }}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{cfg.shortLabel}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: cfg.color }}>{count}</p>
            </div>
          );
        })}
      </div>

      {PHASE_ORDER.map(phase => {
        const cfg = PHASE_CONFIG[phase];
        const caps = grouped[phase];
        if (caps.length === 0) return null;
        return (
          <div key={phase} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  {cfg.shortLabel}
                </span>
                <h4 className="text-sm font-bold text-gray-900">{cfg.label}</h4>
              </div>
              <span className="text-xs text-gray-400">{caps.length} capabilit{caps.length === 1 ? "y" : "ies"}</span>
            </div>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{PHASE_DESCRIPTIONS[phase]}</p>
            {phase < 4 && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-2.5 mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-0.5">Action to Advance</p>
                <p className="text-xs text-blue-700 font-medium">{PHASE_ADVANCE_ACTIONS[phase]}</p>
              </div>
            )}
            <div className="space-y-1.5">
              {caps.map(cap => (
                <div key={cap.key} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                  <span className="text-xs font-semibold text-gray-900 flex-1">{cap.label}</span>
                  {cap.blockers?.length > 0 && (
                    <span className="text-[10px] font-semibold text-red-500">{cap.blockers.length} blocker{cap.blockers.length === 1 ? "" : "s"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}