import { useState, useEffect, useRef } from "react";
import { ArrowRight, MessageSquare, Zap, Send, CalendarCheck, CheckCircle2 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "Lead Comes In",
    subtitle: "Step 1",
    desc: "A prospect fills out a form, calls your number, or sends a message from any channel.",
  },
  {
    icon: Zap,
    title: "Instant Response",
    subtitle: "Step 2",
    desc: "Within seconds, they receive a personalized message — automatically.",
  },
  {
    icon: Send,
    title: "Follow-Up Sequence",
    subtitle: "Step 3",
    desc: "A smart sequence nurtures the lead over time with the right message at the right moment.",
  },
  {
    icon: CalendarCheck,
    title: "Books Appointment",
    subtitle: "Step 4",
    desc: "They're guided directly to your calendar. No phone tag. Just a confirmed booking.",
  },
  {
    icon: CheckCircle2,
    title: "Customer Arrives",
    subtitle: "Step 5",
    desc: "They show up ready. You get paid. The whole process repeats — without you managing it.",
  },
];

export default function HowItWorks() {
  const [inView, setInView] = useState(false);
  const [lineProgress, setLineProgress] = useState(0);
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
    const section = document.getElementById("how-it-works");
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="how-it-works" 
      className="py-24 md:py-32 px-6 bg-gradient-to-br from-background via-card to-background relative overflow-hidden"
    >
      {/* Animated gradient glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{background: 'radial-gradient(ellipse, rgba(161,120,35,0.12) 0%, transparent 70%)'}}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            From first contact to confirmed appointment — handled automatically in 5 clear steps.
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
                      className="w-16 h-16 rounded-2xl bg-black/8 border border-black/25 flex items-center justify-center transition-all duration-300 mb-0"
                      style={{
                        animation: inView ? `float 3s ease-in-out ${i * 0.2}s infinite` : "none",
                        opacity: inView ? 1 : 0,
                        transform: inView ? "scale(1)" : "scale(0.8)",
                        transition: `opacity 0.4s ease ${i * 0.15}s, transform 0.4s ease ${i * 0.15}s`,
                      }}
                    >
                      <Icon className="w-8 h-8 text-black/70" strokeWidth={1.5} />
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Connecting arrows row */}
            <div className="flex items-center justify-between px-4 mb-2 relative" style={{height: "60px"}}></div>

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

        {/* CTA */}
        <div className="text-center">
          <a href="#book-demo" style={{display:"inline-block",borderRadius:"9999px",padding:"2px",background:"linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",boxShadow:"0 4px 18px rgba(120,70,20,0.35)",transition:"box-shadow 0.3s ease, transform 0.3s ease"}}>
            <span style={{display:"flex",alignItems:"center",gap:"8px",height:"48px",padding:"0 32px",borderRadius:"9999px",background:"linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",color:"#f5e6d0",fontWeight:"700",fontSize:"1rem",textShadow:"0 1px 2px rgba(0,0,0,0.3)"}}>
              See It In Action
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>
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