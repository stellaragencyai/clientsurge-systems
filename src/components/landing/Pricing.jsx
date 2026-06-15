import { useEffect, useMemo, useState } from "react";
import {
  getSelectedIndustryRecommendation,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";
import StaggeredFadeUp from "@/components/visual-effects/StaggeredFadeUp";
import PricingCard from "./PricingCard";

// ── Elegant trust indicators ──
function TrustStrip() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
      {[
        { label: "No Lock-In Contract", detail: "Cancel anytime" },
        { label: "Managed Setup", detail: "Done-for-you onboarding" },
        { label: "SMS + Email", detail: "Multi-channel reach" },
        { label: "30-Day Guarantee", detail: "Full refund if unsatisfied" },
      ].map(({ label, detail }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#D4AF37" }} />
          <div className="text-left">
            <p className="text-[11px] font-semibold tracking-[0.06em] uppercase" style={{ color: "rgba(255,255,255,0.60)" }}>
              {label}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {detail}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Pricing() {
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
    if (typeof window === "undefined") return undefined;

    const syncIndustry = () => {
      const storedId = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
      setSelectedIndustry(storedId ? getSelectedIndustryRecommendation() : null);
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
      className="pt-16 pb-20 md:pt-24 md:pb-28 px-6 overflow-visible relative"
      style={{ background: "#060d17" }}
    >
      {/* Subtle radial glow behind section */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(212,175,55,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* ── Section heading ── */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <p
            className="text-[10px] font-bold tracking-[0.28em] uppercase mb-4"
            style={{ color: "#D4AF37" }}
          >
            Investment
          </p>
          <h2
            className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-[-0.03em] leading-[1.08] mb-4 mx-auto"
            style={{ fontFamily: "Montserrat, sans-serif", color: "#ffffff" }}
          >
            Stop Losing Leads.
            <br />
            Start Running a Real System.
          </h2>
          <p className="text-[15px] max-w-xl mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
            Every plan includes white-glove setup, live lead-response infrastructure, and ongoing support.
          </p>
        </div>

        {/* ── Industry recommendation ── */}
        {selectedIndustry ? (
          <div
            className="max-w-4xl mx-auto mb-10 rounded-xl px-6 py-5 text-center"
            style={{
              background: "rgba(212,175,55,0.06)",
              border: "1px solid rgba(212,175,55,0.15)",
            }}
          >
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase mb-1.5" style={{ color: "#D4AF37" }}>
              Recommended for {selectedIndustry.shortName}
            </p>
            <p className="text-[15px] font-semibold" style={{ color: "#ffffff" }}>
              Start with the {selectedIndustry.recommendedPackage?.name}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              {selectedIndustry.summary}
            </p>
          </div>
        ) : null}

        {/* ── Trust strip ── */}
        <TrustStrip />

        {/* ── Pricing cards ── */}
        <StaggeredFadeUp staggerDelay={0.12}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {plans.map((plan) => {
              const isRecommended =
                plan.highlight ||
                selectedIndustry?.recommendedPackage?.name === plan.name;
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
      </div>
    </section>
  );
}