import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import FormInput from "../components/forms/FormInput";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import SectionHeader from "../components/design-system/SectionHeader";
import { setPageMetadata } from "@/lib/seo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;

function Field({ label, required, error, children }) {
  return (
    <div className="group">
      <label className="block mb-2 text-sm font-semibold text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

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
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
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
      <main className="flex-1 px-6 py-12 pt-[calc(var(--cs-nav-height)+2rem)] sm:px-10 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <aside className="rounded-2xl border border-primary/15 bg-primary/5 p-8">
            <p className="cs-section-eyebrow mb-4">Get In Touch</p>
            <h1 className="font-titles text-3xl font-black text-foreground mb-4">Contact ClientSurge Systems</h1>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Ask a question, request a walkthrough, or discuss your lead flow and automation needs.
            </p>
            <div className="space-y-4 text-sm">
              <a href="tel:+16025843227" className="flex items-center gap-3 text-foreground hover:text-primary">
                <Phone className="w-4 h-4" /> (602) 584-3227
              </a>
              <a href="mailto:support@clientsurgesystems.com" className="flex items-center gap-3 text-foreground hover:text-primary">
                <Mail className="w-4 h-4" /> support@clientsurgesystems.com
              </a>
              <span className="flex items-center gap-3 text-foreground">
                <MapPin className="w-4 h-4" /> Phoenix, Arizona
              </span>
            </div>
            <Link to="/pricing" className="cs-btn-primary mt-8 inline-flex">
              View Packages <ArrowRight className="w-4 h-4" />
            </Link>
          </aside>

          <section className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
            {success ? (
              <div className="text-center py-8 md:py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-5" />
                <h2 className="text-3xl font-titles font-black text-foreground mb-3">Message Received</h2>
                <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-sm mx-auto">
                  Thanks for reaching out. We'll respond within one business day.
                </p>
                <Link to="/" className="cs-btn-primary">
                  Back to Home <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                <input
                  type="text"
                  name="website_url"
                  value={form.website_url}
                  onChange={handleChange}
                  className="hidden"
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} error={errors.full_name} required autoComplete="name" />
                  <FormInput label="Business Name" name="business_name" value={form.business_name} onChange={handleChange} autoComplete="organization" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormInput label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} error={errors.email} required autoComplete="email" />
                  <FormInput label="Phone No." type="tel" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="(123) 456-7890" autoComplete="tel" />
                </div>
                <FormInput label="Business Type / Industry" name="business_type" value={form.business_type} onChange={handleChange} placeholder="e.g., HVAC, Dental, Roofing" />
                <Field label="Message" required error={errors.message}>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    aria-invalid={Boolean(errors.message)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-primary focus:shadow-[0_0_0_4px_hsla(199,100%,47%,0.12)] resize-none"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={loading}
                  className="cs-btn-primary disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
                  style={{ minHeight: "52px", paddingLeft: "2rem", paddingRight: "2rem" }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><span>Send Message</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
