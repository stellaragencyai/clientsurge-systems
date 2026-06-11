import { X } from "lucide-react";

const INDUSTRY_BLUEPRINTS = {
  "med-spa": {
    title: "Med Spa Automation Stack",
    icon: "💆",
    flows: [
      {
        step: "1",
        name: "Instant Consultation Request",
        desc: "Lead asks about services → AI responds in 4 sec with available times",
        color: "#22c55e",
      },
      {
        step: "2",
        name: "Booking Flow",
        desc: "Direct calendar integration → Confirmation SMS sent automatically",
        color: "#f59e0b",
      },
      {
        step: "3",
        name: "Pre-Visit Nurture",
        desc: "Email + SMS sequence → Service prep info, pricing confirmation, reviews",
        color: "#a78bfa",
      },
      {
        step: "4",
        name: "Post-Visit Reactivation",
        desc: "Ask for review → Upsell new services → Schedule next appointment",
        color: "#6366f1",
      },
    ],
  },
  hvac: {
    title: "HVAC & Home Services Stack",
    icon: "🔧",
    flows: [
      {
        step: "1",
        name: "Missed Call Text-Back",
        desc: "Call comes in during another job → Auto text sent within 60 sec",
        color: "#ef4444",
      },
      {
        step: "2",
        name: "Emergency Response",
        desc: "Urgent keyword trigger → Escalate to boss with priority alert",
        color: "#f59e0b",
      },
      {
        step: "3",
        name: "Quote & Booking",
        desc: "Send service estimate → Book appointment directly from text",
        color: "#22c55e",
      },
      {
        step: "4",
        name: "Follow-Up Sequence",
        desc: "14-day nurture for non-booked leads → Seasonal service reminders",
        color: "#a78bfa",
      },
    ],
  },
  dental: {
    title: "Dental Practice Stack",
    icon: "🦷",
    flows: [
      {
        step: "1",
        name: "Automated Responses",
        desc: "New patient inquiry → Instant reply with hygiene tips + available appointments",
        color: "#22c55e",
      },
      {
        step: "2",
        name: "Appointment Confirmation",
        desc: "24-hour reminder SMS → Confirm attendance before the appointment",
        color: "#f59e0b",
      },
      {
        step: "3",
        name: "Treatment Plans",
        desc: "Send pricing + educational info → Address patient hesitations",
        color: "#6366f1",
      },
      {
        step: "4",
        name: "Recare Campaigns",
        desc: "Schedule cleanings automatically → Proactive patient retention",
        color: "#a78bfa",
      },
    ],
  },
};

export default function IndustryBlueprintModal({ industry, onClose }) {
  const blueprint = INDUSTRY_BLUEPRINTS[industry];
  if (!blueprint) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(6px)",
          zIndex: 40,
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 50,
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 100%)",
          borderRadius: "20px",
          border: "1.5px solid rgba(154,92,46,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          animation: "blueprintSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px",
            borderBottom: "1px solid rgba(154,92,46,0.1)",
            stickyTop: 0,
            background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>{blueprint.icon}</span>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "800",
                color: "#1a1209",
                margin: 0,
              }}
            >
              {blueprint.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "rgba(26,18,9,0.4)",
            }}
          >
            <X style={{ width: "20px", height: "20px" }} />
          </button>
        </div>

        {/* Flows */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {blueprint.flows.map((flow, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "12px",
                animation: `flowFadeIn 0.4s ease-out ${0.1 + idx * 0.1}s both`,
              }}
            >
              {/* Number badge */}
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: `${flow.color}20`,
                  border: `2px solid ${flow.color}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "13px",
                  fontWeight: "700",
                  color: flow.color,
                }}
              >
                {flow.step}
              </div>

              {/* Content */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: "700",
                    color: "#1a1209",
                    margin: "0 0 4px",
                  }}
                >
                  {flow.name}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(26,18,9,0.6)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {flow.desc}
                </p>
              </div>

              {/* Timeline connector */}
              {idx < blueprint.flows.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "35px",
                    top: "calc(100% + 8px)",
                    width: "2px",
                    height: "24px",
                    background: `linear-gradient(to bottom, ${flow.color}40, transparent)`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(154,92,46,0.1)",
            background: "rgba(255,255,255,0.5)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: "100%",
              borderRadius: "9999px",
              padding: "2px",
              background:
                "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(120,70,20,0.3)",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                height: "44px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#f5e6d0",
                fontWeight: "700",
                fontSize: "13px",
              }}
            >
              Start Your Free Automation Audit
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes blueprintSlideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -45%) scale(0.92);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        @keyframes flowFadeIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
