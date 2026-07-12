import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import CSConfirmationCard from "@/components/design-system/CSConfirmationCard";
import { base44 } from "@/api/base44Client";

const TIME_ZONE_LABEL = "Arizona time (MST)";
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
  "HVAC",
  "Roofing & Restoration",
  "Dental & Orthodontics",
  "Med Spas & Aesthetic Clinics",
  "Plumbing & Drain Services",
  "Chiropractic & Physical Therapy",
  "Contractors & Trades",
  "Other",
];

function normalizeIndustrySlug(value) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (slug.includes("roof")) return "roofing";
  if (slug.includes("hvac")) return "hvac";
  if (slug.includes("plumb")) return "plumbing";
  if (slug.includes("dental") || slug.includes("orthodont")) return "dental";
  if (slug.includes("med_spa") || slug.includes("aesthetic")) return "med_spa";
  if (slug.includes("chiropr") || slug.includes("physical_therapy")) return "chiropractic";
  if (slug.includes("contract")) return "contractors";
  return slug;
}

function crmTagForIndustry(slug) {
  return {
    roofing: "roofing_lead",
    hvac: "hvac_lead",
    plumbing: "plumbing_lead",
    dental: "dental_lead",
    med_spa: "med_spa_lead",
    chiropractic: "chiropractic_lead",
    contractors: "contractor_lead",
  }[slug] || "automation_audit_lead";
}

function getArizonaDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
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
  const flowLabel = mode === "system_match" ? "system match" : "automation audit";
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    business_name: "",
    email: "",
    phone: "",
    website: "",
    industry: prefillIndustry,
    biggest_issue: "",
    preferred_date: "",
    preferred_time: "",
    website_url: "",
    consent_given: false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const labelClass = isLight
    ? "block text-xs font-bold text-slate-700 mb-1.5"
    : "block text-xs font-semibold text-white/70 mb-1.5";
  const helperClass = isLight ? "text-xs text-slate-500" : "text-xs text-white/60";
  const errorClass = isLight ? "text-xs font-semibold text-red-600" : "text-xs font-semibold text-red-300";
  const inputClass = (key) => isLight
    ? `w-full h-11 rounded-xl border px-3 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[key] ? "border-red-500" : "border-slate-200"}`
    : `w-full h-11 rounded-xl border px-3 text-sm bg-white/5 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-500/40 ${errors[key] ? "border-red-400" : "border-white/15"}`;

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.first_name.trim()) next.first_name = "Required";
    if (!form.last_name.trim()) next.last_name = "Required";
    if (!form.business_name.trim()) next.business_name = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 10) next.phone = "Enter a valid phone";
    if (!form.industry.trim()) next.industry = "Required";
    if (!form.biggest_issue.trim()) next.biggest_issue = "Required";
    if (!form.preferred_date) next.preferred_date = "Choose a date";
    if (!form.preferred_time) next.preferred_time = "Choose a time";
    if (!form.consent_given) next.consent_given = "Consent is required";
    return next;
  };

  const handleDateChange = async (value) => {
    updateField("preferred_date", value);
    updateField("preferred_time", "");
    setBookedSlots([]);
    if (!value) return;
    setLoadingSlots(true);
    try {
      const response = await base44.functions.invoke("getBookedDemoSlots", { date: value });
      setBookedSlots(response?.data?.booked_times || []);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (bookedSlots.includes(form.preferred_time)) {
      setErrors({ preferred_time: "That preferred time is no longer available" });
      return;
    }

    setSaving(true);
    try {
      const industrySlug = normalizeIndustrySlug(form.industry);
      const response = await base44.functions.invoke("scheduleDemoBooking", {
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
        consent_given: true,
        consent_source: mode === "system_match" ? "book_system_match_inline" : "audit_inline_request",
        consent_text_version: "audit_preferred_time_request_v2",
        website_url: form.website_url,
        scheduled_date: form.preferred_date,
        scheduled_time: form.preferred_time,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.error || "Request failed");
      }
      setResponseMessage(
        response.data.message || "Preferred time received. ClientSurge will confirm it within one business day."
      );
      setSuccess(true);
    } catch (error) {
      setErrors({
        submit: error?.response?.data?.error || error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <CSConfirmationCard
        title="Preferred Time Received"
        message={responseMessage}
        responseTime="within one business day"
        nextSteps={[
          `Your preferred ${flowLabel} time is held as a request`,
          "ClientSurge confirms the time or sends the closest option",
          "You receive the confirmed appointment details by email",
        ]}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="website_url"
        value={form.website_url}
        onChange={(event) => updateField("website_url", event.target.value)}
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

      <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
        <p className={`font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>
          Request a preferred time
        </p>
        <p className={`mt-1 ${helperClass}`}>
          Times are shown in {TIME_ZONE_LABEL}. Your request is pending until ClientSurge confirms it by email.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>First name *</label>
          <input value={form.first_name} onChange={(event) => updateField("first_name", event.target.value)} className={inputClass("first_name")} placeholder="Jane" />
          {errors.first_name && <p className={errorClass}>{errors.first_name}</p>}
        </div>
        <div>
          <label className={labelClass}>Last name *</label>
          <input value={form.last_name} onChange={(event) => updateField("last_name", event.target.value)} className={inputClass("last_name")} placeholder="Smith" />
          {errors.last_name && <p className={errorClass}>{errors.last_name}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Business name *</label>
        <input value={form.business_name} onChange={(event) => updateField("business_name", event.target.value)} className={inputClass("business_name")} placeholder="My Business" />
        {errors.business_name && <p className={errorClass}>{errors.business_name}</p>}
      </div>

      <div>
        <label className={labelClass}>Industry *</label>
        <select value={form.industry} onChange={(event) => updateField("industry", event.target.value)} className={`${inputClass("industry")} cursor-pointer`}>
          <option value="">Select industry...</option>
          {INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
        </select>
        {errors.industry && <p className={errorClass}>{errors.industry}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className={inputClass("email")} placeholder="jane@business.com" />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>
        <div>
          <label className={labelClass}>Phone *</label>
          <input type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className={inputClass("phone")} placeholder="(555) 000-0000" />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>Website <span className="font-normal opacity-70">(optional)</span></label>
        <input value={form.website} onChange={(event) => updateField("website", event.target.value)} className={inputClass("website")} placeholder="https://mybusiness.com" />
      </div>

      <div>
        <label className={labelClass}>What should we review first? *</label>
        <select value={form.biggest_issue} onChange={(event) => updateField("biggest_issue", event.target.value)} className={`${inputClass("biggest_issue")} cursor-pointer`}>
          <option value="">Select one...</option>
          {serviceLabel && <option value={`Need ${serviceLabel}`}>Need {serviceLabel}</option>}
          <option value="Slow response time">Slow response time</option>
          <option value="Missed calls not being followed up">Missed calls not being followed up</option>
          <option value="No follow-up system">No follow-up system</option>
          <option value="Low booking conversions">Low booking conversions</option>
          <option value="Website needs improvement">Website needs improvement</option>
        </select>
        {errors.biggest_issue && <p className={errorClass}>{errors.biggest_issue}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Preferred date *</label>
          <input
            type="date"
            value={form.preferred_date}
            min={getArizonaDate()}
            onChange={(event) => handleDateChange(event.target.value)}
            className={inputClass("preferred_date")}
          />
          {errors.preferred_date && <p className={errorClass}>{errors.preferred_date}</p>}
        </div>
        <div>
          <label className={labelClass}>Preferred {TIME_ZONE_LABEL} *</label>
          <select
            value={form.preferred_time}
            onChange={(event) => updateField("preferred_time", event.target.value)}
            disabled={!form.preferred_date || loadingSlots}
            className={`${inputClass("preferred_time")} cursor-pointer disabled:opacity-50`}
          >
            <option value="">{loadingSlots ? "Checking availability..." : "Choose a preferred time..."}</option>
            {TIME_SLOTS.map(({ value, label }) => {
              const unavailable = bookedSlots.includes(value);
              return <option key={value} value={value} disabled={unavailable}>{label}{unavailable ? " — unavailable" : ""}</option>;
            })}
          </select>
          {errors.preferred_time && <p className={errorClass}>{errors.preferred_time}</p>}
        </div>
      </div>

      <label className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-xs leading-relaxed ${isLight ? "bg-white text-slate-600" : "text-white/70"} ${errors.consent_given ? "border-red-500" : isLight ? "border-slate-200" : "border-white/15"}`}>
        <input
          type="checkbox"
          checked={form.consent_given}
          onChange={(event) => updateField("consent_given", event.target.checked)}
          className={isLight ? "mt-0.5 h-4 w-4 rounded accent-primary" : "mt-0.5 h-4 w-4 rounded accent-amber-500"}
        />
        <span>I agree to receive SMS and email messages from ClientSurge Systems about this request. Reply STOP to opt out.</span>
      </label>
      {errors.consent_given && <p className={errorClass}>{errors.consent_given}</p>}
      {errors.submit && <p className={errorClass}>{errors.submit}</p>}

      <button
        type="submit"
        disabled={saving}
        className={isLight
          ? "w-full h-12 flex items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50"
          : "w-full h-12 flex items-center justify-center gap-2 rounded-full bg-amber-700 text-sm font-bold text-amber-50 transition hover:bg-amber-600 disabled:opacity-50"}
      >
        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending request...</> : <>Request This Time <ArrowRight className="h-4 w-4" /></>}
      </button>

      <div className={`flex items-start gap-2 ${helperClass}`}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <span>No payment is required. ClientSurge confirms the appointment before it is marked booked.</span>
      </div>
    </form>
  );
}
