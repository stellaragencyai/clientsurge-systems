import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

export default function DemoBookingModal({ onClose, prefillIndustry = "" }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    industry: prefillIndustry,
    biggest_issue: "",
    website_url: "",
  });
  const [scheduling, setScheduling] = useState({
    date: "",
    time: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState(/** @type {Record<string, string | undefined>} */ ({}));
  const [submitWarnings, setSubmitWarnings] = useState([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      industry: prefillIndustry || current.industry,
    }));
  }, [prefillIndustry]);

  useEffect(() => {
    // Keep homepage overlays on one shared lock manager so opening this modal
    // from the mobile nav cannot leave body scrolling stuck on close.
    const releaseScrollLock = acquireBodyScrollLock("demo-booking-modal");
    return () => {
      releaseScrollLock();
    };
  }, []); // Modal mounts only when open — overflow restored on unmount

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSchedulingChange = async (e) => {
    const { name, value } = e.target;
    setScheduling((s) => ({ ...s, [name]: value }));
    if (name === 'date' && value) {
      setLoadingSlots(true);
      setBookedSlots([]);
      setScheduling((s) => ({ ...s, date: value, time: '' }));
      try {
        const res = await base44.functions.invoke('getBookedDemoSlots', { date: value });
        setBookedSlots(res.data.booked_times || []);
      } catch {
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[\d\s\-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const newErrors = /** @type {Record<string, string | undefined>} */ ({});
    
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
    setSubmitWarnings([]);
    try {
      const result = await base44.functions.invoke('scheduleDemoBooking', {
        full_name: form.full_name,
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        industry: form.industry,
        biggest_issue: form.biggest_issue,
        website_url: form.website_url,
        scheduled_date: scheduling.date,
        scheduled_time: scheduling.time,
      });

      if (result.data.success) {
        setSubmitWarnings(result.data.warnings || []);
        setSuccess(true);
        // Show success for 2 seconds, then close + redirect
        setTimeout(() => {
          onClose();
          window.location.href = '/success';
        }, 2000);
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
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-booking-modal-title"
    >
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
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Free Audit Call</span>
          </div>
          <h2 id="demo-booking-modal-title" className="font-display text-2xl font-semibold text-foreground">Tell us about your business</h2>
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
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full mb-4">
                <p className="text-xs text-amber-800">
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
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                <span className="text-lg">Warning:</span>
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
                  autoComplete="name"
                  placeholder="Jane Smith"
                  style={{ fontSize: "16px" }}
                  className={`w-full h-11 rounded-xl border px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-primary transition ${errors.full_name ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.full_name && <p className="text-red-600 text-xs mt-1">Error: {errors.full_name}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Business Name <span className="text-red-600">*</span></label>
                <input
                  name="business_name"
                  value={form.business_name}
                  onChange={handleChange}
                  autoComplete="organization"
                  placeholder="My Business"
                  style={{ fontSize: "16px" }}
                  className={`w-full h-11 rounded-xl border px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-primary transition ${errors.business_name ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.business_name && <p className="text-red-600 text-xs mt-1">Error: {errors.business_name}</p>}
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
                  autoComplete="email"
                  placeholder="jane@business.com"
                  style={{ fontSize: "16px" }}
                  className={`w-full h-11 rounded-xl border px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-primary transition ${errors.email ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.email && <p className="text-red-600 text-xs mt-1">Error: {errors.email}</p>}
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Phone <span className="text-red-600">*</span></label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="(555) 000-0000"
                  style={{ fontSize: "16px" }}
                  className={`w-full h-11 rounded-xl border px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-primary transition ${errors.phone ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
                />
                {errors.phone && <p className="text-red-600 text-xs mt-1">Error: {errors.phone}</p>}
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
                <option value="">Select one...</option>
                <option value="Slow response time">Slow response time</option>
                <option value="Missed calls not being followed up">Missed calls not being followed up</option>
                <option value="No follow-up system">No follow-up system</option>
                <option value="Low booking conversions">Low booking conversions</option>
              </select>
            </div>

            <button
              type="submit"
              style={{background:"linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(0,174,239,0.4)"}}
              className="w-full h-12 flex items-center justify-center gap-2 text-sm font-bold text-white transition hover:opacity-90 focus:ring-2 focus:ring-primary focus:outline-none"
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,174,239,0.6), 0 4px 18px rgba(0,174,239,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,174,239,0.4)"}
            >
              Next: Choose Time <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-center text-xs text-muted-foreground">No commitment. Free 15-minute call. Live in 5-7 days.</p>
            <p className="text-center text-xs text-muted-foreground/60">
              By submitting, you agree to receive SMS follow-up messages from ClientSurge Systems. Reply STOP at any time to opt out. See our{" "}
              <a href="/legal/privacy" className="underline hover:text-primary">Privacy Policy</a>.
            </p>
          </form>
        )}

        {/* Step 2: Scheduling */}
        {!success && step === 2 && (
          <form onSubmit={handleStep2Submit} className="px-8 py-6 space-y-4" noValidate>
            {errors.scheduling && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-start gap-2">
                <span className="text-lg">Warning:</span>
                <span>{errors.scheduling}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Select Date <span className="text-red-600">*</span></label>
              <input
                name="date"
                type="date"
                value={scheduling.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleSchedulingChange}
                style={{ fontSize: "16px", minHeight: "48px" }}
                className={`w-full rounded-xl border px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-primary transition ${errors.scheduling ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Select Time <span className="text-red-600">*</span>
                {loadingSlots && <span className="ml-2 text-xs text-muted-foreground font-normal">Loading availability...</span>}
              </label>
              <select
                name="time"
                value={scheduling.time}
                onChange={handleSchedulingChange}
                disabled={!scheduling.date || loadingSlots}
                style={{ fontSize: "16px", minHeight: "48px" }}
                className={`w-full rounded-xl border px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:border-primary transition disabled:opacity-50 disabled:cursor-not-allowed ${errors.scheduling ? 'border-red-500 bg-red-50' : 'border-input bg-background'}`}
              >
                <option value="">{!scheduling.date ? 'Select a date first...' : 'Choose a time...'}</option>
                {[
                  { value: "09:00", label: "9:00 AM" },
                  { value: "09:30", label: "9:30 AM" },
                  { value: "10:00", label: "10:00 AM" },
                  { value: "10:30", label: "10:30 AM" },
                  { value: "11:00", label: "11:00 AM" },
                  { value: "11:30", label: "11:30 AM" },
                  { value: "14:00", label: "2:00 PM" },
                  { value: "14:30", label: "2:30 PM" },
                  { value: "15:00", label: "3:00 PM" },
                  { value: "15:30", label: "3:30 PM" },
                  { value: "16:00", label: "4:00 PM" },
                  { value: "16:30", label: "4:30 PM" },
                ].map(({ value, label }) => {
                  const isBooked = bookedSlots.includes(value);
                  return (
                    <option key={value} value={value} disabled={isBooked}>
                      {label}{isBooked ? ' - Booked' : ''}
                    </option>
                  );
                })}
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
                onClick={() => { setStep(1); setErrors({}); }}
                className="flex-1 h-12 rounded-full border border-input text-foreground font-semibold hover:bg-muted focus:ring-2 focus:ring-primary focus:outline-none transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving || (Date.now() - lastSubmitTime < 3000 && lastSubmitTime > 0)}
                style={{background:"linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",borderRadius:"9999px",boxShadow:"0 4px 18px rgba(0,174,239,0.4)"}}
                className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60 focus:ring-2 focus:ring-primary focus:outline-none"
                onMouseEnter={(e) => !saving && (e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,174,239,0.6), 0 4px 18px rgba(0,174,239,0.4)")}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,174,239,0.4)"}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</>
                ) : (
                  <>Schedule Demo <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-muted-foreground">We'll send confirmation email & SMS</p>
            <p className="text-center text-xs text-muted-foreground/80">No spam. No pressure. Just a tailored walkthrough of your business.</p>
          </form>
        )}
      </div>
      </div>
    </div>,
    document.body
  );
}