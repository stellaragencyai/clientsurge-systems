import { useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import DemoBookingModal from "@/components/forms/DemoBookingModal";

const SMS_MESSAGES = [
  { from: "lead", text: "Hi! I saw your ad for the laser facial. How much is it?", time: "2:14 PM" },
  { from: "system", text: "Hi Sarah! Thanks for reaching out to Glow Med Spa 💛 Our laser facial starts at $249. I'd love to get you booked — are mornings or afternoons better for you?", time: "2:14 PM", tag: "Replied in 8 sec" },
  { from: "lead", text: "Afternoons work! Maybe Thursday?", time: "2:16 PM" },
  { from: "system", text: "Perfect! I've reserved Thursday at 3 PM for you. Here's your booking link to confirm: glowspa.com/book ✅", time: "2:16 PM", tag: "Booked!" },
];

function SMSMockup() {
  return (
    <div
      className="relative w-full max-w-xs mx-auto lg:mx-0 lg:ml-auto"
      aria-hidden="true"
    >
      {/* Phone frame */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)",
          border: "1.5px solid rgba(255,255,255,0.12)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-[10px] font-semibold text-white/60">2:16 PM</span>
          <div className="flex gap-1.5">
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>
          <span className="text-[10px] font-semibold text-white/60">100%</span>
        </div>

        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #9a5c2e, #c8965c)" }}
          >
            G
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Glow Med Spa</p>
            <p className="text-[10px] text-green-400">● AI System Active</p>
          </div>
        </div>

        {/* Messages */}
        <div className="px-3 py-4 space-y-3">
          {SMS_MESSAGES.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.from === "lead" ? "items-start" : "items-end"}`}
            >
              {msg.tag && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider mb-1 px-2 py-0.5 rounded-full"
                  style={{
                    background: msg.tag === "Booked!" ? "rgba(34,197,94,0.2)" : "rgba(200,150,92,0.25)",
                    color: msg.tag === "Booked!" ? "#4ade80" : "#f5d9a8",
                    border: msg.tag === "Booked!" ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(200,150,92,0.3)",
                  }}
                >
                  {msg.tag}
                </span>
              )}
              <div
                className="max-w-[80%] rounded-2xl px-3 py-2"
                style={{
                  background: msg.from === "lead"
                    ? "rgba(255,255,255,0.1)"
                    : "linear-gradient(135deg, #7a4825, #c8965c)",
                  borderBottomLeftRadius: msg.from === "lead" ? "4px" : undefined,
                  borderBottomRightRadius: msg.from === "system" ? "4px" : undefined,
                }}
              >
                <p className="text-[11px] leading-relaxed text-white">{msg.text}</p>
              </div>
              <span className="text-[9px] text-white/35 mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="flex items-center gap-2 px-3 py-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="flex-1 h-8 rounded-full px-3 flex items-center"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="text-[10px] text-white/30">Message...</span>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7a4825, #c8965c)" }}
          >
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>

      {/* Floating stat pill */}
      <div
        className="absolute -left-6 top-1/3 flex items-center gap-2 rounded-full px-3 py-2 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(200,150,92,0.3)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-bold text-foreground">Replied in 8 sec</span>
      </div>

      {/* Floating booked pill */}
      <div
        className="absolute -right-4 bottom-20 flex items-center gap-2 rounded-full px-3 py-2 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(34,197,94,0.3)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
        <span className="text-[10px] font-bold text-foreground">Appointment Booked</span>
      </div>
    </div>
  );
}

export default function Hero() {
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);

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
          minHeight: "100vh",
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
        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-28 md:py-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT: Copy */}
            <div className="flex flex-col items-start text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 backdrop-blur-sm rounded-full px-4 py-1.5 mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  Built for Med Spas &amp; Service Businesses
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] xl:text-6xl font-bold tracking-tight leading-[1.08] mb-5 text-foreground">
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
                </span>{" "}
                Automatically
                <span className="block text-foreground mt-1">— Without Hiring Staff</span>
              </h1>

              {/* Subheadline */}
              <p className="text-base md:text-lg text-foreground/70 leading-relaxed mb-8 max-w-lg">
                We install done-for-you AI systems that capture, respond, and follow up with every lead instantly — for med spas and local service teams.
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
                    <span className="text-sm font-medium text-foreground/80">{item}</span>
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