import { useState, useEffect, useRef } from "react";
import { MessageSquare, Zap } from "lucide-react";

/**
 * messages: [
 *   { from: "system" | "lead", text: string, delay: number (ms) }
 * ]
 * triggerLabel: string — text on the trigger button
 * triggerEvent: string — what fires the sequence (e.g. "New missed call detected")
 * automationName: string
 * accentColor: string (hex)
 */
export default function IndustrySMSDemo({
  messages = [],
  initialMessage,
  automatedResponse,
  leadReply,
  confirmationMessage,
  triggerLabel = "Simulate",
  triggerEvent = "New lead detected",
  automationName = "AI Automation",
  accentColor = "#0088CC",
  businessName = "Your Business"
}) {
  const normalizedMessages = messages.length
    ? messages
    : [
        initialMessage && { from: "lead", text: initialMessage, delay: 300 },
        automatedResponse && { from: "system", text: automatedResponse, delay: 900 },
        leadReply && { from: "lead", text: leadReply, delay: 1100 },
        confirmationMessage && { from: "system", text: confirmationMessage, delay: 900 },
      ].filter(Boolean);
  const systemBubbleColor = accentColor.toLowerCase() === "#0088cc" ? "#005f99" : accentColor;
  const [visible, setVisible] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const timeouts = useRef([]);

  const reset = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setVisible([]);
    setRunning(false);
    setDone(false);
    setTyping(false);
  };

  const run = () => {
    if (running) {reset();return;}
    reset();
    if (!normalizedMessages.length) {
      setDone(true);
      return;
    }
    setRunning(true);

    let cumulativeDelay = 400;

    normalizedMessages.forEach((msg, i) => {
      cumulativeDelay += msg.delay || 1200;

      // Show typing indicator before system messages
      if (msg.from === "system") {
        const typingStart = cumulativeDelay - 800;
        timeouts.current.push(
          setTimeout(() => setTyping(true), Math.max(typingStart, 0))
        );
      }

      timeouts.current.push(
        setTimeout(() => {
          setTyping(false);
          setVisible((prev) => [...prev, msg]);
          if (i === messages.length - 1) {
            setRunning(false);
            setDone(true);
          }
        }, cumulativeDelay)
      );
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visible, typing]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  return (
    <section id="demo-flow" className="px-4 py-14 md:px-6 md:py-20" style={{ background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
            Live Demo Flow
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            See Exactly What Your Customers Experience
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            This is a real simulation of the {automationName} firing in real time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
          {/* Left: trigger card */}
          <div
            className="rounded-lg p-6"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,136,204,0.18)",
              boxShadow: "0 14px 38px rgba(0,59,143,0.08)"
            }}>
            
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
                
                <Zap style={{ width: "18px", height: "18px", color: accentColor }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Automation Trigger</p>
                <p className="text-sm font-semibold text-foreground">{automationName}</p>
              </div>
            </div>

            <div
              className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
              style={{ background: `${accentColor}08`, border: `1px solid ${accentColor}18` }}>
              
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: "#22c55e" }} />
              <p className="text-sm font-medium text-foreground/75">{triggerEvent}</p>
            </div>

            <button
              type="button"
              onClick={run}
              style={{
                width: "100%",
                borderRadius: "9999px",
                padding: "2px",
                background: done ?
                "linear-gradient(135deg,#16a34a,#22c55e)" :
                "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 18px rgba(120,70,20,0.28)"
              }}>
              
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "44px",
                  borderRadius: "9999px",
                  background: done ?
                  "linear-gradient(135deg,#15803d,#16a34a)" :
                  "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "14px"
                }}>
                
                {running ? "Running…" : done ? "▶ Replay Demo" : `▶ ${triggerLabel}`}
              </span>
            </button>

            {done &&
            <p className="text-center text-xs text-green-600 font-semibold mt-3">
                ✓ Sequence complete — this runs automatically, 24/7
              </p>
            }
          </div>

          {/* Right: phone mockup */}
          <div
            className="rounded-lg overflow-hidden"
            style={{
              background: "#1c1c1e",
              border: "8px solid #2c2c2e",
              boxShadow: "0 24px 60px rgba(0,59,143,0.18), inset 0 1px 0 rgba(255,255,255,0.1)",
              minHeight: "420px",
              maxHeight: "560px",
              display: "flex",
              flexDirection: "column"
            }}>
            
            {/* Phone header */}
            <div
              className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
              style={{ background: "#2c2c2e", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: accentColor }}>
                <MessageSquare style={{ width: "14px", height: "14px", color: "#fff" }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{businessName}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.68)" }}>AI System · Text Message</p>
              </div>
              <div className="ml-auto flex gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "#ffbd2e" }} />
                <span className="w-2 h-2 rounded-full" style={{ background: "#28ca41" }} />
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ background: "#1c1c1e" }}>
              
              {visible.length === 0 && !running && (
              <div className="space-y-3">
                  {normalizedMessages.slice(0, 2).map((msg, i) => (
                    <div
                      key={`preview-${i}`}
                      className={`flex ${msg.from === "system" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className="rounded-2xl px-3 py-2.5 max-w-[82%]"
                        style={{
                          background: msg.from === "system" ? systemBubbleColor : "#3a3a3c",
                          color: "#fff",
                          fontSize: "12px",
                          lineHeight: 1.55,
                          borderRadius: msg.from === "system" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                        }}
                      >
                        <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <p className="pt-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.72)" }}>
                    Press simulate to watch the full sequence run live.
                  </p>
                </div>
              )}

              {visible.map((msg, i) =>
              <div
                key={i}
                className={`flex ${msg.from === "system" ? "justify-start" : "justify-end"}`}
                style={{
                  animation: "fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both"
                }}>
                
                  <div
                  className="rounded-2xl px-3 py-2.5 max-w-[82%]"
                  style={{
                    background: msg.from === "system" ? systemBubbleColor : "#3a3a3c",
                    color: "#fff",
                    fontSize: "12px",
                    lineHeight: 1.55,
                    boxShadow: msg.from === "system" ?
                    `0 4px 14px ${systemBubbleColor}55` :
                    "0 2px 8px rgba(0,0,0,0.25)",
                    borderRadius: msg.from === "system" ?
                    "18px 18px 18px 4px" :
                    "18px 18px 4px 18px"
                  }}>
                  
                    {msg.from === "lead" &&
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                        Customer
                      </p>
                  }
                    {msg.from === "system" &&
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {businessName} · AI
                      </p>
                  }
                    <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {typing &&
              <div className="flex justify-start">
                  <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-1"
                  style={{ background: systemBubbleColor, borderRadius: "18px 18px 18px 4px" }}>
                  
                    {[0, 1, 2].map((d) =>
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-white"
                    style={{ animation: `typingDot 1.2s ${d * 0.2}s infinite ease-in-out` }} />

                  )}
                  </div>
                </div>
              }

              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </section>);

}
