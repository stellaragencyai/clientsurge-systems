import { useState } from "react";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CALENDLY_URL = "https://calendly.com";

export default function MedSpaDemoModal({ onClose }) {
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    monthly_leads: "",
    biggest_issue: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.Leads.create({
      full_name: form.full_name,
      business_name: form.business_name,
      email: form.email,
      phone: form.phone,
      business_type: "Med Spa",
      problem: form.biggest_issue || form.monthly_leads,
      status: "New",
    });
    // Redirect to booking
    window.open(CALENDLY_URL, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Free 15-Min Demo</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Tell us about your med spa</h2>
          <p className="text-sm text-muted-foreground mt-1">We'll tailor the demo to your exact situation.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name *</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="Jane Smith"
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Business Name *</label>
              <input
                name="business_name"
                value={form.business_name}
                onChange={handleChange}
                required
                placeholder="Glow Med Spa"
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="jane@glowspa.com"
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">Phone *</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="(555) 000-0000"
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Monthly Leads (approx.)</label>
            <input
              name="monthly_leads"
              value={form.monthly_leads}
              onChange={handleChange}
              placeholder="e.g. 30–50 per month"
              className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Biggest challenge right now?</label>
            <select
              name="biggest_issue"
              value={form.biggest_issue}
              onChange={handleChange}
              className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            >
              <option value="">Select one…</option>
              <option value="Slow response time">Slow response time</option>
              <option value="Missed calls not being followed up">Missed calls not being followed up</option>
              <option value="No follow-up system">No follow-up system</option>
              <option value="Low booking conversions">Low booking conversions</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <>Book My Demo <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">No commitment. Free 15-min call. Live in 5–7 days.</p>
        </form>
      </div>
    </div>
  );
}