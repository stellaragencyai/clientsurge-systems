import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

const RECOVERY_CASES = [
  {
    business: "Glow Med Spa",
    leadName: "Sarah M.",
    leadSource: "Instagram Ad",
    without: {
      outcome: "No response for 2 hours",
      emoji: "😕",
      color: "#ef4444",
    },
    with: {
      outcome: "Booked within 15 min",
      emoji: "🎉",
      color: "#22c55e",
      recovered: "$280",
    },
  },
  {
    business: "Peak Health Clinic",
    leadName: "Marcus D.",
    leadSource: "Google Search",
    without: {
      outcome: "Went to competitor",
      emoji: "😤",
      color: "#ef4444",
    },
    with: {
      outcome: "Confirmed appointment",
      emoji: "✅",
      color: "#22c55e",
      recovered: "$450",
    },
  },
  {
    business: "Luxe Aesthetics",
    leadName: "Priya K.",
    leadSource: "Facebook Lead Ad",
    without: {
      outcome: "Lead went silent",
      emoji: "⏳",
      color: "#ef4444",
    },
    with: {
      outcome: "14-day nurture → Booked",
      emoji: "🚀",
      color: "#22c55e",
      recovered: "$620",
    },
  },
];

export default function MissedLeadRecovery() {
  const [current, setCurrent] = useState(0);
  const case_ = RECOVERY_CASES[current];

  const nextCase = () => setCurrent((current + 1) % RECOVERY_CASES.length);
  const prevCase = () =>
    setCurrent((current - 1 + RECOVERY_CASES.length) % RECOVERY_CASES.length);

  return (
    <section
      style={{
        padding: "48px 24px",
        background:
          "linear-gradient(135deg, rgba(255,252,247,0.5) 0%, rgba(252,240,220,0.3) 100%)",
        borderRadius: "20px",
        border: "1.5px solid rgba(154,92,46,0.15)",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h2
            className="font-display"
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "#1a1209",
              marginBottom: "8px",
            }}
          >
            See the Difference
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(26,18,9,0.55)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Missed Leads vs. Automated Recovery
          </p>
        </div>

        {/* Case comparison */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Without */}
          <div
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1.5px solid rgba(239,68,68,0.2)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "32px", lineHeight: 1 }}>
              {case_.without.emoji}
            </span>
            <p
              style={{
                fontSize: "13px",
                color: "#ef4444",
                fontWeight: "700",
                margin: "10px 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Without Automation
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#1a1209",
                margin: 0,
              }}
            >
              {case_.without.outcome}
            </p>
            <p
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "#ef4444",
                marginTop: "12px",
              }}
            >
              $0 recovered
            </p>
          </div>

          {/* With */}
          <div
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1.5px solid rgba(34,197,94,0.2)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 8px 24px rgba(34,197,94,0.12)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-10px",
                right: "16px",
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
                color: "white",
                fontSize: "10px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              ClientSurge
            </div>
            <span style={{ fontSize: "32px", lineHeight: 1 }}>
              {case_.with.emoji}
            </span>
            <p
              style={{
                fontSize: "13px",
                color: "#22c55e",
                fontWeight: "700",
                margin: "10px 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              With Automation
            </p>
            <p
              style={{
                fontSize: "15px",
                fontWeight: "600",
                color: "#1a1209",
                margin: 0,
              }}
            >
              {case_.with.outcome}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "12px",
              }}
            >
              <TrendingUp
                style={{ width: "16px", height: "16px", color: "#22c55e" }}
              />
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: "#22c55e",
                  margin: 0,
                }}
              >
                {case_.with.recovered}
              </p>
            </div>
          </div>
        </div>

        {/* Case info */}
        <div
          style={{
            background: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(154,92,46,0.15)",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "rgba(26,18,9,0.55)",
              margin: "0 0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Case Study
          </p>
          <p style={{ fontSize: "14px", fontWeight: "700", color: "#1a1209", margin: 0 }}>
            {case_.business} — {case_.leadName} from {case_.leadSource}
          </p>
        </div>

        {/* Carousel controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={prevCase}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid rgba(154,92,46,0.2)",
              background: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(154,92,46,0.1)";
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.8)";
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.2)";
            }}
          >
            <ChevronLeft style={{ width: "16px", height: "16px" }} />
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {RECOVERY_CASES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  border: "none",
                  background:
                    idx === current
                      ? "linear-gradient(135deg,#9a5c2e,#c8965c)"
                      : "rgba(154,92,46,0.2)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              />
            ))}
          </div>

          <button
            onClick={nextCase}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid rgba(154,92,46,0.2)",
              background: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(154,92,46,0.1)";
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.8)";
              e.currentTarget.style.borderColor = "rgba(154,92,46,0.2)";
            }}
          >
            <ChevronRight style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>
    </section>
  );
}