import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { getPackageStorePath } from "@/lib/salesCatalog";

// ── Luxury feature data per tier ──
const STARTER_FEATURES = [
  "Instant lead response via SMS",
  "Missed-call auto text-back",
  "Managed system setup",
  "Monthly monitoring included",
  "Launch support",
];

const GROWTH_ADDED = [
  "14-day nurture sequences",
  "AI appointment booking",
  "Email automation",
  "Lead scoring & routing",
];

const PRO_ADDED = [
  "Review request automation",
  "Lead reactivation campaigns",
  "Priority support",
  "Advanced reporting & insights",
];

const PREVIOUS_PLAN = {
  growth_system: "Starter",
  pro_system: "Growth",
};

// ── Elegant bullet — thin gold diamond ──
function FeatureBullet() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-[3px]" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="#D4AF37" strokeWidth="1.5" transform="rotate(45 7 7)" />
    </svg>
  );
}

export default function PricingCard({ plan, isRecommended, selectedIndustry }) {
  const previousPlanName = PREVIOUS_PLAN[plan.packageKey] || null;

  const featureList = useMemo(() => {
    if (plan.packageKey === "starter_system") return { main: STARTER_FEATURES };
    if (plan.packageKey === "growth_system") return { base: "Starter", added: GROWTH_ADDED };
    if (plan.packageKey === "pro_system") return { base: "Growth", added: PRO_ADDED };
    return { main: plan.features };
  }, [plan.packageKey, plan.features]);

  const isHighlighted = isRecommended || plan.highlight;

  return (
    <div
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-500 h-full"
      style={{
        background: "linear-gradient(180deg, #0a1220 0%, #0f1928 100%)",
        border: isHighlighted ? "1.5px solid rgba(212,175,55,0.22)" : "1.5px solid rgba(255,255,255,0.06)",
        boxShadow: isHighlighted
          ? "0 4px 24px rgba(0,0,0,0.25), 0 0 20px rgba(212,175,55,0.07)"
          : "0 4px 24px rgba(0,0,0,0.25)",
        transform: isHighlighted ? "scale(1.02)" : "scale(1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(212,175,55,0.55)";
        e.currentTarget.style.boxShadow = "0 8px 40px rgba(0,0,0,0.35), 0 0 32px rgba(212,175,55,0.14), 0 0 0 1px rgba(212,175,55,0.20)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHighlighted ? "rgba(212,175,55,0.22)" : "rgba(255,255,255,0.06)";
        e.currentTarget.style.boxShadow = isHighlighted
          ? "0 4px 24px rgba(0,0,0,0.25), 0 0 20px rgba(212,175,55,0.07)"
          : "0 4px 24px rgba(0,0,0,0.25)";
        e.currentTarget.style.transform = isHighlighted ? "scale(1.02)" : "scale(1)";
      }}
    >
      {/* Ambient gold corner glow on hover */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)" }}
      />

      {/* Recommended badge */}
      {isRecommended && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
          <div
            className="flex items-center gap-1.5 px-5 py-1.5 rounded-b-lg text-[10px] font-bold tracking-[0.14em] uppercase"
            style={{
              background: "linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)",
              color: "#0a1220",
              boxShadow: "0 4px 16px rgba(212,175,55,0.3)",
            }}
          >
            <span style={{ fontSize: "10px" }}>◆</span> Best for {selectedIndustry?.shortName || "You"}
          </div>
        </div>
      )}

      {/* Most Popular badge */}
      {plan.badge && !isRecommended && (
        <div className="absolute top-3 right-3 z-20">
          <span
            className="inline-block text-[10px] font-semibold tracking-[0.12em] uppercase px-3 py-1 rounded-full"
            style={{
              background: "rgba(212,175,55,0.12)",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#D4AF37",
            }}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div className="p-6 md:p-8 flex flex-col flex-1 relative z-10">
        {/* ── Header ── */}
        <div className="mb-7">
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase mb-3"
            style={{ color: "#D4AF37" }}
          >
            {plan.fit?.split(".")[0] || plan.name}
          </p>
          <h3
            className="text-[22px] font-bold mb-1 tracking-[-0.02em]"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#ffffff" }}
          >
            {plan.name}
          </h3>
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
            {plan.desc}
          </p>
        </div>

        {/* ── Price ── */}
        <div className="mb-7 pb-7 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-[42px] font-extrabold tracking-[-0.03em] leading-none" style={{ color: "#ffffff", fontFamily: "Montserrat, sans-serif" }}>
              {plan.monthly}
            </span>
            <span className="text-[13px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              /month
            </span>
          </div>
          <p className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.40)" }}>
            + {plan.setup} one-time setup
          </p>
        </div>

        {/* ── Features ── */}
        <ul className="space-y-3 flex-1 mb-8" aria-label={`Features for ${plan.name}`}>
          {featureList.main ? (
            featureList.main.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <FeatureBullet />
                <span className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>
                  {feature}
                </span>
              </li>
            ))
          ) : (
            <>
              <li className="pb-2 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-[10px] font-semibold tracking-[0.15em] uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Everything in {featureList.base}, plus:
                </span>
              </li>
              {featureList.added.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <FeatureBullet />
                  <span className="text-[13px] leading-snug" style={{ color: "rgba(255,255,255,0.72)" }}>
                    {feature}
                  </span>
                </li>
              ))}
            </>
          )}
        </ul>

        {/* ── CTA ── */}
        <a
          href={getPackageStorePath(plan.packageKey)}
          className="w-full flex items-center justify-center gap-2 h-[46px] rounded-xl text-[13px] font-bold tracking-[0.03em] transition-all duration-300 no-underline"
          style={{
            background: isHighlighted
              ? "linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)"
              : "rgba(255,255,255,0.06)",
            border: isHighlighted ? "none" : "1px solid rgba(255,255,255,0.12)",
            color: isHighlighted ? "#0a1220" : "#ffffff",
          }}
          onMouseEnter={(e) => {
            if (isHighlighted) {
              e.currentTarget.style.boxShadow = "0 8px 28px rgba(212,175,55,0.45)";
              e.currentTarget.style.transform = "translateY(-2px)";
            } else {
              e.currentTarget.style.background = "rgba(255,255,255,0.10)";
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.35)";
            }
          }}
          onMouseLeave={(e) => {
            if (isHighlighted) {
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            } else {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            }
          }}
        >
          {isHighlighted ? "Get Started" : "View Details"}
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}