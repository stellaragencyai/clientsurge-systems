import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight, Rocket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import PostPurchaseWhatNext from "@/components/portal/PostPurchaseWhatNext";
import GuaranteeCard from "@/components/portal/GuaranteeCard";
import { trackEvent } from "@/lib/analytics";

// Prevent search engines from indexing the order success page
const noIndexMeta = document.querySelector('meta[name="robots"]');
if (noIndexMeta) noIndexMeta.setAttribute("content", "noindex,nofollow");

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [orderSummary, setOrderSummary] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);

  useEffect(() => {
    // Read pre-checkout summary saved to sessionStorage before Stripe redirect
    try {
      const raw = sessionStorage.getItem("clientsurge:last-order");
      if (raw) {
        setOrderSummary(JSON.parse(raw));
        sessionStorage.removeItem("clientsurge:last-order");
      }
      sessionStorage.removeItem("clientsurge:cart");
    } catch {}

    // Resolve order from Stripe session_id so we can link to the setup wizard
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) return;

    base44.functions.invoke("getOrderStatus", { session_id: sessionId })
      .then((result) => {
        if (result?.eligible && result?.order?.id) {
          setOrderInfo(result.order);
        }
      })
      .catch(() => {});
  }, []);

  // GA4 purchase tracking — fires once when order is confirmed, idempotent
  useEffect(() => {
    if (!orderInfo?.id) return;

    // Skip test orders
    const email = (orderInfo.customer_email || "").toLowerCase();
    const testPatterns = [
      /@example\.com/i, /@clientsurge\.test/i, /@clientsurge-install\.internal/i,
      /runtime\.checkout/i, /test-/i, /stripe-.*-proof/i,
      /pricing-live-checkout/i, /postfix-live-checkout/i, /proof@/i,
    ];
    if (!email || testPatterns.some(p => p.test(email))) return;

    // Idempotency — prevent double-counting on page refresh
    const fireKey = `clientsurge:ga4-purchase-fired:${orderInfo.id}`;
    if (sessionStorage.getItem(fireKey)) return;
    sessionStorage.setItem(fireKey, "1");

    const totalValue = Number(orderInfo.total_setup || 0) + Number(orderInfo.total_monthly || 0);

    trackEvent("purchase", {
      transaction_id: orderInfo.stripe_session_id || orderInfo.id,
      value: totalValue,
      currency: "USD",
      items: (orderInfo.items || []).map((item, idx) => ({
        item_id: item.product_id || item.service_key || `item-${idx}`,
        item_name: item.product_name || item.service_key || "Service",
        price: Number(item.setup_fee || 0) + Number(item.monthly_fee || 0),
        quantity: 1,
      })),
    });
  }, [orderInfo]);

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
            Your AI Brain is Deploying
          </h1>
          <p
            style={{
              fontSize: "1.05rem",
              color: "rgba(26,18,9,0.6)",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Payment confirmed. Your automations are now being provisioned remotely. Track real-time deployment progress in your client portal—setup complete in 4–6 hours.
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
              { step: "1", text: "Deployment briefing email arrives (credentials, timeline, next steps)." },
              { step: "2", text: "AI Brain auto-generates your business config (SMS templates, email sequences, booking logic)." },
              { step: "3", text: "Services deploy in parallel: Twilio SMS, email routing, lead capture webhooks, voice AI." },
              { step: "4", text: "Watch real-time status in your dashboard—go-live confirmation within 4–6 hours." },
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

          {/* Post-purchase roadmap */}
          <div style={{ marginBottom: "24px" }}>
            <PostPurchaseWhatNext />
          </div>

          {/* 30-day guarantee */}
          <div style={{ marginBottom: "24px" }}>
            <GuaranteeCard />
          </div>

          {/* Finding #105: Post-purchase upsell — one-time upgrade offer */}
          {orderInfo && (
            <div style={{
              background: "linear-gradient(135deg, rgba(0,174,239,0.06) 0%, rgba(0,107,176,0.03) 100%)",
              border: "1.5px solid rgba(0,174,239,0.2)",
              borderRadius: "20px",
              padding: "24px 28px",
              marginBottom: "32px",
              textAlign: "left",
            }}>
              <p style={{
                fontSize: "11px", fontWeight: "700", color: "#00AEEF",
                textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px",
              }}>
                Limited-Time Upgrade Offer
              </p>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "#1a1209", marginBottom: "8px" }}>
                Upgrade within 48 hours and save $500
              </p>
              <p style={{ fontSize: "13px", color: "rgba(26,18,9,0.6)", lineHeight: 1.5, marginBottom: "16px" }}>
                Lock in a higher tier now while your account is being provisioned. We'll apply the upgrade instantly — no re-onboarding needed.
              </p>
              <Link
                to="/pricing"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  fontSize: "13px", fontWeight: "700", color: "#00AEEF",
                  textDecoration: "none",
                }}
              >
                View upgrade options <ArrowRight style={{ width: "14px", height: "14px" }} />
              </Link>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            {orderInfo ? (
              <button
                onClick={() => navigate(`/setup/credentials?order_id=${orderInfo.id}`)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "9999px",
                  padding: "2px",
                  border: "none",
                  cursor: "pointer",
                  background: "linear-gradient(135deg, #00AEEF 0%, #009DFF 45%, #003B8F 100%)",
                  textDecoration: "none",
                  boxShadow: "0 4px 18px rgba(0,174,239,0.3)",
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
                    background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  <Rocket style={{ width: "16px", height: "16px" }} /> Complete Your Setup <ArrowRight style={{ width: "14px", height: "14px" }} />
                </span>
              </button>
            ) : (
              <Link
                to="/client-portal"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  borderRadius: "9999px",
                  padding: "2px",
                  background: "linear-gradient(135deg, #00AEEF 0%, #009DFF 45%, #003B8F 100%)",
                  textDecoration: "none",
                  boxShadow: "0 4px 18px rgba(0,174,239,0.3)",
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
                    background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "14px",
                  }}
                >
                  Get Instant Access <ArrowRight style={{ width: "14px", height: "14px" }} />
                </span>
              </Link>
            )}
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
        </div>
      </div>
    </DemoBookingProvider>
  );
}