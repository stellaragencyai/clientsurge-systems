import { useState, useMemo } from "react";
import { Check, AlertTriangle, X, Minus, Shield, Filter } from "lucide-react";
import { SAAS_AUDIT_CATEGORIES, SAAS_AUDIT_ITEMS, STATUS_META, getAuditSummary } from "@/data/saasAuditConfig";

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  const icons = { check: Check, alert: AlertTriangle, x: X, minus: Minus };
  const Icon = icons[meta.icon];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
    >
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

function SummaryCard({ label, value, color, bg, border }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: bg, borderColor: border }}>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color }}>{label}</p>
    </div>
  );
}

export default function SaaSAuditDashboard() {
  const [filterStatus, setFilterStatus] = useState("all");
  const summary = useMemo(() => getAuditSummary(), []);

  const filteredItems = useMemo(() => {
    if (filterStatus === "all") return SAAS_AUDIT_ITEMS;
    return SAAS_AUDIT_ITEMS.filter((item) => item.status === filterStatus);
  }, [filterStatus]);

  const statusFilters = [
    { key: "all", label: "All", count: SAAS_AUDIT_ITEMS.length },
    { key: "green", label: "Implemented", count: summary.counts.green },
    { key: "yellow", label: "Partial", count: summary.counts.yellow },
    { key: "red", label: "Missing", count: summary.counts.red },
    { key: "na", label: "N/A", count: summary.counts.na },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,174,239,0.10)" }}>
              <Shield className="w-5 h-5" style={{ color: "#0088CC" }} />
            </div>
            <h1 className="text-xl font-black text-gray-900 font-display">SaaS Upgrade Audit</h1>
          </div>
          <p className="text-sm text-gray-500">
            30-point SaaS experience audit scored against the live ClientSurge Systems site.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <SummaryCard label="Overall Score" value={`${summary.score}%`} color="#0088CC" bg="rgba(0,174,239,0.06)" border="rgba(0,174,239,0.20)" />
          <SummaryCard label="Implemented" value={summary.implemented} color="#10B981" bg="rgba(16,185,129,0.06)" border="rgba(16,185,129,0.20)" />
          <SummaryCard label="Partial" value={summary.partial} color="#D4AF37" bg="rgba(212,175,55,0.06)" border="rgba(212,175,55,0.20)" />
          <SummaryCard label="Missing" value={summary.missing} color="#EF4444" bg="rgba(239,68,68,0.06)" border="rgba(239,68,68,0.20)" />
          <SummaryCard label="Not Applicable" value={summary.counts.na} color="#94A3B8" bg="rgba(148,163,184,0.06)" border="rgba(148,163,184,0.20)" />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              style={{
                background: filterStatus === f.key ? "rgba(0,174,239,0.10)" : "transparent",
                border: filterStatus === f.key ? "1px solid rgba(0,174,239,0.25)" : "1px solid #e5e7eb",
                color: filterStatus === f.key ? "#0088CC" : "#6b7280",
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Audit table grouped by category */}
        <div className="space-y-6">
          {SAAS_AUDIT_CATEGORIES.map((category) => {
            const catItems = filteredItems.filter((item) => item.cat === category.id);
            if (catItems.length === 0) return null;
            return (
              <div key={category.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between" style={{ background: "rgba(0,174,239,0.03)" }}>
                  <div>
                    <h2 className="text-sm font-black text-gray-900">{category.name}</h2>
                    <p className="text-xs text-gray-400">Items {category.items}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{catItems.length} item{catItems.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400" style={{ width: "40px" }}>#</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">Item</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400" style={{ width: "130px" }}>Status</th>
                        <th className="text-left px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-gray-400 hidden md:table-cell" style={{ width: "45%" }}>Audit Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 text-sm font-bold text-gray-300">{item.id}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-gray-900">{item.title}</td>
                          <td className="px-5 py-3"><StatusBadge status={item.status} /></td>
                          <td className="px-5 py-3 text-xs text-gray-500 hidden md:table-cell">{item.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/40 p-4 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-[#0088CC] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 leading-relaxed">
            Items marked <strong>Partial</strong> or <strong>Missing</strong> are actively being addressed.
            "N/A" items are not applicable to ClientSurge's storefront purchase model (direct purchase, not freemium/trial).
          </p>
        </div>
      </main>
    </div>
  );
}