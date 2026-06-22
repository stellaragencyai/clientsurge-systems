import { Copy, Crown, Loader2 } from "lucide-react";

export default function DuplicateGroups({ leads, loading }) {
  // Group duplicate_candidate leads by their quality_reason (contains group key)
  const groups = {};
  (leads || []).forEach((lead) => {
    const reason = lead.quality_reason || '';
    // Extract group key from reason: "Potential duplicate of lead XXX (group: YYY)"
    const match = reason.match(/group:\s*(.+)\)/);
    const groupKey = match ? match[1] : 'ungrouped';

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(lead);
  });

  const groupEntries = Object.entries(groups).filter(([_, members]) => members.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Duplicate Groups</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Leads grouped by phone, website domain, or business name + location. The strongest record stays active; weaker records are flagged as duplicate candidates.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : groupEntries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Copy className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No duplicate groups detected. Run the audit to check for duplicates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupEntries.map(([groupKey, members]) => (
            <div key={groupKey} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border-b border-orange-100">
                <Copy className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-semibold text-foreground">{groupKey}</p>
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  {members.length} records
                </span>
              </div>
              <div className="divide-y divide-border">
                {members.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.business_name || "—"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.email || "no email"} · {lead.phone || "no phone"} · {lead.city || "no city"}, {lead.state || "no state"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{lead.source || "—"}</p>
                      <p className="text-[10px] text-muted-foreground/60">{new Date(lead.created_date).toLocaleDateString()}</p>
                    </div>
                    {lead.quality_review_status === 'active' && (
                      <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Keeper (strongest record)" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}