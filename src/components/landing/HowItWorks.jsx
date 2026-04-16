import { useState, useEffect, useRef } from "react";
import { ArrowRight, MessageSquare, Zap, Send, CalendarCheck, CheckCircle2 } from "lucide-react";
import DemoBookingModal from "../forms/DemoBookingModal";

const steps = [
  {
    icon: MessageSquare,
    title: "A prospect contacts you via form, phone, DM, or ad — the system captures them instantly.",
    subtitle: "Step 1",
    desc: "Every lead is logged, tagged, and ready to engage.",
  },
  {
    icon: Zap,
    title: "Within 60 seconds they receive a personalized SMS and email — before your competitor sees the notification.",
    subtitle: "Step 2",
    desc: "Speed wins. You're always first.",
  },
  {
    icon: Send,
    title: "A multi-day sequence keeps you top-of-mind without any manual work.",
    subtitle: "Step 3",
    desc: "Consistent follow-up that builds interest.",
  },
  {
    icon: CalendarCheck,
    title: "A booking link is sent at exactly the right moment — confirmed appointment, no phone tag.",
    subtitle: "Step 4",
    desc: "Frictionless booking experience.",
  },
  {
    icon: CheckCircle2,
    title: "Post-visit the system auto-requests a review and re-enters them into a referral sequence.",
    subtitle: "Step 5",
    desc: "Turn customers into repeat business and referrals.",
  },
];

export default function HowItWorks() {
  const [inView, setInView] = useState(false);
  const [lineProgress, setLineProgress] = useState(0);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const lineRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        // Animate line fill
        let start = null;
        const duration = 1400;
        const animate = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          setLineProgress(progress);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    const section = document.getElementById("how-it-works-section");
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="how-it-works-section" 
      className="py-20 md:py-28 px-4 md:px-6 bg-gradient-to-br from-background via-card to-background relative overflow-hidden"
    >
      {/* Animated gradient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{background: 'radial-gradient(ellipse, rgba(161,120,35,0.12) 0%, transparent 70%)'}}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-foreground/70 tracking-widest uppercase mb-4">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            How You Turn Leads Into Booked Appointments Automatically
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            From first inquiry to booked appointment — without manual follow-up or missed opportunities.
          </p>
        </div>

        {/* Horizontal flow */}
        <div className="relative mb-16">
          {/* Desktop: Horizontal flow with aligned icons */}
          <div className="hidden lg:block">
            {/* Icons row — all perfectly aligned directly above titles */}
            <div className="flex items-start justify-between mb-0 relative px-4">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <div
                      className="w-14 h-14 rounded-2xl bg-black/8 border border-black/25 flex items-center justify-center transition-all duration-300 mb-0"
                      style={{
                        animation: inView ? `float 3s ease-in-out ${i * 0.2}s infinite` : "none",
                        opacity: inView ? 1 : 0,
                        transform: inView ? "scale(1)" : "scale(0.8)",
                        transition: `opacity 0.4s ease ${i * 0.15}s, transform 0.4s ease ${i * 0.15}s`,
                      }}
                    >
                      <Icon className="w-6 h-6" strokeWidth={1.5} style={{color: "#9a5c2e"}} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Connecting arrows row */}
            <div className="flex items-center justify-between px-4 mb-2 relative" style={{height: "20px"}}></div>

            {/* Text row */}
            <div className="flex justify-between gap-2 px-4">
              {steps.map((step, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <p className="text-xs font-semibold text-black/50 uppercase mb-2">{step.subtitle}</p>
                  <h3 className="text-sm font-bold text-foreground text-center mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: Vertical stack */}
          <div className="lg:hidden space-y-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary uppercase mb-1">{step.subtitle}</p>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emotional Payoff */}
        <div className="text-center mb-10">
          <p className="text-lg font-semibold text-foreground">
            No missed calls. No delayed replies. No lost opportunities.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-foreground mb-6">Want to see this set up for your business?</p>
          <button onClick={() => setShowDemoModal(true)} style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.5s ease, transform 0.3s ease",border:"none",cursor:"pointer"}} onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35)";
          }}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              See It Work For Your Business
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
          {showDemoModal && <DemoBookingModal onClose={() => setShowDemoModal(false)} />}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}