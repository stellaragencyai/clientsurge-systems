import { useState, useEffect } from "react";
import { ArrowRight, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Canonical product_ids per plan — used as primary checkout input
const PLAN_PRODUCT_IDS = {
  starter_system: [
    "prod_UNi5RHiKNSTfQl",
    "prod_UNi5QL0bQl98If",
  ],
  growth_system: [
    "prod_UNi5RHiKNSTfQl",
    "prod_UNi5QL0bQl98If",
    "prod_UNi5N0l5MtaV0R",
    "prod_UNi5fLL2SyJJdP",
  ],
  pro_system: [
    "prod_UNi5RHiKNSTfQl",
    "prod_UNi5QL0bQl98If",
    "prod_UNi5N0l5MtaV0R",
    "prod_UNi5fLL2SyJJdP",
    "prod_UNi5PWv05ECzXI",
    "prod_UNi5dvOUm6Fi9i",
  ],
};

// Inline plan data — no external imports of config
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

export default function ProductSignup() {
  // Get ?package= parameter
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    businessName: "",
    email: "",
    phone: "",
    industry: "",
  });
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get("package");
    const valid = PLANS.some(p => p.id === pkg);
    setSelectedPlanId(valid ? pkg : "starter_system");
  }, []);

  const selectedPlan = PLANS.find(p => p.id === selectedPlanId);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckout = async () => {
    setCheckoutError(null);
    
    // Validate form
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim() || !selectedPlanId) {
      setCheckoutError("Please fill in all required fields.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const response = await base44.functions.invoke("createCheckoutSession", {
        product_ids: PLAN_PRODUCT_IDS[selectedPlanId],
        package_key: selectedPlanId,
        selected_package_type: selectedPlanId,
        customer_name: formData.fullName,
        customer_email: formData.email,
        customer_phone: formData.phone,
        business_name: formData.businessName,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${selectedPlanId}`,
      });

      const url = response?.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(response?.data?.error || "No checkout URL returned.");
      }
    } catch (err) {
      setCheckoutError(err.message || "Something went wrong. Please try again.");
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-black">Choose Your Plan</h1>
          <p className="text-gray-600 mt-1">Select the system that fits your needs.</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: Plan selection cards */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-6">
              Select a plan
            </p>
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  window.history.replaceState(null, "", `?package=${plan.id}`);
                }}
                className="w-full text-left p-6 rounded-lg border-2 transition-all"
                style={{
                  borderColor: selectedPlanId === plan.id ? "#00AEEF" : "#e5e7eb",
                  background: selectedPlanId === plan.id ? "#f0f9ff" : "#ffffff",
                }}
              >
                {plan.recommended && (
                  <span className="inline-block mb-2 px-3 py-1 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                    Recommended
                  </span>
                )}
                <h3 className="font-bold text-lg text-black">{plan.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-black">{plan.price}</p>
                  <p className="text-xs text-gray-500 mt-1">{plan.setup} setup</p>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Selected plan summary + form */}
          {selectedPlan && (
            <div className="space-y-8">
              {/* Plan summary */}
              <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-bold text-black mb-4">What's included:</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Your information
                </p>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                disabled={checkoutLoading || !selectedPlanId}
                className="w-full px-6 py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{
                  background: checkoutLoading ? "#999" : "#00AEEF",
                  opacity: checkoutLoading || !selectedPlanId ? 0.7 : 1,
                  cursor: checkoutLoading || !selectedPlanId ? "not-allowed" : "pointer",
                }}
              >
                {checkoutLoading ? "Processing..." : "Continue to Checkout"}
                {!checkoutLoading && <ArrowRight className="w-4 h-4" />}
              </button>

              <p className="text-xs text-gray-500 text-center">
                Secure Stripe checkout. No long-term contract. Month-to-month billing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}