import { useEffect, useRef, useState } from "react";
import { Mail, MessageSquare, CheckCircle2, Repeat } from "lucide-react";

const STEPS = [
  {
    id: "enrolled",
    number: "01",
    label: "Lead Enrolled",
    title: "Lead enters the 14-day sequence.",
    description: "The moment a lead submits a form or is marked as unresponsive, they're automatically enrolled — no manual action required.",
    color: "#0ea5e9",
    bgColor: "rgba(14,165,233,0.08)",
    borderColor: "rgba(14,165,233,0.3)",
  },
  {
    id: "sms",
    number: "02",
    label: "Day 1 SMS",
    title: "Warm SMS fires within minutes.",
    description: "A friendly, personalized text goes out — referencing their specific service interest to feel human, not automated.",
    color: "#8b5cf6",
    bgColor: "rgba(139,92,246,0.08)",
    borderColor: "rgba(139,92,246,0.3)",
  },
  {
    id: "email",
    number: "03",
    label: "Day 3 Email",
    title: "Value-first follow-up email sent.",
    description: "A helpful email with social proof, an answer to common objections, and a soft call-to-action to book.",
    color: "#f59e0b",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  {
    id: "converted",
    number: "04",
    label: "Day 7 — Booked",
    title: "Lead replies and books.",
    description: "On average, 35–40% of leads respond within 7 days when nurtured consistently. One message unlocks the revenue.",
    color: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
    borderColor: "rgba(34,197,94,0.3)",
  },
];

const TIMELINE = [
  { day: "Day 1", channel: "sms",   label: "Welcome SMS",        text: "Hey [Name]! Thanks for your interest in [Service]. We'd love to help — want to grab a quick 15-min call this week?", color: "#0ea5e9" },
  { day: "Day 2", channel: "email", label: "Intro Email",        text: "Subject: Quick question about [Service]\n\nHi [Name], just checking in — we have a few openings this week. Here's what clients like you say about us…", color: "#f59e0b" },
  { day: "Day 4", channel: "sms",   label: "Value Nudge",        text: "Still thinking about [Service]? We helped [Client] get [Result] last month. Happy to chat — reply YES to book a free consult!", color: "#8b5cf6" },
  { day: "Day 7", channel: "email", label: "Social Proof Email", text: "Subject: Real results from [Business Type] clients\n\n\"We went from 2 bookings/week to 10+ with this system\" — Jessica M.", color: "#f59e0b" },
  { day: "Day 10", channel: "sms",  label: "Urgency Trigger",   text: "Last chance to grab our open slot this week, [Name]. Reply BOOK and I'll send the link directly. 🗓️", color: "#0ea5e9" },
  { day: "Day 14", channel: "sms",  label: "Final Touch",        text: "Hey [Name] — no hard feelings if the timing isn't right. When you're ready, we're here. Reply anytime 👋", color: "#22c55e" },
];

function PhoneScreen({ step, visibleItems }) {
  return (
    <div style={{
      width: "180px",
      height: "320px",
      borderRadius: "28px",
      background: "#0a0a0a",
      border: "6px solid #1a1a1a",
      boxShadow: "0 24px 60px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.06)",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60px", height: "18px", background: "#0a0a0a", borderRadius: "0 0 12px 12px", zIndex: 10 }} />

      <div style={{ width: "100%", height: "100%", background: "linear-gradient(180deg, #1c1c1e 0%, #000 100%)", display: "flex", flexDirection: "column", padding: "22px 8px 8px" }}>
        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: "10px" }}>14-Day Nurture Timeline</div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
          {TIMELINE.slice(0, visibleItems).map((item, i) => (
            <div key={i} style={{
              display: "flex", gap: "6px", alignItems: "flex-start",
              animation: "fadeInUp 0.4s ease-out",
              opacity: i === visibleItems - 1 ? 1 : 0.65,
            }}>
              {/* Day badge */}
              <div style={{
                flexShrink: 0, width: "28px", padding: "3px 0", textAlign: "center",
                background: item.channel === "sms" ? "rgba(14,165,233,0.2)" : "rgba(245,158,11,0.2)",
                borderRadius: "5px", fontSize: "6px", fontWeight: "800",
                color: item.channel === "sms" ? "#0ea5e9" : "#f59e0b",
              }}>
                {item.day}
              </div>
              {/* Message pill */}
              <div style={{
                flex: 1, padding: "4px 6px", borderRadius: "6px",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${item.channel === "sms" ? "rgba(14,165,233,0.15)" : "rgba(245,158,11,0.15)"}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "3px", marginBottom: "2px" }}>
                  {item.channel === "sms"
                    ? <MessageSquare style={{ width: "7px", height: "7px", color: "#0ea5e9" }} />
                    : <Mail style={{ width: "7px", height: "7px", color: "#f59e0b" }} />
                  }
                  <span style={{ fontSize: "7px", fontWeight: "700", color: item.channel === "sms" ? "#0ea5e9" : "#f59e0b" }}>{item.label}</span>
                </div>
                <div style={{ fontSize: "6.5px", color: "rgba(255,255,255,0.5)", lineHeight: 1.35, maxHeight: "24px", overflow: "hidden" }}>
                  {item.text.split('\n')[0]}
                </div>
              </div>
            </div>
          ))}

          {/* Booked indicator at end */}
          {step === 3 && visibleItems >= TIMELINE.length && (
            <div style={{
              marginTop: "4px", padding: "7px 8px", borderRadius: "8px",
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)",
              display: "flex", alignItems: "center", gap: "5px",
              animation: "fadeInUp 0.4s ease-out",
            }}>
              <CheckCircle2 style={{ width: "10px", height: "10px", color: "#22c55e", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: "8px", fontWeight: "800", color: "#22c55e" }}>LEAD BOOKED! 🎉</div>
                <div style={{ fontSize: "6.5px", color: "rgba(255,255,255,0.5)" }}>Replied on Day 7</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NurtureSequenceAnimation() {
  const [activeStep, setActiveStep] = useState(0);
  const [visibleItems, setVisibleItems] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const sectionRef = useRef(null);
  const timersRef = useRef([]);

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };

  const runAnimation = () => {
    clearTimers();
    setIsPlaying(true);
    setHasStarted(true);
    setActiveStep(0);
    setVisibleItems(0);

    const schedule = [
      [600,  () => { setVisibleItems(1); }],
      [1400, () => { setActiveStep(1); setVisibleItems(2); }],
      [2400, () => { setVisibleItems(3); }],
      [3400, () => { setActiveStep(2); setVisibleItems(4); }],
      [4400, () => { setVisibleItems(5); }],
      [5400, () => { setActiveStep(3); setVisibleItems(6); }],
      [7000, () => setIsPlaying(false)],
    ];
    schedule.forEach(([delay, fn]) => {
      timersRef.current.push(setTimeout(fn, delay));
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !hasStarted) runAnimation(); },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!isPlaying && hasStarted) {
      const loop = setTimeout(runAnimation, 3500);
      return () => clearTimeout(loop);
    }
  }, [isPlaying, hasStarted]);

  useEffect(() => () => clearTimers(), []);

  return (
    <section ref={sectionRef} style={{ background: "#ffffff", padding: "80px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.2)", borderRadius: "9999px", padding: "4px 14px", marginBottom: "16px" }}>
            <Repeat style={{ width: "12px", height: "12px", color: "#0ea5e9" }} />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#0088CC", textTransform: "uppercase", letterSpacing: "0.15em" }}>14-Day Nurture Sequence</span>
          </div>
          <h2 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: "800", color: "#0A1628", margin: "0 0 12px", lineHeight: 1.15 }}>
            Most leads need 5–7 touchpoints.<br />
            <span style={{ background: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Yours fires them automatically.
            </span>
          </h2>
          <p style={{ fontSize: "16px", color: "rgba(10,22,40,0.55)", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
            Watch a 14-day multi-touch sequence unfold — SMS and email working together to warm up a cold lead and convert them into a booked appointment.
          </p>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "32px", alignItems: "center", marginBottom: "48px" }}>

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                onClick={() => setActiveStep(idx)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "14px",
                  padding: "16px 18px", borderRadius: "16px",
                  border: `1.5px solid ${activeStep === idx ? step.borderColor : "rgba(0,0,0,0.07)"}`,
                  background: activeStep === idx ? step.bgColor : "#fafafa",
                  cursor: "pointer", transition: "all 0.4s ease",
                  transform: activeStep === idx ? "translateX(4px)" : "translateX(0)",
                  boxShadow: activeStep === idx ? `0 4px 20px ${step.color}18` : "none",
                }}
              >
                <div style={{
                  width: "32px", height: "32px", borderRadius: "10px", flexShrink: 0,
                  background: activeStep === idx ? step.color : "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.3s ease",
                }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: activeStep === idx ? "#fff" : "rgba(0,0,0,0.3)" }}>{step.number}</span>
                </div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: "700", color: activeStep === idx ? step.color : "rgba(0,0,0,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>{step.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: activeStep === idx ? "#0A1628" : "rgba(10,22,40,0.45)", marginBottom: "3px", transition: "color 0.3s" }}>{step.title}</div>
                  <div style={{ fontSize: "12px", color: activeStep === idx ? "rgba(10,22,40,0.6)" : "rgba(10,22,40,0.3)", lineHeight: 1.4, transition: "color 0.3s" }}>{step.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <PhoneScreen step={activeStep} visibleItems={visibleItems} />
            <button
              onClick={runAnimation}
              disabled={isPlaying}
              style={{
                padding: "8px 20px", borderRadius: "9999px",
                background: isPlaying ? "rgba(14,165,233,0.1)" : "linear-gradient(135deg,#0ea5e9,#8b5cf6)",
                border: "none", color: isPlaying ? "#0ea5e9" : "#fff",
                fontSize: "12px", fontWeight: "700", cursor: isPlaying ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {isPlaying ? "Playing…" : "▶  Replay"}
            </button>
          </div>

          {/* Results panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{
              padding: "20px", borderRadius: "16px",
              background: activeStep === 3 ? "rgba(34,197,94,0.06)" : "#fafafa",
              border: `1.5px solid ${activeStep === 3 ? "rgba(34,197,94,0.3)" : "rgba(0,0,0,0.07)"}`,
              transition: "all 0.5s ease",
            }}>
              <p style={{ fontSize: "10px", fontWeight: "700", color: activeStep === 3 ? "#16a34a" : "rgba(0,0,0,0.3)", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>What you gain</p>
              {[
                { emoji: "💬", color: "#0ea5e9", label: "Multi-Channel Follow-Up", sub: "SMS + email working in tandem" },
                { emoji: "🧠", color: "#8b5cf6", label: "Personalized Messaging", sub: "Each message feels 1-on-1" },
                { emoji: "📅", color: "#f59e0b", label: "Consistent 14-Day Coverage", sub: "No lead falls through the cracks" },
                { emoji: "📈", color: "#22c55e", label: "3× More Booked Appointments", sub: "Vs. single-touch follow-up" },
              ].map(({ emoji, color, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", opacity: activeStep === 3 ? 1 : 0.3, transition: "opacity 0.5s ease" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "14px" }}>
                    {emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>{label}</div>
                    <div style={{ fontSize: "11px", color: "rgba(10,22,40,0.45)" }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { value: "14", label: "Days automated" },
                { value: "6", label: "Touchpoints" },
                { value: "3×", label: "More bookings" },
                { value: "0", label: "Manual effort" },
              ].map(({ value, label }) => (
                <div key={label} style={{ padding: "14px 12px", borderRadius: "12px", background: "#fafafa", border: "1.5px solid rgba(0,0,0,0.07)", textAlign: "center" }}>
                  <div style={{ fontSize: "20px", fontWeight: "900", color: "#0088CC", lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: "10px", color: "rgba(10,22,40,0.45)", marginTop: "3px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div style={{ display: "flex", justifyContent: "center", gap: "32px", flexWrap: "wrap", paddingTop: "32px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {[
            { icon: "📱", text: "SMS + email in one sequence" },
            { icon: "🧠", text: "AI-personalized for each lead" },
            { icon: "⏱️", text: "Fully automated — set it and forget it" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "rgba(10,22,40,0.6)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      ` }} />
    </section>
  );
}