import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock3,
  ShieldCheck,
  Sparkles,
  MessageSquareText,
} from "lucide-react";
import { Link } from "react-router-dom";
import FormInput from "../components/forms/FormInput";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import MobileCallBar from "../components/landing/MobileCallBar";
import FloatingConfirmation from "@/components/ui/FloatingConfirmation";
import { setPageMetadata } from "@/lib/seo";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+.-]+$/;

function Field({ label, required, error, children }) {
  return (
    <div className="group">
      <label className="mb-2 block text-sm font-semibold text-slate-900">
        {label} {required && <span className="text-[#00AEEF]">*</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}

const contactMethods = [
  { Icon: Phone, label: "Phone", value: "(602) 584-3227", href: "tel:+16025843227" },
  { Icon: Mail, label: "Email", value: "support@clientsurgesystems.com", href: "mailto:support@clientsurgesystems.com" },
  { Icon: MapPin, label: "Location", value: "Phoenix, Arizona" },
];

const trustPoints = [
  { Icon: Clock3, title: "Fast response", detail: "Replies within one business day." },
  { Icon: ShieldCheck, title: "No-pressure clarity", detail: "We help identify the right next step." },
  { Icon: Sparkles, title: "Built for operators", detail: "Designed around local service-business lead flow." },
];

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
  const [showFloat, setShowFloat] = useState(false);
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

  const allValid = Boolean(
    form.full_name.trim() &&
    EMAIL_REGEX.test(form.email) &&
    form.phone.trim() && form.phone.replace(/\D/g, '').length >= 10 &&
    form.business_name.trim() &&
    form.business_type.trim() &&
    form.message.trim()
  );

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
      setShowFloat(true);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again or email us directly." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white">
      <Navbar />
      <main className="relative flex-1 overflow-hidden pt-[calc(var(--cs-nav-height)+2.25rem)]">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_22%_12%,rgba(0,174,239,0.18),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(0,59,143,0.12),transparent_30%),linear-gradient(180deg,#f8fcff_0%,#ffffff_42%,#f3faff_100%)]" />
        <div className="absolute left-1/2 top-12 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-[#00AEEF]/10 blur-3xl" />

        <section className="px-6 pb-10 sm:px-10 md:px-12">
          <div className="mx-auto mb-10 max-w-4xl">
            <div className="cs-section-header cs-section-header--center">
              <p className="cs-section-eyebrow">Get in touch</p>
              <div className="cs-section-title-row cs-section-header--center">
                <span className="cs-section-bar" />
                <h1 className="cs-section-title">
                  Let's map the fastest path to a cleaner lead system.
                </h1>
              </div>
              <p className="cs-section-subtitle">
                Ask a question, request a walkthrough, or tell us where leads are slipping through the cracks.
                We will help you identify the most practical next step.
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <aside className="relative overflow-hidden rounded-[2rem] cs-glow-card p-8 backdrop-blur-xl md:p-10">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#00AEEF]/15 blur-2xl" />
              <div className="absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-[#003B8F]/10 blur-2xl" />

              <div className="relative">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0079c1] shadow-sm">
                  <MessageSquareText className="h-3.5 w-3.5" /> Contact command panel
                </span>
                <h2 className="font-titles text-3xl font-black leading-[1.02] tracking-[-0.04em] text-foreground md:text-4xl">
                  Contact ClientSurge Systems
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 md:text-base">
                  Talk through your website, missed calls, follow-up gaps, booking flow, or automation launch plan.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Response within one business day
                </div>

                <div className="mt-8 space-y-3">
                  {contactMethods.map(({ Icon, label, value, href }) => {
                    const content = (
                      <>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-200 bg-white text-[#0079c1] shadow-sm">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</span>
                          <span className="mt-1 block text-sm font-bold text-slate-900">{value}</span>
                        </span>
                      </>
                    );

                    return href ? (
                      <a key={label} href={href} className="flex items-center gap-3 rounded-2xl border border-transparent p-2 transition hover:border-sky-200 hover:bg-white/70">
                        {content}
                      </a>
                    ) : (
                      <div key={label} className="flex items-center gap-3 rounded-2xl p-2">
                        {content}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 rounded-3xl border border-sky-200/80 bg-gradient-to-br from-white to-sky-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00AEEF]">Best next step</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Not sure what you need yet? Start with the package comparison, then send us your current lead-flow problem.
                  </p>
                  <Link to="/pricing" className="cs-btn-primary cs-cta-glow mt-5 inline-flex">
                    View Packages <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.14)] backdrop-blur-xl md:p-9">
              {success ? (
                <div className="px-4 py-10 text-center md:py-16">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <h2 className="font-titles text-3xl font-black text-slate-950">Message Received</h2>
                  <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-slate-600">
                    {`Thanks for reaching out. We'll respond within one business day.`}
                  </p>
                  <Link to="/" className="cs-btn-primary cs-cta-glow mt-8 inline-flex">
                    Back to Home <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-7">
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-[#00AEEF]">Send a message</p>
                    <h2 className="font-titles text-4xl font-black tracking-[-0.04em] text-foreground md:text-5xl">Contact Us</h2>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                      Share the basics and we will respond with a clear next step for your business.
                    </p>
                  </div>

                  {errors.submit && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
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

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4 md:p-5">
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Contact details</p>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <FormInput label="Full Name" name="full_name" value={form.full_name} onChange={handleChange} error={errors.full_name} required autoComplete="name" allValid={allValid} />
                      <FormInput label="Business Name" name="business_name" value={form.business_name} onChange={handleChange} autoComplete="organization" allValid={allValid} />
                      <FormInput label="Email Address" type="email" name="email" value={form.email} onChange={handleChange} error={errors.email} required autoComplete="email" allValid={allValid} />
                      <FormInput label="Phone No." type="tel" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="(123) 456-7890" autoComplete="tel" allValid={allValid} />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-slate-50/60 p-4 md:p-5">
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">Business context</p>
                    <div className="space-y-5">
                      <FormInput label="Business Type / Industry" name="business_type" value={form.business_type} onChange={handleChange} placeholder="e.g., HVAC, Dental, Roofing" allValid={allValid} />
                      <Field label="Message" required error={errors.message}>
                        <div className="relative">
                          <textarea
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            rows={5}
                            aria-invalid={Boolean(errors.message)}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-base text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-[#00AEEF] focus:shadow-[0_0_0_4px_rgba(0,174,239,0.12)]"
                            placeholder="Tell us what is not working: missed calls, slow follow-up, poor booking, low website conversion, or something else."
                          />
                          {allValid && !errors.message && form.message.trim() && (
                            <CheckCircle2 className="absolute right-3 top-3 w-5 h-5 text-green-500 flex-shrink-0 pointer-events-none" />
                          )}
                        </div>
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="submit"
                      disabled={loading}
                      className="cs-btn-primary cs-cta-glow disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ minHeight: "52px", paddingLeft: "2rem", paddingRight: "2rem" }}
                    >
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><span>Send Message</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <p className="text-sm font-semibold text-slate-500">No spam. No pressure. Just a clear next step.</p>
                  </div>
                </form>
              )}
            </section>
          </div>

          <div className="mx-auto mt-10 grid max-w-6xl gap-4 md:grid-cols-3">
            {trustPoints.map(({ Icon, title, detail }) => (
              <div key={title} className="rounded-3xl border border-sky-100 bg-white/80 p-5 shadow-[0_16px_50px_rgba(15,23,42,0.07)] backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#0079c1]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-base font-black text-slate-950">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-slate-600">{detail}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-sky-200/40 bg-[linear-gradient(135deg,#003B8F_0%,#0079c1_48%,#00AEEF_100%)] px-6 py-14 text-white sm:px-10 md:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_82%_35%,rgba(255,255,255,0.16),transparent_24%)]" />
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-white/75">ClientSurge Systems</p>
              <h2 className="font-titles max-w-2xl text-3xl font-black leading-tight tracking-[-0.04em] md:text-5xl">
                AI automation systems for faster lead response, follow-up, booking, and customer reactivation.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[#006bb0] shadow-[0_18px_45px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 cs-cta-glow" style={{ color: "#006bb0" }}>
                Compare Packages <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/automations" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15">
                View Automation Stack
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
      <FloatingConfirmation
        show={showFloat}
        onDismiss={() => setShowFloat(false)}
        title="Message Received"
        message="Thanks for reaching out. We'll respond within one business day."
      />
    </div>
  );
}