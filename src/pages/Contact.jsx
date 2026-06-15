import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import DemoBookingModal from "../components/forms/DemoBookingModal";
import { setPageMetadata } from "@/lib/seo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;

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
  });
  
  // Capture UTM params from URL on mount
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
  }, []);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }

    const fire = () => {
      confetti({
        particleCount: 140,
        spread: 80,
        startVelocity: 38,
        origin: { y: 0.55 },
        colors: ["#00AEEF", "#009DFF", "#003B8F", "#7DD3FC", "#FFFFFF"],
      });
    };

    fire();
  }, [success]);

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
    const nextErrors = {};

    if (!form.full_name.trim()) {
      nextErrors.full_name = 'Required';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Required';
    } else if (!EMAIL_REGEX.test(form.email)) {
      nextErrors.email = 'Enter a valid email';
    }

    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, '');
      if (!PHONE_REGEX.test(form.phone) || digits.length < 10) {
        nextErrors.phone = 'Enter a valid phone number';
      }
    }

    if (!form.message.trim()) {
      nextErrors.message = 'Required';
    }

    return nextErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined, submit: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);

    try {
      const result = await base44.functions.invoke("submitContactInquiry", form);

      if (!result.data?.success) {
        throw new Error(result.data?.error || "Contact submission failed");
      }

      setSuccess(true);
    } catch (error) {
      setErrors({ submit: "Something went wrong. Please try again or email us directly." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Luxury Hero Section */}
      <section className="px-6 pb-10 pt-[calc(var(--cs-nav-height)+24px)] md:pb-12 md:pt-[calc(var(--cs-nav-height)+32px)]" style={{ background: "linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--background)))" }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div style={{ width: "3px", height: "32px", background: "#00AEEF", borderRadius: "1px" }} />
            <p className="text-xs font-bold text-primary tracking-[0.2em] uppercase">Get In Touch</p>
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.08, color: "hsl(var(--foreground))" }} className="mb-4 md:mb-6">
            Contact ClientSurge
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Have a question about AI automation, lead capture, or booking systems? Send a message and we&apos;ll get back to you within one business day.
          </p>
        </div>
      </section>

      {/* Split-Screen Luxury Layout */}
      <section className="px-6 pb-20 pt-12 md:pt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">
            
            {/* LEFT: Brand Authority & Contact Details */}
            <div className="flex flex-col gap-10 lg:gap-12">
              
              {/* Contact Information - Minimalist Styling */}
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <div style={{ width: "2px", height: "24px", background: "#00AEEF" }} />
                  <h2 style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.15em", color: "hsl(var(--foreground))" }} className="uppercase">Contact Information</h2>
                </div>
                <div className="space-y-8">
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }} className="uppercase mb-2">Email</p>
                    <a href="mailto:support@clientsurgesystems.com" className="text-sm text-foreground hover:text-primary transition-colors font-light">
                      support@clientsurgesystems.com
                    </a>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }} className="uppercase mb-2">Phone</p>
                    <a href="tel:+16025843227" className="text-sm text-foreground hover:text-primary transition-colors font-light">
                      (602) 584-3227
                    </a>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.15em", color: "hsl(var(--muted-foreground))" }} className="uppercase mb-2">Location</p>
                    <p className="text-sm text-foreground font-light">Phoenix, Arizona</p>
                  </div>
                </div>
              </div>

              {/* Decorative Divider */}
              <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.3), transparent)" }} />

              {/* CTA Card - Direct Action */}
              <div style={{ 
                padding: "24px 28px", 
                background: "linear-gradient(135deg, rgba(0,174,239,0.08) 0%, rgba(0,136,204,0.04) 100%)",
                border: "1px solid rgba(0,174,239,0.15)",
                borderRadius: "2px"
              }}>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "8px", color: "hsl(var(--foreground))" }}>
                  Skip the form?
                </h3>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "hsl(var(--muted-foreground))", marginBottom: "16px", fontWeight: 400 }}>
                  Book a free automation audit. We&apos;ll review your lead flow and show you the fastest wins.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    padding: "10px 20px",
                    background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "2px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 20px rgba(0,136,204,0.3)"}
                  onMouseLeave={(e) => e.target.style.boxShadow = "none"}
                >
                  Book Free Audit <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* RIGHT: Conversion Form - Ultra-Minimal */}
            <div style={{ borderTop: "1px solid rgba(0,174,239,0.2)", paddingTop: "32px" }} className="lg:border-t-0 lg:pt-0">
            {success ? (
              <motion.div
                className="flex flex-col items-center text-center py-8"
                aria-live="polite"
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5"
                  initial={{ scale: 0.8, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.08, type: "spring", stiffness: 260, damping: 16 }}
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </motion.div>
                <motion.h3
                  className="text-xl font-semibold text-foreground mb-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.14, duration: 0.3 }}
                >
                  Message Sent!
                </motion.h3>
                <motion.p
                  className="text-sm text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  Thanks for reaching out. We&apos;ll get back to you within one business day.
                </motion.p>
                <motion.div
                  className="mt-6 flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(true)}
                    className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    Prefer to start a free automation audit instead?
                  </button>
                  <a
                    href="mailto:support@clientsurgesystems.com"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Email us directly
                  </a>
                </motion.div>
              </motion.div>
            ) : (
              <form action="/contact" method="post" onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="flex items-center gap-3 mb-8">
                  <div style={{ width: "2px", height: "24px", background: "#00AEEF" }} />
                  <h3 style={{ fontSize: "0.75rem", fontWeight: 900, letterSpacing: "0.15em", color: "hsl(var(--foreground))" }} className="uppercase">Send a Message</h3>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
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
                
                {/* Two-Column Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Full Name - Bottom Border Input */}
                  <div>
                    <label htmlFor="contact-full-name" style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.1em", color: "hsl(var(--muted-foreground))", display: "block", marginBottom: "12px" }} className="uppercase">Full Name <span className="text-red-500">*</span></label>
                    <input
                      id="contact-full-name"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                      aria-invalid={Boolean(errors.full_name)}
                      aria-describedby={errors.full_name ? "contact-full-name-error" : undefined}
                      placeholder="Jane Smith"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        borderBottom: errors.full_name ? "2px solid rgb(239,68,68)" : "1px solid rgba(0,174,239,0.3)",
                        padding: "8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(0,174,239,0.6)"}
                      onBlur={(e) => e.target.style.borderColor = errors.full_name ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)"}
                    />
                    {errors.full_name && <p id="contact-full-name-error" className="text-red-500 text-xs mt-2">{errors.full_name}</p>}
                  </div>

                  {/* Email - Bottom Border Input */}
                  <div>
                    <label htmlFor="contact-email" style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.1em", color: "hsl(var(--muted-foreground))", display: "block", marginBottom: "12px" }} className="uppercase">Email <span className="text-red-500">*</span></label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                      placeholder="jane@business.com"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        borderBottom: errors.email ? "2px solid rgb(239,68,68)" : "1px solid rgba(0,174,239,0.3)",
                        padding: "8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(0,174,239,0.6)"}
                      onBlur={(e) => e.target.style.borderColor = errors.email ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)"}
                    />
                    {errors.email && <p id="contact-email-error" className="text-red-500 text-xs mt-2">{errors.email}</p>}
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Phone - Bottom Border Input */}
                  <div>
                    <label htmlFor="contact-phone" style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.1em", color: "hsl(var(--muted-foreground))", display: "block", marginBottom: "12px" }} className="uppercase">Phone</label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      inputMode="tel"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                      placeholder="(555) 000-0000"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        borderBottom: errors.phone ? "2px solid rgb(239,68,68)" : "1px solid rgba(0,174,239,0.3)",
                        padding: "8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(0,174,239,0.6)"}
                      onBlur={(e) => e.target.style.borderColor = errors.phone ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)"}
                    />
                    {errors.phone && <p id="contact-phone-error" className="text-red-500 text-xs mt-2">{errors.phone}</p>}
                  </div>

                  {/* Business Type - Bottom Border Select */}
                  <div>
                    <label htmlFor="contact-business-type" style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.1em", color: "hsl(var(--muted-foreground))", display: "block", marginBottom: "12px" }} className="uppercase">Business Type</label>
                    <select
                      id="contact-business-type"
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(0,174,239,0.3)",
                        padding: "8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "rgba(0,174,239,0.6)"}
                      onBlur={(e) => e.target.style.borderColor = "rgba(0,174,239,0.3)"}
                    >
                      <option value="">Select one...</option>
                      <option>Med Spas & Aesthetic Clinics</option>
                      <option>Dental & Orthodontics</option>
                      <option>Chiropractic & Physical Therapy</option>
                      <option>HVAC, Plumbing & Home Services</option>
                      <option>Roofing & Restoration</option>
                      <option>Contractors & Trades</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                {/* Message - Full Width Bottom Border Textarea */}
                <div>
                  <label htmlFor="contact-message" style={{ fontSize: "0.65rem", fontWeight: 900, letterSpacing: "0.1em", color: "hsl(var(--muted-foreground))", display: "block", marginBottom: "12px" }} className="uppercase">Message <span className="text-red-500">*</span></label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    placeholder="Tell us about your business and what you're looking for..."
                    rows={4}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderBottom: errors.message ? "2px solid rgb(239,68,68)" : "1px solid rgba(0,174,239,0.3)",
                      padding: "8px 0",
                      fontSize: "0.95rem",
                      color: "hsl(var(--foreground))",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                      resize: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(0,174,239,0.6)"}
                    onBlur={(e) => e.target.style.borderColor = errors.message ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)"}
                  />
                  {errors.message && <p id="contact-message-error" className="text-red-500 text-xs mt-2">{errors.message}</p>}
                </div>

                {/* Decorative Divider Before Button */}
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.2), transparent)", margin: "8px 0" }} />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ 
                    display: "block",
                    width: "100%",
                    marginTop: "24px",
                    padding: "14px 0",
                    background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "0.95rem",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => !loading && (e.target.style.boxShadow = "0 12px 32px rgba(0,136,204,0.35)")}
                  onMouseLeave={(e) => !loading && (e.target.style.boxShadow = "none")}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  No spam. No pressure. Just a thoughtful reply from our team.
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  We respect your privacy. See our{" "}
                  <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
                </p>
              </form>
            )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileCallBar />
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </div>
  );
}