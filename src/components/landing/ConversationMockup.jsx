import { useEffect, useRef, useState } from "react";

// All steps in the animation sequence
// delay = ms after previous step completes before this one shows
const STEPS = [
  // --- Round 1 ---
  {
    id: "sys1",
    type: "system",
    text: "New lead received: Sarah M. — Interested in Botox consultation",
    delay: 800,
  },
  {
    id: "bot1",
    type: "bot",
    label: "Instant Auto-Response",
    text: "Hi Sarah! Thanks for reaching out about our Botox services. Would you prefer a morning or afternoon consultation?",
    time: "2:14 PM",
    delay: 1400,
  },
  {
    id: "read1",
    type: "read",
    delay: 2400,
  },
  {
    id: "typing1",
    type: "typing",
    delay: 2000,
  },
  {
    id: "sarah1",
    type: "lead",
    text: "Afternoon works best for me!",
    time: "2:16 PM",
    delay: 2800,
  },
  {
    id: "aityping1",
    type: "aityping",
    delay: 1800,
  },
  {
    id: "bot2",
    type: "bot",
    label: "Smart Booking Flow",
    text: "Perfect! I have Thursday at 3:00 PM available. Here's your booking link: [Book Now] 🗓️",
    time: "2:16 PM",
    delay: 2400,
  },
  {
    id: "sys2",
    type: "system",
    text: "✓ Appointment booked: Thursday, 3:00 PM — Botox Consultation",
    delay: 1800,
  },
  {
    id: "gap",
    type: "timegap",
    text: "30 minutes later...",
    delay: 3000,
  },
  {
    id: "aityping2",
    type: "aityping",
    delay: 1600,
  },
  {
    id: "bot3",
    type: "bot",
    label: "Automated Follow-Up",
    text: "Hi Sarah! Just confirming your Botox consultation Thursday at 3 PM. Reply YES to confirm or call us to reschedule. See you soon! 💫",
    time: "2:46 PM",
    delay: 2600,
  },
  {
    id: "read2",
    type: "read",
    delay: 2200,
  },
  {
    id: "typing2",
    type: "typing",
    delay: 2000,
  },
  {
    id: "sarah2",
    type: "lead",
    text: "YES, confirmed! See you then 😊",
    time: "2:47 PM",
    delay: 2600,
  },
  {
    id: "sys3",
    type: "system",
    text: "✓ Appointment confirmed by client",
    delay: 1600,
  },
];

function TypingDots({ color = "gray" }) {
  return (
    <div className={`flex items-center gap-1 px-4 py-3 rounded-2xl rounded-bl-sm w-16 ${color === "green" ? "bg-[#dcf8c6]" : "bg-[#e5e5ea]"}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.18}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

export default function ConversationMockup() {
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);
  const timeoutsRef = useRef([]);
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [showTyping, setShowTyping] = useState(false); // sarah typing
  const [showAiTyping, setShowAiTyping] = useState(false);
  const [readReceipt, setReadReceipt] = useState(false);
  const [animating, setAnimating] = useState(false);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const startAnimation = () => {
    clearAllTimeouts();
    setVisibleSteps([]);
    setShowTyping(false);
    setShowAiTyping(false);
    setReadReceipt(false);
    setAnimating(true);

    let elapsed = 0;

    STEPS.forEach((step) => {
      elapsed += step.delay;
      const t = setTimeout(() => {
        if (step.type === "typing") {
          setShowTyping(true);
          const hide = setTimeout(() => setShowTyping(false), 1300);
          timeoutsRef.current.push(hide);
        } else if (step.type === "aityping") {
          setShowAiTyping(true);
          const hide = setTimeout(() => setShowAiTyping(false), 1100);
          timeoutsRef.current.push(hide);
        } else if (step.type === "read") {
          setReadReceipt(true);
          const hide = setTimeout(() => setReadReceipt(false), 2200);
          timeoutsRef.current.push(hide);
        } else {
          setVisibleSteps((prev) => [...prev, step.id]);
        }
        // scroll chat to bottom
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, elapsed);
      timeoutsRef.current.push(t);
    });

    const total = elapsed + 1000;
    const done = setTimeout(() => setAnimating(false), total);
    timeoutsRef.current.push(done);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      observer.disconnect();
      clearAllTimeouts();
    };
  }, []);

  const isVisible = (id) => visibleSteps.includes(id);

  // Find the last visible bot message for read receipt positioning
  const lastBotVisible = [...STEPS]
    .reverse()
    .find((s) => s.type === "bot" && isVisible(s.id));

  return (
    <section ref={sectionRef} className="py-20 md:py-28 pb-40 md:pb-56 px-6 bg-gradient-to-b from-background via-card to-amber-50/20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            See It In Action
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            From Lead to Booked — In Minutes
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Watch the automation play out in real time.
          </p>
        </div>

        {/* Phone container */}
        <div className="mx-auto" style={{ perspective: "1200px", maxWidth: "450px" }}>
          {/* 3D tilt wrapper */}
          <div style={{ transform: "rotateY(-2deg) rotateX(1deg)" }}>
          {/* Phone shell */}
          <div className="bg-white rounded-[2.8rem] overflow-hidden relative" style={{ boxShadow: "0 50px 100px -20px rgba(0,0,0,0.25), 0 30px 60px -30px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.05)", border: "3px solid #1a1a1a", outline: "1px solid rgba(0,0,0,0.12)", outlineOffset: "2px" }}>
            {/* Notch / Dynamic Island */}
            <div className="bg-white relative">
              <div className="mx-auto mt-2 w-[90px] h-[24px] bg-black rounded-full" />
              <div className="px-6 pt-2 pb-1 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground">2:14 PM</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-[2px] items-end">
                    {[3,5,7,9].map(h => <div key={h} className="w-[3px] bg-foreground/80 rounded-sm" style={{ height: `${h}px` }} />)}
                  </div>
                  <svg className="w-4 h-4 text-foreground/80" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.24 4.24 0 00-6 0zm-4-4l2 2a7.07 7.07 0 0110 0l2-2C15.68 9.68 8.32 9.68 5 13z"/></svg>
                  <svg className="w-5 h-5 text-foreground/80" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="20.5" y="10" width="1.5" height="4" rx="0.5" fill="currentColor"/><rect x="4" y="8" width="10" height="8" rx="1" fill="currentColor" opacity="0.5"/></svg>
                </div>
              </div>
            </div>

            {/* iMessage header */}
            <div className="bg-white px-4 py-3 flex flex-col items-center border-b border-gray-100">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center mb-1.5 shadow-sm">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <p className="text-sm font-semibold text-foreground">Sarah M.</p>
              <p className="text-[10px] text-muted-foreground">iMessage</p>
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              className="bg-white px-4 py-4 space-y-3 overflow-y-auto"
              style={{ minHeight: "399px", maxHeight: "441px" }}
            >
              {STEPS.map((step) => {
                if (!isVisible(step.id)) return null;

                if (step.type === "system") {
                  return (
                    <div key={step.id} className="text-center animate-fade-in">
                      <span className="inline-block text-[10px] text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                        {step.text}
                      </span>
                    </div>
                  );
                }

                if (step.type === "timegap") {
                  return (
                    <div key={step.id} className="text-center animate-fade-in py-1">
                      <span className="inline-block text-[10px] text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
                        {step.text}
                      </span>
                    </div>
                  );
                }

                if (step.type === "bot") {
                  return (
                    <div key={step.id} className="flex flex-col items-start animate-fade-in">
                      {step.label && (
                        <span className="text-[9px] text-primary font-semibold mb-1 ml-1 uppercase tracking-wide">
                          {step.label}
                        </span>
                      )}
                      <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-[#e5e5ea] text-black">
                        {step.text}
                      </div>
                      {step.time && (
                        <span className="text-[9px] text-muted-foreground mt-1 ml-1">{step.time}</span>
                      )}
                    </div>
                  );
                }

                if (step.type === "lead") {
                  return (
                    <div key={step.id} className="flex flex-col items-end animate-fade-in">
                      <div className="max-w-[82%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-[#34c759] text-white">
                        {step.text}
                      </div>
                      {step.time && (
                        <span className="text-[9px] text-muted-foreground mt-1 mr-1">{step.time}</span>
                      )}
                    </div>
                  );
                }

                return null;
              })}

              {/* Sarah typing indicator */}
              {showTyping && (
                <div className="flex items-end gap-2 animate-fade-in">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-[9px]">S</span>
                  </div>
                  <TypingDots color="gray" />
                </div>
              )}

              {/* Read receipt */}
              {readReceipt && (
                <div className="flex justify-end animate-fade-in">
                  <span className="text-[9px] text-muted-foreground">Read</span>
                </div>
              )}

              {/* AI typing indicator */}
              {showAiTyping && (
                <div className="flex flex-col items-start animate-fade-in">
                  <TypingDots color="gray" />
                </div>
              )}
            </div>

            {/* iMessage input bar */}
            <div className="bg-white px-3 py-3 border-t border-gray-100 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs text-muted-foreground">
                iMessage
              </div>
              <div className="w-7 h-7 rounded-full bg-[#34c759] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" />
                </svg>
              </div>
            </div>

            {/* Home indicator */}
            <div className="bg-white pb-4 pt-1 flex justify-center">
              <div className="w-28 h-[5px] bg-black/20 rounded-full" />
            </div>
          </div>

          </div>
          {/* Replay button */}
          <div className="text-center mt-6">
            <button
              onClick={startAnimation}
              disabled={animating}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-40 flex items-center gap-1.5 mx-auto"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-4" />
              </svg>
              {animating ? "Playing..." : "Replay animation"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}