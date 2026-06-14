import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, Wallet } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import {
  getSelectedIndustryRecommendation,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import StaggeredFadeUp from "@/components/visual-effects/StaggeredFadeUp";
import PricingCard from "./PricingCard";

export default function Pricing() {
  const demoBooking = useDemoBooking();
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [businessSize, setBusinessSize] = useState(null);

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
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2
            className="text-[#001B44] text-4xl font-bold tracking-tight leading-tight md:text-5xl lg:text-6xl"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Stop Losing Leads. Start Running a Real System.
          </h2>
        </div>

        {/* Business Size Toggle */}
        <div className="flex justify-center gap-3 mb-12">
          {["Local", "Scaling", "High-Volume"].map((size) => (
            <button
              key={size}
              onClick={() => setBusinessSize(size)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                businessSize === size
                  ? "bg-primary text-white shadow-lg"
                  : "bg-card border border-primary/15 text-foreground hover:border-primary/30"
              }`}
            >
              {size}
            </button>
          ))}
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
                background: "rgba(0,174,239,0.08)",
                borderColor: "rgba(0,174,239,0.28)",
                color: "#005f99",
              }}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {text}
            </span>
          ))}
        </div>

        <StaggeredFadeUp staggerDelay={0.12}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {plans.map((plan) => {
              const isRecommended = selectedIndustry?.recommendedPackage?.name === plan.name;
              return (
                <PricingCard
                  key={plan.packageKey}
                  plan={plan}
                  isRecommended={isRecommended}
                  selectedIndustry={selectedIndustry}
                />
              );
            })}
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
      `}</style>
    </section>
  );
}