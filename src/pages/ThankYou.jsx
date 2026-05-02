import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const PLANS = {
  starter: { name: "Starter Plan", price: "$797 Setup + $497/mo" },
  growth:  { name: "Growth Plan",  price: "$1,297 Setup + $997/mo" },
  elite:   { name: "Elite Plan",   price: "$2,497 Setup + $1,997/mo" },
};

const STEPS = [
  { icon: "📞", title: "We'll reach out within 24 hours", desc: "Our team will contact you to kick things off." },
  { icon: "🔧", title: "Your systems get built", desc: "Full setup completed in 5–7 business days." },
  { icon: "🚀", title: "You go live", desc: "Your AI lead system starts capturing & converting." },
];

export default function ThankYou() {
  const [visible, setVisible] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const planKey = params.get("plan")?.toLowerCase();
  const plan = PLANS[planKey] || null;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0F1E",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "48px 20px 64px",
      fontFamily: "-apple-system, 'Inter', sans-serif",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.6s ease, transform 0.6s ease",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: "48px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#00D4FF,#0088cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#fff", fontWeight: "900", fontSize: "13px" }}>CS</span>
        </div>
        <span style={{ color: "#fff", fontWeight: "700", fontSize: "16px" }}>ClientSurge Systems</span>
      </div>

      {/* HERO */}
      <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "600px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "rgba(0,212,255,0.1)", border: "2px solid rgba(0,212,255,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(0,212,255,0.25)",
          }}>
            <CheckCircle style={{ width: "40px", height: "40px", color: "#00D4FF" }} />
          </div>
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: "800", color: "#fff", margin: "0 0 16px", lineHeight: 1.15 }}>
          You're In. Welcome to ClientSurge.
        </h1>
        <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
          Your payment was received and your onboarding has started.
        </p>
      </div>

      {/* PLAN CARD */}
      <div style={{
        position: "relative", borderRadius: "20px", padding: "2px",
        background: "linear-gradient(135deg, #00D4FF, #00a3cc, #0055aa)",
        marginBottom: "48px", width: "100%", maxWidth: "440px",
        boxShadow: "0 8px 40px rgba(0,212,255,0.2)",
      }}>
        <div style={{
          borderRadius: "18px", background: "#111827",
          padding: "28px 32px", textAlign: "center",
        }}>
          <p style={{ fontSize: "11px", fontWeight: "700", color: "#00D4FF", textTransform: "uppercase", letterSpacing: "0.18em", margin: "0 0 10px" }}>
            {plan ? "Your Plan" : "Payment Confirmed"}
          </p>
          <p style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", margin: "0 0 6px" }}>
            {plan ? plan.name : "Your Plan"}
          </p>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>
            {plan ? plan.price : "Payment Received"}
          </p>
        </div>
      </div>

      {/* NEXT STEPS */}
      <div style={{ width: "100%", maxWidth: "760px", marginBottom: "48px" }}>
        <p style={{ textAlign: "center", fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: "24px" }}>
          What Happens Next
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px", padding: "24px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{step.icon}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "#00D4FF", flexShrink: 0 }}>
                  {i + 1}
                </span>
                <p style={{ fontSize: "14px", fontWeight: "700", color: "#fff", margin: 0, textAlign: "left" }}>{step.title}</p>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CONTACT */}
      <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px", marginBottom: "32px", lineHeight: 1.8 }}>
        Questions?{" "}
        <a href="mailto:nolan@clientsurgesystems.com" style={{ color: "#00D4FF", textDecoration: "none" }}>nolan@clientsurgesystems.com</a>
        {" "}|{" "}
        <a href="tel:+16025843227" style={{ color: "#00D4FF", textDecoration: "none" }}>(602) 584-3227</a>
      </p>

      {/* CTA */}
      <Link to="/" style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "14px 36px", borderRadius: "9999px",
        background: "linear-gradient(135deg, #00D4FF, #0088cc)",
        color: "#fff", fontWeight: "700", fontSize: "15px",
        textDecoration: "none", boxShadow: "0 6px 28px rgba(0,212,255,0.35)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,212,255,0.45)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,212,255,0.35)"; }}
      >
        ← Back to Home
      </Link>

    </div>
  );
}