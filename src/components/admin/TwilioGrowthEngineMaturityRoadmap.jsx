import { PHASE_LABELS, PHASE_ACTIONS, computeAllPhases } from "@/lib/twilioGrowthEnginePhases";
import { ArrowRight, Circle, CircleDot, Activity, FileCheck, ShieldCheck } from "lucide-react";

const PHASE_ICONS = {
  0: Circle,
  1: CircleDot,
  2: Activity,
  3: FileCheck,
  4: ShieldCheck,
};

export default function TwilioGrowthEngineMaturityRoadmap({ data }) {
  if (!data) return null;
  const { byPhase, summary } = computeAllPhases(data.capabilities || []);
  const total = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Explanation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <p className="text-xs text-gray-500 leading-relaxed">
          Each capability is assigned an implementation phase (0–4) based on current app data.
          Phase 4 requires proof records and zero active blockers — no capability is shown at Phase 4 without proven evidence.
        </p>
      </div>

      {/* Phase progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">Phase Distribution</h3>
          <span className="text-xs text-gray-400">{total} capabilities</span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden flex">
          {[0, 1, 2, 3, 4].map(p => {
            const pct = total > 0 ? (summary[p] / total) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div key={p} style={{ width: `${pct}%`, background: PHASE_LABELS[p].color }} title={`${PHASE_LABELS[p].label}: ${summary[p]}`} />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {[0, 1, 2, 3, 4].map(p => (
            <span key={p} className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE_LABELS[p].color }} />
              <span className="text-gray-500">{PHASE_LABELS[p].short}</span>
              <span className="font-semibold text-gray-700">{summary[p]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Phase groups */}
      {[0, 1, 2, 3, 4].map(phase => {
        const items = byPhase[phase] || [];
        if (items.length === 0) return null;
        const style = PHASE_LABELS[phase];
        const Icon = PHASE_ICONS[phase];
        return (
          <div key={phase} className="bg-white rounded-xl border border-gray-200 p-5" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <Icon className="w-4 h-4" style={{ color: style.color }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-900">{style.label}</h4>
                <p className="text-[11px] text-gray-400">{items.length} capabilit{items.length === 1 ? "y" : "ies"} in this phase</p>
              </div>
              <span className="rounded-full px-2.5 py-0.5 text-xs font-bold flex-shrink-0" style={{ color: style.color, background: style.bg, border: `1px solid ${style.border}` }}>
                {items.length}
              </span>
            </div>

            {/* Action to next phase */}
            <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 p-3 flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Action to Advance</p>
                <p className="text-xs text-gray-600 mt-0.5">{PHASE_ACTIONS[phase]}</p>
              </div>
            </div>

            {/* Capability list */}
            <div className="space-y-2">
              {items.map(cap => (
                <div key={cap.key} className="rounded-lg border border-gray-100 p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{cap.label}</p>
                    {cap.blockers?.length > 0 && (
                      <p className="text-[11px] text-red-500 mt-0.5 truncate">{cap.blockers[0]}</p>
                    )}
                    {cap.next_action && phase < 4 && (
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">{cap.next_action}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-gray-300 flex-shrink-0">{style.short}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty phases note */}
      {Object.values(summary).every(v => v === 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-400">No capability data available.</p>
        </div>
      )}
    </div>
  );
}