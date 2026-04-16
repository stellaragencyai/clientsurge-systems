import { useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function DemoBookingModal({ onClose, prefillIndustry = "" }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    industry: prefillIndustry,
    biggest_issue: "",
  });
  const [scheduling, setScheduling] = useState({
    date: "",
    time: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSchedulingChange = (e) => {
    setScheduling((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[\d\s\-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const newErrors = {};
    
    if (!form.full_name.trim()) newErrors.full_name = "Name is required";
    if (!form.business_name.trim()) newErrors.business_name = "Business name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!validateEmail(form.email)) newErrors.email = "Please enter a valid email";
    if (!form.phone.trim()) newErrors.phone = "Phone is required";
    else if (!validatePhone(form.phone)) newErrors.phone = "Please enter a valid phone number";
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setStep(2);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastSubmitTime < 3000) return;
    
    if (!scheduling.date || !scheduling.time) {
      setErrors({ scheduling: "Please select both date and time" });
      return;
    }

    setSaving(true);
    setLastSubmitTime(now);
    try {
      const result = await base44.functions.invoke('scheduleDemoBooking', {
        full_name: form.full_name,
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        industry: form.industry,
        biggest_issue: form.biggest_issue,
        scheduled_date: scheduling.date,
        scheduled_time: scheduling.time,
      });

      if (result.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } catch (error) {
      setErrors({ submit: "Something went wrong. Please try again or contact support." });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Centering wrapper */}
      <div className="flex min-h-full items-center justify-center p-4">
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-border">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-border focus:ring-2 focus:ring-primary focus:outline-none transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-3 py-1 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Free 15-Min Demo</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Tell us about your business</h2>
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
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 w-full mb-6">
              <p className="text-xs text-muted-foreground">
                ✓ Confirmation email sent<br/>
                ✓ SMS reminder scheduled<br/>
                ✓ Demo added to calendar
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Redirecting to home in 4 seconds...
            </p>
          </div>
        )}

        {/* Step 1: Info Collection */}
        {!success && step === 1 && (
          <form onSubmit={handleStep1Submit} className="px-8 py-6 space-y-4">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{errors.submit}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name <span className="text-red-600">*</span></label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${errors.full_name ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.full_name && <p className="text-red-600 text-xs mt-1">❌ {errors.full_name}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Business Name <span className="text-red-600">*</span></label>
                <input
                  name="business_name"
                  value={form.business_name}
                  onChange={handleChange}
                  placeholder="My Business"
                  className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${errors.business_name ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.business_name && <p className="text-red-600 text-xs mt-1">❌ {errors.business_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email <span className="text-red-600">*</span></label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@business.com"
                  className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.email && <p className="text-red-600 text-xs mt-1">❌ {errors.email}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Phone <span className="text-red-600">*</span></label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(555) 000-0000"
                  className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${errors.phone ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.phone && <p className="text-red-600 text-xs mt-1">❌ {errors.phone}</p>}
              </div>
            </div>

            {prefillIndustry && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Selected Industry</label>
                <input
                  name="industry"
                  value={form.industry}
                  readOnly
                  className="w-full h-11 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-semibold text-primary focus:outline-none cursor-default"
                />
              </div>
            )}

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
              style={{background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}
              className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-amber-100 transition hover:opacity-90 focus:ring-2 focus:ring-primary focus:outline-none"
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"}
            >
              Next: Choose Time <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-muted-foreground">No commitment. Free 15-min call. Live in 5–7 days.</p>
          </form>
        )}

        {/* Step 2: Scheduling */}
        {!success && step === 2 && (
          <form onSubmit={handleStep2Submit} className="px-8 py-6 space-y-4">
            {errors.scheduling && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{errors.scheduling}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Date <span className="text-red-600">*</span></label>
              <input
                name="date"
                type="date"
                value={scheduling.date}
                onChange={handleSchedulingChange}
                className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${errors.scheduling ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Time <span className="text-red-600">*</span></label>
              <select
                name="time"
                value={scheduling.time}
                onChange={handleSchedulingChange}
                className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition ${errors.scheduling ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
              >
                <option value="">Choose a time…</option>
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
                <strong>📅 Demo Confirmed:</strong> {scheduling.date && new Date(scheduling.date).toLocaleDateString()} at {scheduling.time || 'TBD'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); setErrors({}); }}
                className="flex-1 h-12 rounded-full border border-input text-foreground font-semibold hover:bg-muted focus:ring-2 focus:ring-primary focus:outline-none transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving || (Date.now() - lastSubmitTime < 3000 && lastSubmitTime > 0)}
                style={{background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(120,70,20,0.35)"}}
                className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-60 focus:ring-2 focus:ring-primary focus:outline-none"
                onMouseEnter={(e) => !saving && (e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)")}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)"}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling…</>
                ) : (
                  <>Schedule Demo <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">We'll send confirmation email & SMS</p>
          </form>
        )}
      </div>
      </div>
    </div>,
    document.body
  );
}