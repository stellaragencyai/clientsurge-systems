import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import OrderTracker from "@/components/landing/OrderTracker";

// Prevent search engines from indexing the order success page
const noIndexMeta = document.querySelector('meta[name="robots"]');
if (noIndexMeta) noIndexMeta.setAttribute("content", "noindex,nofollow");

export default function OrderSuccess() {
  const [sessionId, setSessionId] = useState("");

  const [orderSummary, setOrderSummary] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id") || "");
    // Read pre-checkout summary saved to sessionStorage before Stripe redirect
    try {
      const raw = sessionStorage.getItem("clientsurge:last-order");
      if (raw) {
        setOrderSummary(JSON.parse(raw));
        sessionStorage.removeItem("clientsurge:last-order");
      }
    } catch {}
  }, []);

  return (
    <DemoBookingProvider>
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 100%)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Navbar />
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              border: "2px solid rgba(34,197,94,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <CheckCircle2 style={{ width: "40px", height: "40px", color: "#22c55e" }} />
          </div>

          <h1
            className="font-display"
            style={{ fontSize: "2.2rem", fontWeight: "800", color: "#1a1209", marginBottom: "12px" }}
          >
            You're All Set!
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "rgba(26,18,9,0.6)",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Your payment was successful. Our team has been notified and will begin your setup review shortly.
            You'll receive a confirmation email and can track progress in your client portal.
          </p>

          <div
            style={{
              background: "rgba(255,255,255,0.8)",
              border: "1.5px solid rgba(154,92,46,0.15)",
              borderRadius: "20px",
              padding: "24px 28px",
              marginBottom: "32px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#9a5c2e",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                marginBottom: "16px",
              }}
            >
              What Happens Next
            </p>
            {[
              { step: "1", text: "You'll receive an order confirmation email within minutes." },
              { step: "2", text: "Our team reviews your paid order and starts the canonical setup workflow." },
              { step: "3", text: "Each purchased service moves through configuration, testing, and live review inside our admin workspace." },
              { step: "4", text: "Your client portal reflects the real paid-order setup status as services are verified." },
            ].map((entry) => (
              <div
                key={entry.step}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#9a5c2e,#c8965c)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff" }}>{entry.step}</span>
                </div>
                <p style={{ fontSize: "14px", color: "rgba(26,18,9,0.7)", lineHeight: 1.5, margin: 0 }}>
                  {entry.text}
                </p>
              </div>
            ))}
          </div>

          {/* Order summary */}
          {orderSummary && (
            <div style={{
              background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(154,92,46,0.15)",
              borderRadius: "20px", padding: "20px 24px", marginBottom: "24px", textAlign: "left",
            }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
                Your Order
              </p>
              {orderSummary.items?.map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < orderSummary.items.length - 1 ? "1px solid rgba(154,92,46,0.08)" : "none" }}>
                  <span style={{ fontSize: "13px", color: "#1a1209", fontWeight: "600" }}>{item.icon} {item.name}</span>
                  <span style={{ fontSize: "12px", color: "rgba(26,18,9,0.6)" }}>${item.setup_fee} + ${item.monthly_fee}/mo</span>
                </div>
              ))}
              {orderSummary.totalSetup != null && (
                <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1.5px solid rgba(154,92,46,0.12)", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#1a1209" }}>Total</span>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#9a5c2e" }}>${orderSummary.totalSetup} setup · ${orderSummary.totalMonthly}/mo</span>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <Link
              to="/client-portal"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "9999px",
                padding: "2px",
                background:
                  "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                textDecoration: "none",
                boxShadow: "0 4px 18px rgba(120,70,20,0.3)",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "48px",
                  padding: "0 28px",
                  borderRadius: "9999px",
                  background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                Go to Client Portal <ArrowRight style={{ width: "14px", height: "14px" }} />
              </span>
            </Link>
            <Link
              to="/store"
              style={{
                fontSize: "13px",
                color: "rgba(154,92,46,0.7)",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Add more AI services
            </Link>
          </div>

          {sessionId && (
            <div className="mt-8 text-left">
              <OrderTracker sessionId={sessionId} />
            </div>
          )}
        </div>
      </div>
    </DemoBookingProvider>
  );
}