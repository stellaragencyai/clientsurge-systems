/**
 * Customer Proof Cards
 * Social proof with specific, measurable results
 * Placed below pricing options
 */

import { TrendingUp, Users, Zap } from "lucide-react";

const proofCards = [
  {
    icon: TrendingUp,
    metric: "$47K",
    label: "Revenue Generated",
    detail: "First 30 days",
    industry: "Med Spa",
  },
  {
    icon: Users,
    metric: "23",
    label: "New Clients Booked",
    detail: "In first month",
    industry: "Dental",
  },
  {
    icon: Zap,
    metric: "12x",
    label: "Response Speed Improvement",
    detail: "Instant vs. manual",
    industry: "HVAC",
  },
];

export default function CustomerProofCards() {
  return (
    <div className="mt-16 pt-16 border-t border-border">
      <div className="max-w-5xl mx-auto px-6">
        <h3 className="text-center font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
          Real Results, Real Businesses
        </h3>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          These aren't averages. These are actual clients who went live with ClientSurge and saw immediate results.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {proofCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: "radial-gradient(circle at top right, rgba(154,92,46,0.08) 0%, transparent 60%)",
                  }}
                />

                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  <div className="mb-3">
                    <p className="text-3xl font-bold text-foreground">{card.metric}</p>
                    <p className="text-sm font-semibold text-muted-foreground mt-1">{card.label}</p>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">{card.detail}</p>

                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/25">
                    <span className="text-xs font-semibold text-primary">{card.industry}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}