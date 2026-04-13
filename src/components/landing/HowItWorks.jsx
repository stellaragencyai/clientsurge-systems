import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    title: "Lead Comes In",
    desc: "A prospect fills out a form, calls your number, or sends a message from any channel.",
  },
  {
    num: "02",
    title: "Instant Response Fires",
    desc: "Within seconds, they receive a personalized message — automatically. No one on your team needs to lift a finger.",
  },
  {
    num: "03",
    title: "Follow-Up Sequence Begins",
    desc: "A smart sequence nurtures the lead over time, sending the right message at the right moment.",
  },
  {
    num: "04",
    title: "Lead Books an Appointment",
    desc: "They're guided directly to your calendar. No phone tag. No back-and-forth. Just a confirmed booking.",
  },
  {
    num: "05",
    title: "Customer Walks In",
    desc: "They show up ready. You get paid. And the whole process repeats — without you managing it.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Process</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            From first contact to confirmed appointment — handled automatically.
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-6 p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {step.num}
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="#book-demo">
            <Button className="rounded-full px-8 h-12 text-base font-semibold gap-2">
              See It In Action
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}