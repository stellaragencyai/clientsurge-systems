import { useState } from "react";
import { X, ShoppingCart, Trash2, ArrowRight, Lock } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { base44 } from "@/api/base44Client";

export default function CartSidebar() {
  const { items, removeItem, cartOpen, setCartOpen, totalSetup, totalMonthly } = useCart();
  const [step, setStep] = useState("cart");
  const [form, setForm] = useState({ name: "", email: "", phone: "", business: "" });
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!form.name || !form.email || !form.business) {
      setError("Please fill in all required fields.");
      return;
    }

    setError("");
    setStep("loading");

    if (window.self !== window.top) {
      alert("Checkout only works from the published app, not the preview.");
      setStep("info");
      return;
    }

    try {
      const response = await base44.functions.invoke("createCheckoutSession", {
        items,
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        business_name: form.business,
        success_url: `${window.location.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/store`,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      setError("Could not start checkout. Please try again.");
      setStep("info");
    } catch (e) {
      setError(e.message || "Checkout failed.");
      setStep("info");
    }
  };

  if (!cartOpen) return null;

  return (
    <>
      <div
        onClick={() => setCartOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(460px, 100vw)",
          background: "linear-gradient(160deg, #fdfcfa 0%, #f8f3ec 100%)",
          borderLeft: "1.5px solid rgba(154,92,46,0.15)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.15)",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid rgba(154,92,46,0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart style={{ width: "20px", height: "20px", color: "#9a5c2e" }} />
            <span style={{ fontWeight: "700", fontSize: "16px", color: "#1a1209" }}>Your AI Stack</span>
            {items.length > 0 ? (
              <span
                style={{
                  background: "#9a5c2e",
                  color: "#fff",
                  borderRadius: "9999px",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                {items.length}
              </span>
            ) : null}
          </div>
          <button
            onClick={() => setCartOpen(false)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
          >
            <X style={{ width: "20px", height: "20px", color: "#888" }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(26,18,9,0.4)" }}>
              <ShoppingCart style={{ width: "40px", height: "40px", margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ fontSize: "14px", fontWeight: "600" }}>Your cart is empty</p>
              <p style={{ fontSize: "12px", marginTop: "6px" }}>Browse the store and add AI services</p>
            </div>
          ) : step === "cart" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(154,92,46,0.12)",
                    borderRadius: "14px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <span style={{ fontSize: "22px" }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#1a1209",
                        margin: "0 0 3px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </p>
                    <p style={{ fontSize: "11px", color: "rgba(26,18,9,0.5)", margin: 0 }}>
                      ${item.setup_fee} setup · ${item.monthly_fee}/mo
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: "#e57373" }}
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "rgba(26,18,9,0.6)", margin: 0 }}>
                Enter your details to continue to payment
              </p>
              {[
                { key: "name", label: "Full Name *", placeholder: "Jane Smith" },
                { key: "email", label: "Email Address *", placeholder: "jane@yourbiz.com" },
                { key: "phone", label: "Phone Number", placeholder: "+1 (602) 555-0123" },
                { key: "business", label: "Business Name *", placeholder: "Glow Med Spa" },
              ].map((field) => (
                <div key={field.key}>
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "rgba(26,18,9,0.55)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      display: "block",
                      marginBottom: "5px",
                    }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.key === "email" ? "email" : "text"}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                    disabled={step === "loading"}
                    style={{
                      width: "100%",
                      borderRadius: "10px",
                      border: "1.5px solid rgba(154,92,46,0.2)",
                      padding: "10px 14px",
                      fontSize: "13px",
                      background: "rgba(255,255,255,0.8)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              {error ? <p style={{ fontSize: "12px", color: "#e53e3e", fontWeight: "600" }}>{error}</p> : null}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid rgba(154,92,46,0.12)",
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "rgba(26,18,9,0.5)" }}>One-time setup total</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1209" }}>${totalSetup}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "rgba(26,18,9,0.5)" }}>Monthly total</span>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#9a5c2e" }}>${totalMonthly}/mo</span>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("info")}
                style={{
                  width: "100%",
                  borderRadius: "9999px",
                  padding: "2px",
                  background:
                    "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    height: "48px",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                    color: "#f5e6d0",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  Continue to Checkout <ArrowRight style={{ width: "15px", height: "15px" }} />
                </span>
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button
                  onClick={handleCheckout}
                  disabled={step === "loading"}
                  style={{
                    width: "100%",
                    borderRadius: "9999px",
                    padding: "2px",
                    background:
                      "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    border: "none",
                    cursor: step === "loading" ? "not-allowed" : "pointer",
                    opacity: step === "loading" ? 0.7 : 1,
                    boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      height: "48px",
                      borderRadius: "9999px",
                      background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#f5e6d0",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    {step === "loading" ? (
                      "Redirecting to Stripe..."
                    ) : (
                      <>
                        <Lock style={{ width: "13px", height: "13px" }} /> Pay Securely with Stripe
                      </>
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setStep("cart")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    color: "rgba(26,18,9,0.4)",
                    textDecoration: "underline",
                  }}
                >
                  ← Back to cart
                </button>
              </div>
            )}

            <p style={{ textAlign: "center", fontSize: "10px", color: "rgba(26,18,9,0.3)", marginTop: "10px" }}>
              🔒 Secured by Stripe · Cancel anytime
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
