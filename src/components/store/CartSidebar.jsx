import { useState } from "react";
import { X, ShoppingCart, Trash2, ArrowRight, Lock } from "lucide-react";
import { useCart } from "@/lib/cartContext";
import { base44 } from "@/api/base44Client";
import {
  CHECKOUT_LEGAL_DOCUMENTS,
  CHECKOUT_LEGAL_VERSION,
} from "@/lib/legalDocuments";

export default function CartSidebar() {
  const {
    items,
    removeItem,
    cartOpen,
    setCartOpen,
    totalSetup,
    totalMonthly,
  } = useCart();
  const [step, setStep] = useState("cart");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    business: "",
    accepted_legal: false,
  });
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    if (!form.name || !form.email || !form.business) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!form.accepted_legal) {
      setError("Please accept the legal terms before continuing to checkout.");
      return;
    }

    setError("");
    setStep("loading");

    if (window.self !== window.top) {
      setError(
        "Checkout is available on the live Base44 site. Open the published app to continue."
      );
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
        legal_acceptance: {
          accepted: true,
          version: CHECKOUT_LEGAL_VERSION,
        },
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
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(6px)",
          zIndex: 100,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(430px, 100vw)",
          background: "linear-gradient(180deg, #fdfbf8 0%, #f6efe5 100%)",
          borderLeft: "1px solid rgba(154,92,46,0.14)",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.18)",
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
            padding: "20px 22px",
            borderBottom: "1px solid rgba(154,92,46,0.1)",
            background: "rgba(255,255,255,0.56)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingCart
              style={{ width: "20px", height: "20px", color: "#9a5c2e" }}
            />
            <span
              style={{ fontWeight: "700", fontSize: "16px", color: "#1a1209" }}
            >
              Your AI Stack
            </span>
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
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X style={{ width: "20px", height: "20px", color: "#7b6b5d" }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 0",
                color: "rgba(26,18,9,0.46)",
              }}
            >
              <ShoppingCart
                style={{
                  width: "40px",
                  height: "40px",
                  margin: "0 auto 12px",
                  opacity: 0.3,
                }}
              />
              <p style={{ fontSize: "14px", fontWeight: "600" }}>
                Your cart is empty
              </p>
              <p style={{ fontSize: "12px", marginTop: "6px" }}>
                Browse the store and add the services you want us to build.
              </p>
            </div>
          ) : step === "cart" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {items.map((item) => (
                <div
                  key={item.product_id}
                  style={{
                    background: "rgba(255,255,255,0.8)",
                    border: "1px solid rgba(154,92,46,0.1)",
                    borderRadius: "16px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
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
                    <p
                      style={{
                        fontSize: "11px",
                        color: "rgba(26,18,9,0.54)",
                        margin: 0,
                      }}
                    >
                      ${item.setup_fee} setup - ${item.monthly_fee}/mo
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      color: "#d46d6d",
                    }}
                  >
                    <Trash2 style={{ width: "14px", height: "14px" }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  borderRadius: "14px",
                  background: "rgba(154,92,46,0.06)",
                  border: "1px solid rgba(154,92,46,0.1)",
                  padding: "12px 14px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "rgba(26,18,9,0.68)",
                    margin: 0,
                  }}
                >
                  Enter your details to continue to payment.
                </p>
              </div>

              {[
                { key: "name", label: "Full Name *", placeholder: "Jane Smith" },
                {
                  key: "email",
                  label: "Email Address *",
                  placeholder: "jane@yourbiz.com",
                },
                {
                  key: "phone",
                  label: "Phone Number",
                  placeholder: "+1 (602) 555-0123",
                },
                {
                  key: "business",
                  label: "Business Name *",
                  placeholder: "Glow Med Spa",
                },
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
                    onChange={(event) =>
                      setForm({ ...form, [field.key]: event.target.value })
                    }
                    disabled={step === "loading"}
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      border: "1.5px solid rgba(154,92,46,0.18)",
                      padding: "11px 14px",
                      fontSize: "13px",
                      background: "rgba(255,255,255,0.86)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  borderRadius: "14px",
                  border: "1px solid rgba(154,92,46,0.12)",
                  background: "rgba(255,255,255,0.86)",
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.accepted_legal}
                  onChange={(event) => {
                    setForm({
                      ...form,
                      accepted_legal: event.target.checked,
                    });
                    if (event.target.checked) {
                      setError("");
                    }
                  }}
                  disabled={step === "loading"}
                  style={{
                    marginTop: "2px",
                    width: "15px",
                    height: "15px",
                    accentColor: "#9a5c2e",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    lineHeight: 1.65,
                    color: "rgba(26,18,9,0.66)",
                  }}
                >
                  I agree to the{" "}
                  {CHECKOUT_LEGAL_DOCUMENTS.map((document, index) => (
                    <span key={document.key}>
                      <a
                        href={document.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#9a5c2e",
                          fontWeight: "700",
                          textDecoration: "underline",
                        }}
                      >
                        {document.label}
                      </a>
                      {index === CHECKOUT_LEGAL_DOCUMENTS.length - 2
                        ? " and "
                        : index < CHECKOUT_LEGAL_DOCUMENTS.length - 2
                        ? ", "
                        : ""}
                    </span>
                  ))}
                  . By continuing, you confirm you are authorized to purchase services for this business.
                </span>
              </label>
              {error ? (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#d14343",
                    fontWeight: "600",
                    lineHeight: 1.55,
                  }}
                >
                  {error}
                </p>
              ) : null}
            </div>
          )}
        </div>

        {items.length > 0 ? (
          <div
            style={{
              padding: "16px 20px 18px",
              borderTop: "1px solid rgba(154,92,46,0.1)",
              background: "rgba(255,255,255,0.7)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                borderRadius: "16px",
                background: "rgba(255,255,255,0.74)",
                border: "1px solid rgba(154,92,46,0.1)",
                padding: "14px 14px 12px",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span style={{ fontSize: "12px", color: "rgba(26,18,9,0.5)" }}>
                  One-time setup total
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#1a1209",
                  }}
                >
                  ${totalSetup}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "rgba(26,18,9,0.5)" }}>
                  Monthly total
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#9a5c2e",
                  }}
                >
                  ${totalMonthly}/mo
                </span>
              </div>
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
                  boxShadow: "0 4px 18px rgba(120,70,20,0.28)",
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
                    background:
                      "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                    color: "#f5e6d0",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  Continue to Checkout{" "}
                  <ArrowRight style={{ width: "15px", height: "15px" }} />
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
                    boxShadow: "0 4px 18px rgba(120,70,20,0.28)",
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
                      background:
                        "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#f5e6d0",
                      fontWeight: "700",
                      fontSize: "14px",
                    }}
                  >
                    {step === "loading" ? (
                      "Redirecting to Stripe..."
                    ) : (
                      <>
                        <Lock style={{ width: "13px", height: "13px" }} /> Pay
                        Securely with Stripe
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
                    color: "rgba(26,18,9,0.46)",
                    textDecoration: "underline",
                  }}
                >
                  {"<"} Back to cart
                </button>
              </div>
            )}

            <p
              style={{
                textAlign: "center",
                fontSize: "10px",
                color: "rgba(26,18,9,0.38)",
                marginTop: "10px",
              }}
            >
              Secured by Stripe - Cancel anytime
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}
