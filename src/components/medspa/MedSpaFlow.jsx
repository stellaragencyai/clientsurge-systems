import { MessageSquare, Zap, Send, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Lead Comes In",
    desc: "A new inquiry comes from your website, Instagram, Google ad, or phone. The system captures them instantly.",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80",
  },
  {
    icon: Zap,
    step: "02",
    title: "Instant Response",
    desc: "Within seconds, the lead receives a personalized reply. No waiting. No manual work. No missed opportunities.",
    image: "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=600&q=80",
  },
  {
    icon: Send,
    step: "03",
    title: "Automatic Follow-Up",
    desc: "If they don't respond right away, the system follows up automatically — multiple times, across multiple days.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80",
  },
  {
    icon: CalendarCheck,
    step: "04",
    title: "They Book",
    desc: "Warm leads are guided directly to your calendar. No phone tag. No back-and-forth. Just confirmed appointments.",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80",
  },
];

export default function MedSpaFlow() {
  return (
    <section id="how-it-works-medspa" className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-5">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Four simple steps. Fully automatic. Every single time.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="group flex flex-col rounded-2xl overflow-hidden border border-border bg-muted hover:shadow-md hover:border-primary/20 transition-all duration-300">
                {/* Image */}
                <div className="h-40 overflow-hidden">
                  <img
                    src={step.image}
                    alt={step.title}
                    width="600"
                    height="400"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-2xl font-bold text-primary/20 font-display">{step.step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
