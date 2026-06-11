import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
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
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    referrer: document.referrer || "",
  };
}

export default function DemoBookingInline({ prefillIndustry = "" }) {
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

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => /^[\d\s\-()]+$/.test(v) && v.replace(/\D/g, "").length >= 10;

  const handleStep1 = (e) => {
    e.preventDefault();
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
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(2);
  };

  const handleDateChange = async (e) => {
    const value = e.target.value;
    setScheduling({ date: value, time: "" });
    setErrors((err) => ({ ...err, scheduling: undefined }));
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
    if (!scheduling.date || !scheduling.time) {
      setErrors({ scheduling: "Please select both date and time" });
      return;
    }
    setSaving(true);
    setSubmitWarnings([]);
    try {
      const industrySlug = canonicalIndustrySlug(form.industry);
      const res = await base44.functions.invoke("scheduleDemoBooking", {
        ...getPageAttribution(),
        full_name: `${form.first_name} ${form.last_name}`,
        first_name: form.first_name,
        last_name: form.last_name,
        business_name: form.business_name,
        email: form.email,
        phone: form.phone,
        website: form.website,
        business_website_url: form.website,
        industry: form.industry,
        business_type: form.industry,
        industry_slug: industrySlug,
        crm_tag: crmTagForIndustry(industrySlug),
        service_interest: "automation_audit",
        biggest_issue: form.biggest_issue,
        consent_given: form.consent_given === true,
        consent_source: "book_inline_scheduler",
        consent_text_version: "audit_inline_explicit_checkbox_v1",
        website_url: form.website_url,
        scheduled_date: scheduling.date,
        scheduled_time: scheduling.time,
      });
      if (res.data.success) {
        setSubmitWarnings(res.data.warnings || []);
        setSuccess(true);
      }
    } catch {
      setErrors({ submit: "Something went wrong. Please try again." });
    } finally { setSaving(false); }
  };

  const inputCls = (key) =>
    `w-full h-10 rounded-xl border px-3 text-sm bg-white/5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition ${errors[key] ? "border-red-500" : "border-white/10"}`;

  if (success) {
    return (
      <div className="py-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">You're all set.</h3>
        <p className="text-sm text-white/50">Nolan will confirm your audit request within 24 hours.</p>
        <p className="mt-3 text-xs text-white/45 max-w-sm">
          Need to reschedule? Reply to your confirmation email or contact support@clientsurgesystems.com.
        </p>
        {submitWarnings.length > 0 && (
          <p className="mt-3 text-xs text-amber-300 max-w-sm">
            Your booking was saved, but one or more follow-up actions still need review.
          </p>
        )}
      </div>
    );
  }

  if (step === 1) {
    return (
      <form onSubmit={handleStep1} className="space-y-3">
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">First Name *</label>
            <input name="first_name" value={form.first_name} onChange={set} placeholder="Jane" className={inputCls("first_name")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={set} placeholder="Smith" className={inputCls("last_name")} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Business Name *</label>
          <input name="business_name" value={form.business_name} onChange={set} placeholder="My Business" className={inputCls("business_name")} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Industry *</label>
          <select name="industry" value={form.industry} onChange={set} className={`${inputCls("industry")} cursor-pointer`}>
            <option value="">Select...</option>
            {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Email *</label>
            <input name="email" type="email" value={form.email} onChange={set} placeholder="jane@biz.com" className={inputCls("email")} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Phone *</label>
            <input name="phone" type="tel" value={form.phone} onChange={set} placeholder="(555) 000-0000" className={inputCls("phone")} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Website *</label>
          <input name="website" value={form.website} onChange={set} placeholder="https://mybusiness.com" className={inputCls("website")} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Biggest challenge right now? *</label>
          <select name="biggest_issue" value={form.biggest_issue} onChange={set} className={`${inputCls("biggest_issue")} cursor-pointer`}>
            <option value="">Select one...</option>
            <option value="Slow response time">Slow response time</option>
            <option value="Missed calls not being followed up">Missed calls not followed up</option>
            <option value="No follow-up system">No follow-up system</option>
            <option value="Low booking conversions">Low booking conversions</option>
          </select>
        </div>
        <label className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-xs leading-relaxed text-white/60 ${errors.consent_given ? "border-red-500" : "border-white/10"}`}>
          <input
            type="checkbox"
            checked={form.consent_given}
            onChange={(e) => {
              setForm((f) => ({ ...f, consent_given: e.target.checked }));
              setErrors((current) => ({ ...current, consent_given: undefined }));
            }}
            className="mt-0.5 h-4 w-4 rounded accent-amber-500"
          />
          <span>I agree to receive automated SMS and email messages from ClientSurge Systems about my audit booking. Reply STOP to opt out.</span>
        </label>
        {Object.keys(errors).length > 0 && (
          <p className="text-xs text-red-400">Please fill in all required fields.</p>
        )}
        <button
          type="submit"
          className="w-full h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-amber-100 transition hover:opacity-90"
          style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}
        >
          Next: Choose Time <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-xs text-white/60">No spam. No pressure. Just a tailored walkthrough of your business.</p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {errors.scheduling && <p className="text-xs text-red-400">{errors.scheduling}</p>}
      {errors.submit && <p className="text-xs text-red-400">{errors.submit}</p>}
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1">Select Date *</label>
        <input
          type="date"
          value={scheduling.date}
          min={new Date().toISOString().split("T")[0]}
          onChange={handleDateChange}
          className={inputCls("scheduling")}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-white/60 mb-1">
          Select Time * {loadingSlots && <span className="font-normal text-white/30 ml-1">Loading...</span>}
        </label>
        <select
          value={scheduling.time}
          name="scheduled_time"
          onChange={(e) => {
            const val = e.target.value;
            setScheduling((s) => ({ ...s, time: val }));
            setErrors((err) => ({ ...err, scheduling: undefined }));
          }}
          disabled={!scheduling.date || loadingSlots}
          className={`${inputCls("scheduling")} disabled:opacity-40 cursor-pointer`}
        >
          <option value="">{!scheduling.date ? "Select a date first..." : "Choose a time..."}</option>
          {TIME_SLOTS.map(({ value, label }) => {
            const booked = bookedSlots.includes(value);
            return <option key={value} value={value} disabled={booked}>{label}{booked ? " - Booked" : ""}</option>;
          })}
        </select>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={() => { setStep(1); setErrors({}); }} className="flex-1 h-11 rounded-full border border-white/10 text-white/60 font-semibold hover:bg-white/5 transition">
          Back
        </button>
        <button
          type="submit"
          disabled={saving || !scheduling.date || !scheduling.time}
          className="flex-1 h-11 flex items-center justify-center gap-2 rounded-full text-sm font-bold text-amber-100 transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)" }}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</> : <>Schedule Audit <ArrowRight className="w-4 h-4" /></>}
        </button>
      </div>
      <p className="text-center text-xs text-white/60">No spam. No pressure. Just a tailored walkthrough of your business.</p>
    </form>
  );
}