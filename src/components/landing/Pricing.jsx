import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import {
  getSelectedIndustryRecommendation,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";
import {
  CANONICAL_SERVICE_PRODUCTS,
  PACKAGE_OFFERS,
} from "@/lib/salesCatalog";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import StaggeredFadeUp from "@/components/visual-effects/StaggeredFadeUp";

function SimpleCheck() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0 mt-0.5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
      <path
        d="M8 12l3 3 5-5"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const STRIPE_LINKS = {
  starter_system: "/store",
  growth_system: "/store",
  elite_system: "/store",
};

function formatMoney(amount) {
  return `$${Number(amount || 0).toLocaleString()}`;
}

const ALA_CARTE = CANONICAL_SERVICE_PRODUCTS.map((product) => ({
  emoji: product.icon || "",
  name: product.name,
  desc: product.description,
  price: `${formatMoney(product.setup_fee)} setup · ${formatMoney(product.monthly_fee)}/mo`,
  link: "/store",
}));

const plans = PACKAGE_OFFERS.map((offer) => ({
  name: offer.name,
  packageKey: offer.package_key,
  fit: offer.fit,
  desc: offer.description,
  setup: formatMoney(offer.setup_total),
  monthly: formatMoney(offer.monthly_total),
  features: offer.included_services.map((service) => service.name),
  badge: offer.badge || null,
  highlight: Boolean(offer.highlight),
}));

export default function Pricing() {
  const demoBooking = useDemoBooking();
  const [selectedIndustry, setSelectedIndustry] = useState(null);

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
      className="nebula-pricing pt-16 md:pt-28 pb-32 md:pb-40 px-6 overflow-visible"
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
          <div className="max-w-4xl mx-auto mb-10 rounded-3xl border border-primary/15 bg-primary/5 px-6 py-5 text-center">
            <p className="text-xs font-semibold text-primary tracking-[0.22em] uppercase mb-2">
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
            { icon: "Secure", text: "Secure Checkout via Stripe" },
            { icon: "Clear", text: "No Hidden Fees" },
            { icon: "Flexible", text: "Month-to-Month Only" },
          ].map((badge) => (
            <span
              key={badge.text}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border"
              style={{
                background: "rgba(0,174,239,0.07)",
                borderColor: "rgba(0,174,239,0.2)",
                color: "rgba(0,80,160,0.85)",
              }}
            >
              {badge.icon} {badge.text}
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
            { icon: "Fast launch", text: "Live in 24-48 Hours" },
            { icon: "Channels", text: "SMS + Email included" },
            { icon: "Managed", text: "Done-for-you setup" },
            { icon: "Protected", text: "30-day money-back guarantee" },
          ].map((badge) => (
            <div
              key={badge.text}
              className="flex flex-col items-center justify-center gap-2 py-6 rounded-2xl font-semibold"
              style={{
                background: "#ffffff",
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

        <div className="mt-16">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              A La Carte Add-Ons
            </h3>
            <p className="text-sm text-muted-foreground">
              Need one specific tool? Every self-serve service below comes from
              the same live checkout catalog used by the store.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {ALA_CARTE.map((item) => (
              <div
                key={item.name}
                className="flex flex-col rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.7)",
                  border: "1px solid rgba(0,0,0,0.12)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h4 className="font-semibold text-foreground text-sm mb-1">
                  {item.name}
                </h4>
                <p className="text-xs text-muted-foreground flex-1 mb-3 leading-relaxed">
                  {item.desc}
                </p>
                <p className="text-xs font-bold text-foreground mb-4">
                  {item.price}
                </p>
                <a
                  href={item.link}
                  className="inline-flex items-center justify-center gap-1.5 h-9 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-black hover:bg-primary/10 transition-colors hover:shadow-[0_0_12px_rgba(0,174,239,0.3)]"
                >
                  Add This <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .pricing-card {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.35s ease;
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%);
        }
        .dark .pricing-card {
          background: linear-gradient(135deg, rgba(30,22,14,0.88) 0%, rgba(20,15,8,0.72) 100%) !important;
          border-color: rgba(200,150,92,0.18) !important;
        }
        .dark .pricing-card.highlight-glow {
          background: linear-gradient(135deg, rgba(40,28,16,0.96) 0%, rgba(28,20,10,0.88) 100%) !important;
          border-color: rgba(200,150,92,0.35) !important;
        }
        .pricing-card.highlight-glow {
          background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 100%);
        }
        .pricing-card.highlight-hover {
          background: linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(245,217,168,0.4) 100%);
        }
        .pricing-card::before {
          content: "";
          position: absolute;
          top: 10%;
          right: -5%;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,150,92,0.15) 0%, transparent 70%);
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
          .pricing-badge-float {
            position: relative;
            top: 0;
            left: 0;
            transform: none;
            display: flex;
            justify-content: center;
            margin-bottom: 8px;
          }
        }
        .shiny-cta-btn {
          display: inline-block;
          border-radius: 9999px;
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
          border-radius: 9999px;
          pointer-events: none;
        }
        .shiny-cta-btn:hover {
          box-shadow: 0 8px 32px rgba(0, 174, 239, 0.6), 0 2px 8px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        .shiny-cta-inner {
          background: linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%);
          border-radius: 9999px;
          color: #ffffff;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
          position: relative;
          z-index: 1;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}

function PricingCard({ plan, selectedIndustry }) {
  const [isHovered, setIsHovered] = useState(false);
  const isRecommended =
    selectedIndustry?.recommendedPackage?.name === plan.name;

  return (
    <motion.div
      className={`pricing-card relative flex flex-col rounded-2xl transition-all duration-300 ${
        plan.highlight ? "highlight-glow" : ""
      } ${isHovered && plan.highlight ? "highlight-hover" : ""}`}
      style={{
        overflow: "visible",
        background: isHovered
          ? "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(230,245,255,0.95) 100%)"
          : plan.highlight
          ? "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(240,250,255,0.92) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(243,250,255,0.78) 100%)",
        backdropFilter: plan.highlight ? "blur(20px)" : "blur(14px)",
        WebkitBackdropFilter: plan.highlight ? "blur(20px)" : "blur(14px)",
        border: plan.highlight
          ? isHovered
            ? "2px solid rgba(0,174,239,0.7)"
            : "2px solid rgba(0,174,239,0.38)"
          : isHovered
          ? "2px solid rgba(0,174,239,0.4)"
          : "1.5px solid rgba(0,174,239,0.15)",
        boxShadow: plan.highlight
          ? isHovered
            ? "0 24px 64px rgba(0,174,239,0.22), 0 0 24px rgba(0,174,239,0.18), inset 0 1px 0 rgba(255,255,255,0.9)"
            : "0 12px 40px rgba(0,174,239,0.14), inset 0 1px 0 rgba(255,255,255,0.8)"
          : isHovered
          ? "0 14px 36px rgba(0,174,239,0.12), inset 0 1px 0 rgba(255,255,255,0.85)"
          : "0 6px 22px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.6)",
        perspective: "1200px",
      }}
      animate={
        isHovered
          ? { rotateY: 6, rotateX: -2, scale: 1.03 }
          : { rotateY: 0, rotateX: 0, scale: 1 }
      }
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.highlight ? (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: isHovered
              ? "0 0 0 1px rgba(0,174,239,0.45), 0 0 48px rgba(0,174,239,0.18)"
              : "0 0 0 1px rgba(0,174,239,0.25), 0 0 30px rgba(0,174,239,0.08)",
            transition: "box-shadow 0.35s ease",
            borderRadius: "inherit",
          }}
        />
      ) : null}

      {plan.badge || isRecommended ? (
        <div className="pricing-badge-float" style={{ zIndex: 30 }}>
          <span
            className="inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, #00AEEF 0%, #009DFF 50%, #003B8F 100%)",
            }}
          >
            {isRecommended
              ? `Best fit for ${selectedIndustry.shortName}`
              : plan.badge}
          </span>
        </div>
      ) : null}

      <div className="p-6 opacity-100 flex flex-col flex-1 md:p-8 lg:p-10 relative z-10">
        <div className="mb-7">
          <h3 className="font-display text-2xl font-semibold text-foreground mb-2">
            {plan.name}
          </h3>
          {plan.badge ? (
            <p className="text-xs font-bold text-primary mb-2">{plan.badge}</p>
          ) : null}
          {isRecommended ? (
            <p className="text-xs font-bold text-primary mb-2">
              Recommended for {selectedIndustry.shortName}
            </p>
          ) : null}
          <p className="text-xs font-semibold text-foreground/70 leading-snug">
            {plan.fit}
          </p>
        </div>

        <div className="mb-5 text-xs text-muted-foreground leading-relaxed px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
          {plan.highlight
            ? "Most clients recover this bundle with a handful of extra bookings per month."
            : plan.packageKey === "starter_system"
            ? "The entry bundle focused on speed-to-lead and booking handoff."
            : "Built for teams that need broader recovery and follow-up coverage."}
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
          <p className="text-xs text-muted-foreground mb-3">
            {plan.setup} one-time setup
          </p>
          <p className="text-xs text-muted-foreground text-left">
            One-time setup fee plus monthly service. No long-term contracts.
            Cancel anytime.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-7">
          {plan.desc}
        </p>

        <ul className="space-y-3.5 flex-1 mb-9">
          {plan.features.map((feature, index) => (
            <li
              key={feature}
              className="flex items-start gap-3"
              style={{
                animation: `slideIn 0.5s ease-out ${index * 0.05}s both`,
              }}
            >
              <SimpleCheck />
              <span className="text-sm text-foreground/75">{feature}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-1">
          <a
            href={STRIPE_LINKS[plan.packageKey] || "/store"}
            className={
              plan.highlight
                ? "w-full shiny-cta-btn focus:ring-2 focus:ring-primary focus:outline-none"
                : "w-full inline-flex items-center justify-center gap-2 h-12 rounded-full border border-primary/25 bg-white/80 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            }
          >
            {plan.highlight ? (
              <span className="shiny-cta-inner w-full flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-sm">
                Get Started - {plan.setup} Today
                <ArrowRight className="w-4 h-4" />
              </span>
            ) : (
              <>
                Get Started - {plan.setup} Today
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </a>
          <p className="text-center text-[11px] text-muted-foreground mt-1">
            {plan.monthly}/mo begins 30 days after go-live
          </p>
        </div>
      </div>
    </motion.div>
  );
}
