/**
 * SegmentFilterBuilder — lets users define filters for campaign audience.
 */

const STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked", "Closed"];
const SOURCES = ["website", "referral", "instagram", "facebook", "google", "other", "manual_import", "demo_booking", "contact_inquiry", "lead_capture"];

export default function SegmentFilterBuilder({ filters, onChange }) {
  const f = filters || {};

  const toggleStatus = (status) => {
    const current = f.statuses || [];
    const next = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onChange({ ...f, statuses: next });
  };

  const toggleSource = (source) => {
    const current = f.sources || [];
    const next = current.includes(source)
      ? current.filter(s => s !== source)
      : [...current, source];
    onChange({ ...f, sources: next });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">Audience Filters</p>
      <p className="text-xs text-muted-foreground">Leave all blank to target ALL leads with an email address.</p>

      {/* Status filter */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Lead Status (select any):</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                (f.statuses || []).includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Source filter */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Lead Source (select any):</p>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSource(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                (f.sources || []).includes(s)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Score range */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Min Lead Score</label>
          <input
            type="number"
            min={0} max={100}
            value={f.lead_score_min ?? ""}
            onChange={e => onChange({ ...f, lead_score_min: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Max Lead Score</label>
          <input
            type="number"
            min={0} max={100}
            value={f.lead_score_max ?? ""}
            onChange={e => onChange({ ...f, lead_score_max: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="100"
          />
        </div>
      </div>

      {/* Active filter summary */}
      {((f.statuses?.length || 0) > 0 || (f.sources?.length || 0) > 0 || f.lead_score_min != null || f.lead_score_max != null) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs font-semibold text-primary">Active Filters:</p>
          <ul className="mt-1 text-xs text-foreground/70 space-y-0.5">
            {f.statuses?.length > 0 && <li>• Status: {f.statuses.join(", ")}</li>}
            {f.sources?.length > 0 && <li>• Source: {f.sources.join(", ")}</li>}
            {f.lead_score_min != null && <li>• Min score: {f.lead_score_min}</li>}
            {f.lead_score_max != null && <li>• Max score: {f.lead_score_max}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}