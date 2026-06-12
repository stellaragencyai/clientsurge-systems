import { useEffect, useState } from "react";
import { MessageSquare, Zap, Send, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    title: "A lead comes in from your website, ads, calls, or DMs.",
    subtitle: "Step 1",
    desc: "The system captures it immediately so nothing gets missed.",
  },
  {
    icon: Zap,
    title: "They get a fast, personalized reply by SMS and email.",
    subtitle: "Step 2",
    desc: "You show up first while intent is still high.",
  },
  {
    icon: Send,
    title: "Follow-up keeps running automatically until they respond or book.",
    subtitle: "Step 3",
    desc: "No manual chasing and no leads slipping through the cracks.",
  },
  {
    icon: CalendarCheck,
    title: "Ready prospects are pushed into a booking or handoff flow.",
    subtitle: "Step 4",
    desc: "That means more confirmed appointments with less front-desk friction.",
  },
];

export default function HowItWorks() {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
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
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,174,239,0.10) 0%, transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-foreground/70 tracking-widest uppercase mb-4">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            How The System Turns Inquiries Into Booked Appointments
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            This is the core service: faster first response, consistent follow-up, and a cleaner path to booking.
          </p>
        </div>

        <div className="relative mb-16">
          <div className="hidden lg:block">
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
                      <Icon className="w-6 h-6" strokeWidth={1.5} style={{ color: "#0088CC" }} />
                    </div>
                  </div>
                );
              })}
            </div>

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

          <div className="lg:hidden space-y-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(240,249,255,0.38) 100%)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(0,174,239,0.18)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                >
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

        <div className="text-center mb-10">
          <p className="text-lg font-semibold text-foreground">
            No missed calls. No delayed replies. No lost opportunities.
          </p>
        </div>

        <div className="text-center">
          <p className="text-foreground mb-3">Want to see how this would fit your business?</p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            See plans and pricing
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
