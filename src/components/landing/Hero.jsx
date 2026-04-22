import { useState, useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

// Each step in the sequence engine (not just final messages)
// Handled procedurally in runSequence below

function TypingDots({ fromLead = false }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${fromLead ? "bg-gray-400" : "bg-white/80"}`}
          style={{
            animation: `typingBounce 1.2s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function SMSMockup() {
  // messages: array of { from: "lead"|"system", text, time, tag? }
  const [messages, setMessages] = useState([]);
  // deliveryStatus per message index: "sent" | "delivered" | "read"
  const [deliveryStatuses, setDeliveryStatuses] = useState({});
  // tapback: index of lead message that gets a heart reaction
  const [tapbackIndex, setTapbackIndex] = useState(null);
  // typingFrom: "system"|"lead"|null — who is currently showing typing dots
  const [typingFrom, setTypingFrom] = useState(null);
  const [floatingReply, setFloatingReply] = useState(false);
  const [floatingBooked, setFloatingBooked] = useState(false);
  const containerRef = useRef(null);

  // Auto-scroll chat area only (never the page)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, typingFrom, deliveryStatuses, tapbackIndex]);

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  function addMessage(msg) {
    setMessages((prev) => [...prev, msg]);
  }

  function setDelivery(index, status) {
    setDeliveryStatuses((prev) => ({ ...prev, [index]: status }));
  }

  useEffect(() => {
    let cancelled = false;

    async function runSequence() {
      // Reset everything
      setMessages([]);
      setDeliveryStatuses({});
      setTapbackIndex(null);
      setTypingFrom(null);
      setFloatingReply(false);
      setFloatingBooked(false);

      // ── Step 1: Sarah sends first message ──
      await sleep(1600);
      if (cancelled) return;
      addMessage({ from: "lead", text: "Hi! I saw your ad for the laser facial. How much is it?", time: "2:14 PM" });

      // ── Step 2: AI types then replies ──
      await sleep(3600);
      if (cancelled) return;
      setTypingFrom("system");
      await sleep(2800);
      if (cancelled) return;
      setTypingFrom(null);
      // aiMsg is index 1 (lead msg is index 0)
      const aiMsg1Index = 1;
      addMessage({ from: "system", text: "Hi Sarah! Thanks for reaching out to Glow Med Spa 💛 Our laser facial starts at $249. I'd love to get you booked — are mornings or afternoons better for you?", time: "2:14 PM", tag: "Replied in 8 sec" });
      setFloatingReply(true);
      // Sent → Delivered after 1.5s
      setDelivery(aiMsg1Index, "sent");
      await sleep(1500);
      if (cancelled) return;
      setDelivery(aiMsg1Index, "delivered");

      // ── Step 3: Delivered → Read after ~8s (simulates Sarah opening it) ──
      await sleep(8000);
      if (cancelled) return;
      setDelivery(aiMsg1Index, "read");

      // ── Step 4: Sarah typing dots ──
      await sleep(2000);
      if (cancelled) return;
      setTypingFrom("lead");
      await sleep(2400);
      if (cancelled) return;
      setTypingFrom(null);

      // ── Step 5: Sarah sends reply ──
      const leadMsg2Index = 2;
      addMessage({ from: "lead", text: "Afternoons work! Maybe Thursday?", time: "2:16 PM" });

      // ── Step 5b: AI sends a tapback ❤️ on Sarah's reply after 2s ──
      await sleep(2000);
      if (cancelled) return;
      setTapbackIndex(leadMsg2Index);

      // ── Step 6: Wait before AI answers ──
      await sleep(3000);
      if (cancelled) return;

      // ── Step 7: AI types then sends booking confirmation ──
      setTypingFrom("system");
      await sleep(2400);
      if (cancelled) return;
      setTypingFrom(null);
      const aiMsg2Index = 3;
      addMessage({ from: "system", text: "Perfect! I've reserved Thursday at 3 PM for you. Here's your booking link to confirm: glowspa.com/book ✅", time: "2:16 PM", tag: "Booked!" });
      setFloatingBooked(true);
      setDelivery(aiMsg2Index, "sent");
      await sleep(1200);
      if (cancelled) return;
      setDelivery(aiMsg2Index, "delivered");
      await sleep(5000);
      if (cancelled) return;
      setDelivery(aiMsg2Index, "read");

      // ── Hold then loop ──
      await sleep(4000);
      if (cancelled) return;
      runSequence();
    }

    runSequence();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto" aria-hidden="true" style={{ isolation: "isolate" }}>
      {/* Phone frame — fixed height so it never resizes during animation */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #f5f5f7 0%, #ffffff 100%)",
          border: "1.5px solid rgba(0,0,0,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {/* Status bar — extra top padding (+10%) */}
        <div className="flex items-center justify-between px-5 pt-6 pb-2">
          <span className="text-[10px] font-semibold text-gray-400">2:14 PM</span>
          <div className="w-12 h-1.5 rounded-full bg-gray-200" />
          <span className="text-[10px] font-semibold text-gray-400">100%</span>
        </div>

        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #9a5c2e, #c8965c)" }}
          >
            G
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Glow Med Spa</p>
            <p className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              AI System Active
            </p>
          </div>
        </div>

        {/* Messages scroll area — fixed height so phone never changes size */}
        <div
          ref={containerRef}
          className="px-3 py-4 space-y-3"
          style={{ height: "380px", overflowY: "auto", scrollbarWidth: "none" }}
        >
          {messages.map((msg, i) => {
            const ds = deliveryStatuses[i];
            return (
              <div
                key={i}
                className={`flex flex-col ${msg.from === "lead" ? "items-start" : "items-end"}`}
                style={{ animation: "fadeSlideIn 0.35s ease forwards" }}
              >
                {/* Tag pill */}
                {msg.tag && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full"
                    style={{
                      background: msg.tag === "Booked!" ? "rgba(34,197,94,0.15)" : "rgba(154,92,46,0.12)",
                      color: msg.tag === "Booked!" ? "#16a34a" : "#9a5c2e",
                      border: msg.tag === "Booked!" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(154,92,46,0.25)",
                    }}
                  >
                    {msg.tag}
                  </span>
                )}

                {/* Bubble + tapback wrapper */}
                <div className="relative">
                  <div
                    className="max-w-[82%] rounded-2xl px-3 py-2"
                    style={{
                      background: msg.from === "lead"
                        ? "#e9e9eb"
                        : "linear-gradient(135deg, #34c759, #28a745)",
                      borderBottomLeftRadius: msg.from === "lead" ? "4px" : undefined,
                      borderBottomRightRadius: msg.from === "system" ? "4px" : undefined,
                    }}
                  >
                    <p className={`text-[11px] leading-relaxed ${msg.from === "lead" ? "text-gray-800" : "text-white"}`}>{msg.text}</p>
                  </div>

                  {/* Tapback ❤️ reaction */}
                  {tapbackIndex === i && (
                    <div
                      className="absolute -bottom-2 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[10px]"
                      style={{ animation: "tapbackPop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
                    >
                      ❤️
                    </div>
                  )}
                </div>

                {/* Timestamp + delivery ticks */}
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-[9px] text-gray-400">{msg.time}</span>
                  {msg.from === "system" && ds && (
                    <span
                      className="flex items-center gap-0.5 text-[9px] font-semibold"
                      style={{
                        color: ds === "read" ? "#3b82f6" : "#9ca3af",
                        animation: "fadeSlideIn 0.3s ease forwards",
                      }}
                    >
                      {ds === "sent" && (
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M1 4l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                      {(ds === "delivered" || ds === "read") && (
                        <svg width="16" height="8" viewBox="0 0 16 8" fill="none">
                          <path d="M1 4l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M5 4l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {ds === "read" && <span className="ml-0.5">Read</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live typing indicator */}
          {typingFrom && (
            <div className={`flex flex-col ${typingFrom === "lead" ? "items-start" : "items-end"}`}>
              <div
                className="rounded-2xl"
                style={{
                  background: typingFrom === "lead"
                    ? "#e9e9eb"
                    : "linear-gradient(135deg, #34c759, #28a745)",
                  borderBottomLeftRadius: typingFrom === "lead" ? "4px" : undefined,
                  borderBottomRightRadius: typingFrom === "system" ? "4px" : undefined,
                }}
              >
                <TypingDots fromLead={typingFrom === "lead"} />
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar — extra bottom padding (+10%) */}
        <div
          className="flex items-center gap-2 px-3 pt-3 pb-5 border-t"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div
            className="flex-1 h-8 rounded-full px-3 flex items-center"
            style={{ background: "#f0f0f0", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <span className="text-[10px] text-gray-400">iMessage</span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #34c759, #28a745)" }}
          >
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Floating "Replied in 8 sec" pill */}
      <div
        className="absolute -left-6 top-1/3 flex items-center gap-2 rounded-full px-3 py-2 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(200,150,92,0.3)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          opacity: floatingReply ? 1 : 0,
          transform: floatingReply ? "translateX(0) scale(1)" : "translateX(-12px) scale(0.9)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-foreground">Replied in 8 sec</span>
      </div>

      {/* Floating "Appointment Booked" pill */}
      <div
        className="absolute -right-4 bottom-20 flex items-center gap-2 rounded-full px-3 py-2 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(34,197,94,0.3)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          opacity: floatingBooked ? 1 : 0,
          transform: floatingBooked ? "translateX(0) scale(1)" : "translateX(12px) scale(0.9)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span className="text-[10px] font-bold text-foreground">Appointment Booked</span>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tapbackPop {
          from { opacity: 0; transform: scale(0.3); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function Hero() {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const handleLearnMore = (e) => {
    e.preventDefault();
    trackCTA("see_how_it_works", "hero");
    const target = document.getElementById("services");
    if (!target) { window.location.href = "/#services"; return; }
    const start = window.scrollY;
    const end = target.getBoundingClientRect().top + window.scrollY - 64;
    const distance = end - start;
    const duration = 1200;
    let startTime = null;
    const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      window.scrollTo(0, start + distance * easeInOutCubic(progress));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(38,18%,94%) 0%, hsl(40,10%,97%) 50%, hsl(0,0%,100%) 100%)",
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* Background gradient overlays for depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 60% 70% at 0% 0%, rgba(200,150,92,0.12) 0%, transparent 55%),
              radial-gradient(ellipse 50% 50% at 100% 60%, rgba(245,217,168,0.10) 0%, transparent 50%),
              radial-gradient(ellipse 80% 40% at 40% 100%, rgba(154,92,46,0.06) 0%, transparent 60%)
            `,
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/60 to-transparent" />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT: Copy */}
            <div className="flex flex-col items-start text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  Built for Med Spas & Service Businesses
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold tracking-tight leading-[1.1] mb-5 text-foreground">
                Turn Missed Leads Into{" "}
                <span
                  className="inline-block"
                  style={{
                    background: "linear-gradient(135deg, #7a4825 0%, #c8965c 50%, #9a5c2e 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Booked Clients
                </span>
                <span className="block text-foreground">Automatically — Without Hiring Staff</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base md:text-lg text-foreground/75 leading-relaxed mb-8 max-w-lg font-medium">
                We install done-for-you AI systems that capture, respond, and follow up with every lead instantly for med spas.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                {/* Primary */}
                <button
                  type="button"
                  onClick={() => {
                    trackCTA("book_your_demo", "hero");
                    setShowBookingModal(true);
                  }}
                  style={{
                    display: "inline-block",
                    borderRadius: "9999px",
                    padding: "2px",
                    background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                    boxShadow: "0 4px 24px rgba(120,70,20,0.4)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.55)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 24px rgba(120,70,20,0.4)"; }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      height: "52px",
                      padding: "0 32px",
                      borderRadius: "9999px",
                      background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                      color: "#f5e6d0",
                      fontWeight: "700",
                      fontSize: "1rem",
                      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                    }}
                  >
                    Book Your Demo
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>

                {/* Secondary */}
                <button
                  type="button"
                  onClick={handleLearnMore}
                  className="inline-flex items-center gap-2 h-[52px] px-7 rounded-full border-2 border-primary/30 bg-white/70 backdrop-blur-sm text-sm font-semibold text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                >
                  See How It Works
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Trust micro-bullets */}
              <div className="flex flex-col gap-2.5">
                {[
                  "Respond to leads instantly (24/7)",
                  "Recover missed calls automatically",
                  "Increase bookings without hiring staff",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: SMS Mockup */}
            <div className="flex justify-center lg:justify-end">
              <SMSMockup />
            </div>
          </div>
        </div>
      </section>

      {showBookingModal && <DemoBookingModal onClose={() => setShowBookingModal(false)} />}
    </>
  );
}