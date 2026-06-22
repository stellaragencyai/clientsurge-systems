import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Mail, Phone, MapPin, Facebook, Instagram, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import DemoBookingModal from "../components/forms/DemoBookingModal";
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

// Visual Improvement #2: reusable styled input field with animated focus border
function Field({ label, required, error, children }) {
  return (
    <div className="group">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 mb-3">
        {label} {required && <span className="text-primary font-black">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-600 text-xs font-medium mt-2">{error}</p>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-transparent border-b-2 border-slate-300 py-3 text-base font-medium text-black placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-primary";

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
  const [showBookingModal, setShowBookingModal] = useState(false);

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

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!EMAIL_REGEX.test(form.email)) e.email = "Enter a valid email";
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, "");
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) e.phone = "Enter a valid phone number";
    }
    if (!form.message.trim()) e.message = "Required";
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
      setErrors({ submit: "Something went wrong. Please try again or email us directly." });
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
        <aside className="hidden lg:flex lg:w-[40%] xl:w-[40%] bg-slate-900 text-white flex-col justify-between p-14 xl:p-20 flex-shrink-0">
          {/* Top block */}
          <div>
            {/* Logo / Brand */}
            <div className="flex items-center gap-3 mb-16">
              <div className="w-1.5 h-10 bg-primary rounded-sm flex-shrink-0" />
              <span className="text-2xl font-black tracking-tight">ClientSurge</span>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-600 pt-12 mb-12 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4.5 h-4.5 text-primary" />
                </div>
                <a href="tel:+16025843227" className="text-base font-medium text-white hover:text-primary transition-colors underline-offset-4 hover:underline">
                  (602) 584-3227
                </a>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Email</p>
                  <a href="mailto:support@clientsurgesystems.com" className="text-base font-medium text-white hover:text-primary transition-colors underline-offset-4 hover:underline break-all">
                    support@clientsurgesystems.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-base font-medium text-white">Phoenix, Arizona</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-base font-normal leading-relaxed">
              {industryContext
                ? `Need help automating your ${industryContext.label.toLowerCase()}? We're here to discuss your lead flow and recommend the right stack.`
                : "Have questions or ready to get started? Send us a message and we'll be in touch within one business day."}
            </p>
          </div>

          {/* Bottom: social icons */}
          <div className="flex items-center gap-5">
            <a href="#" aria-label="Facebook" className="w-11 h-11 rounded-lg bg-primary/30 flex items-center justify-center text-white hover:bg-primary hover:text-slate-900 transition-all duration-300 font-bold">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" aria-label="Instagram" className="w-11 h-11 rounded-lg bg-primary/30 flex items-center justify-center text-white hover:bg-primary hover:text-slate-900 transition-all duration-300 font-bold">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </aside>

        {/* ── RIGHT: Form ── */}
        <main className="flex-1 bg-white flex flex-col justify-center px-6 py-16 sm:px-10 md:px-16 lg:px-20 xl:px-24 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto">

            {success ? (
              /* ── Success state ── */
              <motion.div
                className="text-center py-20"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 rounded-full flex items-center justify-center mx-auto mb-10"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-primary" />
                </motion.div>
                <h2 className="text-4xl font-black text-black mb-4">Message Received</h2>
                <p className="text-slate-700 text-base font-medium leading-relaxed mb-12 max-w-sm mx-auto">
                  Thanks for reaching out. We'll respond within one business day.
                </p>
                <a
                  href="/"
                  className="cs-btn-primary inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                  style={{ boxShadow: '0 4px 20px rgba(0,121,193,0.4)' }}
                >
                  Back to Home <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} noValidate className="space-y-12">

                {/* HEADER */}
                <div className="mb-8">
                  {/* #8 — Tracked uppercase eyebrow label */}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-6">
                    Get In Touch
                  </p>

                  {/* #5/#6 — Bold, wide, uppercase CONTACT heading with accent bar */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-1.5 h-16 bg-primary rounded-sm flex-shrink-0" />
                    <h1 className="text-6xl font-black text-black leading-tight tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>CONTACT</h1>
                  </div>

                  {/* #7 — Editorial sub-text with generous leading */}
                  <p className="text-lg font-bold text-black mb-3" style={{ lineHeight: 1.5 }}>
                    We'd love to hear from you!
                  </p>
                  <p className="text-base text-slate-700 font-medium" style={{ lineHeight: 1.7 }}>
                    Send us a message and we'll get right back in touch.
                  </p>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}

                {/* Honeypot */}
                <input type="text" name="website_url" value={form.website_url} onChange={handleChange} className="hidden" tabIndex={-1} aria-hidden="true" />

                {/* Row 1: Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <Field label="First Name" required error={errors.full_name}>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      aria-invalid={Boolean(errors.full_name)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Last Name">
                    <input
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>
                </div>

                {/* Row 2: Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                  {/* Visual Improvement #1: character counter */}
                  <p className="text-right text-[11px] text-black mt-1.5">
                    {form.message.length} characters
                  </p>
                </Field>

                {/* #11 — Bold gradient pill SEND button, left-aligned */}
                {(() => {
                  const hasErrors = Object.keys(errors).length > 0;
                  const isValid = form.full_name && form.email && form.message && !hasErrors;
                  return (
                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={loading}
                        className="cs-btn-primary inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full text-base font-bold text-white transition-all duration-300 hover:shadow-xl hover:scale-105"
                        style={{ minHeight: 'unset', minWidth: 'unset', boxShadow: '0 4px 20px rgba(0,121,193,0.4)' }}
                      >
                        {loading
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                          : <><span>Send</span><ArrowRight className="w-4 h-4" /></>
                        }
                      </button>
                      {isValid && (
                        <span className="sr-only">Form is valid and ready to send</span>
                      )}
                    </div>
                  );
                })()}

                <p className="text-xs text-black">
                  No spam, no pressure — just a thoughtful reply from our team.
                </p>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* Mobile: show contact info above footer */}
      <div className="lg:hidden bg-slate-900 text-white px-6 py-10 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0">
            <Phone className="w-4 h-4 text-primary" />
          </div>
          <a href="tel:+16025843227" className="text-sm font-medium text-white hover:text-primary transition-colors underline-offset-4 hover:underline">(602) 584-3227</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <a href="mailto:support@clientsurgesystems.com" className="text-sm font-medium text-white hover:text-primary transition-colors underline-offset-4 hover:underline">support@clientsurgesystems.com</a>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-lg bg-primary/25 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-white">Phoenix, Arizona</span>
        </div>
      </div>

      <Footer />
      <MobileCallBar />
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </div>
  );
}