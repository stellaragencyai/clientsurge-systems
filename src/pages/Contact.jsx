import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import DemoBookingModal from "../components/forms/DemoBookingModal";
import { setPageMetadata } from "@/lib/seo";

const INDUSTRY_CONTEXT = {
  "med-spa":       { label: "Med Spa & Aesthetics", sub: "Ready to automate your Med Spa or Aesthetic Clinic?" },
  "dental":        { label: "Dental & Orthodontics", sub: "Ready to automate your Dental or Orthodontic practice?" },
  "hvac":          { label: "HVAC & Home Services", sub: "Ready to automate your HVAC or Home Services business?" },
  "plumbing":      { label: "Plumbing", sub: "Ready to automate your Plumbing business?" },
  "roofing":       { label: "Roofing & Restoration", sub: "Ready to automate your Roofing business?" },
  "chiropractic":  { label: "Chiropractic & PT", sub: "Ready to automate your Chiropractic practice?" },
  "contractors":   { label: "Contractors & Trades", sub: "Ready to automate your Contracting business?" },
};

function detectIndustryFromReferrer() {
  const path = document.referrer ? new URL(document.referrer).pathname : window.location.pathname;
  const slug = Object.keys(INDUSTRY_CONTEXT).find((k) => path.includes(k));
  return slug ? INDUSTRY_CONTEXT[slug] : null;
}

const PAIN_POINTS = [
  "Missed Calls",
  "Slow Lead Follow-Up",
  "No-Show Appointments",
  "Manual Booking Process",
  "Review Management",
  "Cold / Dead Leads",
  "Staff Overwhelmed",
  "No Automation Yet",
];

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
    pain_points: "",
  });

  const [industryContext, setIndustryContext] = useState(null);
  const [selectedPains, setSelectedPains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [showBookingModal, setShowBookingModal] = useState(false);

  const togglePain = (pain) => {
    setSelectedPains((prev) => {
      const next = prev.includes(pain) ? prev.filter((p) => p !== pain) : [...prev, pain];
      setForm((f) => ({ ...f, pain_points: next.join(", ") }));
      return next;
    });
  };

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

      {/* Hero Section */}
      <section className="bg-background pt-24 pb-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-8 text-sm font-semibold text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {industryContext ? industryContext.label : "Ready to automate"}
          </div>
          <div className="flex items-start gap-8 mb-8">
            <div className="w-1 h-20 bg-foreground rounded-sm flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-5xl md:text-6xl font-titles font-black text-foreground mb-6">Contact Us</h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                {industryContext ? industryContext.sub : "Have questions or ready to discuss your lead flow? Reach out and let's talk about the right automation stack for your business."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="px-6 md:px-12 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
            
            {/* LEFT: Contact Info & Timeline */}
            <div className="flex flex-col gap-16">
              {/* Contact Details */}
              <div>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-1 h-6 bg-foreground rounded-sm" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Contact Information</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { Icon: Mail, label: "Email", value: "support@clientsurgesystems.com", href: "mailto:support@clientsurgesystems.com" },
                    { Icon: Phone, label: "Phone", value: "(602) 584-3227", href: "tel:+16025843227" },
                    { Icon: MapPin, label: "Location", value: "Phoenix, Arizona", href: null },
                  ].map(({ Icon, label, value, href }) => (
                    <div key={label} className="flex items-center gap-4 p-4 bg-card rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                        {href ? (
                          <a href={href} className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                            {value}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-foreground">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Box */}
              <div className="p-6 border border-border rounded-lg bg-card hover:border-primary/30 hover:shadow-lg transition-all">
                <h3 className="font-semibold text-foreground mb-2">Prefer a quick call?</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Skip the form and let's discuss your lead flow directly. We'll recommend the right automation stack.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBookingModal(true)}
                  className="cs-btn-primary inline-flex items-center gap-2"
                >
                  Get Help Choosing <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Timeline */}
              <div className="border-t border-border pt-8">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">What happens next</p>
                <div className="space-y-6">
                  {[
                    { n: "1", text: "We review your message within 1 business day" },
                    { n: "2", text: "We'll reach out to learn more about your business" },
                    { n: "3", text: "We recommend the right automation stack for you" },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0 mt-0.5">
                        {n}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-1">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Form */}
            <div>
              {success ? (
                <motion.div
                  className="flex flex-col items-center text-center py-12"
                  aria-live="polite"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <motion.div
                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </motion.div>
                  <motion.h3
                    className="text-2xl font-semibold text-foreground mb-2"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    Message Sent
                  </motion.h3>
                  <motion.p
                    className="text-muted-foreground leading-relaxed max-w-sm mb-8"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    Thanks for reaching out. We'll get back to you within one business day.
                  </motion.p>
                  <motion.div
                    className="flex flex-col sm:flex-row gap-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                  >
                    <button
                      type="button"
                      onClick={() => setShowBookingModal(true)}
                      className="px-5 py-2.5 text-sm font-semibold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      Want help choosing your AI services?
                    </button>
                    <a
                      href="mailto:support@clientsurgesystems.com"
                      className="px-5 py-2.5 text-sm font-semibold text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Email us directly
                    </a>
                  </motion.div>
                </motion.div>
              ) : (
                <form action="/contact" method="post" onSubmit={handleSubmit} className="space-y-8" noValidate>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 bg-foreground rounded-sm" />
                    <h2 className="text-xs font-bold uppercase tracking-widest text-foreground">Send a Message</h2>
                  </div>

                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700" role="alert">
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
                  />
                  
                  {/* Two-Column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="contact-full-name" className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                        Full Name <span className="text-red-500">*</span>
                      </label>
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
                        className="w-full bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-2 text-foreground placeholder:text-muted-foreground"
                      />
                      {errors.full_name && <p id="contact-full-name-error" className="text-red-500 text-xs mt-2">{errors.full_name}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                        Email <span className="text-red-500">*</span>
                      </label>
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
                        className="w-full bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-2 text-foreground placeholder:text-muted-foreground"
                      />
                      {errors.email && <p id="contact-email-error" className="text-red-500 text-xs mt-2">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Second Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="contact-phone" className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                        Phone
                      </label>
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
                        className="w-full bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-2 text-foreground placeholder:text-muted-foreground"
                      />
                      {errors.phone && <p id="contact-phone-error" className="text-red-500 text-xs mt-2">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="contact-business-type" className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                        Business Type
                      </label>
                      <select
                        id="contact-business-type"
                        name="business_type"
                        value={form.business_type}
                        onChange={handleChange}
                        className="w-full bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-2 text-foreground"
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

                  {/* Pain Points */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-4">
                      What's your biggest challenge? <span className="font-normal normal-case text-muted-foreground text-[0.65rem]">(pick all that apply)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PAIN_POINTS.map((pain) => {
                        const active = selectedPains.includes(pain);
                        return (
                          <button
                            key={pain}
                            type="button"
                            onClick={() => togglePain(pain)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              active
                                ? "bg-primary text-white"
                                : "bg-card text-muted-foreground border border-border hover:border-primary/30"
                            }`}
                          >
                            {active && "✓ "}{pain}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
                      Message <span className="text-red-500">*</span>
                    </label>
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
                      className="w-full bg-transparent border-b border-border focus:border-primary focus:outline-none transition-colors py-2 text-foreground placeholder:text-muted-foreground resize-none font-inter"
                    />
                    {errors.message && <p id="contact-message-error" className="text-red-500 text-xs mt-2">{errors.message}</p>}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="cs-btn-primary w-full mt-8 inline-flex items-center justify-center gap-2"
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                  </button>

                  <div className="space-y-3 text-center text-xs text-muted-foreground">
                    <p>No spam. No pressure. Just a thoughtful reply from our team.</p>
                    <p>
                      We respect your privacy. See our{" "}
                      <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">Privacy Policy</a>.
                    </p>
                  </div>
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