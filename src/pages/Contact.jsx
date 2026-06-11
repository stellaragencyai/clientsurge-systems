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

      <section className="px-6 pb-12 pt-[calc(var(--cs-nav-height)+28px)] text-center md:pb-14 md:pt-[calc(var(--cs-nav-height)+42px)]" style={{ background: "linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--background)))" }}>
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Get In Touch</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
          Contact ClientSurge Systems
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Have a question about AI automation, lead capture, or booking systems? Send a message and we&apos;ll get back to you within one business day.
        </p>
      </section>

      <section className="px-6 pb-16 pt-8 md:pt-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-14 items-start">
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-6">Contact Information</h2>
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Email</p>
                    <a href="mailto:support@clientsurgesystems.com" className="text-sm text-foreground hover:text-primary transition-colors">
                      support@clientsurgesystems.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
                    <a href="tel:+16025843227" className="text-sm text-foreground hover:text-primary transition-colors">
                      (602) 584-3227
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Location</p>
                    <p className="text-sm text-foreground">Phoenix, Arizona</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-lg border border-primary/20 bg-primary/5 md:p-6">
              <p className="text-sm font-semibold text-foreground mb-2">Prefer a live walkthrough?</p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Skip the form and book a free automation audit. We&apos;ll review your current lead flow and show the fastest practical automation wins.
              </p>
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)", boxShadow: "0 4px 14px rgba(0,174,239,0.4)", border: "none", cursor: "pointer", textDecoration: "none" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 20px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "700", fontSize: "0.8rem" }}>
                  Book Your Free Audit <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm md:p-8">
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
              <form action="/contact" method="post" onSubmit={handleSubmit} className="space-y-4" noValidate>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Send a Message</h3>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700" role="alert">
                    {errors.submit}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div>
                    <label htmlFor="contact-full-name" className="block text-xs font-semibold text-foreground mb-1.5">Full Name <span className="text-red-500">*</span></label>
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
                      className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background ${errors.full_name ? "border-red-400" : "border-input"}`}
                    />
                    {errors.full_name && <p id="contact-full-name-error" className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-foreground mb-1.5">Email <span className="text-red-500">*</span></label>
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
                      className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background ${errors.email ? "border-red-400" : "border-input"}`}
                    />
                    {errors.email && <p id="contact-email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="contact-phone" className="block text-xs font-semibold text-foreground mb-1.5">Phone</label>
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
                      className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background ${errors.phone ? "border-red-400" : "border-input"}`}
                    />
                    {errors.phone && <p id="contact-phone-error" className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-business-type" className="block text-xs font-semibold text-foreground mb-1.5">Business Type</label>
                    <select
                      id="contact-business-type"
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
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

                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-foreground mb-1.5">Message <span className="text-red-500">*</span></label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    placeholder="Tell us about your business and what you're looking for..."
                    rows={5}
                    className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background resize-none ${errors.message ? "border-red-400" : "border-input"}`}
                  />
                  {errors.message && <p id="contact-message-error" className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)", boxShadow: "0 4px 18px rgba(0,174,239,0.4)", border: "none", cursor: "pointer", width: "100%" }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "700", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                  </span>
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  No spam. No pressure. Just a thoughtful reply from our team.
                </p>
                <p className="text-center text-xs text-muted-foreground mt-1">
                  We respect your privacy. See our{" "}
                  <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <MobileCallBar />
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </div>
  );
}
