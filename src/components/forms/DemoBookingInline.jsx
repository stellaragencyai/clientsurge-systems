import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import CSConfirmationCard from '@/components/design-system/CSConfirmationCard';
import { base44 } from "@/api/base44Client";

const TIME_SLOTS = [
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
];

const INDUSTRIES = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
  "Other",
];

function normalizeIndustrySlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function canonicalIndustrySlug(value) {
  const slug = normalizeIndustrySlug(value);
  if (slug.includes("roof")) return "roofing";
  if (slug.includes("hvac")) return "hvac";
  if (slug.includes("plumb")) return "plumbing";
  if (slug.includes("dental") || slug.includes("orthodont")) return "dental";
  if (slug.includes("med_spa") || slug.includes("aesthetic")) return "med_spa";
  return slug;
}

function crmTagForIndustry(slug) {
  return {
    roofing: "roofing_lead",
    hvac: "hvac_lead",
    plumbing: "plumbing_lead",
    dental: "dental_lead",
    med_spa: "med_spa_lead",
  }[slug] || "automation_audit_lead";
}

function getPageAttribution() {
  if (typeof window === "undefined") {
    return {
      source_page: "/book",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      utm_content: "",
      referrer: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    source_page: window.location.pathname || "/book",
    service_context: params.get("service") || "",
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    referrer: document.referrer || "",
  };
}

export default function DemoBookingInline({
  prefillIndustry = "",
  theme = "dark",
  mode = "audit",
  serviceInterest = "automation_audit",
  serviceLabel = "",
}) {
  const isLight = theme === "light";
  const flowLabel = mode === "system_match" ? "System Match" : "Audit";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: "", last_name: "", business_name: "", email: "",
    phone: "", website: "", industry: prefillIndustry, biggest_issue: "", website_url: "",
    consent_given: false,
  });
  const [scheduling, setScheduling] = useState({ date: "", time: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitWarnings, setSubmitWarnings] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  };

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const validatePhone = (v) => /^[\d\s\-()]+$/.test(v) && v.replace(/\D/g, "").length >= 10;

  const getStep1Errors = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "Required";
    if (!form.last_name.trim()) errs.last_name = "Required";
    if (!form.business_name.trim()) errs.business_name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    else if (!validateEmail(form.email)) errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Required";
    else if (!validatePhone(form.phone)) errs.phone = "Invalid phone";
    if (!form.industry.trim()) errs.industry = "Required";
    if (!form.website.trim()) errs.website = "Required";
    if (!form.biggest_issue.trim()) errs.biggest_issue = "Required";
    if (form.consent_given !== true) errs.consent_given = "Required";
    return errs;
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    const errs = getStep1Errors();
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleDateChange = async (e) => {
    const value = e.target.value;
    setScheduling({ date: value, time: "" });
    setErrors((current) => ({ ...current, scheduling: undefined, submit: undefined }));
    if (!value) return;
    setLoadingSlots(true);
    try {
      const res = await base44.functions.invoke("getBookedDemoSlots", { date: value });
      setBookedSlots(res.data.booked_times || []);
    } catch { setBookedSlots([]); }
    finally { setLoadingSlots(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const step1Errors = getStep1Errors();
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      setStep(1);
      return;
    }
    if (!scheduling.date || !scheduling.time) {
      setErrors({ scheduling: "Please select both date and time" });
      return;
    }
    if (bookedSlots.includes(scheduling.time)) {
      setErrors({ scheduling: "That time is already reserved. Please choose another time." });
      return;
    }
    setSaving(true);
    setSubmitWarnings([]);
    setErrors({});
    try {
      const industrySlug = canonicalIndustrySlug(form.industry);
      const res = await base44.functions.invoke("scheduleDemoBooking", {
        ...getPageAttribution(),
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        business_name: form.business_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        business_website_url: form.website.trim(),
        industry: form.industry,
        business_type: form.industry,
        industry_slug: industrySlug,
        crm_tag: crmTagForIndustry(industrySlug),
        service_interest: serviceInterest,
        service_label: serviceLabel,
        biggest_issue: form.biggest_issue,
        consent_given: form.consent_given === true,
        consent_source: mode === "system_match" ? "book_system_match_inline" : "book_inline_scheduler",
        consent_text_version: mode === "system_match" ? "system_match_inline_explicit_checkbox_v1" : "audit_inline_explicit_checkbox_v1",
        website_url: form.website_url,
        scheduled_date: scheduling.date,
        scheduled_time: scheduling.time,
      });
      if (res.data?.success) {
        setSubmitWarnings(res.data.warnings || []);
        setSuccess(true);
      } else {
        throw new Error(res.data?.error || "Booking failed");
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally { setSaving(false); }
  };

  const labelCls = isLight ? "block text-xs font-bold text-slate-700 mb-1.5" : "block text-xs font-semibold text-white/60 mb-1";
  const helperCls = isLight ? "text-center text-xs text-slate-500" : "text-center text-xs text-white/60";
  const errorCls = isLight ? "text-xs font-semibold text-red-600" : "text-xs text-red-400";
  const inputCls = (key) => isLight
    ? `w-full h-11 rounded-xl border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition ${errors[key] ? "border-red-500" : "border-slate-200"}`
    : `w-full h-10 rounded-xl border px-3 text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition ${errors[key] ? "border-red-500" : "border-white/10"}`;
  const primaryButtonCls = isLight
    ? "w-full h-12 flex items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50"
    : "w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-50";
  const primaryButtonStyle = isLight ? undefined : { background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" };

  if (success) {
    return (
      <CSConfirmationCard
        title="You're All Set"
        message={`Nolan will confirm your ${flowLabel.toLowerCase()} within 24 hours. Need to reschedule? Reply to your confirmation email or contact support@clientsurgesystems.com.`}
        responseTime="within 24 hours"
        nextSteps={[
          `Your ${flowLabel.toLowerCase()} request has been received`,
          'Our team confirms the scheduled time',
          'You receive a confirmation email with details',
        ]}
      />
    );
  }

  if (step === 1) {
    return (
      <form onSubmit={handleStep1} className="space-y-4">
        <input
          type="text"
          name="website_url"
          value={form.website_url}
          onChange={set}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        {serviceLabel && isLight && (
          <div className="rounded-xl border border-primary/15 bg-white p-3 text-sm text-slate-700">
            <span className="font-bold text-primary">Selected focus:</span> {serviceLabel}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>First Name *</label>
            <input name="first_name" value={form.first_name} onChange={set} placeholder="Jane" className={inputCls("first_name")} />
          </div>
          <div>
            <label className={labelCls}>Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={set} placeholder="Smith" className={inputCls("last_name")} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Business Name *</label>
          <input name="business_name" value={form.business_name} onChange={set} placeholder="My Business" className={inputCls("business_name")} />
        </div>
        <div>
          <label className={labelCls}>Industry *</label>
          <select name="industry" value={form.industry} onChange={set} className={`${inputCls("industry")} cursor-pointer`}>
            <option value="">Select...</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Email *</label>
            <input name="email" type="email" value={form.email} onChange={set} placeholder="jane@biz.com" className={inputCls("email")} />
          </div>
          <div>
            <label className={labelCls}>Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="(555) 000-0000" className={inputCls("phone")} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Website *</label>
          <input name="website" value={form.website} onChange={set} placeholder="https://mybusiness.com" className={inputCls("website")} />
        </div>
        <div>
          <label className={labelCls}>Biggest challenge right now? *</label>
          <select name="biggest_issue" value={form.biggest_issue} onChange={set} className={`${inputCls("biggest_issue")} cursor-pointer`}>
            <option value="">Select one...</option>
            {serviceLabel && <option value={`Need ${serviceLabel}`}>Need {serviceLabel}</option>}
            <option value="Slow response time">Slow response time</option>
            <option value="Missed calls not being followed up">Missed calls not followed up</option>
            <option value="No follow-up system">No follow-up system</option>
            <option value="Low booking conversions">Low booking conversions</option>
          </select>
        </div>
        <label className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-xs leading-relaxed ${isLight ? "bg-white text-slate-600" : "text-white/60"} ${errors.consent_given ? "border-red-500" : isLight ? "border-slate-200" : "border-white/10"}`}>
          <input
            type="checkbox"
            checked={form.consent_given}
            onChange={(e) => {
              setForm((f) => ({ ...f, consent_given: e.target.checked }));
              setErrors((current) => ({ ...current, consent_given: undefined, submit: undefined }));
            }}
            className={isLight ? "mt-0.5 h-4 w-4 rounded accent-primary" : "mt-0.5 h-4 w-4 rounded accent-amber-500"}
          />
          <span>I agree to receive automated SMS and email messages from ClientSurge Systems about my {flowLabel.toLowerCase()} request. Reply STOP to opt out.</span>
        </label>
        {Object.keys(errors).length > 0 && (
          <p className={errorCls}>Please fill in all required fields.</p>
        )}
        <button type="submit" className={primaryButtonCls} style={primaryButtonStyle}>
          Next: Choose {flowLabel} Time <ArrowRight className="w-4 h-4" />
        </button>
        <p className={helperCls}>No spam. No pressure. Just a practical recommendation for your business.</p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.scheduling && <p className={errorCls}>{errors.scheduling}</p>}
      {errors.submit && <p className={errorCls}>{errors.submit}</p>}
      <div>
        <label className={labelCls}>Select {flowLabel} Date *</label>
        <input
          type="date"
          value={scheduling.date}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleDateChange}
          className={inputCls("scheduling")}
        />
      </div>
      <div>
        <label className={labelCls}>
          Select {flowLabel} Time * {loadingSlots && <span className={isLight ? "font-normal text-slate-400 ml-1" : "font-normal text-white/30 ml-1"}>Loading...</span>}
        </label>
        <select
          value={scheduling.time}
          onChange={(e) => {
            setScheduling((s) => ({ ...s, time: e.target.value }));
            setErrors((current) => ({ ...current, scheduling: undefined, submit: undefined }));
          }}
          disabled={!scheduling.date || loadingSlots}
          className={`${inputCls("scheduling")} disabled:opacity-40 cursor-pointer`}
        >
          <option value="">{!scheduling.date ? "Select a date first..." : `Choose a ${flowLabel.toLowerCase()} time...`}</option>
          {TIME_SLOTS.map(({ value, label }) => {
            const booked = bookedSlots.includes(value);
            return <option key={value} value={value} disabled={booked}>{label}{booked ? " - Reserved" : ""}</option>;
          })}
        </select>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => { setStep(1); setErrors({}); }}
          className={isLight ? "h-11 flex-1 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-50" : "flex-1 h-11 rounded-full border border-white/10 text-white/60 font-semibold hover:bg-white/5 transition"}
        >
          Back
        </button>
        <button type="submit" disabled={saving} className={isLight ? primaryButtonCls.replace("w-full", "flex-1") : "flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-50"} style={primaryButtonStyle}>
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</> : <>Schedule {flowLabel} <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
      <p className={helperCls}>No spam. No pressure. Just a practical recommendation for your business.</p>
    </form>
  );
}