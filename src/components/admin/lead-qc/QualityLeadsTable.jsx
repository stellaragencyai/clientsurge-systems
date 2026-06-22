import { CheckCircle2, AlertTriangle, Copy, Shield, Send, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700",
  audit_pending: "bg-yellow-100 text-yellow-700",
  quarantine_candidate: "bg-red-100 text-red-700",
  quarantined: "bg-red-200 text-red-800",
  duplicate_candidate: "bg-orange-100 text-orange-700",
  verified_outbound_ready: "bg-blue-100 text-blue-700",
};

export default function QualityLeadsTable({ leads, loading, selectedIds, onToggleSelect, onToggleSelectAll, onAction, actionLoading }) {
  const allSelected = leads.length > 0 && selectedIds.size === leads.length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Action bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/30 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground mr-2">
          {selectedIds.size} selected
        </span>
        <button
          onClick={() => onAction('quarantine')}
          disabled={selectedIds.size === 0 || actionLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-40 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" /> Quarantine
        </button>
        <button
          onClick={() => onAction('safe')}
          disabled={selectedIds.size === 0 || actionLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-40 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Safe
        </button>
        <button
          onClick={() => onAction('outbound')}
          disabled={selectedIds.size === 0 || actionLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 transition-colors"
        >
          <Send className="w-3.5 h-3.5" /> Mark Outbound Ready
        </button>
        {actionLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-3 py-2.5 w-8">
                <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="rounded" />
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Business</th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Contact</th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Source</th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Location</th>
              <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Confidence</th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Status</th>
              <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Reason Codes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="8" className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan="8" className="px-3 py-8 text-center text-muted-foreground text-sm">No leads in this view</td></tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => onToggleSelect(lead.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-foreground text-sm">{lead.business_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{lead.full_name || "—"}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{lead.email || "—"}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone || "—"}</p>
                    {lead.canonical_website_url && (
                      <p className="text-xs text-blue-600 truncate max-w-[150px]">{lead.canonical_website_url}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{lead.source || "—"}</p>
                    <p className="text-xs text-muted-foreground">{lead.business_type || "—"}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">{lead.city || "—"}</p>
                    <p className="text-xs text-muted-foreground">{lead.state || "—"}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                      lead.quality_confidence >= 80 ? "bg-red-50 text-red-600" :
                      lead.quality_confidence >= 50 ? "bg-yellow-50 text-yellow-600" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {lead.quality_confidence || 0}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[lead.quality_review_status] || "bg-gray-100 text-gray-700"}`}>
                      {lead.quality_review_status || "active"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {lead.quality_reason_codes && lead.quality_reason_codes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.quality_reason_codes.slice(0, 3).map((code, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-600">
                            {code}
                          </span>
                        ))}
                        {lead.quality_reason_codes.length > 3 && (
                          <span className="text-[10px] text-muted-foreground">+{lead.quality_reason_codes.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}