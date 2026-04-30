import { CheckCircle2, ArrowRight } from "lucide-react";

const STEPS = [
  {
    number: 1,
    title: "Select Services",
    description: "Choose from 12+ AI-powered automations tailored to your business",
    icon: "🎯",
  },
  {
    number: 2,
    title: "Configure Settings",
    description: "Customize messaging, workflows, and automation triggers",
    icon: "⚙️",
  },
  {
    number: 3,
    title: "Review Stack",
    description: "See your complete solution with setup costs and monthly fees",
    icon: "✓",
  },
  {
    number: 4,
    title: "Launch",
    description: "We handle full setup and deployment in 5-7 business days",
    icon: "🚀",
  },
];

export default function BuildYourStackFlow() {
  return (
    <div className="my-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-foreground mb-2">How It Works</h3>
          <p className="text-muted-foreground">Build your AI automation stack in 4 simple steps</p>
        </div>

        {/* Desktop Flow */}
        <div className="hidden md:grid grid-cols-4 gap-4">
          {STEPS.map((step, idx) => (
            <div key={step.number}>
              <div className="relative flex flex-col items-center">
                {/* Circle with number */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary flex items-center justify-center mb-4 relative z-10">
                  <span className="text-2xl">{step.icon}</span>
                </div>

                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[calc(100%+16px)] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                )}

                {/* Content */}
                <div className="text-center">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Step {step.number}</p>
                  <h4 className="text-sm font-bold text-foreground mb-1">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Flow */}
        <div className="md:hidden space-y-4">
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{step.icon}</span>
                </div>
                {idx < STEPS.length - 1 && <div className="w-0.5 h-8 bg-primary/20 mt-2" />}
              </div>
              <div className="pt-1">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Step {step.number}</p>
                <h4 className="text-sm font-bold text-foreground mb-1">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Recommended setup time: <span className="font-semibold text-foreground">15-20 minutes</span>
          </p>
        </div>
      </div>
    </div>
  );
}