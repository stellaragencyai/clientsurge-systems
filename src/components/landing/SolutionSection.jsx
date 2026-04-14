import { useState, useRef, useCallback } from "react";
import { Zap, MessageSquare, PhoneOff, CalendarCheck, RotateCcw, Database } from "lucide-react";

const services = [
  {
    icon: Zap,
    title: "Instant Lead Response",
    outcome: "Stop losing leads to faster competitors.",
    desc: "Every new inquiry — form, call, or message — gets an immediate, personalized response. No delays. No missed opportunities.",
  },
  {
    icon: MessageSquare,
    title: "Automated Follow-Up",
    outcome: "Convert more of the leads you're already getting.",
    desc: "Smart multi-step sequences keep following up until a lead books or opts out. Your pipeline works even when your team doesn't.",
  },
  {
    icon: PhoneOff,
    title: "Missed Call Text-Back",
    outcome: "Recover revenue from every unanswered call.",
    desc: "When you miss a call, a text fires instantly to keep the conversation alive. Customers stay engaged instead of moving on.",
  },
  {
    icon: CalendarCheck,
    title: "Booking Flow Automation",
    outcome: "Remove friction between interest and appointment.",
    desc: "Leads are guided directly to your calendar with zero manual back-and-forth. More bookings, fewer drop-offs.",
  },
  {
    icon: RotateCcw,
    title: "Lead Reactivation",
    outcome: "Generate revenue from leads you've already paid for.",
    desc: "We re-engage dormant contacts in your database with targeted campaigns. Turn past inquiries into new bookings.",
  },
  {
    icon: Database,
    title: "CRM Pipeline Automation",
    outcome: "Always know exactly where every lead stands.",
    desc: "Automatic tagging, status updates, and task creation keep your pipeline clean. Nothing falls through the cracks.",
  },
];

const ServiceCard = ({ service }) => {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sheen, setSheen] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -12, y: dx * 12 });
    setSheen({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setSheen({ x: 50, y: 50 });
    setHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: hovered ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.03)` : "perspective(800px) rotateX(0) rotateY(0) scale(1)",
        transition: hovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: hovered ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.1)",
        boxShadow: hovered ? "0 24px 48px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.1)" : "0 4px 16px rgba(0,0,0,0.06)",
        borderRadius: "1rem",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glass sheen highlight */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.3s ease",
          background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 60%)`,
          pointerEvents: "none",
        }}
      />
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5" style={{ transform: "translateZ(20px)" }}>
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1" style={{ transform: "translateZ(16px)" }}>{service.title}</h3>
      <p className="text-xs font-semibold text-primary mb-3" style={{ transform: "translateZ(14px)" }}>{service.outcome}</p>
      <p className="text-sm text-muted-foreground leading-relaxed" style={{ transform: "translateZ(10px)" }}>{service.desc}</p>
    </div>
  );
};

export default function SolutionSection() {
  return (
    <section id="services" className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">What We Build</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Systems That <span className="text-primary">Convert</span> Leads Into Revenue
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            Each system is built around a specific outcome — not a feature. No fluff. Just results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s, i) => (
            <ServiceCard key={i} service={s} />
          ))}
        </div>
      </div>
    </section>
  );
}