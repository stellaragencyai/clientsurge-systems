import { MessageSquare, Zap, Send, Calendar, CheckCircle2 } from "lucide-react";

export default function MedSpaFlow() {
  const steps = [
    { icon: MessageSquare, title: "Lead Comes In", desc: "From any channel" },
    { icon: Zap, title: "Instant Response", desc: "Within seconds" },
    { icon: Send, title: "Follow-Up Happens", desc: "Automatically" },
    { icon: Calendar, title: "Lead Books", desc: "Guided to your calendar" },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
          How It Works
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-14">
          Simple. Automatic. Every time.
        </p>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute ml-[calc(50%+3rem)] mt-8 w-12 h-0.5 bg-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}