import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  { id: 1, from: "lead", text: "Hi, I'm interested in Botox.", time: "2:12 PM", delay: 800 },
  { id: 2, from: "bot", label: "Instant Auto-Response", text: "Hey! Thanks for reaching out. I can help with that — are you looking for pricing or availability?", time: "2:12 PM", delay: 1600 },
  { id: 3, from: "lead", text: "Availability, please.", time: "2:13 PM", delay: 2400 },
  { id: 4, from: "bot", label: "Smart Response", text: "Perfect — here's a quick link to grab a time that works for you. We'd love to have you in for a consultation!", time: "2:13 PM", delay: 1800 },
  { id: 5, type: "system", text: "✓ Booking link opened — appointment scheduled", delay: 1400 },
];

export default function MedSpaDemo() {
  const sectionRef = useRef(null);
  const scrollRef = useRef(null);
  const timeoutsRef = useRef([]);
  const [visible, setVisible] = useState([]);
  const [animating, setAnimating] = useState(false);
  const [showTyping, setShowTyping] = useState(false);

  const clearAll = () => { timeoutsRef.current.forEach(clearTimeout); timeoutsRef.current = []; };

  const start = () => {
    clearAll();
    setVisible([]);
    setShowTyping(false);
    setAnimating(true);
    let elapsed = 0;

    MESSAGES.forEach((msg, i) => {
      elapsed += msg.delay;
      // Show typing before bot messages
      if (msg.from === "bot") {
        const showT = setTimeout(() => setShowTyping(true), elapsed - 900);
        const hideT = setTimeout(() => setShowTyping(false), elapsed - 100);
        timeoutsRef.current.push(showT, hideT);
      }
      const t = setTimeout(() => {
        setVisible((prev) => [...prev, msg.id]);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, elapsed);
      timeoutsRef.current.push(t);
    });

    const done = setTimeout(() => setAnimating(false), elapsed + 500);
    timeoutsRef.current.push(done);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
    }, { threshold: 0.3 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { observer.disconnect(); clearAll(); };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left text */}
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Live Example</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              See the System in Action
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              This is exactly what happens the moment a lead reaches out. Before your front desk sees the notification, your lead already has a response.
            </p>
            <ul className="space-y-3">
              {[
                "Responds in under 90 seconds",
                "Personalizes the message to their inquiry",
                "Guides them directly toward booking",
                "Works 24/7, including weekends"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: phone mockup */}
          <div>
            <div className="max-w-xs mx-auto">
              <div
                className="bg-white rounded-[2.5rem] overflow-hidden"
                style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.07)", border: "3px solid #1a1a1a" }}
              >
                {/* Dynamic island */}
                <div className="bg-white pt-3 pb-1 flex flex-col items-center">
                  <div className="w-[80px] h-[22px] bg-black rounded-full mb-1" />
                </div>
                {/* Header */}
                <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-white">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-pink-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Sarah M.</p>
                    <p className="text-[10px] text-muted-foreground">iMessage</p>
                  </div>
                </div>
                {/* Messages */}
                <div ref={scrollRef} className="bg-white px-4 py-4 space-y-3 overflow-y-auto" style={{ minHeight: "300px", maxHeight: "340px" }}>
                  {MESSAGES.map((msg) => {
                    if (!visible.includes(msg.id)) return null;
                    if (msg.type === "system") {
                      return (
                        <div key={msg.id} className="text-center animate-fade-in">
                          <span className="text-[10px] text-muted-foreground bg-gray-100 px-3 py-1 rounded-full inline-block">{msg.text}</span>
                        </div>
                      );
                    }
                    if (msg.from === "bot") {
                      return (
                        <div key={msg.id} className="flex flex-col items-start animate-fade-in">
                          {msg.label && <span className="text-[9px] text-primary font-semibold mb-1 ml-1 uppercase tracking-wide">{msg.label}</span>}
                          <div className="max-w-[85%] px-3 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed bg-[#e5e5ea] text-black">{msg.text}</div>
                          <span className="text-[9px] text-muted-foreground mt-1 ml-1">{msg.time}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className="flex flex-col items-end animate-fade-in">
                        <div className="max-w-[85%] px-3 py-2.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed bg-[#34c759] text-white">{msg.text}</div>
                        <span className="text-[9px] text-muted-foreground mt-1 mr-1">{msg.time}</span>
                      </div>
                    );
                  })}
                  {showTyping && (
                    <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-tl-sm bg-[#e5e5ea] w-14 animate-fade-in">
                      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.18}s`, animationDuration: "0.8s" }} />)}
                    </div>
                  )}
                </div>
                {/* Input bar */}
                <div className="bg-white px-3 py-2.5 border-t border-gray-100 flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground">iMessage</div>
                  <div className="w-6 h-6 rounded-full bg-[#34c759] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>
                  </div>
                </div>
                <div className="bg-white pb-3 pt-1 flex justify-center">
                  <div className="w-24 h-1 bg-black/20 rounded-full" />
                </div>
              </div>
              <div className="text-center mt-6">
                <button onClick={start} disabled={animating} className="px-5 py-2.5 text-xs text-white font-semibold bg-primary hover:bg-primary/90 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 mx-auto hover:shadow-lg hover:scale-105">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-4" /></svg>
                  {animating ? "Playing..." : "Replay Demo"}
                </button>
                <p className="text-xs text-muted-foreground mt-3">{visible.length} / {MESSAGES.length} messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}