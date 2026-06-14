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
      className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 h-full ${
        isRecommended
          ? "border-primary/60 ring-2 ring-primary/30 shadow-2xl scale-105"
          : "border-foreground/12 shadow-sm hover:shadow-lg hover:border-foreground/20"
      }`}
      style={{
        background: isRecommended
          ? "linear-gradient(135deg, #ffffff 0%, #f5faff 100%)"
          : "#ffffff",
      }}
    >
      {/* Glow accent — only for recommended */}
      {isRecommended && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 0 32px rgba(0,174,239,0.15)",
        }} />
      )}

      {/* Floating badge */}
       {plan.badge || isRecommended ? (
         <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
           <span
             className="inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-xl"
             style={{
               background: isRecommended
                 ? "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)"
                 : "linear-gradient(135deg, #0088CC 0%, #005f99 100%)",
               boxShadow: isRecommended
                 ? "0 4px 12px rgba(0,174,239,0.5)"
                 : "0 2px 8px rgba(0,136,204,0.3)",
             }}
           >
             {isRecommended ? `★ Best for ${selectedIndustry?.shortName}` : plan.badge}
           </span>
         </div>
       ) : null}

      <div className="p-6 md:p-8 flex flex-col flex-1 relative z-10">
        {/* Icon + Title */}
        <div className="mb-6 pb-4 border-b-2" style={{ borderColor: isRecommended ? "rgba(0,174,239,0.2)" : "rgba(0,0,0,0.06)" }}>
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 flex-shrink-0"
              style={{
                background: isRecommended
                  ? "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)"
                  : plan.packageKey === "pro_system"
                  ? "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)"
                  : "rgba(0,174,239,0.12)",
                boxShadow: isRecommended
                  ? "0 4px 16px rgba(0,174,239,0.35)"
                  : "none",
              }}
            >
              <TierIcon
                className="w-7 h-7"
                style={{
                  color: isRecommended || plan.packageKey === "pro_system" ? "#ffffff" : "#0088CC",
                }}
              />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
            <p className="text-base font-semibold text-foreground/85 mt-3 leading-snug">{OUTCOME_COPY[plan.packageKey]}</p>
            <p className="text-xs text-foreground/55 mt-2 uppercase tracking-widest">{plan.fit}</p>
          </div>

        {/* Pricing */}
         <div className="mb-7 pb-7 border-b-2" style={{ borderColor: isRecommended ? "rgba(0,174,239,0.2)" : "rgba(0,0,0,0.06)" }}>
           <div className="flex items-baseline gap-2 mb-3">
             <span className={`font-black ${isRecommended ? "text-5xl" : "text-4xl"}`} style={{ color: "#001B44" }}>
               {plan.monthly}
             </span>
             <span className="text-base text-foreground/60 font-semibold">/month</span>
           </div>
           <p className="text-sm font-bold text-foreground/75">+ {plan.setup} setup fee</p>
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
         <div className="space-y-2.5">
           {isRecommended ? (
             <a
               href={getPackageStorePath(plan.packageKey)}
               className="w-full block h-12 rounded-xl text-sm font-bold text-white transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none flex items-center justify-center gap-2"
               style={{
                 background: "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)",
                 boxShadow: "0 6px 20px rgba(0,174,239,0.4)",
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,174,239,0.55)";
                 e.currentTarget.style.transform = "translateY(-3px)";
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,174,239,0.4)";
                 e.currentTarget.style.transform = "translateY(0)";
               }}
             >
               Start Now <ArrowRight className="w-4 h-4" />
             </a>
           ) : (
             <a
               href={getPackageStorePath(plan.packageKey)}
               className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-foreground/20 bg-white text-sm font-bold text-foreground hover:border-primary/40 hover:bg-primary/3 transition-all focus:ring-2 focus:ring-primary focus:outline-none"
             >
               Choose Plan <ArrowRight className="w-4 h-4" />
             </a>
           )}
           <a
             href="/book"
             className="w-full inline-flex items-center justify-center h-10 rounded-lg text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
           >
             Free automation audit
           </a>
         </div>
      </div>
    </div>
  );
}