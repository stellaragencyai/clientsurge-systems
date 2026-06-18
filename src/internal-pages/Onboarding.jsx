import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Lock } from "lucide-react";
import OnboardingChatWidget from "../components/onboarding/OnboardingChatWidget";
import PostOnboardingFlow from "../components/forms/PostOnboardingFlow";
import Navbar from "@/components/landing/Navbar";

const SERVICES = ["Botox / Injectables", "Fillers", "Laser Treatments", "Facials / Skincare", "Body Contouring", "Weight Loss", "HVAC", "Roofing", "Dental", "Chiropractic", "Other"];
const LEAD_SOURCES = ["Website Forms", "Instagram DMs", "Phone Calls", "Paid Ads", "Referrals", "Walk-ins", "Google My Business"];
const RESPONSE_OPTIONS = ["Immediately", "Within 1 hour", "Same day", "Longer"];

const STEPS = [
  { id: 1, label: "About You",    emoji: "👋" },
  { id: 2, label: "Your Business", emoji: "💼" },
  { id: 3, label: "Booking",      emoji: "📅" },
  { id: 4, label: "Goals",        emoji: "🎯" },
];

export default function Onboarding() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    full_name: "",
    business_name: "",
    email: "",
    phone: "",
    website: "",
    social_media: "",
    services: [],
    lead_sources: [],
    current_process: "",
    response_speed: "",
    booking_link: "",
    calendar_system: "",
    requires_consultation: "",
    brand_voice: "",
    customer_questions: "",
    business_hours: "",
    has_old_leads: "",
    access_info: "",
    goals: "",
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then((auth) => {
      setIsAuthenticated(auth);
      setAuthChecked(true);
    }).catch(() => {
      setIsAuthenticated(false);
      setAuthChecked(true);
    });
  }, []);

  const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const validateRequiredFields = () => {
    const nextErrors = {};
    if (!formData.full_name.trim()) nextErrors.full_name = "Please enter your full name.";
    if (!formData.business_name.trim()) nextErrors.business_name = "Please enter your business name.";
    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (!/^[\d\s()+-]{10,}$/.test(formData.phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number.";
    }
    setFieldErrors(nextErrors);
    return nextErrors;
  };

  const toggleChip = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((i) => i !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateRequiredFields();
    if (Object.keys(nextErrors).length > 0) {
      setStep(1);
      setError("Please complete the required fields before submitting.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("submitClientOnboarding", { ...formData, flow: "onboarding" });
      setSubmitted(true);
    } catch (err) {
      setError(err?.data?.error || err.message || "Failed to submit onboarding. Please try again.");
      setLoading(false);
    }
  };

  // Loading auth check
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ── Unauthenticated: safe public gate ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Client Onboarding</h1>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Client onboarding is available after you start setup or log in. If you haven't started your remote setup intake yet, begin there.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/start"
                className="cs-btn-primary flex items-center gap-2 justify-center"
                style={{ minHeight: 'unset', minWidth: 'unset', fontSize: '0.875rem' }}
              >
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Client Login
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Need help? <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">support@clientsurgesystems.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated: full onboarding wizard ──
  if (submitted) {
    return <PostOnboardingFlow businessName={formData.business_name} email={formData.email} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      <div style={{ background: "linear-gradient(135deg,#0A1628 0%,#003B8F 100%)" }} className="px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <p className="text-[11px] font-bold text-blue-300/70 uppercase tracking-widest">ClientSurge Systems</p>
          <p className="text-white font-semibold text-lg mt-0.5">Client Onboarding</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200/60">Step {step} of {STEPS.length}</p>
          <p className="text-white font-semibold text-sm">{STEPS[step - 1].label}</p>
        </div>
      </div>

      <div className="h-1 bg-slate-200">
        <div className="h-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%`, background: "linear-gradient(90deg,#00AEEF,#003B8F)" }} />
      </div>

      <div className="flex items-center justify-center gap-0 pt-8 pb-2 px-4">
        {STEPS.map((s, i) => {
          const done = s.id < step;
          const active = s.id === step;
          return (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    done ? "bg-green-500 text-white shadow-md" :
                    active ? "text-white shadow-lg scale-110" :
                    "bg-white text-slate-400 border-2 border-slate-200"
                  }`}
                  style={active ? { background: "linear-gradient(135deg,#00AEEF,#003B8F)" } : {}}
                >
                  {done ? <CheckCircle2 className="w-5 h-5" /> : s.emoji}
                </div>
                <span className={`text-[10px] font-semibold hidden sm:block ${active ? "text-primary" : done ? "text-green-600" : "text-slate-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-1 mb-5 transition-all ${done ? "bg-green-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-6">
        <div className="w-full max-w-xl">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">

            {step === 1 && (
              <StepWrapper title="Tell us about you" subtitle="We'll use this to personalize your setup">
                <Field label="Your Full Name" required>
                  <Input value={formData.full_name} onChange={v => update("full_name", v)} placeholder="Jane Smith" />
                  {fieldErrors.full_name && <FieldError message={fieldErrors.full_name} />}
                </Field>
                <Field label="Business Name" required>
                  <Input value={formData.business_name} onChange={v => update("business_name", v)} placeholder="Luxe Med Spa" />
                  {fieldErrors.business_name && <FieldError message={fieldErrors.business_name} />}
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Email" required>
                    <Input type="email" value={formData.email} onChange={v => update("email", v)} placeholder="you@spa.com" />
                    {fieldErrors.email && <FieldError message={fieldErrors.email} />}
                  </Field>
                  <Field label="Phone" required>
                    <Input type="tel" value={formData.phone} onChange={v => update("phone", v)} placeholder="(602) 555-0100" />
                    {fieldErrors.phone && <FieldError message={fieldErrors.phone} />}
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Website">
                    <Input value={formData.website} onChange={v => update("website", v)} placeholder="https://yourbiz.com" />
                  </Field>
                  <Field label="Instagram">
                    <Input value={formData.social_media} onChange={v => update("social_media", v)} placeholder="@yourhandle" />
                  </Field>
                </div>
              </StepWrapper>
            )}

            {step === 2 && (
              <StepWrapper title="Your business details" subtitle="Help us understand how you operate">
                <Field label="Services you offer">
                  <ChipGrid options={SERVICES} selected={formData.services} onToggle={v => toggleChip("services", v)} />
                </Field>
                <Field label="Where do your leads come from?">
                  <ChipGrid options={LEAD_SOURCES} selected={formData.lead_sources} onToggle={v => toggleChip("lead_sources", v)} />
                </Field>
                <Field label="How do you currently handle new leads?" hint="Briefly describe what happens when someone reaches out">
                  <Textarea value={formData.current_process} onChange={v => update("current_process", v)} placeholder="e.g. I reply manually via Instagram DMs, usually the next day..." />
                </Field>
                <Field label="How fast do you typically respond?">
                  <SingleSelect options={RESPONSE_OPTIONS} value={formData.response_speed} onSelect={v => update("response_speed", v)} />
                </Field>
              </StepWrapper>
            )}

            {step === 3 && (
              <StepWrapper title="Booking & brand" subtitle="Set up how clients schedule with you">
                <Field label="Booking / Scheduling Link">
                  <Input value={formData.booking_link} onChange={v => update("booking_link", v)} placeholder="https://calendly.com/yourspa" />
                </Field>
                <Field label="Calendar System" hint="e.g. Acuity, Calendly, Google Calendar">
                  <Input value={formData.calendar_system} onChange={v => update("calendar_system", v)} placeholder="Acuity Scheduling" />
                </Field>
                <Field label="Require a consultation before booking?">
                  <SingleSelect options={["Yes", "No"]} value={formData.requires_consultation} onSelect={v => update("requires_consultation", v)} />
                </Field>
                <Field label="Business Hours">
                  <Textarea value={formData.business_hours} onChange={v => update("business_hours", v)} placeholder={"Mon–Fri: 9am–6pm\nSat: 10am–4pm\nClosed Sunday"} rows={3} />
                </Field>
                <Field label="Brand Voice — how do you speak to clients?">
                  <SingleSelect options={["Professional", "Friendly", "Luxury", "Casual"]} value={formData.brand_voice} onSelect={v => update("brand_voice", v)} />
                </Field>
              </StepWrapper>
            )}

            {step === 4 && (
              <StepWrapper title="Almost done!" subtitle="A few final details to complete your setup">
                <Field label="What are the most common questions clients ask?" hint="We'll use this to prepare your setup">
                  <Textarea value={formData.customer_questions} onChange={v => update("customer_questions", v)} placeholder="e.g. How much does Botox cost? Do you offer free consultations?" />
                </Field>
                <Field label="Do you have old leads to reactivate?">
                  <SingleSelect options={["Yes — I have a list", "No — start fresh"]} value={formData.has_old_leads} onSelect={v => update("has_old_leads", v)} />
                </Field>
                <Field label="What would success look like for you?" hint="Be as specific as you'd like">
                  <Textarea value={formData.goals} onChange={v => update("goals", v)} placeholder="e.g. 10 new bookings per month, faster response time, automated follow-ups..." />
                </Field>
                <Field label="Access Info (optional)" hint="CRM logins, email access — only if you'd like to share now">
                  <Textarea value={formData.access_info} onChange={v => update("access_info", v)} placeholder="You can always share this later via email" rows={2} />
                </Field>
              </StepWrapper>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 flex gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 gap-4">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              {step < STEPS.length ? (
                <button type="button" onClick={() => setStep(s => s + 1)}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "linear-gradient(135deg,#00AEEF,#003B8F)" }}>
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)" }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Submit & Launch 🚀</>}
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Questions? Email <a href="mailto:support@clientsurgesystems.com" className="text-primary underline">support@clientsurgesystems.com</a>
          </p>
        </div>
      </div>

      <OnboardingChatWidget />
    </div>
  );
}

function StepWrapper({ title, subtitle, children }) {
  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-sm font-semibold text-slate-700">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </label>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm transition-all" />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm resize-none transition-all" />
  );
}

function FieldError({ message }) {
  return <p className="text-xs font-medium text-red-500">{message}</p>;
}

function ChipGrid({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => onToggle(opt)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              active ? "border-primary bg-primary/8 text-primary" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-primary/40 hover:text-slate-700"
            }`}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SingleSelect({ options, value, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => {
        const active = value === opt;
        return (
          <button key={opt} type="button" onClick={() => onSelect(opt)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
              active ? "border-primary bg-primary/8 text-primary" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-primary/40 hover:text-slate-700"
            }`}>
            {active && <span className="mr-1.5">✓</span>}
            {opt}
          </button>
        );
      })}
    </div>
  );
}