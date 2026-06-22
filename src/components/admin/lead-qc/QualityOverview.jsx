import { Users, ShieldAlert, Copy, Globe, Phone, MapPin, CheckCircle2, Send } from "lucide-react";

export default function QualityOverview({ counts, onRunAudit, auditLoading, onNavigateTab }) {
  const cards = [
    { label: "Total Leads", value: counts.total, icon: Users, color: "bg-blue-50 text-blue-700", tab: 'overview' },
    { label: "Active Leads", value: counts.active, icon: CheckCircle2, color: "bg-green-50 text-green-700", tab: 'overview' },
    { label: "Quarantine Candidates", value: counts.quarantine_candidates, icon: ShieldAlert, color: "bg-red-50 text-red-700", tab: 'quarantine' },
    { label: "Duplicate Groups", value: counts.duplicate_groups, icon: Copy, color: "bg-orange-50 text-orange-700", tab: 'duplicates' },
    { label: "Missing Website", value: counts.missing_website, icon: Globe, color: "bg-purple-50 text-purple-700", tab: 'enrichment' },
    { label: "Missing Phone", value: counts.missing_phone, icon: Phone, color: "bg-yellow-50 text-yellow-700", tab: 'overview' },
    { label: "Missing City/State", value: counts.missing_city_state, icon: MapPin, color: "bg-amber-50 text-amber-700", tab: 'overview' },
    { label: "Outbound Ready", value: counts.outbound_ready, icon: Send, color: "bg-cyan-50 text-cyan-700", tab: 'overview' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Lead Quality Control Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">Separate real prospects from test records, duplicates, and raw imports.</p>
        </div>
        <button
          onClick={onRunAudit}
          disabled={auditLoading}
          className="cs-btn-primary text-sm"
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          {auditLoading ? "Running..." : "Run Audit"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className={`rounded-xl border border-border p-4 text-left hover:shadow-md transition-shadow cursor-pointer ${card.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4 opacity-70" />
              </div>
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-xs font-medium opacity-75 mt-1">{card.label}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Audit Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">Internal/Test Detection</p>
            <p>Flags leads with test keywords in business/name, example.com emails, 555 phone patterns, test sources, and generic inquiry names. Confidence: 100%.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Raw Import Quarantine</p>
            <p>Flags leads from bulk imports with no contact data, generic business names, missing city/state, and chain/franchise accounts. Confidence: 85%.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Deduplication</p>
            <p>Groups by canonical phone, website domain, and business name + location. Keeps the strongest record, marks weaker ones as duplicate candidates.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Enrichment Queue</p>
            <p>Active leads missing website data are queued for Google Business Profile lookup via web search enrichment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}