import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import FormInput from "../components/forms/FormInput";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import DemoBookingModal from "../components/forms/DemoBookingModal";
import ReadyToStartSection from "../components/landing/ReadyToStartSection";
import SectionHeader from "../components/design-system/SectionHeader";
import ManualVsAIComparison from "../components/landing/ManualVsAIComparison";
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



function Field({ label, required, error, children }) {
  return (
    <div className="group">
      <label className="cs-eyebrow block mb-2 text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1.5">{error}</p>
      )}
    </div>
  );
}

export default function Contact() {
   const [form, setForm] = useState({
      full_name: "",
      business_name: "",
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

        {/* ── LEFT: Premium "Ready to Start?" dark panel ── */}
        <aside className="hidden lg:block lg:w-[40%] xl:w-[42%] flex-shrink-0">
          <ReadyToStartSection />
        </aside>

        {/* ── RIGHT: Form ── */}
        <main className="flex-1 bg-background flex flex-col justify-center px-6 py-12 pt-[calc(var(--cs-nav-height)+2rem)] lg:pt-12 sm:px-10 md:px-12 lg:px-16 xl:px-20 overflow-y-auto">
          <div className="w-full max-w-xl mx-auto lg:max-w-2xl">

            {success ? (
              /* ── Success state ── */
              <motion.div
                className="text-center py-8 md:py-16 px-4 cs-interactive-card rounded-2xl border border-border bg-card p-8 md:p-12"
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
                <h2 className="text-3xl font-titles font-black text-foreground mb-3">Message Received</h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-xs mx-auto">
                  Thanks for reaching out. We'll respond within one business day.
                </p>
                <Link to="/" className="cs-btn-primary">
                  Back to Home <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} noValidate className="space-y-6">

                {/* HEADER — unified SectionHeader system */}
                <SectionHeader
                  eyebrow="Get In Touch"
                  title="Contact Us"
                  subtitle="Send a message and we'll respond within one business day."
                  align="left"
                />

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}

                {/* Honeypot */}
                <input type="text" name="website_url" value={form.website_url} onChange={handleChange} className="hidden" tabIndex={-1} aria-hidden="true" />

                {/* #15 — Consistent gap between form field rows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput
                    label="Full Name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    error={errors.full_name}
                    required
                    autoComplete="name"
                  />
                  <FormInput
                    label="Business Name"
                    name="business_name"
                    value={form.business_name}
                    onChange={handleChange}
                    autoComplete="organization"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput
                    label="Email Address"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    autoComplete="email"
                  />
                  <FormInput
                    label="Phone No."
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                    placeholder="(123) 456-7890"
                    autoComplete="tel"
                  />
                </div>

                <div>
                  <FormInput
                    label="Business Type / Industry"
                    name="business_type"
                    value={form.business_type}
                    onChange={handleChange}
                    placeholder="e.g., HVAC, Dental, Roofing"
                  />
                </div>

                {/* Message */}
                <Field label="Message" required error={errors.message}>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    aria-invalid={Boolean(errors.message)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_4px_hsla(199,100%,47%,0.12)] resize-none"
                  />
                  {/* Character counter */}
                  <p className="text-right text-xs text-muted-foreground mt-1.5">
                    {form.message.length} characters
                  </p>
                </Field>

                {/* Submit button — standardized alignment */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="cs-btn-primary disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                    style={{ minHeight: "52px", paddingLeft: "2rem", paddingRight: "2rem" }}
                  >
                    {loading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                      : <><span>Send Message</span><ArrowRight className="w-4 h-4" /></>
                    }
                  </button>
                  <p className="text-xs text-muted-foreground">
                    No spam, no pressure — just a thoughtful reply from our team.
                  </p>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>

      {/* Mobile contact info — unified branding */}
      <div
        className="lg:hidden px-6 py-10 space-y-4 safe-bottom"
        style={{ background: "var(--cs-gradient)", borderTop: "1px solid rgba(0,174,239,0.15)" }}
      >
        <p className="cs-section-eyebrow mb-5" style={{ color: "rgba(0,174,239,0.85)" }}>
          Get In Touch
        </p>
        <div className="flex items-center gap-3">
          <span className="cs-footer-contact-icon" aria-hidden="true">
            <Phone className="w-4 h-4" />
          </span>
          <a href="tel:+16025843227" className="text-sm font-medium" style={{ color: "#e2e8f0" }}>(602) 584-3227</a>
        </div>
        <div className="flex items-center gap-3">
          <span className="cs-footer-contact-icon" aria-hidden="true">
            <Mail className="w-4 h-4" />
          </span>
          <a href="mailto:support@clientsurgesystems.com" className="text-sm font-medium break-all" style={{ color: "#e2e8f0" }}>support@clientsurgesystems.com</a>
        </div>
        <div className="flex items-center gap-3">
          <span className="cs-footer-contact-icon" aria-hidden="true">
            <MapPin className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>Phoenix, Arizona</span>
        </div>
      </div>

      <ManualVsAIComparison />

      <Footer />
      <MobileCallBar />
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </div>
  );
}