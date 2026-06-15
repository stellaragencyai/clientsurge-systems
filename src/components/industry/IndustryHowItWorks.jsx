import { ArrowRight } from 'lucide-react';

export default function IndustryHowItWorks({ steps }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="relative">
            {/* Step card */}
            <div className="p-8 rounded-xl border-2 border-primary/30 bg-card hover:border-primary/60 transition-all h-full">
              {/* Step number badge */}
              <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
                {step.number}
              </div>

              <h3 className="font-semibold text-xl mb-3 mt-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>

            {/* Arrow connector (hidden on last item) */}
            {idx < steps.length - 1 && (
              <div className="hidden md:flex absolute -right-10 top-12 items-center justify-center w-8 h-8">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 p-8 rounded-lg bg-primary/5 border border-primary/20 text-center">
        <p className="text-muted-foreground mb-2">
          This entire process runs automatically, 24/7.
        </p>
        <p className="font-semibold text-foreground text-lg">
          Your team only handles qualified, ready-to-book leads.
        </p>
      </div>
    </div>
  );
}