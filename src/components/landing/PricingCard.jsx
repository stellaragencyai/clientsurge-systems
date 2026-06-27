import { ArrowRight, Zap, TrendingUp, Crown } from "lucide-react";
import CheckoutButton from "@/components/checkout/CheckoutButton";
import { getPackageStorePath } from "@/lib/salesCatalog";
import PageCheckIcon from "@/components/ui/PageCheckIcon";

const TIER_ICONS = {
  starter_system: Zap,
  growth_system: TrendingUp,
  pro_system: Crown,
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

export default function PricingCard({ plan, isRecommended, selectedIndustry }) {
  const TierIcon = TIER_ICONS[plan.packageKey] || Zap;

  return (
    <div
      className={`relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 h-full ${
        isRecommended
          ? "border-primary/50 ring-2 ring-primary/25 shadow-2xl lg:scale-105"
          : "border-foreground/10 shadow-md hover:shadow-2xl hover:border-foreground/15 hover:-translate-y-1"
      }`}
      style={{
        background: isRecommended
          ? "linear-gradient(135deg, #ffffff 0%, #f7fbff 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Glow accent — only for recommended */}
      {isRecommended && (
        <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.95), 0 0 40px rgba(0,174,239,0.2), inset 0 0 20px rgba(0,174,239,0.05)",
        }} />
      )}

      {/* Floating badge — only for recommended */}
       {isRecommended ? (
         <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
           <span
             className="inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-xl"
             style={{
               background: "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)",
               boxShadow: "0 4px 12px rgba(0,174,239,0.5)"
             }}
           >
             ★ Best for {selectedIndustry?.shortName}
           </span>
         </div>
       ) : null}

      <div className="py-9 md:py-12 px-6 md:px-8 flex flex-col flex-1 relative z-10 min-h-[420px] md:min-h-[500px]">
        {/* Icon + Title */}
        <div className="mb-6 pb-4 border-b-2" style={{ borderColor: isRecommended ? "rgba(0,174,239,0.15)" : "rgba(0,0,0,0.04)" }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 flex-shrink-0"
              style={{
                background: isRecommended
                  ? "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)"
                  : plan.packageKey === "pro_system"
                  ? "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)"
                  : "linear-gradient(135deg, rgba(0,174,239,0.12) 0%, rgba(0,136,204,0.08) 100%)",
                boxShadow: isRecommended
                  ? "0 8px 24px rgba(0,174,239,0.3)"
                  : plan.packageKey === "pro_system"
                  ? "0 4px 12px rgba(124,58,237,0.15)"
                  : "none",
              }}
            >
              <TierIcon
                className="w-7 h-7"
                style={{
                  color: isRecommended || plan.packageKey === "pro_system" ? "#ffffff" : "#00AEEF",
                }}
              />
            </div>
            <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
            <p className="text-xs text-foreground/55 mt-2 uppercase tracking-widest">{plan.fit}</p>
          </div>

        {/* Pricing */}
         <div className="mb-7 pb-7 border-b-2" style={{ borderColor: isRecommended ? "rgba(0,174,239,0.15)" : "rgba(0,0,0,0.04)" }}>
           <div className="flex items-baseline gap-2 mb-3">
             <span className={`font-black ${isRecommended ? "text-5xl" : "text-4xl"}`} style={{ color: "#001B44" }}>
               {plan.monthly}
             </span>
             <span className="text-base text-foreground/60 font-semibold">/month</span>
           </div>
           <p className="text-sm font-bold text-foreground/75">+ {plan.setup} setup fee</p>
         </div>

        {/* Features — Task #12: Centralized badge colors */}
         <ul className="space-y-3 flex-1 mb-6" aria-label={`Features for ${plan.name}`}>
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
           <CheckoutButton
             packageKey={plan.packageKey}
             label={isRecommended ? "Start Now" : "Choose Plan"}
           />
           <a
             href="/book"
             className="w-full inline-flex items-center justify-center h-10 rounded-lg text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
           >
             Explore the Automation Catalog
           </a>
         </div>
      </div>
    </div>
  );
}