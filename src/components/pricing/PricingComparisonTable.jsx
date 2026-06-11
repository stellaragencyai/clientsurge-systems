import { CheckCircle2, X } from "lucide-react";
import { useDemoBooking } from "../landing/DemoBookingContext";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

const SERVICE_NAMES = Array.from(
  new Set(
    PACKAGE_OFFERS.flatMap((plan) =>
      plan.included_services.map((service) => service.name)
    )
  )
);

const PRICING_PLANS = PACKAGE_OFFERS.map((offer) => ({
  name: offer.customer_facing_name || offer.name,
  internalName: offer.name,
  subtitle: offer.badge || offer.fit,
  price: formatMoney(offer.monthly_total),
  billing: "/month",
  setup: `${formatMoney(offer.setup_total)} setup`,
  description: offer.description,
  services: new Set(offer.included_services.map((service) => service.name)),
  cta: "Free Automation Audit",
  highlighted: Boolean(offer.highlight),
}));

export default function PricingComparisonTable() {
  const demoBooking = useDemoBooking();

  const handleCTA = () => {
    demoBooking?.openDemoBooking?.();
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Transparent Pricing. No Surprises.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Every plan below is rendered from the same live sales catalog used
            by checkout, order creation, and package display.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left px-6 py-4 font-semibold text-foreground min-w-56">
                  Included Services
                </th>
                {PRICING_PLANS.map((plan) => (
                  <th
                    key={plan.name}
                    className={`px-6 py-4 text-center min-w-80 ${
                      plan.highlighted
                        ? "bg-primary/5 border-l-2 border-r-2 border-primary/20"
                        : ""
                    }`}
                  >
                    <div className="mb-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        {plan.subtitle}
                      </p>
                      <h3 className="font-display text-2xl font-bold text-foreground mb-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {plan.internalName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>

                    <div className="my-6 pt-6 border-t border-border/50">
                      <div className="flex items-baseline justify-center gap-1 mb-2">
                        <span className="text-4xl font-black text-foreground">
                          {plan.price}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {plan.billing}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {plan.setup}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-2 italic">
                        No contracts. Cancel anytime.
                      </p>
                    </div>

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
              {SERVICE_NAMES.map((serviceName, index) => (
                <tr
                  key={serviceName}
                  className={`border-b border-border/50 hover:bg-card/50 transition-colors ${
                    index % 2 === 0 ? "bg-background" : "bg-card/25"
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-foreground/80 text-sm">
                    {serviceName}
                  </td>

                  {PRICING_PLANS.map((plan) => (
                    <td
                      key={plan.name}
                      className={`px-6 py-4 text-center ${
                        plan.highlighted ? "bg-primary/5" : ""
                      }`}
                    >
                      {plan.services.has(serviceName) ? (
                        <div className="flex justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <X className="w-5 h-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            Package savings and service counts now come from the canonical sales
            catalog instead of hand-maintained plan tables.
          </p>
        </div>
      </div>
    </section>
  );
}
