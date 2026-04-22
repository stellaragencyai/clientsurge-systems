import { useEffect, useState } from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

export default function OrderSuccess() {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id") || "");
  }, []);

  return (
    <DemoBookingProvider>
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 100%)", fontFamily: "'Inter', sans-serif" }}>
        <Navbar />
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          {/* Success icon */}
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <CheckCircle2 style={{ width: "40px", height: "40px", color: "#22c55e" }} />
          </div>

          <h1 className="font-display" style={{ fontSize: "2.2rem", fontWeight: "800", color: "#1a1209", marginBottom: "12px" }}>
            You're All Set! 🎉
          </h1>
          <p style={{ fontSize: "1.05rem", color: "rgba(26,18,9,0.6)", lineHeight: 1.7, marginBottom: "32px" }}>
            Your payment was successful. Our team has been notified and will begin setting up your AI services within 24 hours. You'll receive a confirmation email shortly.
          </p>

          <div style={{ background: "rgba(255,255,255,0.8)", border: "1.5px solid rgba(154,92,46,0.15)", borderRadius: "20px", padding: "24px 28px", marginBottom: "32px", textAlign: "left" }}>
            <p style={{ fontSize: "11px", fontWeight: "700", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "16px" }}>What Happens Next</p>
            {[
              { step: "1", text: "You'll receive an order confirmation email within minutes" },
              { step: "2", text: "Our team reviews your order and begins setup within 24 hours" },
              { step: "3", text: "Each AI service activates on your dashboard as it goes live (5–7 days)" },
              { step: "4", text: "You start seeing live metrics — leads responded, texts sent, bookings made" },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#9a5c2e,#c8965c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff" }}>{s.step}</span>
                </div>
                <p style={{ fontSize: "14px", color: "rgba(26,18,9,0.7)", lineHeight: 1.5, margin: 0 }}>{s.text}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
            <Link
              to="/client-portal"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", textDecoration: "none", boxShadow: "0 4px 18px rgba(120,70,20,0.3)" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 28px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "14px" }}>
                Go to My Dashboard <ArrowRight style={{ width: "14px", height: "14px" }} />
              </span>
            </Link>
            <Link to="/store" style={{ fontSize: "13px", color: "rgba(154,92,46,0.7)", fontWeight: "600", textDecoration: "none" }}>
              ← Add more AI services
            </Link>
          </div>
        </div>
      </div>
    </DemoBookingProvider>
  );
}