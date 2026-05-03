import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const journeySteps = [
  { id: 1, day: "Day 0", label: "Lead Captured", description: "Instant SMS response sent" },
  { id: 2, day: "Day 1", label: "Engaged", description: "Follow-up email delivered" },
  { id: 3, day: "Day 7", label: "Nurtured", description: "14-day nurture begins" },
  { id: 4, day: "Day 30", label: "Booked", description: "Lead converts to appointment" },
];

export default function InteractiveJourneyMap() {
  const [expandedNode, setExpandedNode] = useState(null);
  const [dotPosition, setDotPosition] = useState(0);

  useEffect(() => {
    let frame = 0;
    const interval = setInterval(() => {
      frame = (frame + 1) % 200;
      setDotPosition((frame / 200) * 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: "700",
            color: "#c8965c",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: "8px",
          }}
        >
          Your Lead Journey
        </p>
        <h3 style={{ fontSize: "28px", fontWeight: "600", color: "#1b140d" }}>
          From First Contact to Booked Appointment
        </h3>
      </div>

      {/* Timeline Container */}
      <div style={{ position: "relative", padding: "20px 0 0" }}>

        {/* Step Nodes */}
        <div
          className="timeline-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {journeySteps.map((step, idx) => (
            <motion.button
              key={step.id}
              type="button"
              onClick={() => setExpandedNode(expandedNode === step.id ? null : step.id)}
              transition={{ delay: idx * 0.1 }}
              style={{
                background: expandedNode === step.id ? "rgba(200,150,92,0.15)" : "transparent",
                border: "2px solid rgba(200,150,92,0.3)",
                borderRadius: "12px",
                padding: "16px",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(200,150,92,0.6)";
                e.currentTarget.style.background = "rgba(200,150,92,0.1)";
              }}
              onMouseLeave={(e) => {
                if (expandedNode !== step.id) {
                  e.currentTarget.style.borderColor = "rgba(200,150,92,0.3)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {/* Node Circle */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #9a5c2e, #c8965c)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "14px",
                  margin: "0 auto 12px",
                  boxShadow: "0 4px 12px rgba(154,92,46,0.3)",
                }}
              >
                {step.id}
              </div>

              <p style={{ fontSize: "11px", fontWeight: "700", color: "#c8965c", margin: "0 0 4px" }}>
                {step.day}
              </p>
              <p style={{ fontSize: "13px", fontWeight: "600", color: "#1b140d", margin: 0 }}>
                {step.label}
              </p>

              {/* Expanded Detail */}
              {expandedNode === step.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(200,150,92,0.2)" }}
                >
                  <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.7)", margin: 0 }}>
                    {step.description}
                  </p>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Line + Animated Dot — below the cards */}
        <svg
          style={{ display: "block", width: "100%", height: "24px", marginTop: "12px" }}
          viewBox="0 0 800 24"
          preserveAspectRatio="none"
        >
          <line x1="0" y1="12" x2="800" y2="12" stroke="rgba(200,150,92,0.25)" strokeWidth="2" />
          <motion.circle
            cx={`${dotPosition * 8}`}
            cy="12"
            r="6"
            fill="#c8965c"
            style={{ filter: "drop-shadow(0 0 8px rgba(200,150,92,0.5))" }}
          />
        </svg>
      </div>

      {/* CTA */}
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.6)", marginBottom: "16px" }}>
          Click any step to learn more about what happens
        </p>
        <a
          href="#pricing"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            borderRadius: "9999px",
            background: "rgba(154,92,46,0.1)",
            border: "1px solid rgba(154,92,46,0.25)",
            color: "#9a5c2e",
            fontWeight: "600",
            fontSize: "13px",
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(154,92,46,0.2)";
            e.currentTarget.style.borderColor = "rgba(154,92,46,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(154,92,46,0.1)";
            e.currentTarget.style.borderColor = "rgba(154,92,46,0.25)";
          }}
        >
          See Pricing <ChevronRight style={{ width: "14px", height: "14px" }} />
        </a>
      </div>
    </div>
  );
}