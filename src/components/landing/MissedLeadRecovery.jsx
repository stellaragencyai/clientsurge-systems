import { useState, useEffect } from "react";
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
  const [autoPlay, setAutoPlay] = useState(true);
  const case_ = RECOVERY_CASES[current];

  const nextCase = () => {
    setCurrent((current + 1) % RECOVERY_CASES.length);
    setAutoPlay(false);
  };
  const prevCase = () => {
    setCurrent((current - 1 + RECOVERY_CASES.length) % RECOVERY_CASES.length);
    setAutoPlay(false);
  };

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((current + 1) % RECOVERY_CASES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [current, autoPlay]);

  return (
    <section
      style={{
        padding: "48px 24px",
        background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
        borderRadius: "20px",
        border: "1.5px solid rgba(154,92,46,0.3)",
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
              color: "#f5e6d0",
              marginBottom: "8px",
            }}
          >
            See the Difference
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(245,230,208,0.7)",
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
            animation: "fadeSwitch 0.5s ease-in-out",
          }}
        >
          {/* Without */}
          <div
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <span style={{ fontSize: "32px", lineHeight: 1 }}>
              {case_.without.emoji}
            </span>
            <p
              style={{
                fontSize: "13px",
                color: "#ffcccc",
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
                color: "#f5e6d0",
                margin: 0,
              }}
            >
              {case_.without.outcome}
            </p>
            {/* Animated counter */}
            <div style={{ marginTop: "12px" }}>
              <CounterValue value={0} />
            </div>
          </div>

          {/* With */}
          <div
            style={{
              background: "rgba(34,197,94,0.15)",
              border: "1.5px solid rgba(34,197,94,0.4)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
              position: "relative",
              boxShadow: "0 8px 24px rgba(34,197,94,0.2)",
              backdropFilter: "blur(10px)",
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
                color: "#f5e6d0",
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
              <CounterValue value={parseInt(case_.with.recovered)} />
            </div>
          </div>
        </div>

        {/* Case info */}
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "12px",
            padding: "14px 16px",
            marginBottom: "20px",
            textAlign: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              color: "rgba(245,230,208,0.6)",
              margin: "0 0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Case Study
          </p>
          <p style={{ fontSize: "14px", fontWeight: "700", color: "#f5e6d0", margin: 0 }}>
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
          onMouseEnter={() => setAutoPlay(false)}
          onMouseLeave={() => setAutoPlay(true)}
        >
          <button
            onClick={prevCase}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.12)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              backdropFilter: "blur(10px)",
              color: "#f5e6d0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            <ChevronLeft style={{ width: "16px", height: "16px" }} />
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {RECOVERY_CASES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrent(idx);
                  setAutoPlay(false);
                }}
                style={{
                  width: idx === current ? "12px" : "6px",
                  height: "6px",
                  borderRadius: "3px",
                  border: "none",
                  background:
                    idx === current
                      ? "linear-gradient(135deg,#f5d9a8,#c8965c)"
                      : "rgba(255,255,255,0.25)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
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
              border: "1.5px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.12)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              backdropFilter: "blur(10px)",
              color: "#f5e6d0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.25)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.12)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
          >
            <ChevronRight style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSwitch {
          from { opacity: 0.8; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function CounterValue({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    let current = 0;
    const increment = Math.ceil(value / 30);
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(current);
      }
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <p style={{ fontSize: "20px", fontWeight: "800", color: value > 0 ? "#22c55e" : "#ef4444", margin: 0 }}>
      ${display} recovered
    </p>
  );
}