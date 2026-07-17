import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sparkles,
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
const LOGO_URL =
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png";

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
    value: "Phoenix, Arizona · Serving businesses nationwide",
  },
  {
    Icon: Clock3,
    label: "Business Hours",
    value: "Monday–Friday · Replies within one business day",
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
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
        <path d="M5.36 3.5A2.36 2.36 0 1 1 .64 3.5a2.36 2.36 0 0 1 4.72 0ZM1.04 8.08h4.64V23H1.04V8.08ZM8.48 8.08h4.45v2.04h.06c.62-1.17 2.13-2.4 4.39-2.4 4.69 0 5.56 3.09 5.56 7.1V23H18.3v-7.25c0-1.73-.03-3.95-2.41-3.95-2.41 0-2.78 1.88-2.78 3.82V23H8.48V8.08Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
        <path d="M18.9 2H22l-6.77 7.73L23.2 22h-6.24l-4.89-6.39L6.48 22H3.36l7.25-8.29L2.96 2h6.4l4.42 5.84L18.9 2Zm-1.1 17.84h1.72L8.42 4.05H6.58L17.8 19.84Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
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

function UnderlineField({
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
        className="mb-2 flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-slate-600"
      >
        <span>{label}</span>
        {required && (
          <>
            <span aria-hidden="true" className="text-[#0079C1]">
              *
            </span>
            <span className="sr-only">required</span>
          </>
        )}
        {optional && (
          <span className="text-[0.69rem] font-medium normal-case tracking-normal text-slate-500">
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
        className="contact-control h-12 w-full text-base text-[#001B44] placeholder:text-slate-400"
      />

      {showError && (
        <p id={errorId} className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ContactMethod({ Icon, label, value, href }) {
  const content = (
    <>
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#35BDF1]" />
      <span className="min-w-0">
        <span className="block text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-white/65">
          {label}
        </span>
        <span className="mt-1 block text-[0.98rem] font-medium leading-relaxed text-white/95">
          {value}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="flex min-h-11 items-start gap-4 py-1.5 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
      >
        {content}
      </a>
    );
  }

  return <div className="flex min-h-11 items-start gap-4 py-1.5">{content}</div>;
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
    <div className="contact-page min-h-screen overflow-x-hidden bg-white">
      <Navbar />

      <main className="pt-[var(--cs-nav-height)]">
        <section
          className="contact-shell grid lg:grid-cols-[0.46fr_0.54fr]"
          style={{ minHeight: "calc(100vh - var(--cs-nav-height))" }}
        >
          <aside className="relative overflow-hidden bg-[#061025] text-white">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 12% 12%, rgba(53,189,241,0.16), transparent 32%), radial-gradient(circle at 88% 84%, rgba(0,121,193,0.18), transparent 34%), linear-gradient(145deg, #061025 0%, #001B44 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#35BDF1]/40 to-transparent lg:block"
            />

            <div className="contact-panel-inner contact-left-inner relative mx-auto flex h-full w-full max-w-[680px] flex-col px-8 py-12 sm:px-12 lg:px-14 xl:px-16">
              <a
                href="/"
                aria-label="ClientSurge Systems home"
                className="inline-flex w-fit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
              >
                <img
                  src={LOGO_URL}
                  alt="ClientSurge Systems"
                  width="480"
                  height="224"
                  decoding="async"
                  className="contact-logo h-auto w-[360px] max-w-full object-contain object-left"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </a>

              <div className="contact-left-divider my-5 h-px w-full bg-gradient-to-r from-[#35BDF1]/80 via-[#35BDF1]/35 to-transparent" />

              <div className="contact-left-list grid gap-2.5">
                {contactMethods.map((method) => (
                  <ContactMethod key={method.label} {...method} />
                ))}
              </div>

              <div className="contact-left-divider my-5 h-px w-full bg-gradient-to-r from-[#35BDF1]/80 via-[#35BDF1]/35 to-transparent" />

              <div className="flex flex-col items-start gap-3.5 sm:flex-row sm:items-center">
                <a
                  href="/book#system-match-form"
                  className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#35BDF1] px-5 text-center text-[0.72rem] font-bold uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#35BDF1] hover:text-[#061025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  AI Readiness Check
                </a>

                <a
                  href="/book"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/85 underline decoration-[#35BDF1]/60 underline-offset-4 transition-colors hover:text-[#35BDF1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
                >
                  Prefer to talk? Book a call
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>

              <nav
                className="contact-socials mt-5 flex items-center gap-2.5"
                aria-label="ClientSurge Systems social media"
              >
                {socialLinks.map(({ label, icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`ClientSurge Systems on ${label}`}
                    title={label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-[#35BDF1] transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
                  >
                    <SocialIcon name={icon} />
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <section className="bg-white text-[#001B44]">
            <div className="contact-panel-inner contact-form-inner mx-auto flex h-full w-full max-w-[900px] flex-col px-8 py-10 sm:px-12 lg:px-14 xl:px-16">
              {success ? (
                <div className="max-w-xl" aria-live="polite">
                  <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-[#0079C1]" />
                  <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Message sent
                  </p>
                  <h1 className="mt-3 font-titles text-4xl font-black tracking-[-0.045em] text-[#001B44] sm:text-5xl">
                    THANK YOU
                  </h1>
                  <p className="mt-6 max-w-lg text-base leading-7 text-slate-600">
                    Your inquiry is in the ClientSurge system. We will review it and respond within one
                    business day with a clear next step.
                  </p>

                  {submittedLead?.request_id && (
                    <p className="mt-5 text-xs font-medium text-slate-500">
                      Reference: {submittedLead.request_id}
                    </p>
                  )}

                  <a
                    href="/"
                    className="mt-10 inline-flex min-h-14 min-w-[220px] items-center justify-center gap-2 border-2 border-[#001B44] bg-[#001B44] px-8 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:border-[#00AEEF] hover:bg-[#00AEEF] hover:text-[#001B44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                  >
                    Return Home
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <>
                  <header className="contact-title-block">
                    <p className="text-sm font-semibold uppercase tracking-[0.13em] text-slate-600">
                      Get in touch
                    </p>

                    <div className="mt-2.5 flex items-center gap-5 sm:gap-7">
                      <span
                        aria-hidden="true"
                        className="h-16 w-1 shrink-0 bg-[#00AEEF] sm:h-[4.25rem]"
                      />
                      <h1 className="contact-heading font-titles font-black leading-[0.9] tracking-[-0.055em] text-[#001B44]">
                        CONTACT US
                      </h1>
                    </div>

                    <div className="contact-intro mt-5">
                      <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[#001B44] sm:text-2xl">
                        We would love to hear from you!
                      </h2>
                      <p className="mt-1.5 text-base leading-7 text-slate-600">
                        Send us a message and we will get right back in touch.
                      </p>
                    </div>
                  </header>

                  <form
                    ref={formRef}
                    id="contact-form"
                    onSubmit={handleSubmit}
                    noValidate
                    aria-busy={loading}
                    className="contact-form mt-6"
                  >
                    {errors.submit && (
                      <div
                        className="mb-5 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
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

                    <div className="contact-fields grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
                      <UnderlineField
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

                      <UnderlineField
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

                      <UnderlineField
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

                      <UnderlineField
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
                        <UnderlineField
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
                            className="flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-slate-600"
                          >
                            <span>Message</span>
                            <span aria-hidden="true" className="text-[#0079C1]">
                              *
                            </span>
                            <span className="sr-only">required</span>
                          </label>
                          <span className="text-xs font-medium text-slate-500" aria-live="polite">
                            {form.message.length}/{MAX_MESSAGE_LENGTH}
                          </span>
                        </div>

                        <textarea
                          id="contact-message"
                          name="message"
                          value={form.message}
                          onChange={(event) => updateField("message", event.target.value)}
                          onBlur={() => handleBlur("message")}
                          rows={3}
                          maxLength={MAX_MESSAGE_LENGTH}
                          required
                          placeholder="Tell us what you would like to improve in your lead response, follow-up, booking, or customer reactivation process."
                          aria-invalid={Boolean(errors.message && touched.message)}
                          aria-describedby={
                            errors.message && touched.message ? "contact-message-error" : undefined
                          }
                          className="contact-control contact-textarea min-h-[5.75rem] w-full resize-y text-base leading-7 text-[#001B44] placeholder:text-slate-400"
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

                    <div className="contact-consent mt-4">
                      <label className="flex cursor-pointer items-start gap-3 text-[0.8rem] leading-5 text-slate-600">
                        <input
                          type="checkbox"
                          name="consent_given"
                          checked={form.consent_given}
                          onChange={(event) => updateField("consent_given", event.target.checked)}
                          onBlur={() => handleBlur("consent_given")}
                          aria-invalid={Boolean(errors.consent_given && touched.consent_given)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-slate-400 text-[#0079C1] focus:ring-[#00AEEF]"
                        />
                        <span>
                          I agree that ClientSurge Systems may contact me about this inquiry by email,
                          phone, or SMS. Message/data rates may apply. Reply STOP to opt out. See our{" "}
                          <a
                            href="/privacy"
                            className="font-semibold text-[#0079C1] underline underline-offset-2 hover:text-[#001B44]"
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

                    <div className="contact-submit-row mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex min-h-[3.6rem] min-w-[230px] items-center justify-center gap-2 border-2 border-[#001B44] bg-[#001B44] px-8 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:border-[#00AEEF] hover:bg-[#00AEEF] hover:text-[#001B44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Sending..." : "Send Message"}
                        {!loading && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                      </button>

                      <p className="text-sm font-medium text-slate-500">
                        We typically reply within one business day.
                      </p>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>
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

      <style>{`
        .contact-page #contact-form .contact-control {
          display: block;
          border: 0 !important;
          border-bottom: 1px solid #94a3b8 !important;
          border-radius: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          outline: none;
          transition: border-color 180ms ease, box-shadow 180ms ease;
        }

        .contact-page #contact-form .contact-control:hover {
          border-bottom-color: #64748b !important;
        }

        .contact-page #contact-form .contact-control:focus {
          border-bottom-color: #00AEEF !important;
          box-shadow: 0 2px 0 -1px #00AEEF !important;
        }

        .contact-page #contact-form .contact-control[aria-invalid="true"] {
          border-bottom-color: #dc2626 !important;
          box-shadow: 0 2px 0 -1px #dc2626 !important;
        }

        .contact-page #contact-form .contact-textarea {
          padding-top: 0.35rem !important;
          padding-bottom: 0.55rem !important;
        }

        .contact-page #contact-form input:-webkit-autofill,
        .contact-page #contact-form input:-webkit-autofill:hover,
        .contact-page #contact-form input:-webkit-autofill:focus {
          -webkit-text-fill-color: #001B44 !important;
          box-shadow: 0 0 0 1000px #ffffff inset !important;
          transition: background-color 9999s ease-out 0s;
        }

        .contact-page .contact-panel-inner {
          justify-content: flex-start;
          padding-top: clamp(2.75rem, 6vh, 5rem);
          padding-bottom: 2.5rem;
        }

        .contact-page .contact-heading {
          white-space: nowrap !important;
          font-size: clamp(3.4rem, 4.2vw, 5.2rem) !important;
          max-width: none;
        }

        @media (min-width: 1024px) and (max-height: 850px) {
          .contact-page .contact-panel-inner {
            padding-top: 1.75rem !important;
            padding-bottom: 1.5rem !important;
          }

          .contact-page .contact-logo {
            width: 320px !important;
          }

          .contact-page .contact-left-divider {
            margin-top: 1rem !important;
            margin-bottom: 1rem !important;
          }

          .contact-page .contact-left-list {
            gap: 0.45rem !important;
          }

          .contact-page .contact-socials {
            margin-top: 1rem !important;
          }

          .contact-page .contact-intro {
            margin-top: 1rem !important;
          }

          .contact-page .contact-form {
            margin-top: 1rem !important;
          }

          .contact-page .contact-fields {
            row-gap: 0.85rem !important;
          }

          .contact-page #contact-form .contact-control {
            height: 2.65rem !important;
          }

          .contact-page #contact-form .contact-textarea {
            min-height: 4.7rem !important;
          }

          .contact-page .contact-consent,
          .contact-page .contact-submit-row {
            margin-top: 0.85rem !important;
          }
        }

        @media (max-width: 1023px) {
          .contact-page .contact-panel-inner {
            padding-top: 3.5rem;
            padding-bottom: 3.5rem;
          }

          .contact-page .contact-left-inner {
            min-height: auto;
          }
        }

        @media (max-width: 639px) {
          .contact-page .contact-heading {
            white-space: normal !important;
            font-size: clamp(3rem, 16vw, 4rem) !important;
          }
        }
      `}</style>
    </div>
  );
}
