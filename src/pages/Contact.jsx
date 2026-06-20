import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
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

      {/* Split Layout Container */}
      <div className="flex min-h-[calc(100vh-200px)]">
        {/* LEFT: Dark sidebar with contact info */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-16">
          <div>
            <div className="mb-12">
              <div className="text-2xl font-bold mb-8 flex items-center gap-2">
                <div className="w-1 h-8 bg-primary rounded-sm" />
                ClientSurge
              </div>
              <div className="border-b border-slate-700 pb-8 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                    <a href="tel:+16025843227" className="hover:text-primary transition">
                      (602) 584-3227
                    </a>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400">SALES</p>
                      <a href="mailto:support@clientsurgesystems.com" className="hover:text-primary transition block text-sm">
                        support@clientsurgesystems.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm">Phoenix, Arizona</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info text */}
            <div className="text-sm text-slate-400 leading-relaxed">
              <p className="mb-4">
                {industryContext 
                  ? `Need help automating your ${industryContext.label.toLowerCase()}? We're here to discuss your lead flow and recommend the right automation stack.`
                  : "Have questions? We'd love to hear from you. Send us a message and we'll get back to you within one business day."
                }
              </p>
              <p>Ready to transform how you handle leads and follow-ups?</p>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-6">
            <a href="#" className="text-primary hover:text-white transition">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" className="text-primary hover:text-white transition">
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* RIGHT: White form area */}
        <div className="w-full lg:w-1/2 bg-white p-8 md:p-16 flex items-center justify-center">
          <div className="w-full max-w-md">
            {success ? (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                >
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </motion.div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Received</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Thanks for reaching out. We'll get back to you within one business day.
                </p>
                <button
                  type="button"
                  onClick={() => window.location.href = "/"}
                  className="px-6 py-2.5 border border-slate-300 text-slate-900 font-semibold rounded hover:bg-slate-50 transition"
                >
                  Back to Home
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="mb-10">
                  <p className="text-sm font-semibold text-slate-600 tracking-widest uppercase mb-2">Get in Touch</p>
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-10 bg-primary rounded-sm" />
                    <h1 className="text-4xl font-black text-slate-900">CONTACT</h1>
                  </div>
                </div>

                <p className="text-slate-700 text-sm mb-8 leading-relaxed">
                  We would love to hear from you! Send us a message and we'll get right back in touch.
                </p>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}

                <input
                  type="text"
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  className="hidden"
                  tabIndex={-1}
                />

                {/* First Name & Last Name */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Jane"
                      className="w-full border-b border-slate-300 focus:border-primary outline-none py-2 text-slate-900 placeholder:text-slate-400 transition"
                      aria-invalid={Boolean(errors.full_name)}
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      placeholder="Smith"
                      className="w-full border-b border-slate-300 focus:border-primary outline-none py-2 text-slate-900 placeholder:text-slate-400 transition"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                      Phone No.
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(555) 000-0000"
                      className="w-full border-b border-slate-300 focus:border-primary outline-none py-2 text-slate-900 placeholder:text-slate-400 transition"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@business.com"
                      className="w-full border-b border-slate-300 focus:border-primary outline-none py-2 text-slate-900 placeholder:text-slate-400 transition"
                      aria-invalid={Boolean(errors.email)}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 block">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your business and what you're looking for..."
                    rows={4}
                    className="w-full border-b border-slate-300 focus:border-primary outline-none py-2 text-slate-900 placeholder:text-slate-400 transition resize-none"
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                {/* Pain Points */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 block">
                    What's your biggest challenge?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_POINTS.map((pain) => {
                      const active = selectedPains.includes(pain);
                      return (
                        <button
                          key={pain}
                          type="button"
                          onClick={() => togglePain(pain)}
                          className={`px-3 py-1.5 text-xs font-medium rounded transition ${
                            active
                              ? "bg-primary text-white"
                              : "border border-slate-300 text-slate-700 hover:border-primary hover:text-primary"
                          }`}
                        >
                          {active && "✓ "}{pain}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-32 px-6 py-3 border-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wide hover:bg-slate-900 hover:text-white transition disabled:opacity-70 mt-8"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "SEND"}
                </button>

                <p className="text-xs text-slate-500 mt-6">
                  No spam, no pressure. Just thoughtful replies from our team.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <MobileCallBar />
      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </div>
  );
}