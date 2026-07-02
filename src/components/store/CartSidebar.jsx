import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { AI_PRODUCTS } from "@/lib/aiProducts";
import VoiceAgentUpsell from "./VoiceAgentUpsell";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

const COMPLEMENTARY_SERVICES = {
  instant_lead_response: ["missed_call_text_back", "nurture_sequence_14d", "ai_booking_agent"],
  missed_call_text_back: ["instant_lead_response", "ai_booking_agent", "nurture_sequence_14d"],
  nurture_sequence_14d: ["instant_lead_response", "lead_reactivation", "ai_booking_agent"],
  ai_booking_agent: ["instant_lead_response", "nurture_sequence_14d", "review_request"],
  lead_reactivation: ["nurture_sequence_14d", "instant_lead_response", "review_request"],
};

const SIGNUP_FORM_STORAGE_KEY = "clientsurge_signup_form";

function packageSignupUrl(packageKey) {
  return `/product-signup?package=${encodeURIComponent(packageKey)}`;
}

function saveSignupPrefill(form) {
  try {
    localStorage.setItem(
      SIGNUP_FORM_STORAGE_KEY,
      JSON.stringify({
        fullName: form.name || "",
        businessName: form.business || "",
        email: form.email || "",
        phone: form.phone || "",
        industry: "",
      })
    );
  } catch {}
}

function saveOrderPreview({ items, totalSetup, totalMonthly, packageKey }) {
  try {
    sessionStorage.setItem(
      "clientsurge:last-order",
      JSON.stringify({
        packageKey,
        items: items.map((item) => ({
          icon: item.icon,
          name: item.name,
          setup_fee: item.setup_fee,
          monthly_fee: item.monthly_fee,
        })),
        totalSetup,
        totalMonthly,
      })
    );
  } catch {}
}

export default function CartSidebar() {
  const {
    items,
    removeItem,
    addItem,
    cartOpen,
    setCartOpen,
    pricingSummary,
    totalSetup,
    totalMonthly,
  } = useCart();
  const [step, setStep] = useState("cart");
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "" });
  const [error, setError] = useState("");

  const packageOffer = pricingSummary?.package_offer || null;
  const packageKey = packageOffer?.package_key || "";

  useEffect(() => {
    if (!cartOpen) return undefined;
    return acquireBodyScrollLock("cart-sidebar");
  }, [cartOpen]);

  const suggestedAddon = useMemo(() => {
    if (!items.length || packageOffer) return null;

    const selectedProductIds = new Set(items.map((item) => item.product_id));
    const selectedServiceKeys = new Set(items.map((item) => item.service_key).filter(Boolean));
    const preferredServiceKeys = items.flatMap((item) => COMPLEMENTARY_SERVICES[item.service_key] || []);

    return (
      preferredServiceKeys
        .map((serviceKey) => AI_PRODUCTS.find((product) => product.service_key === serviceKey))
        .find(
          (product) =>
            product?.checkout_enabled &&
            !product.coming_soon &&
            !selectedProductIds.has(product.product_id) &&
            !selectedServiceKeys.has(product.service_key)
        ) ||
      AI_PRODUCTS.find(
        (product) =>
          product.checkout_enabled &&
          !product.coming_soon &&
          !selectedProductIds.has(product.product_id)
      ) ||
      null
    );
  }, [items, packageOffer]);

  const checkoutBlocker = useMemo(() => {
    if (!items.length) return "";
    if (!packageOffer?.package_key) {
      return "Live checkout requires a Starter, Growth, or Pro package. Choose a complete package before continuing.";
    }

    const selectedServiceKeys = new Set(pricingSummary.selected_service_keys || []);
    const packageServiceKeys = new Set(packageOffer.included_service_keys || []);
    const hasExactPackageServices =
      selectedServiceKeys.size === packageServiceKeys.size &&
      [...packageServiceKeys].every((serviceKey) => selectedServiceKeys.has(serviceKey));

    if (!hasExactPackageServices || (pricingSummary.add_on_service_keys || []).length > 0) {
      return "Add-on checkout is not enabled yet. Remove extra services or choose one package before continuing.";
    }

    return "";
  }, [items.length, packageOffer, pricingSummary]);

  const openPackageSignup = () => {
    if (checkoutBlocker) {
      setError(checkoutBlocker);
      setStep("cart");
      return;
    }
    if (!form.name || !form.email || !form.business) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!packageKey) {
      setError("Checkout is not available for this selection. Please choose a complete package.");
      setStep("cart");
      return;
    }

    setError("");
    setStep("loading");
    saveSignupPrefill(form);
    saveOrderPreview({ items, totalSetup, totalMonthly, packageKey });

    const signupUrl = packageSignupUrl(packageKey);
    if (window.self !== window.top) {
      window.open(`${window.location.origin}${signupUrl}`, "_blank", "noopener,noreferrer");
      setStep("info");
      setError("Checkout must run in a full browser tab. I opened the package signup page in a new tab.");
      return;
    }
    window.location.assign(signupUrl);
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.42)", zIndex: 100 }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(430px, 100vw)",
              background: "linear-gradient(180deg, #f7fbff 0%, #ffffff 100%)",
              borderLeft: "1px solid rgba(0,136,204,0.16)",
              boxShadow: "-20px 0 60px rgba(0,0,0,0.18)",
              zIndex: 101,
              display: "flex",
              flexDirection: "column",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px", borderBottom: "1px solid rgba(0,136,204,0.12)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShoppingCart style={{ width: "20px", height: "20px", color: "#0088CC" }} />
                <span style={{ fontWeight: 700, fontSize: "16px", color: "#0A1628" }}>Your AI Stack</span>
                {items.length > 0 && <span style={{ background: "#0088CC", color: "#fff", borderRadius: "9999px", padding: "2px 7px", fontSize: "11px", fontWeight: 700 }}>{items.length}</span>}
              </div>
              <button type="button" onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                <X style={{ width: "20px", height: "20px", color: "rgba(10,22,40,0.58)" }} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              {items.length === 0 ? (
                <div style={{ textAlign: "center", padding: "36px 16px 24px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#0A1628" }}>Your stack is empty</p>
                  <p style={{ fontSize: "12px", color: "rgba(10,22,40,0.5)", lineHeight: 1.5 }}>Add services from the catalog below to get started.</p>
                </div>
              ) : step === "cart" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {items.map((item) => (
                    <div key={item.product_id} style={{ background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,136,204,0.12)", borderRadius: "16px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "22px" }}>{item.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "#0A1628", margin: "0 0 3px" }}>{item.name}</p>
                        <p style={{ fontSize: "11px", color: "rgba(10,22,40,0.56)", margin: 0 }}>{item.setup_fee === 0 ? "No setup fee" : `$${item.setup_fee} setup`} — ${item.monthly_fee}/mo</p>
                      </div>
                      <button type="button" onClick={() => removeItem(item.product_id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#d46d6d" }}>
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                      </button>
                    </div>
                  ))}
                  <VoiceAgentUpsell cartItems={items} onAdd={addItem} />
                  {suggestedAddon && (
                    <div style={{ marginTop: "8px", borderRadius: "16px", padding: "14px", background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.18)" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0088CC" }}>Recommended Add-On</p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                        <div><p style={{ margin: "0 0 3px", fontSize: "13px", fontWeight: 800, color: "#0A1628" }}>{suggestedAddon.icon} {suggestedAddon.name}</p><p style={{ margin: 0, fontSize: "11px", color: "rgba(10,22,40,0.58)" }}>Complements your stack - ${suggestedAddon.monthly_fee}/mo</p></div>
                        <button type="button" onClick={() => addItem(suggestedAddon)} style={{ border: "none", borderRadius: "999px", background: "#0088CC", color: "#fff", fontSize: "11px", fontWeight: 800, padding: "8px 12px", cursor: "pointer" }}>Add</button>
                      </div>
                    </div>
                  )}
                  {(error || checkoutBlocker) && <p style={{ fontSize: "12px", color: "#d14343", fontWeight: 600, lineHeight: 1.55 }}>{error || checkoutBlocker}</p>}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(10,22,40,0.68)", margin: 0 }}>Enter your details. The next page creates a fresh Stripe Checkout Session.</p>
                  {[
                    { key: "name", label: "Full Name *", placeholder: "Jane Smith" },
                    { key: "email", label: "Email Address *", placeholder: "jane@example.com" },
                    { key: "phone", label: "Phone Number", placeholder: "+1 (602) 555-0123" },
                    { key: "business", label: "Business Name *", placeholder: "Glow Med Spa" },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ fontSize: "11px", fontWeight: 700, color: "rgba(10,22,40,0.55)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: "5px" }}>{field.label}</label>
                      <input type={field.key === "email" ? "email" : "text"} placeholder={field.placeholder} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} disabled={step === "loading"} style={{ width: "100%", borderRadius: "12px", border: "1.5px solid rgba(0,136,204,0.18)", padding: "11px 14px", fontSize: "13px", background: "rgba(255,255,255,0.86)", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                  {error && <p style={{ fontSize: "12px", color: "#d14343", fontWeight: 600, lineHeight: 1.55 }}>{error}</p>}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div style={{ padding: "16px 20px 18px", borderTop: "1px solid rgba(0,136,204,0.12)", background: "rgba(255,255,255,0.7)" }}>
                <div style={{ borderRadius: "16px", background: "rgba(255,255,255,0.74)", border: "1px solid rgba(0,136,204,0.12)", padding: "14px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ fontSize: "12px", color: "rgba(10,22,40,0.52)" }}>One-time setup total</span><span style={{ fontSize: "13px", fontWeight: 700, color: "#0A1628" }}>${totalSetup}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: "12px", color: "rgba(10,22,40,0.52)" }}>Monthly total</span><span style={{ fontSize: "14px", fontWeight: 800, color: "#005f99" }}>${totalMonthly}/mo</span></div>
                </div>
                {step === "cart" ? (
                  <button type="button" onClick={() => { if (checkoutBlocker) { setError(checkoutBlocker); return; } setError(""); setStep("info"); }} disabled={Boolean(checkoutBlocker)} className="cs-btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    Continue to Package Signup <ArrowRight style={{ width: "15px", height: "15px" }} />
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <button type="button" onClick={openPackageSignup} disabled={step === "loading"} className="cs-btn-primary" style={{ width: "100%", justifyContent: "center", opacity: step === "loading" ? 0.7 : 1 }}>
                      {step === "loading" ? "Opening package signup..." : "Continue Secure Checkout"}
                    </button>
                    <button type="button" onClick={() => setStep("cart")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(10,22,40,0.48)", textDecoration: "underline" }}>{"<"} Back to cart</button>
                  </div>
                )}
                <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(10,22,40,0.4)", marginTop: "10px" }}>Fresh Stripe Checkout Session created on next page · Cancel anytime</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
