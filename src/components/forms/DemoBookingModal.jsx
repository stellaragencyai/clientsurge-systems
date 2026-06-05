import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, Loader2, Mail, Phone, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  business_name: "",
  business_type: "",
  message: "",
  business_website_url: "",
  website_url: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  referrer: "",
};

export default function DemoBookingModal({ isOpen = true, onClose, prefillIndustry = "" }) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    business_type: prefillIndustry,
    message: prefillIndustry
      ? `I would like a free automation audit for my ${prefillIndustry} business.`
      : "I would like a free automation audit for my business.",
  }));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      referrer: document.referrer || "",
    }));
  }, [isOpen, prefillIndustry]);

  const canSubmit = useMemo(() => {
    return Boolean(form.full_name.trim() && EMAIL_REGEX.test(form.email.trim()) && form.message.trim());
  }, [form.email, form.full_name, form.message]);

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

    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) {
        nextErrors.phone = "Enter a valid phone number";
      }
    }

    if (!form.message.trim()) {
      nextErrors.message = "Required";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
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
      const result = await base44.functions.invoke("submitContactInquiry", {
        ...form,
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        message: form.message.trim(),
        business_type: form.business_type.trim() || "Free Automation Audit",
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.error || "Audit request failed");
      }

      setSuccess(true);
    } catch (error) {
      setErrors({
        submit: "We could not send the request automatically. Please call or email us directly.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  const inputClass =
    "w-full min-h-12 rounded-lg border border-white/15 bg-white px-4 py-3 text-[16px] text-slate-950 outline-none transition focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/25";
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
              Free Automation Audit
            </p>
            <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">
              Find the lead leaks costing you booked jobs.
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Send the request here and ClientSurge will review your current follow-up,
              booking, and missed-call path before the walkthrough.
            </p>

            <div className="mt-7 space-y-4 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00aeef]" />
                <span>Lead capture and missed-call response review</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#00aeef]" />
                <span>Fastest AI automation opportunities for your business type</span>
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
                <h3 className="text-2xl font-semibold text-slate-950">Audit request sent</h3>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                  We have your details. Expect a direct follow-up with practical next steps for your lead flow.
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
              <form action="/contact" method="post" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <h3 className="text-2xl font-semibold text-slate-950">Request your free audit</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    A real request form feeds the ClientSurge lead workflow directly.
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
                    {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="demo-email" className={labelClass}>Email</label>
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
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-phone" className={labelClass}>Phone</label>
                    <input
                      id="demo-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="demo-business-name" className={labelClass}>Business name</label>
                    <input
                      id="demo-business-name"
                      name="business_name"
                      value={form.business_name}
                      onChange={handleChange}
                      className={inputClass}
                      autoComplete="organization"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="demo-business-type" className={labelClass}>Industry</label>
                    <input
                      id="demo-business-type"
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Dental, roofing, med spa..."
                    />
                  </div>
                  <div>
                    <label htmlFor="demo-business-website" className={labelClass}>Website</label>
                    <input
                      id="demo-business-website"
                      name="business_website_url"
                      type="url"
                      value={form.business_website_url}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="https://"
                      autoComplete="url"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="demo-message" className={labelClass}>What should we review?</label>
                  <textarea
                    id="demo-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputClass} min-h-28 resize-y`}
                    required
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading || !canSubmit}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00aeef] px-6 text-[16px] font-bold text-white transition hover:bg-[#0094d4] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending request
                    </>
                  ) : (
                    <>
                      Send audit request
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
