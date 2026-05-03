import { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";

const MESSAGES = [
  {
    from: "lead",
    text: "Hi, I\u2019m interested in Botox. Do you have availability this week?",
    delay: 800,
    time: "11:42 AM",
  },
  {
    from: "system",
    text: "Hey Sarah! \uD83D\uDC4B Thanks for reaching out to Glow Med Spa. We have openings Thursday at 2pm or Friday at 10am \u2014 which works better for you?",
    delay: 1800,
    time: "11:42 AM",
    label: "AI replied in 47 sec",
  },
  {
    from: "lead",
    text: "Thursday at 2pm works!",
    delay: 2200,
    time: "11:43 AM",
  },
  {
    from: "system",
    text: "Perfect! \u2705 You\u2019re booked for Thursday at 2pm. We\u2019ll send a reminder the morning of. See you then!",
    delay: 1400,
    time: "11:43 AM",
  },
];

export default function HeroSMSDemo() {
  const [visible, setVisible] = useState([]);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const messagesRef = useRef(null);
  const bottomRef = useRef(null);
  const timeouts = useRef([]);

  const runSequence = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setVisible([]);
    setTyping(false);
    setDone(false);

    let cumulative = 600;
    MESSAGES.forEach((msg, i) => {
      cumulative += msg.delay;
      if (msg.from === "system") {
        const typingAt = cumulative - 900;
        timeouts.current.push(setTimeout(() => setTyping(true), Math.max(typingAt, 0)));
      }
      timeouts.current.push(
        setTimeout(() => {
          setTyping(false);
          setVisible((prev) => [...prev, msg]);
          if (i === MESSAGES.length - 1) setDone(true);
        }, cumulative)
      );
    });
  };

  useEffect(() => {
    runSequence();
    const loop = setInterval(runSequence, 13000);
    return () => {
      clearInterval(loop);
      timeouts.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    // Scrolling the page-level bottom marker was pulling the full homepage down
    // toward this demo every time the message animation advanced. Only scroll
    // the chat pane itself here so the demo stays animated without hijacking
    // the document scroll position.
    const messagesEl = messagesRef.current;
    if (!messagesEl) return;

    messagesEl.scrollTo({
      top: messagesEl.scrollHeight,
      behavior: "smooth",
    });
  }, [visible, typing]);

  return (
    <div style={{ width: "100%", maxWidth: "300px", margin: "0 auto", fontFamily: "-apple-system, BlinkMacSystemFont, \'SF Pro Text\', sans-serif" }}>
      {/* Phone shell */}
      <div style={{
        borderRadius: "40px",
        background: "linear-gradient(160deg, #2a2a2a 0%, #1a1a1a 100%)",
        padding: "10px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.1)",
        position: "relative",
      }}>
        {/* Side buttons */}
        <div style={{ position: "absolute", left: "-3px", top: "80px", width: "3px", height: "28px", background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: "-3px", top: "118px", width: "3px", height: "44px", background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", left: "-3px", top: "172px", width: "3px", height: "44px", background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
        <div style={{ position: "absolute", right: "-3px", top: "130px", width: "3px", height: "60px", background: "#3a3a3a", borderRadius: "0 2px 2px 0" }} />

        {/* Screen */}
        <div style={{ borderRadius: "32px", background: "#f2f2f7", overflow: "hidden", display: "flex", flexDirection: "column" }}>

          {/* Status bar */}
          <div style={{ background: "#ffffff", padding: "10px 20px 4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#1c1c1e" }}>9:41</span>
            {/* Dynamic island */}
            <div style={{ width: "88px", height: "22px", background: "#1a1a1a", borderRadius: "20px" }} />
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <div style={{ fontSize: "10px", color: "#1c1c1e" }}>●●●</div>
            </div>
          </div>

          {/* iMessage nav bar */}
          <div style={{ background: "#ffffff", borderBottom: "0.5px solid #e5e5ea", padding: "6px 12px 10px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #0088CC, #00AEEF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800", color: "#ffffff", marginBottom: "4px", boxShadow: "0 2px 8px rgba(0,174,239,0.35)" }}>G</div>
            <p style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e", margin: 0 }}>Glow Med Spa</p>
            <p style={{ fontSize: "11px", color: "#8e8e93", margin: 0 }}>iMessage</p>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px", minHeight: "320px", maxHeight: "320px", overflowY: "auto" }}
          >
            {visible.map((msg, i) => (
              <div key={i}>
                {msg.label && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", margin: "4px 0" }}>
                    <Zap style={{ width: "9px", height: "9px", color: "#30d158" }} />
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#30d158", letterSpacing: "0.02em" }}>{msg.label}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: msg.from === "lead" ? "flex-end" : "flex-start", animation: "smsBubbleIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                  <div style={{
                    maxWidth: "82%",
                    padding: "8px 12px",
                    borderRadius: msg.from === "lead" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.from === "lead" ? "linear-gradient(135deg, #7a4825 0%, #c8965c 100%)" : "#ffffff",
                    color: msg.from === "lead" ? "#fff8ee" : "#1c1c1e",
                    fontSize: "12.5px",
                    lineHeight: "1.4",
                    boxShadow: msg.from === "system" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}>
                    {msg.text}
                  </div>
                </div>
                <div style={{ textAlign: msg.from === "lead" ? "right" : "left", fontSize: "9.5px", color: "#8e8e93", marginTop: "1px", padding: "0 4px" }}>
                  {msg.time}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", animation: "smsBubbleIn 0.3s ease both" }}>
                <div style={{ background: "#ffffff", borderRadius: "18px 18px 18px 4px", padding: "10px 14px", display: "flex", gap: "4px", alignItems: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8e8e93", animation: `smsTypingDot 1.2s ease-in-out ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            {done && (
              <div style={{ textAlign: "center", marginTop: "6px", animation: "smsBubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                <span style={{ display: "inline-block", background: "rgba(48,209,88,0.12)", color: "#30d158", fontSize: "10.5px", fontWeight: "700", padding: "3px 12px", borderRadius: "20px", border: "1px solid rgba(48,209,88,0.3)" }}>
                  \u2713 Appointment booked
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* iMessage input bar */}
          <div style={{ background: "#ffffff", borderTop: "0.5px solid #e5e5ea", padding: "8px 10px", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ flex: 1, background: "#f2f2f7", borderRadius: "18px", padding: "7px 12px", fontSize: "12px", color: "#8e8e93" }}>iMessage</div>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #7a4825, #c8965c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Caption + Replay */}
      <div style={{ textAlign: "center", marginTop: "14px" }}>
        <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.42)", letterSpacing: "0.04em", marginBottom: "6px" }}>
          Lead to booked appointment — fully automated
        </p>
        {done && (
          <button
            onClick={runSequence}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              fontSize: "11px", fontWeight: "700", color: "#9a5c2e",
              background: "rgba(154,92,46,0.08)", border: "1px solid rgba(154,92,46,0.25)",
              borderRadius: "20px", padding: "5px 14px", cursor: "pointer",
            }}
          >
            ↺ Replay demo
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes smsBubbleIn {
          0% { opacity: 0; transform: scale(0.82) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes smsTypingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      ` }} />
    </div>
  );
}