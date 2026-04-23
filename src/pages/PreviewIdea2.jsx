import { useEffect, useRef, useState } from "react";
import { CalendarCheck, HeadphonesIcon, LayoutDashboard, MessageSquare, PhoneCall, RotateCcw, Send, Zap } from "lucide-react";

const stages = [
  { id: "lead-in", icon: Zap, eyebrow: "Trigger", title: "Lead comes in", copy: "A call, form, ad lead, or direct inquiry enters the system and gets captured immediately — nothing slips through the cracks." },
  { id: "instant-response", icon: MessageSquare, eyebrow: "Speed", title: "Instant response", copy: "The system replies within seconds so you show up first while the lead's intent is still at its peak." },
  { id: "missed-call", icon: PhoneCall, eyebrow: "Coverage", title: "Missed-call recovery", copy: "If nobody answers, a text-back fires immediately to keep the conversation alive before they call a competitor." },
  { id: "follow-up", icon: Send, eyebrow: "Nurture", title: "Follow-up runs", copy: "Automated sequences keep warm leads moving over 14 days until they reply, book, or clearly go cold." },
  { id: "booking", icon: CalendarCheck, eyebrow: "Conversion", title: "Booking handoff", copy: "Ready leads move into a frictionless booking path — fewer drop-offs, more confirmed appointments." },
  { id: "crm", icon: LayoutDashboard, eyebrow: "Visibility", title: "Pipeline updates", copy: "Statuses, tags, and handoffs stay organized automatically so your team always knows where every lead stands." },
  { id: "reactivation", icon: RotateCcw, eyebrow: "Recovery", title: "Old leads return", copy: "Dormant contacts get reactivated with proven campaigns — turning forgotten leads into fresh revenue." },
  { id: "optimization", icon: HeadphonesIcon, eyebrow: "Support", title: "System improves", copy: "Performance is reviewed and tuned after launch so the automation keeps getting stronger over time." },
];

const STAGE_DURATION = 3000;

// Place 8 nodes along a semi-circle arc
// Arc goes from ~200deg to ~340deg (bottom-left to bottom-right, opening downward)
function getArcPosition(index, total, cx, cy, rx, ry) {
  const startAngle = 200; // degrees
  const endAngle = 340;
  const angle = startAngle + (index / (total - 1)) * (endAngle - startAngle);
  const rad = (angle * Math.PI) / 180;
  return {
    x: cx + rx * Math.cos(rad),
    y: cy + ry * Math.sin(rad),
    angle,
  };
}

export default function PreviewIdea2() {
  const [activeStage, setActiveStage] = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [contentKey, setContentKey] = useState(0);
  const [sweepAngle, setSweepAngle] = useState(200);

  const advanceTo = (index) => {
    setContentVisible(false);
    setTimeout(() => {
      setActiveStage(index);
      setContentKey((k) => k + 1);
      setContentVisible(true);
    }, 340);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      advanceTo((activeStage + 1) % stages.length);
    }, STAGE_DURATION);
    return () => clearInterval(interval);
  }, [activeStage]);

  // Update sweep angle when activeStage changes
  useEffect(() => {
    const startAngle = 200;
    const endAngle = 340;
    const angle = startAngle + (activeStage / (stages.length - 1)) * (endAngle - startAngle);
    setSweepAngle(angle);
  }, [activeStage]);

  const active = stages[activeStage];
  const ActiveIcon = active.icon;

  // Arc geometry
  const CX = 500, CY = 520, RX = 390, RY = 320;
  const nodePositions = stages.map((_, i) => getArcPosition(i, stages.length, CX, CY, RX, RY));

  // SVG arc path for the background track
  const arcPath = (() => {
    const start = nodePositions[0];
    const end = nodePositions[stages.length - 1];
    return `M ${start.x} ${start.y} A ${RX} ${RY} 0 0 1 ${end.x} ${end.y}`;
  })();

  // Sweep indicator position
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const sweepX = CX + RX * Math.cos(sweepRad);
  const sweepY = CY + RY * Math.sin(sweepRad);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0d0f18 0%, #12151f 50%, #0a0d14 100%)", fontFamily: "var(--font-inter, Inter, sans-serif)", padding: "60px 40px", display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* Label */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <span style={{ display: "inline-block", background: "linear-gradient(135deg, #6b3f1f, #c8965c)", color: "#f5d9a8", fontSize: "11px", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", padding: "6px 18px", borderRadius: "9999px", marginBottom: "16px" }}>
          Preview — Idea 2: Progress Arc / Circular Flow
        </span>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: "800", color: "#f5e6d0", margin: "0 0 8px" }}>
          See the Full <span style={{ color: "#c8965c" }}>System</span> in Motion
        </h1>
        <p style={{ color: "rgba(245,230,208,0.45)", fontSize: "15px" }}>Semi-circle arc · Sweep indicator · Dark cinematic theme</p>
      </div>

      {/* Arc diagram */}
      <div style={{ position: "relative", width: "100%", maxWidth: "1000px" }}>
        <svg
          viewBox="0 0 1000 560"
          style={{ width: "100%", overflow: "visible" }}
        >
          {/* Dim arc track */}
          <path
            d={arcPath}
            fill="none"
            stroke="rgba(200,150,92,0.12)"
            strokeWidth="2"
          />

          {/* Glowing filled arc up to active node */}
          {(() => {
            const activePos = nodePositions[activeStage];
            const startPos = nodePositions[0];
            const isLarge = sweepAngle - 200 > 180 ? 1 : 0;
            const activeArcPath = `M ${startPos.x} ${startPos.y} A ${RX} ${RY} 0 ${isLarge} 1 ${activePos.x} ${activePos.y}`;
            return (
              <path
                d={activeArcPath}
                fill="none"
                stroke="url(#goldGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 6px rgba(200,150,92,0.5))" }}
              />
            );
          })()}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7a4825" />
              <stop offset="50%" stopColor="#c8965c" />
              <stop offset="100%" stopColor="#f5d9a8" />
            </linearGradient>
            <radialGradient id="sweepGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff5e0" stopOpacity="1" />
              <stop offset="40%" stopColor="#e8a550" stopOpacity="0.9" />
              <stop offset="100%" stopColor="rgba(200,150,92,0)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sweep glowing dot */}
          <circle
            cx={sweepX}
            cy={sweepY}
            r="18"
            fill="url(#sweepGlow)"
            style={{ transition: `cx ${STAGE_DURATION * 0.85}ms cubic-bezier(0.4,0,0.2,1), cy ${STAGE_DURATION * 0.85}ms cubic-bezier(0.4,0,0.2,1)`, filter: "drop-shadow(0 0 12px rgba(232,165,80,0.8))" }}
          />

          {/* Stage nodes */}
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const pos = nodePositions[index];
            const isActive = activeStage === index;
            const isPast = index < activeStage;
            const nodeR = isActive ? 36 : 28;

            return (
              <g key={stage.id} onClick={() => advanceTo(index)} style={{ cursor: "pointer" }}>
                {/* Outer glow ring for active */}
                {isActive && (
                  <circle cx={pos.x} cy={pos.y} r={nodeR + 14} fill="rgba(200,150,92,0.08)" stroke="rgba(200,150,92,0.25)" strokeWidth="1.5" />
                )}

                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeR}
                  fill={isActive ? "url(#goldGrad)" : isPast ? "rgba(154,92,46,0.35)" : "rgba(255,255,255,0.04)"}
                  stroke={isActive ? "rgba(200,150,92,0.7)" : isPast ? "rgba(154,92,46,0.4)" : "rgba(200,150,92,0.15)"}
                  strokeWidth={isActive ? "2.5" : "1.5"}
                  style={{ transition: "all 0.4s ease", filter: isActive ? "drop-shadow(0 0 14px rgba(200,150,92,0.5))" : "none" }}
                />

                {/* Icon — rendered as foreignObject */}
                <foreignObject x={pos.x - 14} y={pos.y - 14} width="28" height="28" style={{ overflow: "visible" }}>
                  <div xmlns="http://www.w3.org/1999/xhtml" style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: isActive ? "20px" : "16px", height: isActive ? "20px" : "16px", color: isActive ? "#fff5e0" : isPast ? "#c8965c" : "rgba(200,150,92,0.45)", transition: "all 0.4s ease" }} />
                  </div>
                </foreignObject>

                {/* Label below node */}
                <text
                  x={pos.x}
                  y={pos.y + nodeR + 18}
                  textAnchor="middle"
                  fill={isActive ? "#c8965c" : "rgba(245,230,208,0.35)"}
                  fontSize="11"
                  fontWeight={isActive ? "700" : "500"}
                  style={{ transition: "fill 0.4s ease", fontFamily: "Inter, sans-serif" }}
                >
                  {stage.title}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center content panel — positioned absolutely at center-bottom of arc */}
        <div style={{ position: "absolute", bottom: "0", left: "50%", transform: "translateX(-50%)", width: "min(420px, 90%)" }}>
          <div
            key={contentKey}
            style={{
              background: "linear-gradient(135deg, rgba(245,246,248,0.06) 0%, rgba(228,231,236,0.04) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1.5px solid rgba(200,150,92,0.2)",
              borderRadius: "20px",
              padding: "28px 32px",
              textAlign: "center",
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
              transition: "opacity 340ms ease, transform 340ms ease",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "linear-gradient(135deg, #7a4825, #c8965c)", boxShadow: "0 6px 20px rgba(154,92,46,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <ActiveIcon style={{ width: "24px", height: "24px", color: "#fff5e0" }} />
            </div>
            <p style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.28em", color: "#c8965c", marginBottom: "8px" }}>{active.eyebrow} · Step {activeStage + 1}/{stages.length}</p>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#f5e6d0", marginBottom: "12px" }}>{active.title}</h3>
            <p style={{ fontSize: "14px", color: "rgba(245,230,208,0.6)", lineHeight: 1.7 }}>{active.copy}</p>

            {/* Progress dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "20px" }}>
              {stages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => advanceTo(i)}
                  style={{ width: i === activeStage ? "20px" : "6px", height: "6px", borderRadius: "3px", border: "none", cursor: "pointer", background: i === activeStage ? "linear-gradient(90deg, #7a4825, #c8965c)" : "rgba(200,150,92,0.2)", transition: "all 0.4s ease" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}