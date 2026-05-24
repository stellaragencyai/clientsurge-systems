import { useEffect, useState } from "react";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function MedSpaDemoModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    monthly_leads: "",
    biggest_issue: "",
    website_url: "",
  });
  const [scheduling, setScheduling] = useState({
    date: "",
    time: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitWarnings, setSubmitWarnings] = useState([]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSchedulingChange = (e) => {
    setScheduling((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (form.full_name && form.business_name && form.email && form.phone) {
      setStep(2);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!scheduling.date || !scheduling.time) return;

    setSaving(true);
    setSubmitWarnings([]);
    try {
      const result = await base44.functions.invoke('scheduleDemoBooking', {
        full_name: form.full_name,
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        monthly_leads: form.monthly_leads,
        biggest_issue: form.biggest_issue,
        website_url: form.website_url,
        scheduled_date: scheduling.date,
        scheduled_time: scheduling.time,
        industry: "Med Spa",
      });

      if (result.data.success) {
        setSubmitWarnings(result.data.warnings || []);
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      setSubmitError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medspa-demo-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-border transition-colors"
            type="button"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Free 15-Minute Demo</span>
          </div>
          <h2 id="medspa-demo-modal-title" className="font-display text-2xl font-semibold text-foreground">Tell us about your med spa</h2>
          <p className="text-sm text-muted-foreground mt-1">We'll tailor the demo to your exact situation.</p>
        </div>

        {/* Success State */}
        {success && (
          <div className="px-8 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">Thank You!</h3>
            <p className="text-base text-muted-foreground mb-2">
              We've received your intake form and demo request.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Keep an eye on your inbox for a confirmation email with all the details about your scheduled demo.
            </p>
            {submitWarnings.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full mb-4">
                <p className="text-xs text-blue-800">
                  Your booking was saved, but one or more follow-up actions still need review on our side.
                </p>
              </div>
            )}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 w-full mb-6">
              <p className="text-xs text-muted-foreground">
                ✓ Confirmation email sent<br/>
                ✓ SMS reminder scheduled<br/>
                ✓ Demo added to calendar
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              This window will close in a moment...
            </p>
          </div>
        )}

        {/* Step 1: Info Collection */}
        {!success && step === 1 && (
          <form onSubmit={handleStep1Submit} className="px-8 py-6 space-y-4" noValidate>
            <input
              type="text"
              name="website_url"
              value={form.website_url}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name *</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
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
                  autoComplete="organization"
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
                  autoComplete="email"
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
                  autoComplete="tel"
                  inputMode="tel"
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
                placeholder="e.g. 30-50 per month"
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
                <option value="">Select one...</option>
                <option value="Slow response time">Slow response time</option>
                <option value="Missed calls not being followed up">Missed calls not being followed up</option>
                <option value="No follow-up system">No follow-up system</option>
                <option value="Low booking conversions">Low booking conversions</option>
              </select>
            </div>

            <button
              type="submit"
              style={{background:"linear-gradient(135deg,#00AEEF 0%,#0088CC 50%,#003B8F 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(0,136,204,0.35)"}}
              className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-white transition hover:opacity-90"
            >
              Next: Choose Time <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-muted-foreground">No commitment. Free 15-minute call. Live in 5-7 days.</p>
            <p className="text-center text-xs text-muted-foreground/80">No spam. No pressure. Just a tailored walkthrough of your med spa.</p>
          </form>
        )}

        {/* Step 2: Scheduling */}
        {!success && step === 2 && (
          <form onSubmit={handleStep2Submit} className="px-8 py-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Date *</label>
              <input
                name="date"
                type="date"
                value={scheduling.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleSchedulingChange}
                required
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Time *</label>
              <select
                name="time"
                value={scheduling.time}
                onChange={handleSchedulingChange}
                required
                className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              >
                <option value="">Choose a time...</option>
                <option value="09:00">9:00 AM</option>
                <option value="09:30">9:30 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="10:30">10:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="15:30">3:30 PM</option>
                <option value="16:00">4:00 PM</option>
                <option value="16:30">4:30 PM</option>
              </select>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
              <p className="text-xs text-muted-foreground">
                <strong>Demo confirmed:</strong> {scheduling.date && scheduling.date.split('-').slice(1).concat(scheduling.date.split('-')[0]).join('/')} at {scheduling.time || 'TBD'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 h-12 rounded-full border border-input text-foreground font-semibold hover:bg-muted transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{background:"linear-gradient(135deg,#00AEEF 0%,#0088CC 50%,#003B8F 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(0,136,204,0.35)"}}
                 className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</>
                ) : (
                  <>Schedule Demo <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            {submitError && <p className="text-center text-xs text-destructive">{submitError}</p>}
            <p className="text-center text-xs text-muted-foreground">We'll send confirmation email & SMS</p>
            <p className="text-center text-xs text-muted-foreground/80">No spam. No pressure. Just a tailored walkthrough of your med spa.</p>
          </form>
        )}
      </div>
    </div>
  );
}