import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { trackCTA } from "@/lib/analytics";

// Inline plan data — single source of truth for the signup page UI
const PLANS = [
  {
    id: "starter_system",
    name: "Starter",
    title: "Starter System",
    price: "$497",
    setup: "$797 one-time",
    description: "Essential lead capture and response.",
    features: [
      "AI landing page setup",
      "Lead capture & notification",
      "Instant lead response SMS",
      "Missed-call text-back",
      "CRM handoff",
      "Basic follow-up",
    ],
  },
  {
    id: "growth_system",
    name: "Growth",
    title: "Growth System",
    price: "$997",
    setup: "$1,297 one-time",
    description: "Lead response, booking, and follow-up.",
    features: [
      "Everything in Starter",
      "AI scheduling agent",
      "Multi-step SMS/email follow-up",
      "Booking automation",
      "Review request system",
      "Client dashboard",
    ],
    recommended: true,
  },
  {
    id: "pro_system",
    name: "Pro",
    title: "Pro System",
    price: "$1,997",
    setup: "$2,497 one-time",
    description: "Complete lead recovery and automation.",
    features: [
      "Everything in Growth",
      "Full website design & build",
      "Lead reactivation system",
      "Advanced analytics & reporting",
      "Priority support & setup",
      "Expanded automation stack",
    ],
  },
];

const FORM_STORAGE_KEY = "clientsurge_signup_form";

const REQUIRED_FIELDS = ["fullName", "email", "phone"];

function validateField(field, value) {
  if (!REQUIRED_FIELDS.includes(field)) return "";
  if (!value || !value.trim()) return "This field is required.";
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Please enter a valid email address.";
  }
  if (field === "phone" && value.replace(/\D/g, "").length < 10) {
    return "Please enter a valid phone number.";
  }
  return "";
}

export default function ProductSignup() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Reactively read ?package= from URL — updates when URL changes
  const pkgParam = searchParams.get("package");
  const selectedPlanId = PLANS.some((p) => p.id === pkgParam) ? pkgParam : "starter_system";

  const setSelectedPlanId = (planId) => {
    setSearchParams({ package: planId }, { replace: true });
    trackCTA(`signup_select_${planId}`, "product_signup", { package_id: planId });
  };

  // Form state with localStorage persistence
  const [formData, setFormData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || "{}");
      return {
        fullName: saved.fullName || "",
        businessName: saved.businessName || "",
        email: saved.email || "",
        phone: saved.phone || "",
        industry: saved.industry || "",
      };
    } catch {
      return { fullName: "", businessName: "", email: "", phone: "", industry: "" };
    }
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // Track page view with package context
  useEffect(() => {
    trackCTA("product_signup_view", "product_signup", { package_id: selectedPlanId });
  }, [selectedPlanId]);

  // Auto-save form data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }, [formData]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on edit
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFieldBlur = (field) => {
    const error = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const validateAll = useCallback(() => {
    const errors = {};
    for (const field of REQUIRED_FIELDS) {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleCheckout = async () => {
    setCheckoutError(null);

    // FIX: Block checkout in iframe/preview context with clear messaging
    const inIframe = window.self !== window.top;
    const inPreview = window.location.hostname.includes("preview-sandbox");
    if (inIframe || inPreview) {
      setCheckoutError(
        inIframe
          ? "Checkout is not available inside the preview window. Please open this page in a new tab or publish your app to accept payments."
          : "Checkout is not available in preview-sandbox mode. Please publish your app to accept payments."
      );
      return;
    }

    if (!validateAll()) {
      setCheckoutError("Please correct the highlighted fields above.");
      return;
    }

    setCheckoutLoading(true);

    try {
      // FIX: Only send package_key — the backend resolves correct Stripe price IDs
      // from the canonical catalog. No hardcoded product_ids needed.
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
      if (url) {
        trackCTA("checkout_redirect", "product_signup", { package_id: selectedPlanId });
        // Clear saved form data on successful checkout redirect
        try {
          localStorage.removeItem(FORM_STORAGE_KEY);
        } catch {
          // noop
        }
        window.location.href = url;
      } else {
        throw new Error(response?.data?.error || "No checkout URL returned.");
      }
    } catch (err) {
      setCheckoutError(err.message || "Something went wrong. Please try again or contact support.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-20">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-black font-titles">Choose Your Plan</h1>
            <p className="text-gray-600 mt-2">Select the system that fits your needs. Switch plans anytime before checkout.</p>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Plan selection cards */}
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-6">
                Select a plan
              </p>
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="w-full text-left p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: isSelected ? "#00AEEF" : "#e5e7eb",
                      background: isSelected ? "#f0f9ff" : "#ffffff",
                      boxShadow: isSelected ? "0 4px 16px rgba(0,174,239,0.15)" : "none",
                    }}
                  >
                    {plan.recommended && (
                      <span
                        className="inline-block mb-2 px-3 py-1 text-xs font-bold rounded-full"
                        style={{ background: "rgba(0,174,239,0.12)", color: "#00AEEF" }}
                      >
                        ★ Recommended
                      </span>
                    )}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-black">{plan.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[#00AEEF] flex-shrink-0 ml-3" />
                      )}
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-extrabold text-black">{plan.price}</span>
                      <span className="text-sm text-gray-500 font-semibold">/mo</span>
                      <p className="text-xs text-gray-500 mt-1">{plan.setup}</p>
                    </div>
                  </button>
                );
              })}

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.2)", color: "#00AEEF" }}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Secure Stripe Checkout
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border" style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.2)", color: "#00AEEF" }}>
                  No Long-Term Contract
                </span>
              </div>
            </div>

            {/* Right: Selected plan summary + form */}
            {selectedPlan && (
              <div className="space-y-6">
                {/* Plan summary */}
                <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-black mb-4">What's included in {selectedPlan.title}:</h4>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature) => (
                      <li key={feature} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-[#00AEEF] font-bold mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Your information
                  </p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleFieldBlur("fullName")}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-black ${
                        fieldErrors.fullName ? "border-red-400 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your Business"
                      value={formData.businessName}
                      onChange={(e) => handleFieldChange("businessName", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-black ${
                        fieldErrors.email ? "border-red-400 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      onBlur={() => handleFieldBlur("phone")}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-black ${
                        fieldErrors.phone ? "border-red-400 bg-red-50" : "border-gray-300"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Industry
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., HVAC, Roofing, Dental"
                      value={formData.industry}
                      onChange={(e) => handleFieldChange("industry", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00AEEF] text-black"
                    />
                  </div>
                </div>

                {/* Error message */}
                {checkoutError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{checkoutError}</p>
                  </div>
                )}

                {/* Checkout button */}
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="cs-btn-primary w-full px-6 py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
                  style={{
                    opacity: checkoutLoading ? 0.7 : 1,
                    cursor: checkoutLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue to Checkout
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Secure Stripe checkout · No long-term contract · Month-to-month billing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
      <MobileCallBar />
    </div>
  );
}