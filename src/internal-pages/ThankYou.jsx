import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { getPackageOffer, normalizePackageKey } from "@/lib/salesCatalog";

const PLANS = {
  starter_system: {
    name: "Starter",
    price: "$797 Setup + $497/month",
    includes: "Includes: Instant Lead Response + Missed Call Text-Back",
  },
  growth_system: {
    name: "Growth",
    price: "$1,297 Setup + $997/month",
    includes: "Includes: Instant Lead Response, Missed Call Text-Back, 14-Day Nurture Sequence + AI Booking Agent",
  },
  pro_system: {
    name: "Pro",
    price: "$2,497 Setup + $1,997/month",
    includes: "Includes: All 6 Automations — fully built and live",
  },
};

const STEPS = [
  {
    emoji: "📞",
    title: "We reach out within 24 hours",
    desc: "Nolan from ClientSurge contacts you personally to kick off your setup.",
  },
  {
    emoji: "⚙️",
    title: "Your systems get built",
    desc: "We configure every automation included in your plan from scratch.",
  },
  {
    emoji: "🚀",
    title: "You go live",
    desc: "Your automations are live and running within 24–48 hours. Then they run themselves.",
  },
];

function AnimatedCheckmark({ visible }) {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", margin: "0 auto 32px" }}
    >
      {/* Circle */}
      <circle
        cx="40"
        cy="40"
        r="36"
        stroke="#00D4FF"
        strokeWidth="4"
        fill="none"
        strokeDasharray="226"
        strokeDashoffset={visible ? "0" : "226"}
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
      {/* Checkmark */}
      <polyline
        points="24,42 35,53 57,30"
        stroke="#00FFB3"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="50"
        strokeDashoffset={visible ? "0" : "50"}
        style={{ transition: "stroke-dashoffset 0.6s ease-out 0.5s" }}
      />
    </svg>
  );
}

export default function ThankYou() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id") || searchParams.get("session_id");
  const [visible, setVisible] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const planKey = normalizePackageKey(params.get("plan") || "");
  const packageOffer = getPackageOffer(planKey);
  const plan =
    (packageOffer && {
      name: packageOffer.customer_facing_name || packageOffer.name,
      price: `$${packageOffer.setup_total} Setup + $${packageOffer.monthly_total}/month`,
      includes: `Includes: ${packageOffer.included_services.map((service) => service.name).join(", ")}`,
    }) ||
    PLANS[planKey] ||
    null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0F1E",
        color: "#fff",
        fontFamily: "var(--font-inter)",
        overflowX: "hidden",
      }}
    >
      {/* SECTION 1 — HERO */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 24px",
          textAlign: "center",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        <AnimatedCheckmark visible={visible} />

        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: "800",
            color: "#ffffff",
            margin: "0 0 16px",
            lineHeight: 1.15,
            fontFamily: "var(--font-display)",
          }}
        >
          You're In. Welcome to ClientSurge.
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            color: "rgba(255,255,255,0.55)",
            margin: "0 0 48px",
            maxWidth: "480px",
            lineHeight: 1.6,
          }}
        >
          Your payment was received. Your setup has already started.
        </p>

        {/* SECTION 2 — PLAN CARD */}
        <div
          style={{
            width: "100%",
            maxWidth: "480px",
            borderRadius: "20px",
            padding: "2px",
            background: "linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)",
            boxShadow: "0 0 40px rgba(0,212,255,0.2)",
          }}
        >
          <div
            style={{
              borderRadius: "18px",
              background: "#0D1526",
              padding: "32px 28px",
              textAlign: "center",
            }}
          >
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.3)",
                borderRadius: "9999px",
                padding: "4px 14px",
                fontSize: "11px",
                fontWeight: "800",
                color: "#00D4FF",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              PAYMENT CONFIRMED ✓
            </div>

            <p
              style={{
                fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
                fontWeight: "800",
                color: "#ffffff",
                margin: "0 0 8px",
                lineHeight: 1.2,
              }}
            >
              {plan ? plan.name : "Your Plan"}
            </p>

            {plan && (
              <>
                <p
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: "600",
                    color: "#00D4FF",
                    margin: "0 0 16px",
                  }}
                >
                  {plan.price}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {plan.includes}
                </p>
              </>
            )}

            {!plan && (
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                Welcome aboard — your setup is underway.
              </p>
            )}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ marginTop: "48px", color: "rgba(255,255,255,0.2)", fontSize: "12px", letterSpacing: "0.1em" }}>
          ↓ scroll to see what happens next
        </div>
      </div>

      {/* SECTION 3 — WHAT HAPPENS NEXT */}
      <div
        style={{
          padding: "80px 24px",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: "800",
            color: "#ffffff",
            marginBottom: "48px",
            fontFamily: "var(--font-display)",
          }}
        >
          Here's What Happens Next
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "24px",
          }}
        >
          {STEPS.map((step, i) => (
            <div
              key={i}
              style={{
                background: "#0D1526",
                border: "1px solid rgba(0,212,255,0.12)",
                borderRadius: "18px",
                padding: "32px 24px",
                textAlign: "center",
              }}
            >
              {/* Icon circle */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "24px",
                }}
              >
                {step.emoji}
              </div>

              {/* Step number */}
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: "800",
                  color: "#00D4FF",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Step {i + 1}
              </p>

              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: "#ffffff",
                  marginBottom: "10px",
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </h3>

              <p
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 — CONTACT */}
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          style={{
            fontSize: "1.2rem",
            fontWeight: "700",
            color: "#ffffff",
            marginBottom: "16px",
          }}
        >
          Questions? We're here.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <a
            href="mailto:nolan@clientsurgesystems.com"
            style={{
              color: "#00D4FF",
              fontSize: "15px",
              fontWeight: "600",
              textDecoration: "none",
            }}
          >
            nolan@clientsurgesystems.com
          </a>
          <a
            href="tel:+16025843227"
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "15px",
              fontWeight: "500",
              textDecoration: "none",
            }}
          >
            (602) 584-3227
          </a>
        </div>

        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
          We respond within the hour.
        </p>
      </div>

      {/* SECTION 5 — CTA */}
      <div style={{ padding: "60px 24px", textAlign: "center" }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 36px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #00D4FF, #00FFB3)",
            color: "#0A0F1E",
            fontWeight: "800",
            fontSize: "15px",
            textDecoration: "none",
            boxShadow: "0 8px 32px rgba(0,212,255,0.3)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          ← Back to Home
        </Link>
        {orderId && (
          <Link
            to={`/setup/credentials?order_id=${orderId}`}
            style={{
              display: "inline-block",
              marginTop: "16px",
              padding: "14px 36px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, #7C3AED, #00D4FF)",
              color: "#fff",
              fontWeight: "800",
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 8px 32px rgba(124,58,237,0.3)",
            }}
          >
            Set Up My Account →
          </Link>
        )}
      </div>
    </div>
  );
}
