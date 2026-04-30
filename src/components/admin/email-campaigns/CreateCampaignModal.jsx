/**
 * CreateCampaignModal — form to create a new email campaign.
 */

import { useState } from "react";
import { X, Loader2, Eye, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SegmentFilterBuilder from "./SegmentFilterBuilder";

export default function CreateCampaignModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    segment_filters: {},
    scheduled_at: "",
  });
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1=details, 2=audience, 3=preview

  const handlePreview = async () => {
    if (!form.name || !form.subject) {
      setError("Name and subject are required.");
      return;
    }
    setPreviewing(true);
    setError("");
    try {
      // First save as draft
      const campaign = await base44.entities.EmailCampaign.create({
        ...form,
        status: "draft",
      });
      // Then preview
      const res = await base44.functions.invoke("sendEmailCampaign", {
        campaign_id: campaign.id,
        preview_only: true,
      });
      setPreviewResult({ ...res.data, campaign_id: campaign.id, campaign });
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Preview failed");
    } finally {
      setPreviewing(false);
    }
  };

  const handleSendNow = async () => {
    if (!previewResult?.campaign_id) return;
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke("sendEmailCampaign", {
        campaign_id: previewResult.campaign_id,
        preview_only: false,
      });
      onCreate?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Send failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!form.name || !form.subject) {
      setError("Name and subject are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await base44.entities.EmailCampaign.create({ ...form, status: "draft" });
      onCreate?.();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-lg">New Email Campaign</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step {step} of 3 — {step === 1 ? "Campaign Details" : step === 2 ? "Audience" : "Preview & Send"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. May Re-engagement Campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Subject Line *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. We'd love to help, {name} 👋"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Use {"{name}"}, {"{business_name}"}, {"{first_name}"} for personalization</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Email Body (HTML)</label>
                <textarea
                  rows={8}
                  value={form.body_html}
                  onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="<p>Hi {name},</p><p>We noticed you reached out recently...</p>"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Plain Text Fallback</label>
                <textarea
                  rows={4}
                  value={form.body_text}
                  onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Hi {name}, we noticed you reached out recently..."
                />
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <SegmentFilterBuilder
              filters={form.segment_filters}
              onChange={filters => setForm(f => ({ ...f, segment_filters: filters }))}
            />
          )}

          {/* Step 3: Preview */}
          {step === 3 && previewResult && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-bold text-green-800 mb-1">Audience Preview</p>
                <p className="text-3xl font-bold text-green-700">{previewResult.recipient_count}</p>
                <p className="text-sm text-green-600">leads will receive this campaign</p>
              </div>
              {previewResult.sample_recipients?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Sample Recipients:</p>
                  <div className="space-y-1.5">
                    {previewResult.sample_recipients.map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </div>
                        <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">{r.status}</span>
                      </div>
                    ))}
                    {previewResult.recipient_count > 5 && (
                      <p className="text-xs text-muted-foreground text-center">+ {previewResult.recipient_count - 5} more</p>
                    )}
                  </div>
                </div>
              )}
              {previewResult.recipient_count === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  No leads match your current filters. Adjust the audience or remove filters to reach all leads.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2">
            {step < 2 && (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save Draft
                </button>
                <button
                  onClick={() => { setError(""); setStep(2); }}
                  disabled={!form.name || !form.subject}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Next: Audience
                </button>
              </>
            )}
            {step === 2 && (
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                Preview Audience
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSendNow}
                disabled={saving || !previewResult?.recipient_count}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send Campaign ({previewResult?.recipient_count} recipients)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}