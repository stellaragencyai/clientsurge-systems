import { CheckCircle2 } from "lucide-react";

export default function MedSpaBenefits() {
  const benefits = [
    "More booked consultations every month",
    "Fewer missed leads falling through the cracks",
    "Faster response time than competitors",
    "Less work for your front desk staff",
    "Higher conversion rates from the same traffic",
  ];

  return (
    <section className="py-20 md:py-28 px-6 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
          What You Get
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12">
          Real results. Real revenue. Real growth.
        </p>

        <div className="space-y-4">
          {benefits.map((benefit, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-lg border border-border">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-primary" />
              </div>
              <p className="text-base text-foreground">{benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}