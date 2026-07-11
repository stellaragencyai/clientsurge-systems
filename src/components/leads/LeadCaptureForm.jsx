import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import {
  buildSourceAttribution,
  hiddenHoneypotFilled,
  isValidEmail,
  isValidPhone,
  normalizeEmail,
  normalizePhone,
} from "@/lib/formSanitizers";

const SMS_CONSENT_VERSION = "lead_capture_optional_sms_v4_2026-07-11";

const BUSINESS_TYPES = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
  "Other",
];

const initialState = {
  full_name: "",
  business_name: "",
  email: "",
  phone: "",
  business_type: "",
  problem: "",
  consent_given: false,
  website_url: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-sky-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100";

function Field({ label, icon: Icon, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <Icon className="h-4 w-4 text-sky-600" aria-hidden="true" />
        {label}
      </label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

export default function LeadCaptureForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState(initialState);

  const completedFields = useMemo(() => {
    const keys = ["full_name", "business_name", "email", "phone", "business_type", "problem"];
    return keys.filter((key) => String(formData[key] || "").trim()).length;
  }, [formData]);

  const completionPercent = Math.round((completedFields / 6) * 100);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError("");
  };

  const validate = () => {
    if (hiddenHoneypotFilled(formData.website_url)) return "bot";
    if (!formData.full_name.trim()) return "Please enter your full name.";
    if (!formData.business_name.trim()) return "Please enter your business name.";
    if (!isValidEmail(formData.email)) return "Please enter a valid business email address.";
    if (!isValidPhone(formData.phone)) return "Please enter a valid phone number.";
    if (!formData.business_type.trim()) return "Please select your business type.";
    if (!formData.problem.trim()) return "Please describe the main problem you want solved.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError === "bot") {
      setSuccess(true);
      return;
    }
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const smsConsentGiven = formData.consent_given === true;
      const result = await base44.functions.invoke("submitLeadCapture", {
        full_name: formData.full_name.trim(),
        business_name: formData.business_name.trim(),
        email: normalizeEmail(formData.email),
        phone: normalizePhone(formData.phone),
        business_type: formData.business_type.trim(),
        problem: formData.problem.trim(),
        source: "lead_capture_page",
        requested_channels: smsConsentGiven ? ["sms", "email"] : ["email"],
        consent_given: smsConsentGiven,
        consent_source: smsConsentGiven ? "lead_capture_page_optional_sms_checkbox" : null,
        consent_text_version: smsConsentGiven ? SMS_CONSENT_VERSION : null,
        ...buildSourceAttribution("/leads/capture"),
      });

      if (!result.data?.success) throw new Error(result.data?.error || "Lead submission failed");

      setSuccess(true);
      setFormData(initialState);
    } catch (submissionError) {
      setError(
        submissionError.message ||
          "We could not submit your request. Please email support@clientsurgesystems.com."
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.10)]" aria-live="polite">
        <div className="bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-7 py-10 text-center sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 shadow-inner">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" />
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight text-slate-950">Your assessment request is in.</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            We received your information. We will follow up by email, and by SMS only when you selected SMS consent.
          </p>
          <div className="mx-auto mt-6 grid max-w-md gap-3 text-left sm:grid-cols-3">
            {["We review your answers", "We identify the first priority", "You receive the next step"].map((step, index) => (
              <div key={step} className="rounded-xl border border-emerald-100 bg-white/80 p-3 text-xs font-semibold leading-5 text-slate-700">
                <span className="mb-2 flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-black text-emerald-700">{index + 1}</span>
                {step}
              </div>
            ))}
          </div>
          <Button type="button" onClick={() => setSuccess(false)} className="mt-6 h-11 rounded-xl bg-sky-600 px-6 font-bold hover:bg-sky-700">
            Submit another request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <input type="text" name="website_url" value={formData.website_url} onChange={handleChange} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Free automation assessment
            </p>
            <p className="mt-1 text-sm text-slate-600">Usually takes less than two minutes.</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-slate-500">Progress</p>
            <p className="text-sm font-black text-sky-700">{completionPercent}%</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-valuenow={completionPercent} aria-valuemin="0" aria-valuemax="100">
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300" style={{ width: `${completionPercent}%` }} />
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-semibold leading-6 text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" icon={UserRound}>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="Nolan Strommer" autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Business name" icon={Building2}>
          <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} required placeholder="Your company" autoComplete="organization" className={inputClass} />
        </Field>
        <Field label="Business email" icon={Mail}>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@company.com" autoComplete="email" aria-invalid={Boolean(formData.email && !isValidEmail(formData.email))} className={inputClass} />
        </Field>
        <Field label="Phone number" icon={Phone}>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 (555) 123-4567" autoComplete="tel" aria-invalid={Boolean(formData.phone && !isValidPhone(formData.phone))} className={inputClass} />
        </Field>
      </div>

      <Field label="Business type" icon={Building2}>
        <select name="business_type" value={formData.business_type} onChange={handleChange} required className={`${inputClass} appearance-none`}>
          <option value="">Select your industry</option>
          {BUSINESS_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
      </Field>

      <Field label="What is the biggest lead or follow-up problem you want solved?" icon={MessageSquareText} hint="Be specific. A clear answer helps us recommend the right automation first.">
        <textarea name="problem" value={formData.problem} onChange={handleChange} required placeholder="Example: We miss calls after hours and leads often wait until the next day for a response." rows={4} className={`${inputClass} resize-y`} />
      </Field>

      <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <ShieldCheck className="h-4 w-4 text-sky-600" />
          Optional SMS consent
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-white bg-white/90 p-4 text-xs leading-5 text-slate-600 shadow-sm transition hover:border-sky-200">
          <input type="checkbox" checked={formData.consent_given} onChange={(event) => setFormData((previous) => ({ ...previous, consent_given: event.target.checked }))} className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 accent-sky-600" aria-describedby="sms-consent-disclosure" />
          <span id="sms-consent-disclosure">
            I agree to receive SMS messages from ClientSurge Systems regarding my inquiry, appointments, onboarding, and service updates. Message frequency varies. Message and data rates may apply. Reply <strong>STOP</strong> to opt out or <strong>HELP</strong> for help. Consent is not a condition of purchase. View <a href="/sms-terms" className="font-bold text-sky-700 underline underline-offset-2 hover:text-sky-900">SMS Terms</a> and <a href="/privacy" className="font-bold text-sky-700 underline underline-offset-2 hover:text-sky-900">Privacy Policy</a>.
          </span>
        </label>
        <p className="mt-3 text-[11px] leading-5 text-slate-500">You can submit this form without selecting SMS consent. We can respond by email instead.</p>
      </div>

      <Button type="submit" disabled={loading} className="group h-[52px] w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 text-base font-black shadow-[0_12px_30px_rgba(2,132,199,0.28)] transition hover:from-sky-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting securely...</> : <>Get my automation assessment<ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
      </Button>

      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-500">
        <span className="rounded-lg bg-slate-50 px-2 py-2"><ShieldCheck className="mx-auto mb-1 h-3.5 w-3.5 text-sky-600" />Secure</span>
        <span className="rounded-lg bg-slate-50 px-2 py-2">No spam</span>
        <span className="rounded-lg bg-slate-50 px-2 py-2">No obligation</span>
      </div>
    </form>
  );
}
