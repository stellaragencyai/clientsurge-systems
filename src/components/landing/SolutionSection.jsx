import { Zap, MessageSquare, PhoneOff, CalendarCheck, RotateCcw, Database } from "lucide-react";

const services = [
  {
    icon: Zap,
    title: "Instant Lead Response",
    what: "Automatically respond to every new lead within seconds via SMS or chat.",
    why: "Speed-to-lead is the #1 factor in conversion. Responding first wins the booking.",
  },
  {
    icon: MessageSquare,
    title: "Automated Follow-Up",
    what: "Multi-step follow-up sequences that nurture leads until they book.",
    why: "80% of sales happen after the 5th contact. Automation ensures no lead is forgotten.",
  },
  {
    icon: PhoneOff,
    title: "Missed Call Text-Back",
    what: "When you can't answer, an instant text is sent to keep the conversation alive.",
    why: "Recover revenue from calls you'd otherwise lose to voicemail.",
  },
  {
    icon: CalendarCheck,
    title: "Booking Flow Automation",
    what: "Guide leads directly to your scheduling page with zero friction.",
    why: "Reduce the steps between interest and appointment. More bookings, less drop-off.",
  },
  {
    icon: RotateCcw,
    title: "Lead Reactivation",
    what: "Re-engage old leads in your database with targeted campaigns.",
    why: "Turn past inquiries into new revenue without spending more on ads.",
  },
  {
    icon: Database,
    title: "CRM Automation",
    what: "Keep your pipeline organized with automatic tagging, status updates, and task creation.",
    why: "Your team sees what matters. Nothing slips through the cracks.",
  },
];

export default function SolutionSection() {
  return (
    <section id="services" className="py-20 md:py-28 px-6 bg-card border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            What We Build For You
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Our Automation Systems Fix That
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-background border border-border hover:shadow-lg hover:border-primary/20 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{s.what}</p>
              <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                → {s.why}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}