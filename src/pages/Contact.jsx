import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Mail, Phone, MapPin, Facebook, Instagram, ArrowRight, Clock, ShieldCheck, BadgeCheck, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const INDUSTRY_CONTEXT = {
  "med-spa":      { label: "Med Spa & Aesthetics", sub: "Ready to automate your Med Spa or Aesthetic Clinic?" },
  "dental":       { label: "Dental & Orthodontics", sub: "Ready to automate your Dental or Orthodontic practice?" },
  "hvac":         { label: "HVAC & Home Services", sub: "Ready to automate your HVAC or Home Services business?" },
  "plumbing":     { label: "Plumbing", sub: "Ready to automate your Plumbing business?" },
  "roofing":      { label: "Roofing & Restoration", sub: "Ready to automate your Roofing business?" },
  "chiropractic": { label: "Chiropractic & PT", sub: "Ready to automate your Chiropractic practice?" },
  "contractors":  { label: "Contractors & Trades", sub: "Ready to automate your Contracting business?" },
};

function detectIndustryFromReferrer() {
  const path = document.referrer ? new URL(document.referrer).pathname : window.location.pathname;
  const slug = Object.keys(INDUSTRY_CONTEXT).find((k) => path.includes(k));
  return slug ? INDUSTRY_CONTEXT[slug] : null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;

const TRUST_BADGES = [
  { Icon: ShieldCheck, label: "Secure & Private" },
  { Icon: BadgeCheck, label: "No Long-Term Contracts" },
  { Icon: Wallet, label: "Month-to-Month Billing" },
];

function Field({ label, required, error, children }) {
  return (
    <div className="group">
      <label className="cs-form-label block mb-2 text-slate-600">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1.5" role="alert">{error}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-transparent border-b border-slate-300 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-300 focus:border-primary";

export default function Contact() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    business_type: "",
    message: "",
    website_url: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    referrer: "",
    pain_points: "",
  });

  const [industryContext, setIndustryContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const successRef = useRef(null);
  const errorSummaryRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setForm((prev) => ({
      ...prev,
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_content: params.get("utm_content") || "",
      referrer: document.referrer || "",
    }));
    setIndustryContext(detectIndustryFromReferrer());
  }, []);

  useEffect(() => {
    return setPageMetadata({
      title: "Contact ClientSurge Systems | Questions and Demo Requests",
      description:
        "Contact ClientSurge Systems to ask questions, request a walkthrough, or discuss AI voice agents, lead follow-up, booking automation, and local service business systems.",
      canonicalPath: "/contact",
      ogTitle: "Contact ClientSurge Systems",
      ogDescription: "Reach out to discuss your lead flow, booking process, or automation questions.",
    });
  }, []);

  useEffect(() => {
    if (success && successRef.current) {
      successRef.current.focus();
    } else if (errors.submit && errorSummaryRef.current) {
      errorSummaryRef.current.focus();
    }
  }, [success, errors.submit]);

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Please enter your full name so we know who to reply to.";
    if (!form.email.trim()) e.email = "Please enter your email so we can reply to you.";
    else if (!EMAIL_REGEX.test(form.email)) e.email = "Please enter a valid email address.";
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) e.phone = "Please enter a valid phone number (at least 10 digits).";
    }
    if (!form.message.trim()) e.message = "Please tell us a little about what you need help with.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((c) => ({ ...c, [name]: value }));
    setErrors((c) => ({ ...c, [name]: undefined, submit: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) { setErrors(nextErrors); return; }
    setLoading(true);
    try {
      const result = await base44.functions.invoke("submitContactInquiry", form);
      if (!result.data?.success) throw new Error(result.data?.error || "Submission failed");
      setSuccess(true);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again or email us directly at support@clientsurgesystems.com." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Navbar />

      {/* Full-height split layout — accounts for navbar */}
      <div className="flex flex-1" style={{ minHeight: "calc(100vh - var(--cs-nav-height, 76px))" }}>

        {/* ── LEFT: Dark sidebar ── */}
        <aside className="hidden lg:flex lg:w-[42%] xl:w-[38%] bg-slate-900 text-white flex-col justify-start p-14 xl:p-20 flex-shrink-0">
          {/* Top block */}
          <div>
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 mb-16">
              <div className="w-1.5 h-10 bg-primary rounded-sm flex-shrink-0" />
              <span className="text-2xl font-black tracking-tight font-display">ClientSurge</span>
            </div>

            {/* Contact details — semantic list */}
            <h2 className="sr-only">Contact Information</h2>
            <ul className="border-t border-slate-700 pt-10 mb-10 space-y-7">
              <li className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a href="tel:+16025843227" className="text-base text-slate-100 hover:text-primary transition">
                  (602) 584-3227
                </a>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email</p>
                  <a href="mailto:support@clientsurgesystems.com" className="text-base text-slate-100 hover:text-primary transition break-all">
                    support@clientsurgesystems.com
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span className="text-base text-slate-100">Phoenix, Arizona</span>
              </li>
            </ul>

            {/* Description — improved contrast */}
            <p className="text-slate-300 text-base leading-relaxed">
              {industryContext
                ? `Need help automating your ${industryContext.label.toLowerCase()}? We're here to discuss your lead flow and recommend the right stack.`
                : "Have questions or ready to get started? Send us a message and we'll be in touch within one business day."}
            </p>
          </div>

          {/* Bottom: social icons */}
          <div className="flex items-center gap-6">
            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition">
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </aside>

        {/* ── RIGHT: Form ── */}
        <main className="flex-1 bg-white flex flex-col justify-center px-6 py-16 sm:px-10 md:px-16 lg:px-20 xl:px-24 overflow-y-auto">
          <div className="w-full max-w-xl mx-auto">

            {success ? (
              /* ── Success state ── */
              <motion.div
                ref={successRef}
                tabIndex={-1}
                className="text-center py-16 outline-none"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-8"
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                  <CheckCircle2 className="w-9 h-9 text-green-600" />
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 mb-3 font-display">Message Received</h2>
                <p className="text-slate-500 text-base leading-relaxed mb-10 max-w-sm mx-auto">
                  Thanks for reaching out. We'll respond within one business day.
                </p>
                <a
                  href="/"
                  className="cs-btn-primary inline-flex"
                >
                  Back to Home <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} noValidate className="space-y-9">

                {/* HEADER */}
                <div>
                  {/* Response-time trust badge */}
                  <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Typically responds within 1 business day</span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-1.5 h-12 bg-primary rounded-sm flex-shrink-0" />
                    <h1 className="text-5xl font-black text-slate-900 leading-none font-display">CONTACT</h1>
                  </div>
                  <p className="text-slate-700 text-base leading-relaxed">
                    We'd love to hear from you. Send us a message and we'll get right back in touch.
                  </p>

                  {/* Trust signals — consistent with site */}
                  <div className="flex flex-wrap gap-3 mt-5">
                    {TRUST_BADGES.map(({ Icon, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border"
                        style={{ background: "rgba(0,174,239,0.08)", borderColor: "rgba(0,174,239,0.28)", color: "#00AEEF" }}
                      >
                        <Icon className="w-3.5 h-3.5" aria-hidden="true" /> {label}
                      </span>
                    ))}
                  </div>
                </div>

                {errors.submit && (
                  <div
                    ref={errorSummaryRef}
                    tabIndex={-1}
                    className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700 outline-none"
                    role="alert"
                  >
                    {errors.submit}
                  </div>
                )}

                {/* Honeypot */}
                <input type="text" name="website_url" value={form.website_url} onChange={handleChange} className="hidden" tabIndex={-1} aria-hidden="true" />

                {/* Row 1: Full Name + Business Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Full Name" required error={errors.full_name}>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.full_name)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Business Type">
                    <input
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                </div>

                {/* Row 2: Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Field label="Phone No." error={errors.phone}>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.phone)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.email)}
                      className={inputClass}
                    />
                  </Field>
                </div>

                {/* Message */}
                <Field label="Message" required error={errors.message}>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    aria-invalid={Boolean(errors.message)}
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-right text-[11px] text-slate-400 mt-1.5">
                    {form.message.length} characters
                  </p>
                </Field>

                {/* Full-width solid blue CTA button with conditional glow */}
                {(() => {
                  const hasErrors = Object.keys(errors).length > 0;
                  const isValid = form.full_name && form.email && form.message && !hasErrors;
                  return (
                    <button
                      type="submit"
                      disabled={loading}
                      className="cs-btn-primary w-full"
                      style={{
                        boxShadow: isValid ? '0 0 24px rgba(0, 174, 239, 0.35)' : undefined,
                        transition: 'box-shadow 0.3s ease',
                        minHeight: 'unset'
                      }}
                    >
                      {loading
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</>
                        : <><span>Send Message</span><ArrowRight className="w-5 h-5" /></>
                      }
                    </button>
                  );
                })()}

                <p className="text-center text-xs text-slate-500">
                  No spam, no pressure — just a thoughtful reply from our team.
                </p>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* Mobile: show contact info above footer */}
      <div className="lg:hidden bg-slate-900 text-white px-6 py-10">
        <h2 className="sr-only">Contact Information</h2>
        <ul className="space-y-5">
          <li className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-primary" />
            <a href="tel:+16025843227" className="text-sm text-slate-100">(602) 584-3227</a>
          </li>
          <li className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-primary" />
            <a href="mailto:support@clientsurgesystems.com" className="text-sm text-slate-100">support@clientsurgesystems.com</a>
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm text-slate-100">Phoenix, Arizona</span>
          </li>
        </ul>
      </div>

      <Footer />
      <MobileCallBar />
    </div>
  );
}