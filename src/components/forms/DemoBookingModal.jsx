import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, Loader2, Mail, Phone, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;
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

const AUDIT_COPY = {
  roofing: {
    eyebrow: "Free Roofing Automation Audit",
    heading: "Find the missed calls and quote requests costing you roofing jobs.",
    intro: "Send the request here and ClientSurge will review your storm lead, missed-call, quote follow-up, and estimate booking path before the walkthrough.",
    checkOne: "Roofing lead capture and missed-call recovery review",
    checkTwo: "Instant storm, quote, and estimate request response gaps",
    defaultMessage: "I would like a free roofing automation audit for my roofing business.",
    serviceInterest: "roofing_automation_audit",
    tag: "free_roofing_automation_audit",
    crmTag: "roofing_lead",
    consentSource: "roofing_audit_modal",
    success: "We have your roofing details and selected audit time. Expect confirmation with practical next steps for missed calls, quote requests, and booked estimates.",
    formIntro: "Choose a time and send roofing-specific context into the ClientSurge booking workflow.",
    submitLabel: "Book roofing audit",
  },
  dental: {
    eyebrow: "Free Dental Automation Audit",
    heading: "Find the missed new-patient calls and appointment requests your front desk cannot chase.",
    intro: "Send the request here and ClientSurge will review your dental lead capture, missed-call text-back, appointment request, and patient follow-up path before the walkthrough.",
    checkOne: "Dental new-patient lead capture and missed-call review",
    checkTwo: "Front desk overload, booking handoff, and follow-up gaps",
    defaultMessage: "I would like a free dental automation audit for my dental practice.",
    serviceInterest: "dental_automation_audit",
    tag: "free_dental_automation_audit",
    crmTag: "dental_lead",
    consentSource: "dental_audit_modal",
    success: "We have your dental practice details and selected audit time. Expect confirmation with practical next steps for missed calls, new-patient appointment requests, and follow-up.",
    formIntro: "Choose a time and send dental-specific context into the ClientSurge booking workflow.",
    submitLabel: "Book dental audit",
  },
  hvac: {
    eyebrow: "Free HVAC Automation Audit",
    heading: "Find the missed calls, emergency calls, and after-hours AC repair leads costing you HVAC jobs.",
    intro: "Send the request here and ClientSurge will review your missed-call text-back, instant lead response, service appointment booking, seasonal surge, and after-hours lead capture path before the walkthrough.",
    checkOne: "HVAC missed-call text-back and emergency lead response review",
    checkTwo: "Service appointment booking, dispatch handoff, and seasonal surge gaps",
    defaultMessage: "I would like a free HVAC automation audit for my heating and cooling business.",
    serviceInterest: "hvac_automation_audit",
    tag: "free_hvac_automation_audit",
    crmTag: "hvac_lead",
    consentSource: "hvac_audit_modal",
    success: "We have your HVAC details and selected audit time. Expect confirmation with practical next steps for missed calls, emergency service leads, and booked appointments.",
    formIntro: "Choose a time and send HVAC-specific context into the ClientSurge booking workflow.",
    submitLabel: "Book HVAC audit",
  },
  med_spa: {
    eyebrow: "Free Med Spa Automation Audit",
    heading: "Find the missed consult requests and booking gaps costing you med spa revenue.",
    intro: "Send the request here and ClientSurge will review your consult capture, instant response, follow-up, and booking handoff path before the walkthrough.",
    checkOne: "Med spa consultation capture and missed-call review",
    checkTwo: "Treatment inquiry, package lead, and follow-up gaps",
    defaultMessage: "I would like a free med spa automation audit for my med spa.",
    serviceInterest: "med_spa_automation_audit",
    tag: "free_med_spa_automation_audit",
    crmTag: "med_spa_lead",
    consentSource: "med_spa_audit_modal",
    success: "We have your med spa details and selected audit time. Expect confirmation with practical next steps for consult requests, lead follow-up, and booking handoff.",
    formIntro: "Choose a time and send med-spa-specific context into the ClientSurge booking workflow.",
    submitLabel: "Book med spa audit",
  },
  plumbing: {
    eyebrow: "Free Plumbing Automation Audit",
    heading: "Find the missed calls and urgent service requests costing you plumbing jobs.",
    intro: "Send the request here and ClientSurge will review your missed-call text-back, emergency lead response, dispatch handoff, and service booking path before the walkthrough.",
    checkOne: "Plumbing missed-call and emergency response review",
    checkTwo: "Service appointment booking, dispatch, and follow-up gaps",
    defaultMessage: "I would like a free plumbing automation audit for my plumbing business.",
    serviceInterest: "plumbing_automation_audit",
    tag: "free_plumbing_automation_audit",
    crmTag: "plumbing_lead",
    consentSource: "plumbing_audit_modal",
    success: "We have your plumbing details and selected audit time. Expect confirmation with practical next steps for missed calls, urgent service requests, and booked jobs.",
    formIntro: "Choose a time and send plumbing-specific context into the ClientSurge booking workflow.",
    submitLabel: "Book plumbing audit",
  },
  default: {
    eyebrow: "Free Automation Audit",
    heading: "Find the lead leaks costing you booked jobs.",
    intro: "Send the request here and ClientSurge will review your current follow-up, booking, and missed-call path before the walkthrough.",
    checkOne: "Lead capture and missed-call response review",
    checkTwo: "Fastest automation opportunities for your business type",
    defaultMessage: "I would like a free automation audit for my business.",
    serviceInterest: "automation_audit",
    tag: "free_automation_audit",
    crmTag: "automation_audit_lead",
    consentSource: "audit_modal",
    success: "We have your details and selected audit time. Expect confirmation with practical next steps for your lead flow.",
    formIntro: "Choose a time and send context into the ClientSurge booking workflow.",
    submitLabel: "Book Free Automation Audit",
  },
};

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  business_name: "",
  business_type: "",
  message: "",
  business_website_url: "",
  website_url: "",
  consent_given: false,
  industry_slug: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  referrer: "",
  scheduled_date: "",
  scheduled_time: "",
};

function normalizeIndustrySlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export default function DemoBookingModal({ isOpen = true, onClose, prefillIndustry = "", industrySlug = "" }) {
  const resolvedIndustrySlug = normalizeIndustrySlug(industrySlug || prefillIndustry);
  const auditCopy = AUDIT_COPY[resolvedIndustrySlug] || AUDIT_COPY.default;
  const [form, setForm] = useState(() => ({
    ...initialForm,
    business_type: prefillIndustry,
    industry_slug: resolvedIndustrySlug,
    message: prefillIndustry
      ? auditCopy.defaultMessage
      : AUDIT_COPY.default.defaultMessage,
  }));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    return acquireBodyScrollLock("demo-video-modal");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setForm((current) => ({
      ...current,
      business_type: current.business_type || prefillIndustry,
      industry_slug: current.industry_slug || resolvedIndustrySlug,
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      referrer: document.referrer || "",
    }));
  }, [isOpen, prefillIndustry, resolvedIndustrySlug]);

  const canSubmit = useMemo(() => {
    return Boolean(
      form.full_name.trim() &&
        EMAIL_REGEX.test(form.email.trim()) &&
        form.phone.trim() &&
        form.business_name.trim() &&
        form.business_type.trim() &&
        form.business_website_url.trim() &&
        form.message.trim() &&
        form.scheduled_date &&
        form.scheduled_time &&
        form.consent_given
    );
  }, [
    form.business_name,
    form.business_type,
    form.business_website_url,
    form.consent_given,
    form.email,
    form.full_name,
    form.message,
    form.phone,
    form.scheduled_date,
    form.scheduled_time,
  ]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const validate = () => {
    const nextErrors = {};

    if (!form.full_name.trim()) {
      nextErrors.full_name = "Required";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Required";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Required";
    } else {
      const digits = form.phone.replace(/\D/g, "");
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) {
        nextErrors.phone = "Enter a valid phone number";
      }
    }

    if (!form.business_name.trim()) {
      nextErrors.business_name = "Required";
    }

    if (!form.business_type.trim()) {
      nextErrors.business_type = "Required";
    }

    if (!form.business_website_url.trim()) {
      nextErrors.business_website_url = "Required";
    }

    if (!form.message.trim()) {
      nextErrors.message = "Required";
    }

    if (!form.scheduled_date) {
      nextErrors.scheduled_date = "Choose a date";
    }

    if (!form.scheduled_time) {
      nextErrors.scheduled_time = "Choose a time";
    }

    if (form.consent_given !== true) {
      nextErrors.consent_given = "Consent is required";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  };

  const handleDateChange = async (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, scheduled_date: value, scheduled_time: "" }));
    setErrors((current) => ({ ...current, scheduled_date: undefined, scheduled_time: undefined, submit: undefined }));
    setBookedSlots([]);

    if (!value) return;

    setLoadingSlots(true);
    try {
      const result = await base44.functions.invoke("getBookedDemoSlots", { date: value });
      setBookedSlots(result?.data?.booked_times || []);
    } catch {
      setBookedSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const effectiveIndustrySlug = form.industry_slug || normalizeIndustrySlug(form.business_type);
      const industryTags = [
        effectiveIndustrySlug,
        effectiveIndustrySlug ? `${effectiveIndustrySlug}_landing_page` : "",
        auditCopy.crmTag,
        auditCopy.tag,
      ].filter(Boolean);
      const result = await base44.functions.invoke("scheduleDemoBooking", {
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        business_name: form.business_name.trim(),
        business_type: form.business_type.trim() || prefillIndustry || "Free Automation Audit",
        industry: form.business_type.trim() || prefillIndustry || "Free Automation Audit",
        industry_slug: effectiveIndustrySlug,
        service_interest: auditCopy.serviceInterest,
        crm_tag: auditCopy.crmTag,
        biggest_issue: form.message.trim(),
        source: "landing_page",
        source_page: currentPath || "/book",
        consent_given: form.consent_given === true,
        consent_source: auditCopy.consentSource,
        consent_text_version: "audit_modal_explicit_checkbox_v1",
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        business_website_url: form.business_website_url.trim(),
        website: form.business_website_url.trim(),
        website_url: form.website_url,
        utm_source: form.utm_source,
        utm_medium: form.utm_medium,
        utm_campaign: form.utm_campaign,
        utm_content: form.utm_content,
        referrer: form.referrer,
        industry_tags: industryTags,
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || "Audit booking failed");
      }

      setSuccess(true);
    } catch (error) {
      setErrors({
        submit: "We could not book the audit automatically. Please call or email us directly.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  const inputClass =
    "w-full min-h-12 rounded-lg border border-white/15 bg-white px-4 py-3 pr-9 text-[16px] text-slate-950 outline-none transition focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/25";

  const allInputsFilled = Boolean(
    form.full_name.trim() &&
    EMAIL_REGEX.test(form.email.trim()) &&
    form.phone.trim() && form.phone.replace(/\D/g, '').length >= 10 &&
    form.business_name.trim() &&
    form.business_type.trim() &&
    form.business_website_url.trim() &&
    form.message.trim() &&
    form.scheduled_date &&
    form.scheduled_time
  );
  const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto overscroll-contain p-4"
      style={{ minHeight: "100svh", WebkitOverflowScrolling: "touch" }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Book a free ClientSurge automation audit"
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl z-50">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/80 text-white transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white/80"
          aria-label="Close audit request form"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid max-h-[calc(100svh-32px)] overflow-y-auto rounded-2xl bg-white shadow-2xl md:grid-cols-[0.92fr_1.08fr]">
          <div className="bg-slate-950 p-6 text-white md:p-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
              {auditCopy.eyebrow}
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
              {auditCopy.heading}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {auditCopy.intro}
            </p>

            <div className="mt-7 space-y-4 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00aeef]" />
                <span>{auditCopy.checkOne}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00aeef]" />
                <span>{auditCopy.checkTwo}</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00aeef]" />
                <span>Plain-English next steps with no placeholder video detours</span>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Direct line
              </p>
              <a className="mt-2 flex items-center gap-2 text-sm font-semibold text-white" href="tel:+16025843227">
                <Phone className="h-4 w-4 text-[#00aeef]" />
                (602) 584-3227
              </a>
              <a className="mt-2 flex items-center gap-2 text-sm font-semibold text-white" href="mailto:support@clientsurgesystems.com">
                <Mail className="h-4 w-4 text-[#00aeef]" />
                support@clientsurgesystems.com
              </a>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {success ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-950">Audit booked</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                  {auditCopy.success}
                </p>
                <p className="mt-3 max-w-sm text-xs leading-5 text-slate-500">
                  Need to reschedule? Reply to your confirmation email or contact support@clientsurgesystems.com.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="tel:+16025843227"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white"
                  >
                    Call now
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-900"
                  >
                    Back to site
                  </button>
                </div>
              </div>
            ) : (
              <form action="/book" method="post" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">Book your free audit</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {auditCopy.formIntro}
                  </p>
                </div>

                {errors.submit && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
                    {errors.submit}
                  </div>
                )}

                <input
                  type="text"
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                  style={{ display: "none", position: "absolute", left: "-9999px" }}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-full-name" className={labelClass}>Full name</label>
                    <div className="relative">
                      <input
                        id="demo-full-name"
                        name="full_name"
                        value={form.full_name}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="name"
                        required
                        aria-invalid={Boolean(errors.full_name)}
                      />
                      {allInputsFilled && !errors.full_name && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="demo-email" className={labelClass}>Email</label>
                    <div className="relative">
                      <input
                        id="demo-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="email"
                        required
                        aria-invalid={Boolean(errors.email)}
                      />
                      {allInputsFilled && !errors.email && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-phone" className={labelClass}>Phone</label>
                    <div className="relative">
                      <input
                        id="demo-phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="tel"
                        inputMode="tel"
                        required
                        aria-invalid={Boolean(errors.phone)}
                      />
                      {allInputsFilled && !errors.phone && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="demo-business-name" className={labelClass}>Business name</label>
                    <div className="relative">
                      <input
                        id="demo-business-name"
                        name="business_name"
                        value={form.business_name}
                        onChange={handleChange}
                        className={inputClass}
                        autoComplete="organization"
                        required
                        aria-invalid={Boolean(errors.business_name)}
                      />
                      {allInputsFilled && !errors.business_name && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.business_name && <p className="mt-1 text-xs text-red-600">{errors.business_name}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-business-type" className={labelClass}>Industry</label>
                    <div className="relative">
                      <input
                        id="demo-business-type"
                        name="business_type"
                        value={form.business_type}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Dental, roofing, med spa..."
                        required
                        aria-invalid={Boolean(errors.business_type)}
                      />
                      <input type="hidden" name="industry_slug" value={form.industry_slug} />
                      {allInputsFilled && !errors.business_type && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.business_type && <p className="mt-1 text-xs text-red-600">{errors.business_type}</p>}
                  </div>
                  <div>
                    <label htmlFor="demo-business-website" className={labelClass}>Website</label>
                    <div className="relative">
                      <input
                        id="demo-business-website"
                        name="business_website_url"
                        type="url"
                        value={form.business_website_url}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="https://"
                        autoComplete="url"
                        required
                        aria-invalid={Boolean(errors.business_website_url)}
                      />
                      {allInputsFilled && !errors.business_website_url && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.business_website_url && <p className="mt-1 text-xs text-red-600">{errors.business_website_url}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="demo-message" className={labelClass}>What should we review?</label>
                  <div className="relative">
                    <textarea
                      id="demo-message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      className={`${inputClass} min-h-28 resize-y`}
                      required
                      aria-invalid={Boolean(errors.message)}
                    />
                    {allInputsFilled && !errors.message && (
                      <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-green-500 pointer-events-none" />
                    )}
                  </div>
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-scheduled-date" className={labelClass}>Audit date</label>
                    <div className="relative">
                      <input
                        id="demo-scheduled-date"
                        name="scheduled_date"
                        type="date"
                        value={form.scheduled_date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={handleDateChange}
                        className={inputClass}
                        required
                        aria-invalid={Boolean(errors.scheduled_date)}
                      />
                      {allInputsFilled && !errors.scheduled_date && (
                        <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.scheduled_date && <p className="mt-1 text-xs text-red-600">{errors.scheduled_date}</p>}
                  </div>
                  <div>
                    <label htmlFor="demo-scheduled-time" className={labelClass}>
                      Audit time {loadingSlots && <span className="normal-case tracking-normal text-slate-400">Loading...</span>}
                    </label>
                    <div className="relative">
                      <select
                        id="demo-scheduled-time"
                        name="scheduled_time"
                        value={form.scheduled_time}
                        onChange={handleChange}
                        disabled={!form.scheduled_date || loadingSlots}
                        className={inputClass}
                        required
                        aria-invalid={Boolean(errors.scheduled_time)}
                      >
                        <option value="">{form.scheduled_date ? "Choose a time" : "Choose a date first"}</option>
                        {TIME_SLOTS.map(({ value, label }) => {
                          const booked = bookedSlots.includes(value);
                          return (
                            <option key={value} value={value} disabled={booked}>
                              {label}{booked ? " - Booked" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {allInputsFilled && !errors.scheduled_time && (
                        <CheckCircle2 className="absolute right-8 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {errors.scheduled_time && <p className="mt-1 text-xs text-red-600">{errors.scheduled_time}</p>}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  <input
                    type="checkbox"
                    name="consent_given"
                    checked={form.consent_given}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, consent_given: event.target.checked }));
                      setErrors((current) => ({ ...current, consent_given: undefined, submit: undefined }));
                    }}
                    disabled={loading}
                    required
                    className="mt-0.5 h-4 w-4 rounded accent-[#00aeef]"
                  />
                  <span>
                    I agree to receive automated SMS and email messages from ClientSurge Systems about my audit booking.
                    Msg and data rates may apply. Reply <strong>STOP</strong> to opt out. See our{" "}
                    <a href="/privacy-policy" className="underline hover:text-slate-950">Privacy Policy</a>
                    {" "}and{" "}
                    <a href="/terms" className="underline hover:text-slate-950">Terms</a>.
                  </span>
                </label>
                {errors.consent_given && <p className="mt-1 text-xs text-red-600">{errors.consent_given}</p>}

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00aeef] px-6 text-[16px] font-bold text-white transition hover:bg-[#0094d4] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Booking audit
                    </>
                  ) : (
                    <>
                      {auditCopy.submitLabel}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}