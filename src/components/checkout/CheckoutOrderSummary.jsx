import { ArrowRight, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import CheckoutSocialProof from "@/components/checkout/CheckoutSocialProof";

function extractPrice(str) {
  const match = String(str).match(/\$[\d,]+/);
  return match ? match[0] : "";
}

export default function CheckoutOrderSummary({
  plans,
  selectedPlanId,
  onSelectPlan,
  onCheckout,
  loading,
  error,
  termsAgreed,
  step = 1,
}) {
  const [showFeatures, setShowFeatures] = useState(false);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const monthlyPrice = selectedPlan?.price || "";
  const setupPrice = extractPrice(selectedPlan?.setup || "");
  const buttonLabel = step >= 2 ? "AGREE & SUBMIT" : "AGREE & NEXT";

  return (
    <div
      className="rounded-xl bg-white p-5 shadow-md border border-[#eee]"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}
    >
      <h3 className="text-base font-bold text-[#333] mb-4">Order Summary</h3>

      {/* Plan selector pills */}
      <div className="flex gap-2 mb-4">
        {plans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              onClick={() => onSelectPlan(plan.id)}
              className="flex-1 px-2 py-2 text-xs font-bold rounded-md border-2 transition-all"
              style={{
                borderColor: isSelected ? "#005691" : "#e5e7eb",
                background: isSelected ? "#005691" : "#ffffff",
                color: isSelected ? "#ffffff" : "#666666",
              }}
            >
              {plan.title.replace(" System", "")}
            </button>
          );
        })}
      </div>

      {/* Plan name + price */}
      <div className="flex items-start justify-between mb-1">
        <span className="text-sm font-bold" style={{ color: "#005691" }}>
          {selectedPlan?.title}
        </span>
        <span className="text-sm font-bold text-[#333]">{monthlyPrice}/mo</span>
      </div>

      {/* View Features toggle */}
      <button
        onClick={() => setShowFeatures(!showFeatures)}
        className="text-xs font-semibold flex items-center gap-1"
        style={{ color: "#005691" }}
      >
        {showFeatures ? "Hide Features" : "View Features"}
        {showFeatures ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showFeatures && (
        <ul className="space-y-1.5 mt-2 mb-4">
          {selectedPlan?.features.map((feature) => (
            <li key={feature} className="text-xs text-[#666] flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#005691] flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Automatic Renewal box */}
      <div className="rounded-lg p-3 mt-3" style={{ background: "#eef6ff" }}>
        <p className="text-xs font-bold text-[#333] mb-2">Automatic Renewal:</p>
        <ul className="space-y-1.5">
          <li className="text-xs text-[#666] flex items-start gap-2">
            <span className="text-[#005691] mt-0.5">•</span>
            <span>Your subscription automatically renews monthly on the same calendar day.</span>
          </li>
          <li className="text-xs text-[#666] flex items-start gap-2">
            <span className="text-[#005691] mt-0.5">•</span>
            <span>You may cancel anytime by contacting support or through your client portal.</span>
          </li>
          <li className="text-xs text-[#666] flex items-start gap-2">
            <span className="text-[#005691] mt-0.5">•</span>
            <span>See our <a href="/refund-policy" className="text-[#005691] underline">cancellation policy</a> for full details.</span>
          </li>
        </ul>
      </div>

      {/* Setup + Total */}
      <div className="border-t border-[#eee] pt-3 mt-3 space-y-1.5">
        <div className="flex justify-between text-xs text-[#666]">
          <span>One-Time Setup</span>
          <span>{setupPrice}</span>
        </div>
        <div className="flex justify-between text-sm font-bold text-[#333]">
          <span>Total Due Today</span>
          <span>{setupPrice}</span>
        </div>
      </div>

      {/* Submit button */}
      <button
        onClick={onCheckout}
        disabled={loading || !termsAgreed}
        className="w-full mt-5 py-3.5 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all"
        style={{
          background: loading || !termsAgreed ? "#9cb3c9" : "#005691",
          cursor: loading || !termsAgreed ? "not-allowed" : "pointer",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Redirecting to Stripe...
          </>
        ) : (
          <>
            {buttonLabel}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {!termsAgreed && (
        <p className="text-xs text-[#999] text-center mt-2">
          Check the terms box to continue
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 leading-relaxed">{error}</p>
        </div>
      )}

      {/* Finding #92: Social proof + Finding #103: Money-back guarantee at checkout */}
      {step === 2 && <CheckoutSocialProof />}
    </div>
  );
}