/**
 * SegmentFilterBuilder - explicit test-batch filters for email campaigns.
 */

const STATUSES = ["New", "Contacted", "Replied", "Qualified", "Booking Prompt Sent", "Booked"];
const SOURCES = ["website", "referral", "instagram", "facebook", "google", "other", "manual_import", "demo_booking", "contact_inquiry", "lead_capture"];
const INDUSTRIES = [
  { key: "roofing", label: "Roofing" },
  { key: "hvac", label: "HVAC" },
  { key: "dental", label: "Dental" },
];
const BATCH_SIZES = [25, 50];

export default function SegmentFilterBuilder({ filters, onChange }) {
  const f = filters || {};

  const update = (patch) => onChange({ ...f, ...patch });

  const toggleListValue = (field, value) => {
    const current = f[field] || [];
    const next = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    update({ [field]: next });
  };

  const activeFilters =
    (f.industries?.length || 0) > 0 ||
    (f.statuses?.length || 0) > 0 ||
    (f.sources?.length || 0) > 0 ||
    f.lead_score_min != null ||
    f.lead_score_max != null ||
    f.max_recipients != null;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-semibold text-foreground">Audience Filters</p>
      <p className="text-xs text-muted-foreground">Choose an industry and a capped test batch before previewing.</p>

      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Industry Segment *</p>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRIES.map(industry => (
            <button
              key={industry.key}
              type="button"
              onClick={() => update({ industries: [industry.key], tags: [industry.key] })}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                (f.industries || []).includes(industry.key)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {industry.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Test Batch Size</p>
        <div className="flex gap-1.5">
          {BATCH_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => update({ max_recipients: size })}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                Number(f.max_recipients || 25) === size
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Lead Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map(status => (
            <button
              key={status}
              type="button"
              onClick={() => toggleListValue("statuses", status)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                (f.statuses || []).includes(status)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-foreground mb-2">Lead Source</p>
        <div className="flex flex-wrap gap-1.5">
          {SOURCES.map(source => (
            <button
              key={source}
              type="button"
              onClick={() => toggleListValue("sources", source)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                (f.sources || []).includes(source)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/50"
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Min Lead Score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={f.lead_score_min ?? ""}
            onChange={e => update({ lead_score_min: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Max Lead Score</label>
          <input
            type="number"
            min={0}
            max={100}
            value={f.lead_score_max ?? ""}
            onChange={e => update({ lead_score_max: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="100"
          />
        </div>
      </div>

      {activeFilters && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <p className="text-xs font-semibold text-primary">Active Filters:</p>
          <ul className="mt-1 text-xs text-foreground/70 space-y-0.5">
            {f.industries?.length > 0 && <li>Industry: {f.industries.join(", ")}</li>}
            {f.max_recipients != null && <li>Batch cap: {f.max_recipients}</li>}
            {f.statuses?.length > 0 && <li>Status: {f.statuses.join(", ")}</li>}
            {f.sources?.length > 0 && <li>Source: {f.sources.join(", ")}</li>}
            {f.lead_score_min != null && <li>Min score: {f.lead_score_min}</li>}
            {f.lead_score_max != null && <li>Max score: {f.lead_score_max}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
