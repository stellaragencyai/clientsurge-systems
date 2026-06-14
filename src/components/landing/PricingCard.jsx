import { useMemo } from "react";
import { ArrowRight, Zap, TrendingUp, Crown } from "lucide-react";
import { getPackageStorePath } from "@/lib/salesCatalog";
import PageCheckIcon from "@/components/ui/PageCheckIcon";

const TIER_ICONS = {
  starter_system: Zap,
  growth_system: TrendingUp,
  pro_system: Crown,
};

const OUTCOME_COPY = {
  starter_system: "Recover missed leads fast.",
  growth_system: "Turn leads into booked appointments.",
  pro_system: "Run the full response, nurture, and review system.",
};

const PRO_ONLY_FEATURES = [
  "Review request automation",
  "Lead reactivation campaign",
  "Priority support",
  "Advanced reporting",
];

const STARTER_FEATURES = [
  "Lead capture connection",
  "SMS notification setup",
  "Missed-call recovery workflow",
  "Basic launch support",
  "Monthly system monitoring",
];

const PREVIOUS_PLAN = {
  growth_system: "Starter",
  pro_system: "Growth",
};

export default function PricingCard({ plan, isRecommended, selectedIndustry }) {
  const TierIcon = TIER_ICONS[plan.packageKey] || Zap;
  const previousPlanName = PREVIOUS_PLAN[plan.packageKey] || null;

  const featureGroups = useMemo(() => {
    if (previousPlanName) {
      return {
        added: plan.features.slice(2, 4),
        base: plan.features.slice(0, 2),
      };
    }
    return {
      main: plan.features.slice(0, 4),
      extra: plan.features.slice(4),
    };
  }, [plan.features, previousPlanName]);

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border transition-all duration-300 h-full ${
        isRecommended
          ? "border-primary/40 ring-1 ring-primary/20 shadow-xl"
          : "border-primary/12 shadow-sm hover:shadow-md hover:border-primary/20"
      }`}
      style={{
        background: isRecommended
          ? "linear-gradient(135deg, #ffffff 0%, #f0faff 100%)"
          : "#ffffff",
      }}
    >
      {/* Glow accent — only for recommended */}
      {isRecommended && (
        <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 0 20px rgba(0,174,239,0.08)",
        }} />
      )}

      {/* Floating badge */}
      {plan.badge || isRecommended ? (
        <div className="absolute -top-3 left-6 z-20">
          <span
            className="inline-block text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg"
            style={{
              background: "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)",
              boxShadow: "0 2px 8px rgba(0,174,239,0.4)",
            }}
          >
            {isRecommended ? `Best for ${selectedIndustry?.shortName}` : plan.badge}
          </span>
        </div>
      ) : null}

      <div className="p-6 md:p-8 flex flex-col flex-1 relative z-10">
        {/* Icon + Title */}
        <div className="mb-6">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 flex-shrink-0"
            style={{
              background: isRecommended
                ? "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)"
                : plan.packageKey === "pro_system"
                ? "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)"
                : "rgba(0,174,239,0.10)",
              boxShadow: isRecommended
                ? "0 4px 12px rgba(0,174,239,0.3)"
                : "none",
            }}
          >
            <TierIcon
              className="w-6 h-6"
              style={{
                color: isRecommended || plan.packageKey === "pro_system" ? "#ffffff" : "#0088CC",
              }}
            />
          </div>
          <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
          <p className="text-sm font-medium text-foreground/70 mt-2">{OUTCOME_COPY[plan.packageKey]}</p>
          <p className="text-xs font-medium text-foreground/60 mt-1">{plan.fit}</p>
        </div>

        {/* Pricing */}
         <div className="mb-6 pb-6 border-b border-primary/10">
           <div className="flex items-baseline gap-2 mb-2">
             <span className="text-4xl font-bold text-foreground">{plan.monthly}</span>
             <span className="text-sm text-foreground/60">/month</span>
           </div>
           <p className="text-sm font-semibold text-foreground/80 leading-tight">+{plan.setup} one-time setup</p>
         </div>

        {/* Features */}
         <ul className="space-y-2.5 flex-1 mb-6">
           {plan.packageKey === "starter_system" ? (
             // Starter: show all features clearly
             STARTER_FEATURES.map((feature) => (
               <li key={feature} className="flex items-start gap-3">
                 <PageCheckIcon />
                 <span className="text-sm text-foreground/75">{feature}</span>
               </li>
             ))
           ) : plan.packageKey === "pro_system" ? (
             // Pro: show "Everything in Growth, plus:" with Pro-only features
             <>
               <li className="flex items-center gap-2 mb-3">
                 <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                   Everything in Growth, plus:
                 </span>
               </li>
               {PRO_ONLY_FEATURES.map((feature) => (
                 <li key={feature} className="flex items-start gap-3">
                   <PageCheckIcon />
                   <span className="text-sm text-foreground/75">{feature}</span>
                 </li>
               ))}
             </>
           ) : (
             // Growth: show "Everything in Starter, plus:" with added features
             <>
               <li className="flex items-center gap-2 mb-3">
                 <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                   Everything in Starter, plus:
                 </span>
               </li>
               {["14-day nurture sequences", "AI appointment booking", "Email automation", "Lead scoring"].map((feature) => (
                 <li key={feature} className="flex items-start gap-3">
                   <PageCheckIcon />
                   <span className="text-sm text-foreground/75">{feature}</span>
                 </li>
               ))}
             </>
           )}
         </ul>

        {/* CTA */}
        <div className="space-y-2">
          {isRecommended ? (
            <a
              href={getPackageStorePath(plan.packageKey)}
              className="w-full block h-11 rounded-lg text-sm font-semibold text-white transition-all focus:ring-2 focus:ring-primary focus:outline-none"
              style={{
                background: "linear-gradient(135deg, #0088CC 0%, #003B8F 100%)",
                boxShadow: "0 4px 14px rgba(0,174,239,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,174,239,0.45)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,174,239,0.35)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            <a
              href={getPackageStorePath(plan.packageKey)}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg border border-primary/20 bg-white text-sm font-semibold text-primary hover:border-primary/40 hover:bg-primary/5 transition-all focus:ring-2 focus:ring-primary focus:outline-none"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </a>
          )}
          <a
            href="/book"
            className="w-full inline-flex items-center justify-center h-9 rounded-lg text-xs font-medium text-foreground/60 hover:text-primary transition-colors"
          >
            Start free automation audit
          </a>
        </div>
      </div>
    </div>
  );
}