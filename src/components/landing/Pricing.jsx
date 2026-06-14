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
      className="nebula-pricing pt-10 md:pt-14 pb-16 md:pb-24 px-6 overflow-visible"
    >
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2
            className="text-[#001B44] text-4xl font-bold tracking-tight leading-tight md:text-5xl lg:text-6xl mx-auto"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Stop Losing Leads. Start Running a Real System.
          </h2>
          <p className="mt-4 text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Choose the level of automation your business needs. Every plan includes setup, support, and live lead-response infrastructure.
          </p>
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

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "No Long-Term Contract" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mt-12 mb-6 w-full">
          {[
            { icon: "🔓", text: "No Lock-In" },
            { icon: "📅", text: "Managed Setup" },
            { icon: "📱", text: "SMS + Email" },
            { icon: "🚀", text: "Launch Support" },
            { icon: null, image: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/fb4532189_720d06dc-da6b-42eb-80bd-84ce273b6d14.png", text: "30-Day Guarantee" },
          ].map((badge) => (
            <div
              key={badge.text}
              className="flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-lg"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid rgba(0,174,239,0.18)",
                color: "rgba(0,0,0,0.75)",
              }}
            >
              {badge.image ? (
                <img src={badge.image} alt={badge.text} style={{ width: "32px", height: "32px", objectFit: "contain" }} />
              ) : (
                <span style={{ fontSize: "20px", lineHeight: 1 }}>
                  {badge.icon}
                </span>
              )}
              <span
                style={{
                  fontSize: "11px",
                  textAlign: "center",
                  lineHeight: 1.2,
                  fontWeight: "600",
                }}
              >
                {badge.text}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <p className="text-sm text-foreground/60">
            <strong>Not sure which plan fits?</strong> Most local service businesses start with Growth because it includes nurture sequences and AI booking—the fastest path to more booked appointments.
          </p>
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