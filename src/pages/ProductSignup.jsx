import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Shield, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { trackCTA } from "@/lib/analytics";
import { setPageMetadata } from "@/lib/seo";
import CheckoutStepper from "@/components/checkout/CheckoutStepper";
import CheckoutOrderSummary from "@/components/checkout/CheckoutOrderSummary";
import CheckoutFooter from "@/components/checkout/CheckoutFooter";
import AccountSignupForm from "@/components/checkout/AccountSignupForm";

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
const REQUIRED_FIELDS = ["firstName", "lastName", "businessName", "email", "phone"];
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

export default function ProductSignup() {
  const [searchParams, setSearchParams] = useSearchParams();
  const pkgParam = searchParams.get("package") || searchParams.get("plan") || "";
  const selectedPlanId = normalizePlanParam(pkgParam);
  const selectedPlan = useMemo(() => PLANS.find((p) => p.id === selectedPlanId) || PLANS.find((p) => p.id === DEFAULT_PLAN_ID), [selectedPlanId]);

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
      };
    } catch {
      return { firstName: "", lastName: "", mi: "", businessName: "", email: "", phone: "", industry: "", address: "", city: "", state: "", zip: "" };
    }
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

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
    if (!termsAgreed) { setCheckoutError("Please agree to the Terms of Service and Privacy Policy to continue."); return; }
    if (!validateAll()) { setCheckoutError("Please complete the highlighted fields before checkout."); return; }
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

      {/* Stepper */}
      <CheckoutStepper currentStep={1} />

      {/* Two-column layout */}
      <main className="max-w-5xl mx-auto w-full px-4 pb-8 flex-1">
        <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-6 lg:gap-8 items-start">
          <AccountSignupForm
            formData={formData}
            fieldErrors={fieldErrors}
            handleFieldChange={handleFieldChange}
            termsAgreed={termsAgreed}
            setTermsAgreed={setTermsAgreed}
            addressConfirmed={addressConfirmed}
            setAddressConfirmed={setAddressConfirmed}
            isFieldValid={isFieldValid}
          />
          <div className="md:sticky md:top-6">
            <CheckoutOrderSummary
              plans={PLANS}
              selectedPlanId={selectedPlanId}
              onSelectPlan={setSelectedPlanId}
              onCheckout={handleCheckout}
              loading={checkoutLoading}
              error={checkoutError}
              termsAgreed={termsAgreed}
            />
            {checkoutError && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center">
                <Link to="/book" className="text-xs font-bold text-[#005691] underline">Book help</Link>
                <Link to="/contact" className="text-xs font-bold text-[#005691] underline">Contact support</Link>
              </div>
            )}
          </div>
        </div>
      </main>

      <CheckoutFooter />
    </div>
  );
}