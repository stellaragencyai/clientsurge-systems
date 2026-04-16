import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";

export default function Contact() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    business_type: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.message.trim()) e.message = "Required";
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await base44.functions.invoke("sendContactEmail", form);
      setSuccess(true);
    } catch (err) {
      setErrors({ submit: "Something went wrong. Please try again or email us directly." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 px-6 text-center" style={{ background: "linear-gradient(to bottom, hsl(40,8%,88%), hsl(0,0%,100%))" }}>
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Get In Touch</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
          Let's Talk About Your Business
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Have a question or want to learn more? Send us a message and we'll get back to you within one business day.
        </p>
      </section>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Info */}
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
                    <a href="mailto:system@clientsurgesystems.com" className="text-sm text-foreground hover:text-primary transition-colors">
                      system@clientsurgesystems.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Phone</p>
                    <a href="mailto:system@clientsurgesystems.com" className="text-sm text-foreground hover:text-primary transition-colors">
                      system@clientsurgesystems.com
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

            <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5">
              <p className="text-sm font-semibold text-foreground mb-2">Prefer a live walkthrough?</p>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                Skip the form and book a free 15-min demo. We'll show you exactly how the system works for your business.
              </p>
              <a
                href="/book"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 14px rgba(120,70,20,0.3)", border: "none", cursor: "pointer", textDecoration: "none" }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", padding: "0 20px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.8rem" }}>
                  Book a Free Demo <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            {success ? (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Thanks for reaching out. We'll get back to you within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">Send a Message</h3>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {errors.submit}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Full Name <span className="text-red-500">*</span></label>
                    <input
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                      className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background ${errors.full_name ? "border-red-400" : "border-input"}`}
                    />
                    {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="jane@business.com"
                      className={`w-full h-11 rounded-xl border px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background ${errors.email ? "border-red-400" : "border-input"}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(555) 000-0000"
                      className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Business Type</label>
                    <select
                      name="business_type"
                      value={form.business_type}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                    >
                      <option value="">Select one…</option>
                      <option>Med Spa / Aesthetic Clinic</option>
                      <option>Wellness Studio</option>
                      <option>Real Estate</option>
                      <option>HVAC / Home Services</option>
                      <option>Contractor / Trades</option>
                      <option>Local Service Business</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Message <span className="text-red-500">*</span></label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your business and what you're looking for…"
                    rows={5}
                    className={`w-full rounded-xl border px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition bg-background resize-none ${errors.message ? "border-red-400" : "border-input"}`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 18px rgba(120,70,20,0.35)", border: "none", cursor: "pointer", width: "100%" }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem", opacity: loading ? 0.7 : 1 }}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send Message <ArrowRight className="w-4 h-4" /></>}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}