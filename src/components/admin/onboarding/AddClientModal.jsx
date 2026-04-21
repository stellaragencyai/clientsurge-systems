import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TONE_OPTIONS = ["Professional", "Friendly", "Luxury", "Casual"];

export default function AddClientModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    business_name: "", owner_name: "", phone: "", email: "",
    website: "", instagram: "", industry: "", services: "",
    tone_of_voice: "Professional", booking_platform: "", booking_link: "",
    lead_sources: "", twilio_number: "", monthly_rate: "", setup_fee: "",
    start_date: new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.OnboardingClient.create({
      ...form,
      monthly_rate: parseFloat(form.monthly_rate) || 0,
      setup_fee: parseFloat(form.setup_fee) || 0,
      status: "Onboarding",
    });
    onSaved();
    onClose();
  };

  const Field = ({ label, k, type = "text", placeholder = "" }) => (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">{label}</label>
      <input
        type={type}
        value={form[k]}
        onChange={e => set(k, e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white px-8 pt-7 pb-5 border-b border-border rounded-t-3xl z-10">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">New Client</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground">Add New Client</h2>
        </div>

        <form onSubmit={handleSave} className="px-8 py-6 space-y-5">
          {/* Core Info */}
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Client Info</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Business Name *" k="business_name" />
            <Field label="Owner Name *" k="owner_name" />
            <Field label="Phone *" k="phone" type="tel" />
            <Field label="Email *" k="email" type="email" />
            <Field label="Website" k="website" placeholder="https://" />
            <Field label="Instagram" k="instagram" placeholder="@handle" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Industry" k="industry" placeholder="e.g. Med Spa" />
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Tone of Voice</label>
              <select
                value={form.tone_of_voice}
                onChange={e => set("tone_of_voice", e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TONE_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Services Offered</label>
            <textarea
              value={form.services}
              onChange={e => set("services", e.target.value)}
              rows={2}
              placeholder="e.g. Botox, fillers, hydrafacials..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Booking */}
          <p className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Booking & Leads</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Booking Platform" k="booking_platform" placeholder="e.g. scheduler, Acuity" />
            <Field label="Booking Link" k="booking_link" placeholder="https://" />
            <Field label="Lead Sources" k="lead_sources" placeholder="Google, Facebook, Instagram" />
            <Field label="Twilio Number" k="twilio_number" placeholder="+1..." />
          </div>

          {/* Financials */}
          <p className="text-xs font-bold text-primary uppercase tracking-widest pt-1">Financials</p>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Monthly Rate ($)" k="monthly_rate" type="number" />
            <Field label="Setup Fee ($)" k="setup_fee" type="number" />
            <Field label="Start Date" k="start_date" type="date" />
          </div>

          <button
            type="submit"
            disabled={saving || !form.business_name || !form.owner_name || !form.email || !form.phone}
            style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", borderRadius: "9999px" }}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-50 mt-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Add Client"}
          </button>
        </form>
      </div>
    </div>
  );
}
