import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Send,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import FloatingConfirmation from "@/components/ui/FloatingConfirmation";
import { setPageMetadata } from "@/lib/seo";
import { invokePublicBase44Function } from "@/lib/publicFunctionClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;
const CONTACT_CONSENT_VERSION = "contact_form_explicit_consent_v1";
const MAX_MESSAGE_LENGTH = 1500;

const contactMethods = [
  {
    Icon: Phone,
    label: "Phone",
    value: "(602) 584-3227",
    href: "tel:+16025843227",
  },
  {
    Icon: Mail,
    label: "Email",
    value: "support@clientsurgesystems.com",
    href: "mailto:support@clientsurgesystems.com",
  },
  {
    Icon: MapPin,
    label: "Location",
    value: "Phoenix, Arizona",
  },
  {
    Icon: Clock3,
    label: "Business Hours",
    value: "Monday–Friday · One-business-day replies",
  },
];

const socialLinks = [
  {
    label: "LinkedIn",
    icon: "linkedin",
    href: "https://linkedin.com/company/clientsurge",
  },
  {
    label: "X",
    icon: "x",
    href: "https://twitter.com/clientsurge",
  },
  {
    label: "GitHub",
    icon: "github",
    href: "https://github.com/stellaragencyai",
  },
];

const initialForm = {
  full_name: "",
  email: "",
  phone: "",
  business_type: "",
  message: "",
  website_url: "",
  business_website_url: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_content: "",
  utm_term: "",
  referrer: "",
  consent_given: false,
};

function SocialIcon({ name }) {
  if (name === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
        <path d="M5.36 3.5A2.36 2.36 0 1 1 .64 3.5a2.36 2.36 0 0 1 4.72 0ZM1.04 8.08h4.64V23H1.04V8.08ZM8.48 8.08h4.45v2.04h.06c.62-1.17 2.13-2.4 4.39-2.4 4.69 0 5.56 3.09 5.56 7.1V23H18.3v-7.25c0-1.73-.03-3.95-2.41-3.95-2.41 0-2.78 1.88-2.78 3.82V23H8.48V8.08Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
        <path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.25-8.29L2.96 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.72L8.42 4.05H6.58L17.8 19.84Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path fillRule="evenodd" d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.29-.5-1.43.11-2.98 0 0 .95-.3 3.09 1.15A10.74 10.74 0 0 1 12 6.1c.96 0 1.92.13 2.82.38 2.14-1.45 3.08-1.15 3.08-1.15.62 1.55.23 2.69.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.27-5.15 5.55.4.35.76 1.04.76 2.1v3.12c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z" clipRule="evenodd" />
    </svg>
  );
}

function getStoredUtm() {
  try {
    return JSON.parse(sessionStorage.getItem("cs_utm_session") || "{}");
  } catch {
    return {};
  }
}

function sourceMetadata() {
  const params = new URLSearchParams(window.location.search);
  const stored = getStoredUtm();
  const fromParamOrStorage = (key) => params.get(key) || stored[key] || "";

  return {
    utm_source: fromParamOrStorage("utm_source"),
    utm_medium: fromParamOrStorage("utm_medium"),
    utm_campaign: fromParamOrStorage("utm_campaign"),
    utm_content: fromParamOrStorage("utm_content"),
    utm_term: fromParamOrStorage("utm_term"),
    referrer: document.referrer || stored.referrer || "",
  };
}

function formatRequestSuffix(error) {
  return error?.request_id ? ` Request ID: ${error.request_id}.` : "";
}

function normalizeWebsite(value) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidWebsite(value) {
  if (!value.trim()) return true;
  try {
    const url = new URL(normalizeWebsite(value));
    return Boolean(url.hostname && url.hostname.includes("."));
  } catch {
    return false;
  }
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  optional = false,
  autoComplete,
  inputMode,
  placeholder,
  maxLength,
}) {
  const inputId = `contact-${name}`;
  const errorId = `${inputId}-error`;
  const showError = Boolean(error && touched);

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-700"
      >
        <span>{label}</span>
        {required && (
          <>
            <span aria-hidden="true" className="text-primary">*</span>
            <span className="sr-only">required</span>
          </>
        )}
        {optional && (
          <span className="text-[0.65rem] font-medium normal-case tracking-normal text-slate-400">
            optional
          </span>
        )}
      </label>

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        required={required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
      />

      {showError && (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ContactMethodCard({ Icon, label, value, href }) {
  const content = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary shadow-[0_10px_24px_rgba(0,174,239,0.12)] transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.68rem] font-bold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-6 text-slate-900 sm:text-[0.95rem]">
          {value}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="group flex min-h-[6.5rem] items-start gap-4 rounded-[1.4rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_22px_48px_rgba(0,107,176,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="group flex min-h-[6.5rem] items-start gap-4 rounded-[1.4rem] border border-white/80 bg-white/90 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur">
      {content}
    </div>
  );
}

export default function Contact() {
  const formRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showFloat, setShowFloat] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submittedLead, setSubmittedLead] = useState(null);

  useEffect(() => {
    setForm((previous) => ({ ...previous, ...sourceMetadata() }));
  }, []);

  useEffect(() => {
    return setPageMetadata({
      title: "Contact ClientSurge Systems | Questions and Support",
      description:
        "Contact ClientSurge Systems to ask questions or discuss AI voice agents, lead follow-up, booking automation, and local service business systems.",
      canonicalPath: "/contact",
      ogTitle: "Contact ClientSurge Systems",
      ogDescription: "Reach out to discuss your lead flow, booking process, or automation questions.",
    });
  }, []);

  const validate = () => {
    const nextErrors = {};

    if (!form.full_name.trim()) nextErrors.full_name = "Full name is required.";

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else {
      const digits = form.phone.replace(/\D/g, "");
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) {
        nextErrors.phone = "Enter a valid phone number.";
      }
    }

    if (!isValidWebsite(form.business_website_url)) {
      nextErrors.business_website_url = "Enter a valid website address.";
    }

    if (!form.message.trim()) nextErrors.message = "Please include a message.";

    if (!form.consent_given) {
      nextErrors.consent_given = "Consent is required so we can respond to your inquiry.";
    }

    return nextErrors;
  };

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  };

  const handleBlur = (name) => {
    setTouched((previous) => ({ ...previous, [name]: true }));
  };

  const focusFirstError = (nextErrors) => {
    const fieldOrder = [
      "full_name",
      "email",
      "phone",
      "business_website_url",
      "message",
      "consent_given",
    ];
    const firstInvalidName = fieldOrder.find((field) => nextErrors[field]);

    if (!firstInvalidName) return;

    window.requestAnimationFrame(() => {
      const field = formRef.current?.querySelector(`[name="${firstInvalidName}"]`);
      field?.focus();
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setTouched({
        full_name: true,
        email: true,
        phone: true,
        business_website_url: true,
        message: true,
        consent_given: true,
      });
      focusFirstError(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        full_name: form.full_name.trim(),
        business_name: "Website inquiry",
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        business_type: form.business_type.trim() || "General inquiry",
        message: form.message.trim(),
        business_website_url: normalizeWebsite(form.business_website_url),
        source: "contact_page",
        source_page: "/contact",
        consent_source: "contact_page_form",
        consent_text_version: CONTACT_CONSENT_VERSION,
      };

      const result = await invokePublicBase44Function("submitContactInquiry", payload);
      if (!result.data?.success) {
        throw new Error(result.data?.error || "Submission failed");
      }

      setSubmittedLead({
        lead_id: result.data.lead_id || null,
        website_lead_id: result.data.website_lead_id || null,
        request_id: result.data.request_id || result.request_id || null,
        action: result.data.action || "created",
      });
      setSuccess(true);
      setShowFloat(true);
    } catch (error) {
      setErrors({
        submit: `Something went wrong. Please try again or email support@clientsurgesystems.com directly.${formatRequestSuffix(error)}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />

      <main className="pt-[var(--cs-nav-height)]">
        {/* Hero header */}
        <section className="relative overflow-hidden bg-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, hsla(199, 100%, 47%, 0.08), transparent 45%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-5 pt-14 pb-10 text-center sm:px-8 sm:pt-16 sm:pb-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary shadow-sm">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              We are here to help
            </span>

            <div className="cs-section-header cs-section-header--center mt-7" style={{ marginBottom: 0 }}>
              <div className="cs-section-title-row" style={{ justifyContent: "center" }}>
                <span className="cs-section-bar" style={{ height: 48 }} aria-hidden="true" />
                <h1 className="cs-section-title" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>
                  Contact Us
                </h1>
              </div>
            </div>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Have a question about lead response, booking automation, or your system setup?
              Send us a message and we will get right back to you within one business day.
            </p>
          </div>
        </section>

        {/* Contact methods grid */}
        <section className="relative z-10 -mt-2 bg-transparent pb-10 sm:-mt-4 sm:pb-12">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {contactMethods.map((method) => (
                <ContactMethodCard key={method.label} {...method} />
              ))}
            </div>
          </div>
        </section>

        {/* Form + sidebar */}
        <section className="bg-[linear-gradient(180deg,rgba(248,250,252,0.78)_0%,rgba(241,245,249,0.92)_100%)] py-14 sm:py-18">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start lg:gap-10">
              {/* Form card */}
              <div className="cs-glow-card overflow-hidden bg-white p-6 sm:p-10">
                {success ? (
                  <div className="flex min-h-[28rem] flex-col items-center justify-center text-center" aria-live="polite">
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-green-50 text-green-600">
                      <CheckCircle2 aria-hidden="true" className="h-10 w-10" />
                    </span>
                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      Message sent
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">
                      Thank you
                    </h2>
                    <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                      Your inquiry is in the ClientSurge system. We will review it and respond
                      within one business day with a clear next step.
                    </p>

                    {submittedLead?.request_id && (
                      <p className="mt-4 text-xs font-medium text-slate-400">
                        Reference: {submittedLead.request_id}
                      </p>
                    )}

                    <a
                      href="/"
                      className="cs-btn-primary mt-8 inline-flex min-h-12 min-w-[200px] items-center justify-center gap-2 px-8"
                    >
                      Return Home
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </a>
                  </div>
                ) : (
                  <>
                    <header className="mb-8">
                      <div className="cs-section-header cs-section-header--left" style={{ marginBottom: 12 }}>
                        <div className="cs-section-title-row">
                          <span className="cs-section-bar" style={{ height: 36 }} aria-hidden="true" />
                          <h2 className="font-display text-2xl font-black tracking-[-0.03em] text-slate-900 sm:text-3xl">
                            Send us a message
                          </h2>
                        </div>
                      </div>
                      <p className="pl-[22px] text-sm leading-6 text-slate-600">
                        Fill out the form below and our team will respond within one business day.
                      </p>
                    </header>

                    <form ref={formRef} id="contact-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
                      {errors.submit && (
                        <div
                          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                          role="alert"
                          aria-live="assertive"
                        >
                          {errors.submit}
                        </div>
                      )}

                      <input
                        type="text"
                        name="website_url"
                        value={form.website_url}
                        onChange={(event) => updateField("website_url", event.target.value)}
                        className="hidden"
                        tabIndex={-1}
                        aria-hidden="true"
                        autoComplete="off"
                      />

                      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                        <Field
                          label="Full Name"
                          name="full_name"
                          value={form.full_name}
                          onChange={(value) => updateField("full_name", value)}
                          onBlur={() => handleBlur("full_name")}
                          error={errors.full_name}
                          touched={touched.full_name}
                          required
                          autoComplete="name"
                        />

                        <Field
                          label="Email Address"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={(value) => updateField("email", value)}
                          onBlur={() => handleBlur("email")}
                          error={errors.email}
                          touched={touched.email}
                          required
                          autoComplete="email"
                          inputMode="email"
                        />

                        <Field
                          label="Phone Number"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={(value) => updateField("phone", value)}
                          onBlur={() => handleBlur("phone")}
                          error={errors.phone}
                          touched={touched.phone}
                          required
                          autoComplete="tel"
                          inputMode="tel"
                        />

                        <Field
                          label="Website"
                          name="business_website_url"
                          type="url"
                          value={form.business_website_url}
                          onChange={(value) => updateField("business_website_url", value)}
                          onBlur={() => handleBlur("business_website_url")}
                          error={errors.business_website_url}
                          touched={touched.business_website_url}
                          optional
                          autoComplete="url"
                          inputMode="url"
                          placeholder="yourbusiness.com"
                        />

                        <div className="sm:col-span-2">
                          <Field
                            label="Industry"
                            name="business_type"
                            value={form.business_type}
                            onChange={(value) => updateField("business_type", value)}
                            onBlur={() => handleBlur("business_type")}
                            error={errors.business_type}
                            touched={touched.business_type}
                            optional
                            placeholder="e.g., HVAC, dental, roofing"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <label
                              htmlFor="contact-message"
                              className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-700"
                            >
                              <span>Message</span>
                              <span aria-hidden="true" className="text-primary">*</span>
                              <span className="sr-only">required</span>
                            </label>
                            <span className="text-xs font-medium text-slate-400" aria-live="polite">
                              {form.message.length}/{MAX_MESSAGE_LENGTH}
                            </span>
                          </div>

                          <textarea
                            id="contact-message"
                            name="message"
                            value={form.message}
                            onChange={(event) => updateField("message", event.target.value)}
                            onBlur={() => handleBlur("message")}
                            rows={4}
                            maxLength={MAX_MESSAGE_LENGTH}
                            required
                            placeholder="Tell us what you would like to improve in your lead response, follow-up, booking, or customer reactivation process."
                            aria-invalid={Boolean(errors.message && touched.message)}
                            aria-describedby={
                              errors.message && touched.message ? "contact-message-error" : undefined
                            }
                            className="min-h-[7rem] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-base leading-7 text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />

                          {errors.message && touched.message && (
                            <p
                              id="contact-message-error"
                              className="mt-1.5 text-xs font-semibold text-red-600"
                              role="alert"
                            >
                              {errors.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-[0.82rem] leading-5 text-slate-600">
                          <input
                            type="checkbox"
                            name="consent_given"
                            checked={form.consent_given}
                            onChange={(event) => updateField("consent_given", event.target.checked)}
                            onBlur={() => handleBlur("consent_given")}
                            aria-invalid={Boolean(errors.consent_given && touched.consent_given)}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span>
                            I agree that ClientSurge Systems may contact me about this inquiry by
                            email, phone, or SMS. Message/data rates may apply. Reply STOP to opt
                            out. See our{" "}
                            <a
                              href="/privacy"
                              className="font-semibold text-primary underline underline-offset-2 hover:text-slate-900"
                            >
                              Privacy Policy
                            </a>
                            .
                          </span>
                        </label>

                        {errors.consent_given && touched.consent_given && (
                          <p className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
                            {errors.consent_given}
                          </p>
                        )}
                      </div>

                      <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="submit"
                          disabled={loading}
                          className="cs-btn-primary cs-cta-glow inline-flex min-h-[3.25rem] min-w-[220px] items-center justify-center gap-2 px-8 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            "Sending..."
                          ) : (
                            <>
                              <Send aria-hidden="true" className="h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </button>

                        <p className="text-sm font-medium text-slate-500">
                          We typically reply within one business day.
                        </p>
                      </div>
                    </form>
                  </>
                )}
              </div>

              {/* Sidebar */}
              <aside className="cs-glow-card overflow-hidden bg-white lg:sticky lg:top-[calc(var(--cs-nav-height)+1.5rem)]">
                <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(0,174,239,0.12),transparent_60%)] p-6 sm:p-7">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
                    Talk Through Your Lead Flow
                  </p>
                  <h3 className="mt-2 font-display text-[1.65rem] font-black tracking-[-0.03em] text-slate-900">
                    Prefer to talk?
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Book a call and we will walk through your current lead flow, response gaps,
                    and where AI can help first.
                  </p>
                  <a
                    href="/book"
                    className="cs-btn-primary cs-cta-glow mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm"
                  >
                    Book a call
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </a>

                  <a
                    href="/book#system-match-form"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary/10"
                  >
                    <Sparkles aria-hidden="true" className="h-4 w-4" />
                    AI Readiness Check
                  </a>
                </div>

                <div className="border-b border-slate-200/80 px-6 py-5 sm:px-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Follow ClientSurge
                    </h3>
                    <span className="text-xs font-medium text-slate-400">Brand + proof links</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    {socialLinks.map(({ label, icon, href }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`ClientSurge Systems on ${label}`}
                        title={label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <SocialIcon name={icon} />
                      </a>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#001B44] via-[#05275c] to-[#07101f] px-6 py-6 text-white sm:px-7">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8DDCFF]">
                    Why teams choose ClientSurge
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-white/85">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#35BDF1]" />
                      <span>Instant lead response in under 60 seconds</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#35BDF1]" />
                      <span>AI booking agent that works after hours</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#35BDF1]" />
                      <span>Proof-based status tracking on every deployment</span>
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileCallBar />
      <FloatingConfirmation
        show={showFloat}
        onDismiss={() => setShowFloat(false)}
        title="Message Received"
        message="Thanks for reaching out. Your inquiry has been logged."
      />
    </div>
  );
}