import { useEffect, useMemo, useState, memo } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Wallet,
  Zap,
  TrendingUp,
  Crown,
} from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import {
  getSelectedIndustryRecommendation,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";
import {
  PACKAGE_OFFERS,
  getPackageStorePath,
} from "@/lib/salesCatalog";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import StaggeredFadeUp from "@/components/visual-effects/StaggeredFadeUp";
import PageCheckIcon from "@/components/ui/PageCheckIcon";

function SimpleCheck() { return <PageCheckIcon />; }

// Maps package key → tier icon component
const TIER_ICONS = {
  starter_system: Zap,
  growth_system: TrendingUp,
  pro_system: Crown,
};

// Maps package key → previous plan name for incremental phrasing
const PREVIOUS_PLAN = {
  growth_system: "Starter",
  pro_system: "Growth",
};

export default function Pricing() {
  const demoBooking = useDemoBooking();
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  const plans = useMemo(
    () =>
      PACKAGE_OFFERS.map((offer) => ({
        name: offer.customer_facing_name || offer.name,
        internalName: offer.name,
        packageKey: offer.package_key,
        fit: offer.fit,
        desc: offer.description,
        setup: `$${Number(offer.setup_total || 0).toLocaleString()}`,
        monthly: `$${Number(offer.monthly_total || 0).toLocaleString()}`,
        features: offer.included_services.map((service) => service.name),
        badge: offer.badge || null,
        highlight: Boolean(offer.highlight),
      })),
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncIndustry = () => {
      const storedId = window.sessionStorage.getItem(
        INDUSTRY_SELECTION_STORAGE_KEY
      );
      setSelectedIndustry(
        storedId ? getSelectedIndustryRecommendation() : null
      );
    };

    syncIndustry();
    window.addEventListener("storage", syncIndustry);
    window.addEventListener("clientsurge:industry-selected", syncIndustry);

    return () => {
      window.removeEventListener("storage", syncIndustry);
      window.removeEventListener("clientsurge:industry-selected", syncIndustry);
    };
  }, []);

  return (
    <section
      id="pricing"
      className="nebula-pricing pt-14 md:pt-28 pb-24 md:pb-40 px-6 overflow-visible"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2
            className="text-[#001B44] text-4xl font-bold tracking-tight leading-tight md:text-5xl lg:text-6xl"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Stop Losing Leads. Start Running a Real System.
          </h2>
        </div>

        {selectedIndustry ? (
          <div className="max-w-4xl mx-auto mb-10 rounded-lg border border-primary/15 bg-primary/5 px-6 py-5 text-center">
            <p className="text-xs font-semibold text-[#005f99] tracking-[0.22em] uppercase mb-2">
              Recommended For {selectedIndustry.shortName}
            </p>
            <p className="text-lg font-semibold text-foreground">
              Start with the {selectedIndustry.recommendedPackage?.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {selectedIndustry.summary}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[
            { Icon: ShieldCheck, text: "Stripe checkout" },
            { Icon: CheckCircle2, text: "No hidden fees" },
            { Icon: Wallet, text: "Month-to-month" },
          ].map(({ Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border"
              style={{
                background: "rgba(0,174,239,0.07)",
                borderColor: "rgba(0,174,239,0.2)",
                color: "rgba(0,80,160,0.85)",
              }}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {text}
            </span>
          ))}
        </div>

        <StaggeredFadeUp staggerDelay={0.15}>
          <div className="pricing-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {plans.map((plan) => (
              <PricingCard
                key={plan.packageKey}
                plan={plan}
                demoBooking={demoBooking}
                selectedIndustry={selectedIndustry}
              />
            ))}
          </div>
        </StaggeredFadeUp>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-8 mb-4 w-full">
          {[
            { icon: "No lock-in", text: "No long-term contracts" },
            { icon: "Launch plan", text: "Timeline confirmed after onboarding" },
            { icon: "Channels", text: "SMS + Email included" },
            { icon: "Managed", text: "Done-for-you setup" },
            { icon: "Protected", text: "30-day money-back guarantee" },
          ].map((badge) => (
            <div
              key={badge.text}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-lg font-semibold"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid rgba(0,174,239,0.18)",
                color: "rgba(0,0,0,0.75)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                }}
              >
                {badge.icon}
              </span>
              <span
                style={{
                  fontSize: "12px",
                  textAlign: "center",
                  lineHeight: 1.3,
                  padding: "0 8px",
                }}
              >
                {badge.text}
              </span>
            </div>
          ))}
        </div>

        <MoneyBackGuarantee />
      </div>

      <style>{`
        .nebula-pricing .text-muted-foreground,
        .nebula-pricing .text-foreground\\/70,
        .nebula-pricing .text-foreground\\/75 {
          color: rgba(10,22,40,0.74) !important;
        }
        .nebula-pricing .text-primary {
          color: #005f99 !important;
        }
        .pricing-card {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.35s ease;
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%);
        }
        .pricing-card.highlight-glow {
          background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 100%);
        }
        .pricing-card.highlight-hover {
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(221,245,255,0.54) 100%);
        }
        .pricing-card::before {
          content: "";
          position: absolute;
          top: 10%;
          right: -5%;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,174,239,0.14) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .pricing-card:nth-child(3)::before {
          top: auto;
          bottom: 5%;
          right: auto;
          left: -5%;
        }
        .pricing-badge-float {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .nebula-pricing > div > .max-w-3xl {
            margin-bottom: 2rem !important;
          }
          .pricing-badge-float {
            position: relative;
            top: 0;
            left: 0;
            transform: none;
            display: flex;
            justify-content: center;
            margin-bottom: 8px;
          }
          .pricing-card .feature-list-extra {
            display: none;
          }
        }
        .shiny-cta-btn {
          display: inline-block;
          border-radius: 8px;
          padding: 2px;
          background: linear-gradient(135deg, #00AEEF 0%, #009DFF 45%, #003B8F 100%);
          box-shadow: 0 4px 18px rgba(0, 174, 239, 0.4), 0 1px 4px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          cursor: pointer;
          border: none;
          position: relative;
        }
        .shiny-cta-btn::after {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          border-radius: 8px;
          pointer-events: none;
        }
        .shiny-cta-btn:hover {
          box-shadow: 0 8px 32px rgba(0, 174, 239, 0.6), 0 2px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        .shiny-cta-inner {
          background: linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%);
          border-radius: 6px;
          color: #ffffff;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
        }
        .pricing-card:hover {
          border-color: rgba(0,174,239,0.45) !important;
          box-shadow: 0 14px 36px rgba(0,174,239,0.12), inset 0 1px 0 rgba(255,255,255,0.85) !important;
          transform: translateY(-4px);
        }
        .tier-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
          flex-shrink: 0;
        }
        .incremental-divider {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .incremental-divider::before,
        .incremental-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(0,174,239,0.15);
        }
      `}</style>
    </section>
  );
}

const PricingCard = memo(function PricingCard({ plan, selectedIndustry }) {
  const isRecommended =
    selectedIndustry?.recommendedPackage?.name === plan.name;

  const TierIcon = TIER_ICONS[plan.packageKey] || Zap;
  const previousPlanName = PREVIOUS_PLAN[plan.packageKey] || null;

  // Split features: first 2 are "base" always shown; rest are incremental additions
  const baseFeatures = plan.features.slice(0, 2);
  const addedFeatures = plan.features.slice(2);

  return (
    <div
      className={`pricing-card relative flex flex-col rounded-lg ${
        plan.highlight ? "highlight-glow" : ""
      }`}
      style={{
        overflow: "visible",
        background: plan.highlight
          ? "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,250,255,0.92) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(243,250,255,0.78) 100%)",
        border: plan.highlight
          ? "2px solid rgba(0,174,239,0.38)"
          : "1.5px solid rgba(0,174,239,0.15)",
        boxShadow: plan.highlight
          ? "0 12px 40px rgba(0,174,239,0.14), inset 0 1px 0 rgba(255,255,255,0.8)"
          : "0 6px 22px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {plan.highlight ? (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: "0 0 0 1px rgba(0,174,239,0.25), 0 0 30px rgba(0,174,239,0.08)",
            borderRadius: "inherit",
          }}
        />
      ) : null}

      {/* Floating badge — "Most Popular" or industry recommendation */}
      {plan.badge || isRecommended ? (
        <div className="pricing-badge-float" style={{ zIndex: 30 }}>
          <span
            className="inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, #00AEEF 0%, #009DFF 50%, #003B8F 100%)",
              boxShadow: "0 4px 14px rgba(0,174,239,0.45)",
            }}
          >
            {isRecommended
              ? `Best fit for ${selectedIndustry.shortName}`
              : plan.badge}
          </span>
        </div>
      ) : null}

      <div className="p-5 opacity-100 flex flex-col flex-1 md:p-8 lg:p-10 relative z-10">

        {/* Tier Icon */}
        <div
          className="tier-icon-wrap"
          style={{
            background: plan.highlight
              ? "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)"
              : plan.packageKey === "pro_system"
              ? "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)"
              : "rgba(0,174,239,0.10)",
            boxShadow: plan.highlight
              ? "0 4px 16px rgba(0,174,239,0.35)"
              : plan.packageKey === "pro_system"
              ? "0 4px 16px rgba(124,58,237,0.25)"
              : "none",
          }}
        >
          <TierIcon
            className="w-6 h-6"
            style={{
              color: plan.highlight || plan.packageKey === "pro_system"
                ? "#ffffff"
                : "#0088CC",
            }}
          />
        </div>

        <div className="mb-5">
          <h3 className="font-display text-2xl font-semibold text-foreground mb-1">
            {plan.name}
          </h3>
          <p className="text-xs font-semibold text-foreground/70 leading-snug">
            {plan.fit}
          </p>
        </div>

        <div className="mb-7 pb-7 border-b border-border">
          <div className="flex items-end gap-2 mb-1">
            <span
              className="text-4xl font-bold text-foreground"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {plan.monthly}
            </span>
            <span className="text-sm text-muted-foreground mb-2">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            {plan.setup} one-time setup
          </p>
          <p className="text-xs text-muted-foreground">
            No long-term contracts. Cancel anytime.
          </p>
        </div>

        {/* Feature list — incremental "Everything in X, plus:" structure */}
        <ul className="space-y-2.5 md:space-y-3 flex-1 mb-7 md:mb-9">
          {previousPlanName ? (
            <>
              {/* Incremental phrasing header */}
              <li className="incremental-divider">
                <span className="text-[11px] font-bold text-primary whitespace-nowrap tracking-wide uppercase">
                  Everything in {previousPlanName}, plus:
                </span>
              </li>
              {addedFeatures.map((feature, index) => (
                index <= 1 ? (
                  <li key={feature} className="flex items-start gap-3">
                    <SimpleCheck />
                    <span className="text-sm text-foreground/75">{feature}</span>
                  </li>
                ) : (
                  <li key={feature} className="hidden sm:flex items-start gap-3">
                    <SimpleCheck />
                    <span className="text-sm text-foreground/75">{feature}</span>
                  </li>
                )
              ))}
              {/* Show base features smaller below the fold */}
              {baseFeatures.map((feature) => (
                <li key={feature} className="hidden sm:flex items-start gap-3 opacity-60">
                  <SimpleCheck />
                  <span className="text-sm text-foreground/65">{feature}</span>
                </li>
              ))}
            </>
          ) : (
            // Starter — no previous plan, just list all features
            plan.features.map((feature, index) => (
              index <= 3 ? (
                <li key={feature} className="flex items-start gap-3">
                  <SimpleCheck />
                  <span className="text-sm text-foreground/75">{feature}</span>
                </li>
              ) : (
                <li key={feature} className="hidden sm:flex items-start gap-3">
                  <SimpleCheck />
                  <span className="text-sm text-foreground/75">{feature}</span>
                </li>
              )
            ))
          )}
        </ul>

        {/* CTA — tiered button intensity */}
        <div className="flex flex-col gap-1">
          {plan.highlight ? (
            /* Growth (highlight) — strongest gradient CTA */
            <a
              href={getPackageStorePath(plan.packageKey)}
              className="w-full shiny-cta-btn focus:ring-2 focus:ring-primary focus:outline-none focus:ring-offset-2"
            >
              <span className="shiny-cta-inner w-full flex items-center justify-center gap-2 h-12 rounded-lg font-semibold text-sm">
                Get Started — {plan.setup} Today
                <ArrowRight className="w-4 h-4" />
              </span>
            </a>
          ) : plan.packageKey === "pro_system" ? (
            /* Pro — solid filled button, purple-to-blue gradient */
            <a
              href={getPackageStorePath(plan.packageKey)}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-lg text-sm font-semibold text-white transition-all focus:ring-2 focus:ring-primary focus:outline-none focus:ring-offset-2 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #0088CC 0%, #005f99 100%)",
                boxShadow: "0 4px 14px rgba(0,136,204,0.28)",
              }}
            >
              Get Started — {plan.setup} Today
              <ArrowRight className="w-4 h-4" />
            </a>
          ) : (
            /* Starter — ghost/outlined button */
            <a
              href={getPackageStorePath(plan.packageKey)}
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-lg border border-primary/25 bg-white/80 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors focus:ring-2 focus:ring-primary focus:outline-none focus:ring-offset-2"
            >
              Get Started — {plan.setup} Today
              <ArrowRight className="w-4 h-4" />
            </a>
          )}

          {/* Secondary "or" divider + consult link */}
          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <a
            href="/book"
            className="w-full inline-flex items-center justify-center h-9 rounded-lg text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Book a free strategy call
          </a>

          <p className="text-center text-[11px] text-muted-foreground mt-1">
            {plan.monthly}/mo begins 30 days after go-live
          </p>
        </div>
      </div>
    </div>
  );
});