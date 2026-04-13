import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold: 0.1 });
    const section = document.getElementById("how-it-works");
    if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="how-it-works" 
      className="py-24 md:py-32 px-6 bg-white transition-all duration-700 relative overflow-hidden"
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
          {/* Desktop: Horizontal flow with animated line */}
          <div className="hidden lg:block">
            <div className="flex items-end justify-between gap-2 mb-8">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    {/* Icon container with float animation */}
                    <div
                      className="relative mb-6"
                      style={{
                        animation: inView ? `float 3s ease-in-out ${i * 0.2}s infinite` : "none",
                      }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center hover:bg-primary/25 transition-all duration-300">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                    </div>

                    {/* Arrow connector (except last) */}
                    {i < steps.length - 1 && (
                      <div className="absolute top-7 left-[calc(50%+28px)] w-12 h-0.5 border-t-2 border-dashed border-primary/20" />
                    )}

                    {/* Step label */}
                    <p className="text-xs font-semibold text-primary uppercase mb-2">{step.subtitle}</p>
                    <h3 className="text-sm font-semibold text-foreground text-center mb-2">{step.title}</h3>
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
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
          <a href="#book-demo">
            <Button className="rounded-full px-8 h-12 text-base font-semibold gap-2">
              See It In Action
              <ArrowRight className="w-4 h-4" />
            </Button>
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