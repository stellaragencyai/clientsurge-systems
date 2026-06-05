/**
 * CreateCampaignModal - form to create a segmented email campaign.
 */

import { useState } from "react";
import { X, Loader2, Eye, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SegmentFilterBuilder from "./SegmentFilterBuilder";

const INDUSTRY_SEQUENCES = {
  roofing: {
    label: "Roofing",
    landing_page_url: "https://clientsurgesystems.com/roofing",
    subject: "{business_name}: missed roof calls are expensive",
    body_text:
      "Hi {first_name},\n\nRoofing teams lose high-intent jobs when storm-season calls, estimate requests, and insurance follow-ups sit too long.\n\nClientSurge checks whether your intake is catching roof repair and replacement leads before they call the next contractor.\n\nWant a quick roofing lead-response audit?\nhttps://clientsurgesystems.com/roofing\n\n- ClientSurge Systems",
    body_html:
      "<p>Hi {first_name},</p><p>Roofing teams lose high-intent jobs when storm-season calls, estimate requests, and insurance follow-ups sit too long.</p><p>ClientSurge checks whether your intake is catching roof repair and replacement leads before they call the next contractor.</p><p><a href=\"https://clientsurgesystems.com/roofing\">Request a roofing lead-response audit</a>.</p><p>- ClientSurge Systems</p>",
  },
  hvac: {
    label: "HVAC",
    landing_page_url: "https://clientsurgesystems.com/hvac",
    subject: "{business_name}: after-hours HVAC leads should not go cold",
    body_text:
      "Hi {first_name},\n\nHVAC demand spikes after hours, on weekends, and during heat or cold snaps. Slow callbacks can turn urgent repair leads into lost bookings.\n\nClientSurge audits whether your intake is capturing emergency repair, replacement, and maintenance leads quickly enough.\n\nWant a quick HVAC lead-response audit?\nhttps://clientsurgesystems.com/hvac\n\n- ClientSurge Systems",
    body_html:
      "<p>Hi {first_name},</p><p>HVAC demand spikes after hours, on weekends, and during heat or cold snaps. Slow callbacks can turn urgent repair leads into lost bookings.</p><p>ClientSurge audits whether your intake is capturing emergency repair, replacement, and maintenance leads quickly enough.</p><p><a href=\"https://clientsurgesystems.com/hvac\">Request an HVAC lead-response audit</a>.</p><p>- ClientSurge Systems</p>",
  },
  dental: {
    label: "Dental",
    landing_page_url: "https://clientsurgesystems.com/dental",
    subject: "{business_name}: new patient inquiries need faster follow-up",
    body_text:
      "Hi {first_name},\n\nDental offices lose new patient opportunities when implant, emergency, and hygiene inquiries are not followed up quickly or consistently.\n\nClientSurge audits whether your practice is turning web forms and missed calls into booked consults.\n\nWant a quick dental lead-response audit?\nhttps://clientsurgesystems.com/dental\n\n- ClientSurge Systems",
    body_html:
      "<p>Hi {first_name},</p><p>Dental offices lose new patient opportunities when implant, emergency, and hygiene inquiries are not followed up quickly or consistently.</p><p>ClientSurge audits whether your practice is turning web forms and missed calls into booked consults.</p><p><a href=\"https://clientsurgesystems.com/dental\">Request a dental lead-response audit</a>.</p><p>- ClientSurge Systems</p>",
  },
};

function buildIndustryForm(industryKey, previousForm) {
  const sequence = INDUSTRY_SEQUENCES[industryKey];
  return {
    ...previousForm,
    name: `${sequence.label} 25-lead audit test`,
    subject: sequence.subject,
    body_html: sequence.body_html,
    body_text: sequence.body_text,
    industry_sequence: industryKey,
    landing_page_url: sequence.landing_page_url,
    follow_up_days: 3,
    max_recipients: 25,
    segment_filters: {
      ...(previousForm.segment_filters || {}),
      industries: [industryKey],
      tags: [industryKey],
      max_recipients: 25,
    },
  };
}

export default function CreateCampaignModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    segment_filters: { max_recipients: 25 },
    scheduled_at: "",
    max_recipients: 25,
    follow_up_days: 3,
    landing_page_url: "",
    industry_sequence: "",
  });
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const selectedIndustry = form.industry_sequence || form.segment_filters?.industries?.[0] || "";
  const maxRecipients = Number(form.max_recipients || form.segment_filters?.max_recipients || 25);

  const updateSegmentFilters = (filters) => {
    const nextMax = Number(filters.max_recipients || maxRecipients || 25);
    setForm(f => ({
      ...f,
      max_recipients: nextMax,
      segment_filters: filters,
    }));
  };

  const handleIndustryChange = (industryKey) => {
    setForm(f => buildIndustryForm(industryKey, f));
    setPreviewResult(null);
    setError("");
  };

  const validateDraft = () => {
    if (!form.name || !form.subject) return "Name and subject are required.";
    if (!selectedIndustry) return "Choose an industry sequence before previewing.";
    if (maxRecipients > 50) return "Test batches are capped at 50 recipients.";
    if (!form.landing_page_url) return "Landing page is required.";
    return "";
  };

  const handlePreview = async () => {
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }
    setPreviewing(true);
    setError("");
    try {
      const campaign = await base44.entities.EmailCampaign.create({
        ...form,
        status: "draft",
      });
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
    if (maxRecipients > 25 || previewResult.recipient_count > 25) {
      setError("Only a reviewed 25-lead production test can be sent from this screen.");
      return;
    }
    if (!window.confirm(`Send this ${selectedIndustry} outreach test to ${previewResult.recipient_count} recipients?`)) {
      return;
    }
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
    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground text-lg">New Email Campaign</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step {step} of 3 - {step === 1 ? "Campaign Details" : step === 2 ? "Audience" : "Preview & Send"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Industry Sequence *</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(INDUSTRY_SEQUENCES).map(([key, sequence]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleIndustryChange(key)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                        selectedIndustry === key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {sequence.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Roofing 25-lead audit test"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Subject Line *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="{business_name}: missed roof calls are expensive"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">Use {"{name}"}, {"{business_name}"}, {"{first_name}"} for personalization</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Landing Page *</label>
                <input
                  type="url"
                  value={form.landing_page_url}
                  onChange={e => setForm(f => ({ ...f, landing_page_url: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://clientsurgesystems.com/roofing"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Email Body (HTML)</label>
                <textarea
                  rows={8}
                  value={form.body_html}
                  onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1">Plain Text Fallback</label>
                <textarea
                  rows={4}
                  value={form.body_text}
                  onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <SegmentFilterBuilder
              filters={form.segment_filters}
              onChange={updateSegmentFilters}
            />
          )}

          {step === 3 && previewResult && (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                <p className="text-sm font-bold text-green-800 mb-1">Audience Preview</p>
                <p className="text-3xl font-bold text-green-700">{previewResult.recipient_count}</p>
                <p className="text-sm text-green-600">leads in the capped test batch</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">Matching: {previewResult.matching_count ?? 0}</div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">Suppressed: {previewResult.suppressed_count ?? 0}</div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">Missing email: {previewResult.missing_email_count ?? 0}</div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">Missing website: {previewResult.missing_website_count ?? 0}</div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">Duplicates: {previewResult.duplicate_excluded_count ?? 0}</div>
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">Recent contact: {previewResult.recently_contacted_count ?? 0}</div>
              </div>
              {previewResult.sample_recipients?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2">Sample Recipients:</p>
                  <div className="space-y-1.5">
                    {previewResult.sample_recipients.map((r, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{r.industry || selectedIndustry}</p>
                        </div>
                        <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewResult.recipient_count === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                  No leads match the current safe test filters.
                </div>
              )}
            </div>
          )}
        </div>

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
                  disabled={!form.name || !form.subject || !selectedIndustry}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Next: Audience
                </button>
              </>
            )}
            {step === 2 && (
              <button
                onClick={handlePreview}
                disabled={previewing || !selectedIndustry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                Preview Audience
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleSendNow}
                disabled={saving || !previewResult?.recipient_count || maxRecipients > 25 || previewResult?.recipient_count > 25}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Send 25 Test ({previewResult?.recipient_count} recipients)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
