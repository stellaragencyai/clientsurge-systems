import { Plus, Trash2 } from "lucide-react";

const LEAD_FIELDS = [
  "full_name", "email", "phone", "business_name", "business_type",
  "problem", "source", "website", "notes"
];

export default function FieldMappingBuilder({ mappings = [], onChange }) {
  const add = () => onChange([...mappings, { source_field: "", target_field: "email" }]);
  const remove = (i) => onChange(mappings.filter((_, idx) => idx !== i));
  const update = (i, key, value) => {
    const updated = mappings.map((m, idx) => idx === i ? { ...m, [key]: value } : m);
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-foreground">Field Mappings</p>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-primary border border-primary/25 px-2 py-1 rounded-lg hover:bg-primary/5 transition"
        >
          <Plus className="w-3 h-3" /> Add Mapping
        </button>
      </div>

      {mappings.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          No mappings set — raw payload fields will be auto-detected.
        </p>
      )}

      <div className="space-y-2">
        {mappings.map((m, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="flex-1 text-xs border border-border rounded-lg px-3 py-2 bg-background"
              placeholder="Payload field (e.g. lead.email)"
              value={m.source_field}
              onChange={(e) => update(i, "source_field", e.target.value)}
            />
            <span className="text-muted-foreground text-xs">→</span>
            <select
              className="flex-1 text-xs border border-border rounded-lg px-3 py-2 bg-background"
              value={m.target_field}
              onChange={(e) => update(i, "target_field", e.target.value)}
            >
              {LEAD_FIELDS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-destructive hover:opacity-70 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}