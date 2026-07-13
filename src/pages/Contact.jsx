import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Twitter,
} from "lucide-react";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import FloatingConfirmation from "@/components/ui/FloatingConfirmation";
import { setPageMetadata } from "@/lib/seo";
import { invokePublicBase44Function } from "@/lib/publicFunctionClient";
import { SITE_CONFIG } from "@/lib/siteConfig";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;
const CONTACT_CONSENT_VERSION = "contact_form_explicit_consent_v1";
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
    Icon: Linkedin,
    label: "ClientSurge Systems on LinkedIn",
    href: SITE_CONFIG.social.linkedin,
  },
  {
    Icon: Twitter,
    label: "ClientSurge Systems on X",
    href: SITE_CONFIG.social.twitter,
  },
  {
    Icon: Github,
    label: "ClientSurge Systems on GitHub",
    href: SITE_CONFIG.social.github,
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
}) {
  const inputId = `contact-${name}`;
  const errorId = `${inputId}-error`;
  const showError = Boolean(error && touched);

  return (
    <div className="min-w-0">
      <label
        htmlFor={inputId}
        className="mb-3 flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
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
          <span className="text-[0.64rem] font-medium normal-case tracking-normal text-slate-400">
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
        aria-invalid={showError}
        aria-describedby={showError ? errorId : undefined}
        className={`h-11 w-full border-0 border-b bg-transparent px-0 text-base text-[#001B44] outline-none transition-colors duration-200 placeholder:text-slate-300 focus:border-[#00AEEF] focus:ring-0 ${
          showError ? "border-red-500" : "border-slate-400"
        }`}
      />
      {showError && (
        <p id={errorId} className="mt-2 text-xs font-semibold text-red-600" role="alert">
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
        <span className="block text-[0.67rem] font-semibold uppercase tracking-[0.16em] text-white/45">
          {label}
        </span>
        <span className="mt-1 block text-sm font-medium leading-relaxed text-white/90 sm:text-[0.94rem]">
          {value}
        </span>
      </span>
    </>
  );

  return href ? (
    <a
      href={href}
      className="group flex items-start gap-4 py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
    >
      {content}
    </a>
  ) : (
    <div className="flex items-start gap-4 py-1">{content}</div>
  );
}

export default function Contact() {
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
    if (!form.email.trim()) nextErrors.email = "Email address is required.";
    else if (!EMAIL_REGEX.test(form.email)) nextErrors.email = "Enter a valid email address.";

    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    else {
      const digits = form.phone.replace(/\D/g, "");
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) {
        nextErrors.phone = "Enter a valid phone number.";
      }
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setTouched({
        full_name: true,
        email: true,
        phone: true,
        message: true,
        consent_given: true,
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...form,
        full_name: form.full_name.trim(),
        business_name: "Not provided",
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        business_type: form.business_type.trim() || "Not provided",
        message: form.message.trim(),
        business_website_url: form.business_website_url.trim(),
        source: "contact_page",
        source_page: "/contact",
        consent_source: "contact_page_form",
        consent_text_version: CONTACT_CONSENT_VERSION,
      };

      const result = await invokePublicBase44Function("submitContactInquiry", payload);
      if (!result.data?.success) throw new Error(result.data?.error || "Submission failed");

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
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />

      <main className="pt-[var(--cs-nav-height)]">
        <section
          className="grid lg:grid-cols-2"
          style={{ minHeight: "calc(100svh - var(--cs-nav-height))" }}
        >
          <aside className="relative overflow-hidden bg-[#061025] text-white">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 12% 12%, rgba(53,189,241,0.18), transparent 32%), radial-gradient(circle at 88% 84%, rgba(0,121,193,0.20), transparent 34%), linear-gradient(145deg, #061025 0%, #001B44 100%)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-[#35BDF1]/45 to-transparent lg:block"
            />

            <div className="relative mx-auto flex h-full w-full max-w-[680px] flex-col justify-center px-7 py-14 sm:px-12 sm:py-16 lg:px-16 xl:px-20">
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
                  className="h-auto w-[330px] max-w-full object-contain object-left"
                />
              </a>

              <div className="my-8 h-px w-full bg-gradient-to-r from-[#35BDF1]/75 via-[#35BDF1]/35 to-transparent" />

              <div className="grid gap-4">
                {contactMethods.map((method) => (
                  <ContactMethod key={method.label} {...method} />
                ))}
              </div>

              <div className="my-8 h-px w-full bg-gradient-to-r from-[#35BDF1]/75 via-[#35BDF1]/35 to-transparent" />

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="/book#system-match-form"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 border border-[#35BDF1] px-4 text-center text-xs font-bold uppercase tracking-[0.11em] text-white transition-colors hover:bg-[#35BDF1] hover:text-[#061025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Sparkles aria-hidden="true" className="h-4 w-4" />
                  AI Readiness Check
                </a>
                <a
                  href="/book"
                  className="group inline-flex min-h-12 items-center justify-center gap-2 border border-white/30 px-4 text-center text-xs font-bold uppercase tracking-[0.11em] text-white transition-colors hover:border-white hover:bg-white hover:text-[#061025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
                >
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  Book a Strategy Call
                </a>
              </div>

              <div className="mt-8 flex items-center gap-5" aria-label="ClientSurge Systems social media">
                {socialLinks.map(({ Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="inline-flex h-9 w-9 items-center justify-center text-[#35BDF1] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35BDF1]"
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <section className="bg-white text-[#001B44]">
            <div className="mx-auto flex h-full w-full max-w-[760px] flex-col justify-center px-7 py-14 sm:px-12 sm:py-16 lg:px-16 xl:px-20">
              {success ? (
                <div className="max-w-xl" aria-live="polite">
                  <CheckCircle2 aria-hidden="true" className="h-12 w-12 text-[#0079C1]" />
                  <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
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
                    <p className="mt-5 text-xs font-medium text-slate-400">
                      Reference: {submittedLead.request_id}
                    </p>
                  )}
                  <a
                    href="/"
                    className="mt-10 inline-flex min-h-14 min-w-[220px] items-center justify-center gap-2 border-2 border-[#001B44] px-8 text-sm font-bold uppercase tracking-[0.08em] text-[#001B44] transition-colors hover:bg-[#001B44] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                  >
                    Return Home <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <>
                  <header>
                    <p className="text-sm font-medium uppercase tracking-[0.13em] text-slate-500">
                      Get in touch
                    </p>
                    <div className="mt-3 flex items-center gap-5 sm:gap-7">
                      <span
                        aria-hidden="true"
                        className="h-16 w-1 shrink-0 bg-[#00AEEF] sm:h-[4.5rem]"
                      />
                      <h1 className="font-titles text-[clamp(3.2rem,6.2vw,5.4rem)] font-black leading-[0.88] tracking-[-0.055em] text-[#001B44]">
                        CONTACT US
                      </h1>
                    </div>

                    <div className="mt-10">
                      <h2 className="text-xl font-black uppercase tracking-[-0.02em] text-[#001B44] sm:text-2xl">
                        We would love to hear from you!
                      </h2>
                      <p className="mt-2 text-base leading-7 text-slate-600">
                        Send us a message and we will get right back in touch.
                      </p>
                    </div>
                  </header>

                  <form id="contact-form" onSubmit={handleSubmit} noValidate className="mt-10">
                    {errors.submit && (
                      <div
                        className="mb-7 border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                        role="alert"
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

                    <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
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
                          autoComplete="organization-title"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label
                          htmlFor="contact-message"
                          className="mb-3 flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate-500"
                        >
                          <span>Message</span>
                          <span aria-hidden="true" className="text-[#0079C1]">
                            *
                          </span>
                          <span className="sr-only">required</span>
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          value={form.message}
                          onChange={(event) => updateField("message", event.target.value)}
                          onBlur={() => handleBlur("message")}
                          rows={3}
                          required
                          aria-invalid={Boolean(errors.message && touched.message)}
                          aria-describedby={
                            errors.message && touched.message ? "contact-message-error" : undefined
                          }
                          className={`w-full resize-none border-0 border-b bg-transparent px-0 py-2 text-base leading-7 text-[#001B44] outline-none transition-colors duration-200 focus:border-[#00AEEF] focus:ring-0 ${
                            errors.message && touched.message ? "border-red-500" : "border-slate-400"
                          }`}
                        />
                        {errors.message && touched.message && (
                          <p
                            id="contact-message-error"
                            className="mt-2 text-xs font-semibold text-red-600"
                            role="alert"
                          >
                            {errors.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-7">
                      <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-slate-500">
                        <input
                          type="checkbox"
                          checked={form.consent_given}
                          onChange={(event) => updateField("consent_given", event.target.checked)}
                          onBlur={() => handleBlur("consent_given")}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-slate-400 text-[#0079C1] focus:ring-[#00AEEF]"
                        />
                        <span>
                          I agree that ClientSurge Systems may contact me about this inquiry by email,
                          phone, or SMS. Message/data rates may apply. Reply STOP to opt out.
                        </span>
                      </label>
                      {errors.consent_given && touched.consent_given && (
                        <p className="mt-2 text-xs font-semibold text-red-600" role="alert">
                          {errors.consent_given}
                        </p>
                      )}
                    </div>

                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex min-h-14 min-w-[220px] items-center justify-center gap-2 border-2 border-[#001B44] bg-white px-8 text-sm font-bold uppercase tracking-[0.08em] text-[#001B44] transition-colors hover:bg-[#001B44] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00AEEF] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? "Sending..." : "Send Message"}
                        {!loading && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                      </button>
                      <p className="text-xs font-medium text-slate-400">
                        Required fields are marked with an asterisk.
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
    </div>
  );
}
