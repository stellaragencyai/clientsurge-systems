import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, ShieldCheck, HelpCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { trackCTA } from "@/lib/analytics";
import { setPageMetadata } from "@/lib/seo";

const PLANS = [
  {
    id: "starter_system",
    aliases: ["starter", "starter-system", "starter_system"],
    title: "Starter System",
    price: "$497",
    setup: "$797 one-time",
    description: "Response and missed-call recovery foundation.",
    features: ["Lead capture", "Instant lead response", "Missed-call text-back", "CRM handoff where supported", "Basic follow-up"],
  },
  {
    id: "growth_system",
    aliases: ["growth", "growth-system", "growth_system"],
    title: "Growth System",
    price: "$997",
    setup: "$1,297 one-time",
    description: "Response, follow-up, and booking system.",
    features: ["Everything in Starter", "AI scheduling handoff", "Multi-step SMS/email follow-up", "Booking automation", "Client dashboard"],
    recommended: true,
  },
  {
    id: "pro_system",
    aliases: ["pro", "pro-system", "pro_system", "elite", "elite_system"],
    title: "Pro System",
    price: "$1,997",
    setup: "$2,497 one-time",
    description: "Full lead recovery and automation layer.",
    features: ["Everything in Growth", "Website design and build", "Lead reactivation", "Advanced reporting", "Priority setup"],
  },
];

const DEFAULT_PLAN_ID = "growth_system";
const FORM_STORAGE_KEY = "clientsurge_signup_form";
const REQUIRED_FIELDS = ["fullName", "businessName", "email", "phone"];
const CHECKOUT_TIMEOUT_MS = 20000;

function normalizePlanParam(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  const match = PLANS.find((plan) => plan.aliases.some((alias) => alias.replace(/_/g, "-") === raw));
  return match?.id || DEFAULT_PLAN_ID;
}

function validateField(field, value) {
  if (!REQUIRED_FIELDS.includes(field)) return "";
  if (!value || !value.trim()) return "This field is required.";
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address.";
  if (field === "phone" && value.replace(/\D/g, "").length < 10) return "Please enter a valid phone number.";
  return "";
}

function getCheckoutErrorMessage(err) {
  const code = err?.data?.code || err?.code || "";
  const message = err?.data?.error || err?.message || "Checkout could not be started.";
  const requestId = err?.data?.request_id || "";
  return [message, code ? `Code: ${code}` : "", requestId ? `Request ID: ${requestId}` : ""].filter(Boolean).join(" ");
}

function withCheckoutTimeout(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Checkout timed out before Stripe returned a secure checkout link.")), CHECKOUT_TIMEOUT_MS);
    }),
  ]);
}

function isEmbeddedPreview() {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export default function ProductSignup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pkgParam = searchParams.get("package") || searchParams.get("plan") || "";
  const selectedPlanId = normalizePlanParam(pkgParam);
  const selectedPlan = useMemo(() => PLANS.find((p) => p.id === selectedPlanId) || PLANS.find((p) => p.id === DEFAULT_PLAN_ID), [selectedPlanId]);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || "{}");
      return { fullName: saved.fullName || "", businessName: saved.businessName || "", email: saved.email || "", phone: saved.phone || "", industry: saved.industry || "" };
    } catch {
      return { fullName: "", businessName: "", email: "", phone: "", industry: "" };
    }
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    return setPageMetadata({
      title: "Complete Your ClientSurge System Signup",
      description: "Choose Starter, Growth, or Pro and continue to secure checkout for your ClientSurge AI automation system.",
      canonicalPath: "/product-signup",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);
  useEffect(() => { trackCTA("product_signup_view", "product_signup", { package_id: selectedPlanId }); }, [selectedPlanId]);
  useEffect(() => { try { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData)); } catch {} }, [formData]);

  const setSelectedPlanId = (planId) => {
    const next = new URLSearchParams(searchParams);
    next.set("package", planId);
    next.delete("plan");
    setSearchParams(next, { replace: true });
    setCheckoutError(null);
    trackCTA(`signup_select_${planId}`, "product_signup", { package_id: planId });
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    if (checkoutError) setCheckoutError(null);
  };

  const validateAll = () => {
    const errors = {};
    for (const field of REQUIRED_FIELDS) {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    if (isEmbeddedPreview()) {
      try { window.open(window.location.href, "_blank", "noopener,noreferrer"); } catch {}
      setCheckoutError("Checkout must run in a full browser tab, not inside an embedded preview. I opened a new tab; continue checkout there.");
      return;
    }
    if (!validateAll()) { setCheckoutError("Please complete the highlighted fields before checkout."); return; }
    setCheckoutLoading(true);
    try {
      const payload = {
        package_key: selectedPlanId,
        customer_name: formData.fullName.trim(),
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        business_name: formData.businessName.trim(),
        industry: formData.industry.trim(),
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${selectedPlanId}`,
      };
      const response = await withCheckoutTimeout(base44.functions.invoke("createCheckoutSession", payload));
      const url = response?.data?.url || response?.url;
      if (!url) throw new Error(response?.data?.error || response?.error || "No checkout URL returned.");
      trackCTA("checkout_redirect", "product_signup", { package_id: selectedPlanId });
      try {
        sessionStorage.setItem("clientsurge:last-checkout-session", JSON.stringify({
          package_id: selectedPlanId,
          request_id: response?.data?.request_id || response?.request_id || "",
          session_id: response?.data?.session_id || response?.session_id || "",
          created_at: new Date().toISOString(),
        }));
        localStorage.removeItem(FORM_STORAGE_KEY);
      } catch {}
      window.location.assign(url);
    } catch (err) {
      setCheckoutError(`${getCheckoutErrorMessage(err)} Use Book help or Contact support below if checkout does not recover.`);
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5fbff] via-white to-white">
      <Navbar />
      <main className="pt-[calc(var(--cs-nav-height)+28px)]">
        <section className="border-b border-primary/10 bg-white/70">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Secure System Checkout</p>
            <h1 className="text-3xl md:text-5xl font-bold text-[#001B44] font-titles leading-tight">Complete your ClientSurge signup</h1>
            <p className="text-slate-600 mt-3 max-w-2xl leading-relaxed">Choose Starter, Growth, or Pro. Then enter your business details to create a secure checkout session.</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-12 items-start">
            <div className="rounded-2xl border border-primary/15 bg-white p-5 md:p-6 shadow-sm">
              <p className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-5">Select a system</p>
              <div className="space-y-4">
                {PLANS.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className="w-full text-left p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer" style={{ borderColor: isSelected ? "#00AEEF" : "#e5e7eb", background: isSelected ? "#f0f9ff" : "#ffffff", boxShadow: isSelected ? "0 4px 16px rgba(0,174,239,0.15)" : "none" }}>
                      {plan.recommended && <span className="inline-block mb-2 px-3 py-1 text-xs font-bold rounded-full" style={{ background: "rgba(0,174,239,0.12)", color: "#00AEEF" }}>Recommended</span>}
                      <div className="flex items-start justify-between gap-4">
                        <div><h3 className="font-bold text-lg text-[#001B44]">{plan.title}</h3><p className="text-sm text-slate-600 mt-1">{plan.description}</p></div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#00AEEF] flex-shrink-0 mt-1" />}
                      </div>
                      <div className="mt-4"><span className="text-2xl font-extrabold text-[#001B44]">{plan.price}</span><span className="text-sm text-slate-500 font-semibold">/mo</span><p className="text-xs text-slate-500 mt-1">{plan.setup}</p></div>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 pt-5"><span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.2)", color: "#00AEEF" }}><ShieldCheck className="h-3.5 w-3.5" /> Secure Stripe Checkout</span></div>
            </div>

            {selectedPlan && (
              <div className="space-y-6 rounded-2xl border border-primary/15 bg-white p-5 md:p-6 shadow-sm">
                <div className="p-5 bg-[#f8fcff] rounded-xl border border-primary/10"><h4 className="font-bold text-[#001B44] mb-4">What's included in {selectedPlan.title}:</h4><ul className="space-y-2">{selectedPlan.features.map((feature) => <li key={feature} className="text-sm text-slate-700 flex items-start gap-2"><span className="text-[#00AEEF] font-bold mt-0.5">✓</span>{feature}</li>)}</ul></div>
                <div className="space-y-4"><p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Your information</p>{[["fullName", "Full Name", "John Doe"], ["businessName", "Business Name", "Your Business"], ["email", "Email", "owner@example.com"], ["phone", "Phone", "(602) 555-0100"], ["industry", "Industry", "e.g., HVAC, Dental, Roofing"]].map(([field, label, placeholder]) => <div key={field}><label className="block text-sm font-semibold text-slate-700 mb-1">{label}{REQUIRED_FIELDS.includes(field) && <span className="text-red-500"> *</span>}</label><input type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} placeholder={placeholder} value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 text-slate-900 ${fieldErrors[field] ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`} />{fieldErrors[field] && <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>}</div>)}</div>
                {checkoutError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex gap-3"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700 leading-relaxed">{checkoutError}</p></div>
                    <div className="mt-3 flex flex-wrap gap-2 pl-8"><Link to="/book" className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">Book help</Link><Link to="/contact" className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">Contact support</Link></div>
                  </div>
                )}
                <button onClick={handleCheckout} disabled={checkoutLoading} className="cs-btn-primary w-full px-6 py-3.5 rounded-full font-bold text-white transition-all flex items-center justify-center gap-2" style={{ opacity: checkoutLoading ? 0.7 : 1, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>{checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating checkout...</> : <>Continue to Secure Checkout <ArrowRight className="w-4 h-4" /></>}</button>
                <div className="flex flex-col gap-2 text-center text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-center"><span>Secure Stripe checkout</span><span className="hidden sm:inline">•</span><span>Month-to-month billing</span></div>
                <Link to="/book" className="flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"><HelpCircle className="w-4 h-4" /> Need help choosing?</Link>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <MobileCallBar />
    </div>
  );
}
