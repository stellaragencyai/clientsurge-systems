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
    <div className="min-h-screen bg-background" style={{ background: "linear-gradient(to bottom, hsl(var(--background)), hsl(var(--background)))" }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <Navbar />

      {/* Hero Section */}
      <section style={{
        background: "#ffffff",
        paddingTop: "calc(var(--cs-nav-height) + 48px)",
        paddingBottom: "48px",
        paddingLeft: "clamp(1.5rem, 6vw, 80px)",
        paddingRight: "clamp(1.5rem, 6vw, 80px)",
      }}>
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
            fontSize: "12px",
            fontWeight: 300,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#777777",
            lineHeight: 1.1,
            marginBottom: "34px",
          }}>
            Get In Touch
          </p>

          {/* Title row: bar + CONTACT */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Blue vertical bar */}
            <div style={{
              width: "6px",
              height: "68px",
              background: "#00AEEF",
              borderRadius: "3px",
              flexShrink: 0,
            }} />

            {/* Main title — div avoids global h1 color/size overrides */}
            <div role="heading" aria-level="1" style={{
              fontFamily: "'Montserrat', system-ui, sans-serif",
              fontSize: "clamp(40px, 6vw, 72px)",
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              color: "#000000 !important",
              textTransform: "uppercase",
              margin: 0,
              WebkitTextFillColor: "#000000",
            }}>
              CONTACT
            </div>
          </div>
        </div>
      </section>

      {/* Split-Screen Luxury Layout with Floating Containers */}
      <section className="px-6 pb-20 pt-12 md:pt-16" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,174,239,0.02) 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-start">
            
            {/* LEFT: Brand Authority & Contact Details - Floating Container */}
            <div 
              className="flex flex-col gap-10 lg:gap-12"
              style={{
                padding: "40px 32px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.92) 100%)",
                border: "1px solid rgba(0,174,239,0.12)",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0,174,239,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
              }}
            >
              
              {/* Contact Information - Minimalist Styling */}
              <div
                style={{
                  animation: "fadeInUp 0.6s ease-out 0.1s backwards",
                }}
              >
                <div className="flex items-center gap-3 mb-8">
                  <div style={{ width: "2px", height: "24px", background: "#00AEEF" }} />
                  <h2 className="font-titles text-[#001B44] text-base font-bold uppercase tracking-wider">Contact Information</h2>
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

              {/* CTA Card - Direct Action with Hover Effect */}
              <div 
                style={{ 
                  padding: "24px 28px", 
                  background: "linear-gradient(135deg, rgba(0,174,239,0.08) 0%, rgba(0,136,204,0.04) 100%)",
                  border: "1px solid rgba(0,174,239,0.15)",
                  borderRadius: "8px",
                  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,174,239,0.12) 0%, rgba(0,136,204,0.08) 100%)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,174,239,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(0,174,239,0.08) 0%, rgba(0,136,204,0.04) 100%)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, letterSpacing: "-0.01em", marginBottom: "8px", color: "hsl(var(--foreground))" }}>
                  Skip the form?
                </h3>
                <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "hsl(var(--muted-foreground))", marginBottom: "16px", fontWeight: 400 }}>
                  Get help choosing your AI services. We&apos;ll talk through your lead flow and recommend the right automation stack.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="cs-btn-primary"
                >
                  Get Help Choosing <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* RIGHT: Conversion Form - Floating Premium Container */}
            <div 
              style={{ 
                padding: "40px 32px",
                background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.96) 100%)",
                border: "1px solid rgba(0,174,239,0.12)",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0,174,239,0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
                backdropFilter: "blur(12px)",
                borderTop: "none",
                paddingTop: "40px",
              }} 
              className="lg:border-t lg:border-t-solid lg:pt-10"
            >
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
                    Want help choosing your AI services instead?
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
                  <h3 className="font-titles text-[#001B44] text-base font-bold uppercase tracking-wider">Send a Message</h3>
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
                  <div style={{ animation: "fadeInUp 0.6s ease-out 0.15s backwards" }}>
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
                        padding: "10px 0 8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(0,174,239,0.8)";
                        e.target.style.borderBottomWidth = "2px";
                        e.target.style.paddingBottom = "7px";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.full_name ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)";
                        e.target.style.borderBottomWidth = errors.full_name ? "2px" : "1px";
                        e.target.style.paddingBottom = "8px";
                      }}
                    />
                    {errors.full_name && <p id="contact-full-name-error" className="text-red-500 text-xs mt-2">{errors.full_name}</p>}
                  </div>

                  {/* Email - Bottom Border Input */}
                  <div style={{ animation: "fadeInUp 0.6s ease-out 0.2s backwards" }}>
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
                        padding: "10px 0 8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(0,174,239,0.8)";
                        e.target.style.borderBottomWidth = "2px";
                        e.target.style.paddingBottom = "7px";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.email ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)";
                        e.target.style.borderBottomWidth = errors.email ? "2px" : "1px";
                        e.target.style.paddingBottom = "8px";
                      }}
                    />
                    {errors.email && <p id="contact-email-error" className="text-red-500 text-xs mt-2">{errors.email}</p>}
                  </div>
                </div>

                {/* Second Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Phone - Bottom Border Input */}
                  <div style={{ animation: "fadeInUp 0.6s ease-out 0.25s backwards" }}>
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
                        padding: "10px 0 8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(0,174,239,0.8)";
                        e.target.style.borderBottomWidth = "2px";
                        e.target.style.paddingBottom = "7px";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.phone ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)";
                        e.target.style.borderBottomWidth = errors.phone ? "2px" : "1px";
                        e.target.style.paddingBottom = "8px";
                      }}
                    />
                    {errors.phone && <p id="contact-phone-error" className="text-red-500 text-xs mt-2">{errors.phone}</p>}
                  </div>

                  {/* Business Type - Bottom Border Select */}
                  <div style={{ animation: "fadeInUp 0.6s ease-out 0.3s backwards" }}>
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
                        padding: "10px 0 8px 0",
                        fontSize: "0.95rem",
                        color: "hsl(var(--foreground))",
                        outline: "none",
                        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "rgba(0,174,239,0.8)";
                        e.target.style.borderBottomWidth = "2px";
                        e.target.style.paddingBottom = "7px";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(0,174,239,0.3)";
                        e.target.style.borderBottomWidth = "1px";
                        e.target.style.paddingBottom = "8px";
                      }}
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
                <div style={{ animation: "fadeInUp 0.6s ease-out 0.35s backwards" }}>
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
                      padding: "10px 0 8px 0",
                      fontSize: "0.95rem",
                      color: "hsl(var(--foreground))",
                      outline: "none",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      resize: "none",
                      fontFamily: "inherit",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(0,174,239,0.8)";
                      e.target.style.borderBottomWidth = "2px";
                      e.target.style.paddingBottom = "7px";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.message ? "rgb(239,68,68)" : "rgba(0,174,239,0.3)";
                      e.target.style.borderBottomWidth = errors.message ? "2px" : "1px";
                      e.target.style.paddingBottom = "8px";
                    }}
                  />
                  {errors.message && <p id="contact-message-error" className="text-red-500 text-xs mt-2">{errors.message}</p>}
                </div>

                {/* Decorative Divider Before Button */}
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.2), transparent)", margin: "8px 0" }} />

                {/* Submit Button with Premium Hover */}
                <button
                  type="submit"
                  disabled={loading}
                  className="cs-btn-primary w-full mt-7"
                  style={{ opacity: loading ? 0.7 : 1 }}
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