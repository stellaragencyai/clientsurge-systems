import { Zap, MessageSquare, PhoneOff, CalendarCheck, RotateCcw } from "lucide-react";

const solutions = [
  {
    icon: Zap,
    title: "Instant Lead Response",
    desc: "Every inquiry gets a personalized reply within seconds. No waiting, no manual work — 24/7.",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80",
  },
  {
    icon: MessageSquare,
    title: "Automated Follow-Up",
    desc: "If they don't respond, the system follows up automatically — multiple times, across multiple days.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
  },
  {
    icon: PhoneOff,
    title: "Missed Call Text-Back",
    desc: "Missed call? An instant text goes out immediately. The lead stays warm instead of disappearing.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  },
  {
    icon: CalendarCheck,
    title: "Booking Push",
    desc: "Ready leads get a booking link at exactly the right moment. No back-and-forth required.",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
  },
  {
    icon: RotateCcw,
    title: "Old Lead Reactivation",
    desc: "Past inquiries that never converted get re-engaged. Many are still interested — they just haven't heard from you.",
    image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80",
  },
];

export default function MedSpaSolution() {
  return (
    <section className="py-24 md:py-32 px-6 bg-muted">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Solution</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-5">
            We Fix the Follow-Up System for You
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Five specific automations. Each one designed to recover a booking you would have otherwise lost.
          </p>
        </div>

        <div className="space-y-6">
          {solutions.map((item, i) => {
            const Icon = item.icon;
            const isEven = i % 2 === 0;
            return (
              <div key={i} className={`group flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-0 bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-primary/40 transition-all duration-300`}>
                {/* Image */}
                <div className="md:w-64 lg:w-72 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                {/* Content */}
                <div className="flex-1 p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm flex-shrink-0 group-hover:bg-primary/30 transition-colors">
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}