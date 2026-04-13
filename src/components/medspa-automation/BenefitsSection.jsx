import { Check } from 'lucide-react';

const benefits = [
  "More booked consultations in your calendar",
  "Faster response times (under 60 seconds)",
  "Higher conversion rates from existing leads",
  "Less pressure on front desk staff",
  "Increased revenue from leads you almost lost",
  "Better data on what's working",
];

export default function BenefitsSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-card">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-16">
          What this means for your med spa
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <p className="text-lg text-foreground">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}