import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Shield, X, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTA } from "@/lib/analytics";
import { setPageMetadata } from "@/lib/seo";
import { getPackageOffer, normalizePackageKey } from "@/lib/salesCatalog";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutFooter from "@/components/checkout/CheckoutFooter";
import AccountSignupForm from "@/components/checkout/AccountSignupForm";
import BillingInformationForm from "@/components/checkout/BillingInformationForm";

// ── Safe plan definitions with fallback defaults ──
// These are display-only; the backend (createCheckoutSession) resolves
// the actual Stripe price IDs from the canonical salesCatalog.
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
const REQUIRED_FIELDS_STEP1 = ["firstName", "lastName", "businessName", "email", "phone"];
const CHECKOUT_TIMEOUT_MS = 20000;

// ── Safe plan resolution — never throws, always returns a valid plan or null ──
function resolvePlan(pkgParam) {
  if (!pkgParam) return null;
  const raw = String(pkgParam).trim().toLowerCase().replace(/[\s_]+/g, "-");
  const match = PLANS.find((plan) => plan.aliases.some((alias) => alias.replace(/_/g, "-") === raw));
  return match || null;
}

function validateField(field, value) {
  if (!value || !value.trim()) return "This field is required.";
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Please enter a valid email address.";
  if (field === "phone" && value.replace(/\D/g, "").length < 10) return "Please enter a valid phone number.";
  return "";
}

function isFieldValid(field, value) {
  return !!(value && value.trim() && !validateField(field, value));
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
  try { return window.self !== window.top; } catch { return true; }
}

// ── Error fallback component for invalid/missing package ──
function PackageError({ pkgParam, onRetry }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}
        >
          <AlertCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#333] mb-3">Package Not Found</h1>
        <p className="text-sm text-[#666] mb-6 leading-relaxed">
          {pkgParam
            ? `We couldn't find a package matching "${pkgParam}". Please choose from our available systems.`
            : "No package was selected. Please choose from our available systems."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
            style={{ background: "linear-gradient(90deg, #0079c1, #005691)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Packages
          </Link>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border border-[#ccc] text-[#333] hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductSignup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pkgParam = searchParams.get("package") || searchParams.get("plan") || "";

  // ── Safe plan resolution with fallback ──
  const resolvedPlan = useMemo(() => resolvePlan(pkgParam), [pkgParam]);
  const selectedPlanId = resolvedPlan?.id || DEFAULT_PLAN_ID;
  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedPlanId) || PLANS.find((p) => p.id === DEFAULT_PLAN_ID),
    [selectedPlanId]
  );

  // ── Verify the package has valid Stripe config from salesCatalog ──
  const packageOffer = useMemo(() => {
    try {
      return getPackageOffer(selectedPlanId);
    } catch {
      return null;
    }
  }, [selectedPlanId]);

  const hasValidStripeConfig = !!(packageOffer?.setup_price_id && packageOffer?.monthly_price_id);

  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    // If package param exists but can't be resolved, show error
    if (pkgParam && !resolvedPlan) {
      setConfigError(`Unknown package: "${pkgParam}"`);
    } else if (selectedPlanId && !hasValidStripeConfig) {
      setConfigError(`Package "${selectedPlanId}" is missing Stripe pricing configuration. Please contact support.`);
    } else {
      setConfigError(null);
    }
  }, [pkgParam, resolvedPlan, selectedPlanId, hasValidStripeConfig]);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(FORM_STORAGE_KEY) || "{}");
      return {
        firstName: saved.firstName || (saved.fullName ? saved.fullName.split(" ")[0] : ""),
        lastName: saved.lastName || (saved.fullName ? saved.fullName.split(" ").slice(1).join(" ") : ""),
        mi: saved.mi || "",
        businessName: saved.businessName || "",
        email: saved.email || "",
        phone: saved.phone || "",
        industry: saved.industry || "",
        address: saved.address || "",
        city: saved.city || "",
        state: saved.state || "",
        zip: saved.zip || "",
        billingAddress: saved.billingAddress || "",
        billingCity: saved.billingCity || "",
        billingState: saved.billingState || "",
        billingZip: saved.billingZip || "",
      };
    } catch {
      return { firstName: "", lastName: "", mi: "", businessName: "", email: "", phone: "", industry: "", address: "", city: "", state: "", zip: "", billingAddress: "", billingCity: "", billingState: "", billingZip: "" };
    }
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [step1TermsAgreed, setStep1TermsAgreed] = useState(false);
  const [step1AddressConfirmed, setStep1AddressConfirmed] = useState(false);
  const [billingSameAsBusiness, setBillingSameAsBusiness] = useState(true);
  const [step2TermsAgreed, setStep2TermsAgreed] = useState(false);

  useEffect(() => {
    try {
      return setPageMetadata({
        title: "Complete Your ClientSurge System Signup",
        description: "Choose Starter, Growth, or Pro and continue to secure checkout for your ClientSurge AI automation system.",
        canonicalPath: "/product-signup",
        robots: "noindex,nofollow",
      });
    } catch (e) {
      console.warn("[ProductSignup] setPageMetadata failed:", e);
    }
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);
  useEffect(() => { try { trackCTA("product_signup_view", "product_signup", { package_id: selectedPlanId }); } catch {} }, [selectedPlanId]);
  useEffect(() => { try { localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData)); } catch {} }, [formData]);

  const setSelectedPlanId = useCallback((planId) => {
    const next = new URLSearchParams(searchParams);
    next.set("package", planId);
    next.delete("plan");
    setSearchParams(next, { replace: true });
    setCheckoutError(null);
    try { trackCTA(`signup_select_${planId}`, "product_signup", { package_id: planId }); } catch {}
  }, [searchParams, setSearchParams]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    if (checkoutError) setCheckoutError(null);
  };

  const validateStep1 = () => {
    const errors = {};
    for (const field of REQUIRED_FIELDS_STEP1) {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setCheckoutError(null);
    if (!step1TermsAgreed) { setCheckoutError("Please agree to the Terms of Service and Privacy Policy to continue."); return; }
    if (!validateStep1()) { setCheckoutError("Please complete the highlighted fields before continuing."); return; }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try { trackCTA("signup_step1_complete", "product_signup", { package_id: selectedPlanId }); } catch {}
  };

  const handleBack = () => {
    setCurrentStep(1);
    setCheckoutError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCheckout = async () => {
    setCheckoutError(null);

    // Guard: embedded preview iframe
    if (isEmbeddedPreview()) {
      try { window.open(window.location.href, "_blank", "noopener,noreferrer"); } catch {}
      setCheckoutError("Checkout must run in a full browser tab, not inside an embedded preview. A new tab was opened — continue checkout there.");
      return;
    }

    // Guard: terms agreed
    if (!step2TermsAgreed) { setCheckoutError("Please agree to the terms to continue."); return; }

    // Guard: form valid
    if (!validateStep1()) { setCurrentStep(1); setCheckoutError("Please complete the highlighted fields before checkout."); return; }

    // Guard: valid Stripe config
    if (!hasValidStripeConfig) {
      setCheckoutError(`This package (${selectedPlanId}) is missing Stripe pricing configuration. Please contact support or choose a different package.`);
      return;
    }

    setCheckoutLoading(true);
    try {
      const fullName = `${formData.firstName} ${formData.mi} ${formData.lastName}`.replace(/\s+/g, " ").trim();
      const payload = {
        package_key: selectedPlanId,
        customer_name: fullName,
        customer_email: formData.email.trim(),
        customer_phone: formData.phone.trim(),
        business_name: formData.businessName.trim(),
        industry: formData.industry.trim(),
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/product-signup?package=${selectedPlanId}`,
      };

      const response = await withCheckoutTimeout(base44.functions.invoke("createCheckoutSession", payload));
      const url = response?.data?.url || response?.url;

      if (!url) {
        throw new Error(response?.data?.error || response?.error || "No checkout URL returned by the server.");
      }

      try { trackCTA("checkout_redirect", "product_signup", { package_id: selectedPlanId }); } catch {}

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
      console.error("[ProductSignup] Checkout error:", err);
      setCheckoutError(`${getCheckoutErrorMessage(err)} Use "Retry Checkout" below, or Book help / Contact support if checkout does not recover.`);
      setCheckoutLoading(false);
    }
  };

  const handlePrimaryAction = () => {
    if (currentStep === 1) return handleNext();
    return handleCheckout();
  };

  const handleRetryCheckout = () => {
    setCheckoutError(null);
    handleCheckout();
  };

  // ── Render: invalid package fallback ──
  if (configError && !resolvedPlan) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="border-b border-[#eee]">
          <Link to="/" className="flex items-center justify-center gap-2 py-5">
            <Shield className="w-7 h-7" style={{ color: "#005691" }} fill="#005691" />
            <span className="text-xl font-bold text-[#333] tracking-tight">ClientSurge</span>
          </Link>
        </div>
        <PackageError
          pkgParam={pkgParam}
          onRetry={() => {
            const next = new URLSearchParams(searchParams);
            next.set("package", DEFAULT_PLAN_ID);
            next.delete("plan");
            setSearchParams(next, { replace: true });
          }}
        />
        <CheckoutFooter />
      </div>
    );
  }

  // ── Render: valid package (even if Stripe config warning exists, show the form) ──
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logo Header */}
      <div className="border-b border-[#eee]">
        <Link to="/" className="flex items-center justify-center gap-2 py-5">
          <Shield className="w-7 h-7" style={{ color: "#005691" }} fill="#005691" />
          <span className="text-xl font-bold text-[#333] tracking-tight">ClientSurge</span>
        </Link>
      </div>

      {/* Dismissible Banner */}
      {bannerVisible && (
        <div className="w-full" style={{ background: "#3e4750" }}>
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            <p className="text-xs text-white/90 text-center flex-1">
              Not sure which system fits your business?{" "}
              <Link to="/pricing" className="underline text-white font-semibold">Compare packages</Link>
            </p>
            <button onClick={() => setBannerVisible(false)} className="text-white/60 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stripe config warning (non-blocking) */}
      {configError && (
        <div className="w-full bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">{configError}</p>
          </div>
        </div>
      )}

      {/* Stepper */}
      <CheckoutStepper currentStep={currentStep} />

      {/* Two-column layout */}
      <main className="max-w-5xl mx-auto w-full px-4 pb-8 flex-1">
        <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 items-start">
          {/* Left column */}
          <div>
            {currentStep === 1 && (
              <AccountSignupForm
                formData={formData}
                fieldErrors={fieldErrors}
                handleFieldChange={handleFieldChange}
                termsAgreed={step1TermsAgreed}
                setTermsAgreed={setStep1TermsAgreed}
                addressConfirmed={step1AddressConfirmed}
                setAddressConfirmed={setStep1AddressConfirmed}
                isFieldValid={isFieldValid}
              />
            )}
            {currentStep === 2 && (
              <>
                <BillingInformationForm
                  formData={formData}
                  handleFieldChange={handleFieldChange}
                  billingSameAsBusiness={billingSameAsBusiness}
                  setBillingSameAsBusiness={setBillingSameAsBusiness}
                  termsAgreed={step2TermsAgreed}
                  setTermsAgreed={setStep2TermsAgreed}
                />
                <button
                  onClick={handleBack}
                  className="mt-4 text-sm font-semibold text-[#666] hover:text-[#005691] transition-colors"
                >
                  ← Back to Account Info
                </button>
              </>
            )}
          </div>

          {/* Right column - Order Summary */}
          <div className="md:sticky md:top-6">
            <CheckoutOrderSummary
              plans={PLANS}
              selectedPlanId={selectedPlanId}
              onSelectPlan={setSelectedPlanId}
              onCheckout={handlePrimaryAction}
              loading={checkoutLoading}
              error={checkoutError}
              termsAgreed={currentStep === 1 ? step1TermsAgreed : step2TermsAgreed}
              step={currentStep}
            />

            {/* Retry + help links */}
            {checkoutError && (
              <div className="mt-3 flex flex-col gap-2">
                <button
                  onClick={handleRetryCheckout}
                  disabled={checkoutLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: checkoutLoading ? "#9cb3c9" : "#005691" }}
                >
                  <RefreshCw className={`w-4 h-4 ${checkoutLoading ? "animate-spin" : ""}`} />
                  Retry Checkout
                </button>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link to="/book" className="text-xs font-bold text-[#005691] underline">Book help</Link>
                  <Link to="/contact" className="text-xs font-bold text-[#005691] underline">Contact support</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}