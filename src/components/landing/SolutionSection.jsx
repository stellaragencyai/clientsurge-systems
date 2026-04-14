import { useState, useRef, useCallback } from "react";
import { Zap, MessageSquare, PhoneOff, CalendarCheck, RotateCcw, Database } from "lucide-react";

const services = [
  {
    icon: Zap,
    title: "Instant Lead Response",
    outcome: "Capture leads before competitors respond.",
    desc: "",
  },
  {
    icon: MessageSquare,
    title: "Automated Follow-Up",
    outcome: "Turn more inquiries into booked appointments.",
    desc: "",
  },
  {
    icon: PhoneOff,
    title: "Missed Call Text-Back",
    outcome: "Recover revenue from every missed call.",
    desc: "",
  },
  {
    icon: CalendarCheck,
    title: "Booking Flow Automation",
    outcome: "Guide leads directly to scheduling without friction.",
    desc: "",
  },
  {
    icon: RotateCcw,
    title: "Lead Reactivation",
    outcome: "Turn old leads into new revenue.",
    desc: "",
  },
  {
    icon: Database,
    title: "Pipeline Tracking",
    outcome: "See exactly where every lead stands.",
    desc: "",
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
      <h3 className="text-base font-semibold text-foreground mb-2" style={{ transform: "translateZ(16px)" }}>{service.title}</h3>
      <p className="text-sm text-primary font-medium leading-relaxed" style={{ transform: "translateZ(14px)" }}>{service.outcome}</p>
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
            Stop Losing Leads — Turn Every Inquiry Into a <span className="text-primary">Booked Appointment</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            We install systems that respond instantly, follow up automatically, and turn more leads into paying customers — without adding extra work to your team.
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