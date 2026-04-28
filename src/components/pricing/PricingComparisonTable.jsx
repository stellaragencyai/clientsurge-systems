import { CheckCircle2, X } from "lucide-react";
import { useDemoBooking } from "../landing/DemoBookingContext";

const PRICING_PLANS = [
  {
    name: "Starter",
    subtitle: "For getting started",
    price: "$397",
    billing: "/month",
    setup: "$997 setup",
    description: "Essential automation for small lead-driven businesses",
    features: [
      { name: "Instant SMS response to leads", included: true },
      { name: "Email confirmation automation", included: true },
      { name: "Basic follow-up sequence (7 days)", included: true },
      { name: "Lead tracking dashboard", included: true },
      { name: "Booking link integration", included: true },
      { name: "Missed call recovery", included: false },
      { name: "Advanced nurture campaigns", included: false },
      { name: "Old lead reactivation", included: false },
      { name: "Priority support", included: false },
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Growth",
    subtitle: "Most popular",
    price: "$797",
    billing: "/month",
    setup: "$1,997 setup",
    description: "Full automation for scaling revenue from existing demand",
    features: [
      { name: "Instant SMS response to leads", included: true },
      { name: "Email confirmation automation", included: true },
      { name: "Advanced follow-up sequence (14 days)", included: true },
      { name: "Lead tracking dashboard", included: true },
      { name: "Booking link integration", included: true },
      { name: "Missed call recovery system", included: true },
      { name: "Multi-touch nurture campaigns", included: true },
      { name: "Old lead reactivation", included: false },
      { name: "Priority support", included: true },
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Pro",
    subtitle: "For maximum revenue",
    price: "$1,500",
    billing: "/month",
    setup: "$3,500 setup",
    description: "The complete system with full revenue recovery engine",
    features: [
      { name: "Instant SMS response to leads", included: true },
      { name: "Email confirmation automation", included: true },
      { name: "Advanced follow-up sequence (14 days)", included: true },
      { name: "Lead tracking dashboard", included: true },
      { name: "Booking link integration", included: true },
      { name: "Missed call recovery system", included: true },
      { name: "Multi-touch nurture campaigns", included: true },
      { name: "Old lead reactivation", included: true },
      { name: "Priority support & strategy sessions", included: true },
    ],
    cta: "Get Started",
    highlighted: false,
  },
];

export default function PricingComparisonTable() {
  const demoBooking = useDemoBooking();

  const handleCTA = () => {
    demoBooking?.openDemoBooking?.();
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Transparent Pricing. No Surprises.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your business. Scale up anytime. Cancel anytime. 30-day money-back guarantee on all plans.
          </p>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left px-6 py-4 font-semibold text-foreground min-w-56">
                  Features
                </th>
                {PRICING_PLANS.map((plan) => (
                  <th
                    key={plan.name}
                    className={`px-6 py-4 text-center min-w-80 ${
                      plan.highlighted ? "bg-primary/5 border-l-2 border-r-2 border-primary/20" : ""
                    }`}
                  >
                    <div className="mb-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        {plan.subtitle}
                      </p>
                      <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </div>

                    {/* Pricing */}
                    <div className="my-6 pt-6 border-t border-border/50">
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-4xl font-black text-foreground">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.billing}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{plan.setup}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
                        No contracts. Cancel anytime.
                      </p>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={handleCTA}
                      className={`w-full mt-6 py-3 px-4 rounded-full font-bold text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        plan.highlighted
                          ? "bg-gradient-to-r from-primary to-primary/80 text-white hover:shadow-lg hover:scale-105"
                          : "border-2 border-primary/25 text-primary hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PRICING_PLANS[0].features.map((_, featureIdx) => {
                const featureName = PRICING_PLANS[0].features[featureIdx].name;
                return (
                  <tr
                    key={featureIdx}
                    className={`border-b border-border/50 hover:bg-card/50 transition-colors ${
                      featureIdx % 2 === 0 ? "bg-background" : "bg-card/25"
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-foreground/80 text-sm">
                      {featureName}
                    </td>

                    {PRICING_PLANS.map((plan) => {
                      const feature = plan.features[featureIdx];
                      return (
                        <td
                          key={plan.name}
                          className={`px-6 py-4 text-center ${
                            plan.highlighted ? "bg-primary/5" : ""
                          }`}
                        >
                          {feature.included ? (
                            <div className="flex justify-center">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <X className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            All plans include system setup, launch support, and 30 days of post-launch optimization. Custom enterprise plans available upon request.
          </p>
        </div>
      </div>
    </section>
  );
}