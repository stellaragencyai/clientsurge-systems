import { CheckCircle2, Shield, RotateCcw, Zap } from "lucide-react";

const guarantees = [
  {
    icon: Shield,
    title: "30-Day Money-Back Guarantee",
    desc: "If you're not seeing measurable results by day 30, we refund your setup cost. No questions asked."
  },
  {
    icon: Zap,
    title: "We Optimize Until It Converts",
    desc: "If your lead response and follow-up system isn't producing measurable booking improvements in 30 days, we keep optimizing at zero additional cost."
  },
  {
    icon: RotateCcw,
    title: "Easy Exit",
    desc: "Month-to-month contracts only. No long-term lock-in. Cancel anytime, but you won't want to."
  },
  {
    icon: CheckCircle2,
    title: "Dedicated Support",
    desc: "You get a direct point of contact for optimization, troubleshooting, and ongoing improvements—not a chatbot."
  }
];

export default function Guarantee() {
  return (
    <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-background to-card/50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Risk-Free Investment</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            We're Confident This Works.<br />Here's Our Guarantee.
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto">
            We don't ask you to believe us on faith. We put our money where our mouth is.
          </p>
        </div>

        {/* Guarantee Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guarantees.map((g, i) => {
            const Icon = g.icon;
            return (
              <div
                key={i}
                className="relative p-6 rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/40 overflow-hidden"
              >
                <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(154,92,46,0.7), rgba(154,92,46,0.15))" }} />
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{g.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12 pt-8 border-t border-border">
          <p className="text-foreground font-medium mb-4">
            The only real risk? Staying where you are and losing more leads.
          </p>
          <p className="text-sm text-muted-foreground">
            Let's talk about what this could mean for your business.
          </p>
        </div>
      </div>
    </section>
  );
}