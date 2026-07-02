import { BrainCircuit, Flame, ShieldAlert, Target, TrendingUp, Zap } from "lucide-react";

/**
 * LeadIntelligenceSummary — visual enhancement for the admin lead dashboard.
 * Renders real-time intelligence summary cards: hot leads, human-intervention
 * queue, automation-ready, and stale/dedup alerts.
 */
function StatTile({ icon: Icon, label, value, accent, helper }) {
  const accentClasses = {
    hot: "from-red-50 to-orange-50 border-red-200 text-red-700",
    human: "from-amber-50 to-yellow-50 border-amber-200 text-amber-700",
    auto: "from-emerald-50 to-green-50 border-emerald-200 text-emerald-700",
    stale: "from-slate-50 to-gray-50 border-slate-200 text-slate-600",
  };

  return (
    <div className={`cs-glow-card bg-gradient-to-br ${accentClasses[accent]} p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{label}</p>
          <p className="mt-1 text-2xl font-extrabold text-foreground">{value}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      {helper && <p className="mt-2 text-[11px] leading-snug opacity-80">{helper}</p>}
    </div>
  );
}

export default function LeadIntelligenceSummary({ summary }) {
  const segmentCounts = summary?.segment_counts || {};
  const hotLeads = segmentCounts.hot || 0;
  const highIntent = segmentCounts.high_intent || 0;
  const nurtureReady = segmentCounts.nurture || 0;
  const dormant = segmentCounts.dormant || 0;
  const totalLeads = summary?.total_leads || 0;

  const humanNeeded = hotLeads + highIntent;
  const automationReady = nurtureReady;
  const staleCount = Math.min(dormant, totalLeads);

  return (
    <div className="cs-glow-card bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Lead Intelligence Summary</h3>
        <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
          Real-time
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Flame}
          label="Hot Leads"
          value={hotLeads}
          accent="hot"
          helper="Score ≥ 80 — call within 5 min"
        />
        <StatTile
          icon={Target}
          label="Human Needed"
          value={humanNeeded}
          accent="human"
          helper="High-intent leads requiring manual outreach"
        />
        <StatTile
          icon={Zap}
          label="Auto-Ready"
          value={automationReady}
          accent="auto"
          helper="Nurture queue for automated sequences"
        />
        <StatTile
          icon={TrendingUp}
          label="Dormant"
          value={staleCount}
          accent="stale"
          helper="Candidates for reactivation campaign"
        />
      </div>
    </div>
  );
}