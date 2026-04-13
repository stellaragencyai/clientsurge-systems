import { useState } from "react";
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
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;
  return (
    <div 
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`p-6 rounded-2xl bg-white/15 backdrop-blur-md hover:bg-white/20 transition-all shadow-lg ${hovered ? "border border-slate-600" : "border border-transparent"}`}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{service.title}</h3>
      <p className="text-xs font-semibold text-primary mb-3">{service.outcome}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
    </div>
  );
};

export default function SolutionSection() {
  return (
    <section id="services" className="py-24 md:py-32 px-6 bg-background transition-all duration-700">
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