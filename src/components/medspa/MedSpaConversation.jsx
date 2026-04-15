import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  { id: 1, from: "lead", text: "Hi, I saw your ad. How much is Botox?", delay: 600 },
  { id: 2, from: "bot", label: "⚡ Auto-Response · 0:47s", text: "Hi Sarah! Thanks for reaching out 😊 Our Botox consultations are complimentary — we'd love to have you in. Are you looking for availability this week?", delay: 1800 },
  { id: 3, from: "lead", text: "Yes! What do you have open?", delay: 1200 },
  { id: 4, from: "bot", label: "Smart Follow-Up", text: "Perfect! Here's a link to grab a time that works for you — takes 30 seconds to book 👇", delay: 1600 },
  { id: 5, type: "booking", text: "📅 Booking link sent automatically", delay: 900 },
  { id: 6, from: "lead", text: "Done! See you Thursday at 2pm 🎉", delay: 1200 },
  { id: 7, type: "system", text: "✅ Consultation booked · Confirmation sent · Reminder scheduled", delay: 800 },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5 rounded-2xl rounded-tl-sm bg-[#e5e5ea] w-14 animate-fade-in">
      {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i*0.18}s`, animationDuration: "0.8s" }} />)}
    </div>
  );
}

export default function MedSpaConversation() {
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
    MESSAGES.forEach((msg) => {
      elapsed += msg.delay;
      if (msg.from === "bot") {
        const showT = setTimeout(() => setShowTyping(true), elapsed - 900);
        const hideT = setTimeout(() => setShowTyping(false), elapsed - 100);
        timeoutsRef.current.push(showT, hideT);
      }
      const t = setTimeout(() => {
        setVisible(prev => [...prev, msg.id]);
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, elapsed);
      timeoutsRef.current.push(t);
    });
    const done = setTimeout(() => setAnimating(false), elapsed + 500);
    timeoutsRef.current.push(done);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) start(); }, { threshold: 0.25 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => { observer.disconnect(); clearAll(); };
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Live Example</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-5 leading-snug">
              From Inquiry to Booked Consultation — In Minutes
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              This is a real example of how the system handles a Botox inquiry. Before your front desk sees the notification, your lead already has a response, a booking link, and a confirmed appointment.
            </p>
            <div className="space-y-3">
              {[
                { stat: "< 90 sec", label: "Average first response time" },
                { stat: "24/7", label: "Including nights & weekends" },
                { stat: "2.4×", label: "More consultations booked" },
                { stat: "Zero", label: "Manual work required" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-primary/4 border border-primary/10">
                  <span className="text-base font-bold text-primary w-16 flex-shrink-0">{item.stat}</span>
                  <span className="text-sm text-foreground/70">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: phone */}
          <div className="max-w-xs mx-auto w-full">
            <div className="bg-white rounded-[2.5rem] overflow-hidden"
              style={{ boxShadow: "0 40px 80px -20px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.07)", border: "3px solid #1a1a1a" }}>
              <div className="bg-white pt-3 pb-1 flex justify-center">
                <div className="w-[80px] h-[22px] bg-black rounded-full" />
              </div>
              <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-white">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-pink-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Sarah M.</p>
                  <p className="text-[10px] text-green-500 font-medium">● Active now</p>
                </div>
              </div>
              <div ref={scrollRef} className="bg-[#f9f9f9] px-4 py-4 space-y-3 overflow-y-auto" style={{ minHeight: "320px", maxHeight: "380px" }}>
                {MESSAGES.map((msg) => {
                  if (!visible.includes(msg.id)) return null;
                  if (msg.type === "system") return (
                    <div key={msg.id} className="text-center animate-fade-in">
                      <span className="text-[10px] text-green-700 bg-green-100 px-3 py-1.5 rounded-full inline-block font-semibold">{msg.text}</span>
                    </div>
                  );
                  if (msg.type === "booking") return (
                    <div key={msg.id} className="text-center animate-fade-in">
                      <span className="text-[10px] text-primary bg-primary/10 px-3 py-1.5 rounded-full inline-block font-semibold border border-primary/20">{msg.text}</span>
                    </div>
                  );
                  if (msg.from === "bot") return (
                    <div key={msg.id} className="flex flex-col items-start animate-fade-in">
                      {msg.label && <span className="text-[9px] text-primary font-bold mb-1 ml-1 uppercase tracking-wide">{msg.label}</span>}
                      <div className="max-w-[88%] px-3 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed bg-white border border-gray-200 text-black shadow-sm">{msg.text}</div>
                    </div>
                  );
                  return (
                    <div key={msg.id} className="flex flex-col items-end animate-fade-in">
                      <div className="max-w-[88%] px-3 py-2.5 rounded-2xl rounded-tr-sm text-xs leading-relaxed bg-[#007aff] text-white">{msg.text}</div>
                    </div>
                  );
                })}
                {showTyping && <TypingDots />}
              </div>
              <div className="bg-white px-3 py-2.5 border-t border-gray-100 flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground">iMessage</div>
                <div className="w-6 h-6 rounded-full bg-[#007aff] flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>
                </div>
              </div>
              <div className="bg-white pb-3 pt-1 flex justify-center">
                <div className="w-24 h-1 bg-black/20 rounded-full" />
              </div>
            </div>
            <div className="text-center mt-4">
              <button onClick={start} disabled={animating} className="text-xs text-primary font-semibold hover:text-primary/70 transition-colors disabled:opacity-40 flex items-center gap-1.5 mx-auto">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 .49-4" /></svg>
                {animating ? "Playing..." : "Replay animation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}