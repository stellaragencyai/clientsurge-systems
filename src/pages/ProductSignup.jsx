import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { trackCTA } from "@/lib/analytics";

const PLANS = [
  {
    id: "starter_system",
    title: "Starter System",
    price: "$497",
    setup: "$797 one-time",
    description: "Response and missed-call recovery foundation.",
    features: ["Lead capture", "Instant lead response", "Missed-call text-back", "CRM handoff where supported", "Basic follow-up"],
  },
  {
    id: "growth_system",
    title: "Growth System",
    price: "$997",
    setup: "$1,297 one-time",
    description: "Response, follow-up, and booking system.",
    features: ["Everything in Starter", "AI scheduling handoff", "Multi-step SMS/email follow-up", "Booking automation", "Client dashboard"],
    recommended: true,
  },
  {
    id: "pro_system",
    title: "Pro System",
    price: "$1,997",
    setup: "$2,497 one-time",
    description: "Full lead recovery and automation layer.",
    features: ["Everything in Growth", "Website design and build", "Lead reactivation", "Advanced reporting", "Priority setup"],
  },
];

const FORM_STORAGE_KEY = "clientsurge_signup_form";
const REQUIRED_FIELDS = ["fullName", "email", "phone"];

function validateField(field, value) {
  if (!REQUIRED_FIELDS.includes(field)) return "";
  if (!value || !value.trim()) return "This field is required.";
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address.";
  if (field === "phone" && value.replace(/\D/g, "").length < 10) return "Please enter a valid phone number.";
  return "";
}

export default function ProductSignup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pkgParam = searchParams.get("package");
  const selectedPlanId = PLANS.some((p) => p.id === pkgParam) ? pkgParam : "starter_system";
  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId);
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

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);
  useEffect(() => { trackCTA("product_signup_view", "product_signup", { package_id: selectedPlanId }); }, [selectedPlanId]);
  useEffect(() => { try { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData)); } catch {} }, [formData]);

  const setSelectedPlanId = (planId) => {
    setSearchParams({ package: planId }, { replace: true });
    trackCTA(`signup_select_${planId}`, "product_signup", { package_id: planId });
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
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
    if (!validateAll()) { setCheckoutError("Please correct the highlighted fields above."); return; }
    setCheckoutLoading(true);
    try {
      const response = await base44.functions.invoke("createCheckoutSession", {
        package_key: selectedPlanId,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        business_name: formData.businessName,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${selectedPlanId}`,
      });
      const url = response?.data?.url;
      if (!url) throw new Error(response?.data?.error || "No checkout URL returned.");
      trackCTA("checkout_redirect", "product_signup", { package_id: selectedPlanId });
      try { localStorage.removeItem(FORM_STORAGE_KEY); } catch {}
      window.location.href = url;
    } catch (err) {
      setCheckoutError(err.message || "Something went wrong. Please try again or contact support.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-[calc(var(--cs-nav-height)+24px)]">
        <section className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#00AEEF] mb-2">System Checkout</p>
            <h1 className="text-3xl font-bold text-black font-titles">Choose the AI system you want ClientSurge to install</h1>
            <p className="text-gray-600 mt-2">Pick Starter, Growth, or Pro. Then complete your business details so we can prepare setup and checkout.</p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6">Select a system</p>
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button key={plan.id} onClick={() => setSelectedPlanId(plan.id)} className="w-full text-left p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer" style={{ borderColor: isSelected ? "#00AEEF" : "#e5e7eb", background: isSelected ? "#f0f9ff" : "#ffffff", boxShadow: isSelected ? "0 4px 16px rgba(0,174,239,0.15)" : "none" }}>
                    {plan.recommended && <span className="inline-block mb-2 px-3 py-1 text-xs font-bold rounded-full" style={{ background: "rgba(0,174,239,0.12)", color: "#00AEEF" }}>★ Recommended</span>}
                    <div className="flex items-start justify-between"><div><h3 className="font-bold text-lg text-black">{plan.title}</h3><p className="text-sm text-gray-600 mt-1">{plan.description}</p></div>{isSelected && <CheckCircle2 className="w-5 h-5 text-[#00AEEF] flex-shrink-0 ml-3" />}</div>
                    <div className="mt-4"><span className="text-2xl font-extrabold text-black">{plan.price}</span><span className="text-sm text-gray-500 font-semibold">/mo</span><p className="text-xs text-gray-500 mt-1">{plan.setup}</p></div>
                  </button>
                );
              })}
              <div className="flex flex-wrap gap-3 pt-4"><span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.2)", color: "#00AEEF" }}><ShieldCheck className="h-3.5 w-3.5" /> Secure Stripe Checkout</span></div>
            </div>

            {selectedPlan && (
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200"><h4 className="font-bold text-black mb-4">What's included in {selectedPlan.title}:</h4><ul className="space-y-2">{selectedPlan.features.map((feature) => <li key={feature} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-[#00AEEF] font-bold mt-0.5">✓</span>{feature}</li>)}</ul></div>
                <div className="space-y-4"><p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Your information</p>{[["fullName", "Full Name", "John Doe"], ["businessName", "Business Name", "Your Business"], ["email", "Email", "owner@yourbusiness.com"], ["phone", "Phone", "(602) 555-0100"], ["industry", "Industry", "e.g., HVAC, Dental, Roofing"]].map(([field, label, placeholder]) => <div key={field}><label className="block text-sm font-semibold text-gray-700 mb-1">{label}{REQUIRED_FIELDS.includes(field) && <span className="text-red-500"> *</span>}</label><input type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} placeholder={placeholder} value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-black ${fieldErrors[field] ? "border-red-400 bg-red-50" : "border-gray-300"}`} />{fieldErrors[field] && <p className="text-xs text-red-600 mt-1">{fieldErrors[field]}</p>}</div>)}</div>
                {checkoutError && <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3"><AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-700">{checkoutError}</p></div>}
                <button onClick={handleCheckout} disabled={checkoutLoading} className="cs-btn-primary w-full px-6 py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2" style={{ opacity: checkoutLoading ? 0.7 : 1, cursor: checkoutLoading ? "not-allowed" : "pointer" }}>{checkoutLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <>Continue to Checkout <ArrowRight className="w-4 h-4" /></>}</button>
                <p className="text-xs text-gray-500 text-center">Secure Stripe checkout · Month-to-month billing</p>
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
