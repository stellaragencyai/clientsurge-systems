import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import FieldMappingBuilder from "./FieldMappingBuilder";

const SOURCE_PRESETS = [
  "Facebook Ads", "GoHighLevel", "Typeform", "Zapier", "HubSpot",
  "Salesforce", "ActiveCampaign", "Calendly", "Custom"
];

export default function WebhookRegistrationForm({ existing, onSave, onClose }) {
  const [form, setForm] = useState({
    source_name: existing?.source_name || "",
    service_key: existing?.service_key || "instant_lead_response",
    field_mappings: existing?.field_mappings || [],
    status: existing?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = !!existing?.id;

  const handleSave = async () => {
    if (!form.source_name) return setError("Source name is required.");
    setSaving(true);
    setError("");
    try {
      const res = await base44.functions.invoke("manageWebhookRegistration", {
        action: isEdit ? "update" : "create",
        id: existing?.id,
        data: form,
      });
      onSave(res.data.registration);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">{isEdit ? "Edit Webhook" : "New Webhook Source"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Source Name</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              value={form.source_name}
              onChange={(e) => setForm({ ...form, source_name: e.target.value })}
            >
              <option value="">Select a source...</option>
              {SOURCE_PRESETS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">Trigger Service</label>
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              value={form.service_key}
              onChange={(e) => setForm({ ...form, service_key: e.target.value })}
            >
              <option value="instant_lead_response">Instant Lead Response</option>
              <option value="missed_call_text_back">Missed Call Text-Back</option>
              <option value="nurture_sequence_14d">14-Day Nurture Sequence</option>
              <option value="ai_booking_agent">AI Booking Agent</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Field Mappings</label>
            <FieldMappingBuilder
              mappings={form.field_mappings}
              onChange={(mappings) => setForm({ ...form, field_mappings: mappings })}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/30 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Create Webhook"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}