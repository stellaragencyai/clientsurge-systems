import { ArrowRight } from "lucide-react";
import { PACKAGE_OFFERS, formatCurrency } from "@/lib/aiProducts";

function GlowingCheck() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0 mt-0.5"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        filter: "drop-shadow(0 0 6px rgba(34,197,94,0.6))",
        animation: "checkPulse 2s ease-in-out infinite",
      }}
    >
      <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
      <path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="nebula-pricing py-24 md:py-32 px-6 overflow-visible">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Pricing & Packages</p>
          <h2 className="font-titles text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
            Buy the exact automation bundle we actually deploy
          </h2>
          <p className="mt-5 text-foreground font-semibold text-base mb-3">
            Every package expands into canonical installable services inside the paid order queue.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Bundle pricing is explicit, deterministic, and aligned with the order-driven setup system used in `/admin`.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {PACKAGE_OFFERS.map((offer) => (
            <PricingCard key={offer.package_key} offer={offer} />
          ))}
        </div>

        <div className="mt-12 max-w-5xl mx-auto rounded-3xl border border-border bg-card/80 p-6 md:p-8 shadow-sm">
          <div className="max-w-2xl mb-6">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What You Are Buying</p>
            <h3 className="font-titles text-2xl md:text-3xl font-bold text-foreground">
              Package name for sales clarity, canonical services for deployment clarity
            </h3>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Buyers see a clean bundle, checkout creates one canonical order, and `/admin` still receives the underlying installable services individually.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Packaged pricing maps directly to actual tracked service installs.",
              "Bundle savings are explicit at checkout, not hidden or manual.",
              "Order.items[] still records the real installable services purchased.",
              "Operators can see package name and included services immediately in /admin.",
              "No shadow pricing model exists outside the canonical checkout path.",
              "Unsupported legacy services are not sold self-serve in this flow.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background px-4 py-4 flex items-start gap-3">
                <GlowingCheck />
                <p className="text-sm text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center max-w-xl mx-auto border-t border-border pt-10">
          <p className="text-foreground font-semibold text-base mb-5">
            Prefer to stack individual services instead? You can still build a custom bundle in the store.
          </p>
          <a
            href="/store"
            className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border-2 border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-200"
          >
            Open Canonical Store
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      <style>{`
        .pricing-card {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.35s ease;
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%);
        }
        .pricing-card:hover {
          border-color: #c8965c !important;
          box-shadow: 0 14px 36px rgba(160, 90, 20, 0.16), 0 2px 10px rgba(0, 0, 0, 0.06) !important;
        }
        @keyframes checkPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(34,197,94,0.6)); }
          50% { filter: drop-shadow(0 0 12px rgba(34,197,94,0.9)); }
        }
      `}</style>
    </section>
  );
}

function PricingCard({ offer }) {
  return (
    <div
      className="pricing-card relative flex flex-col rounded-2xl border p-6 md:p-8 lg:p-10"
      style={{
        border: offer.highlight ? "2px solid rgba(200,150,92,0.4)" : "1.5px solid rgba(154,92,46,0.15)",
        background: offer.highlight
          ? "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%)",
        boxShadow: offer.highlight
          ? "0 8px 30px rgba(160,90,20,0.14), inset 0 1px 0 rgba(255,255,255,0.8)"
          : "0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {offer.badge ? (
        <div className="absolute -top-3 left-6 inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-xl" style={{ background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)" }}>
          {offer.badge}
        </div>
      ) : null}

      <div className="mb-7">
        <h3 className="font-display text-2xl font-semibold text-foreground mb-2">{offer.name}</h3>
        <p className="text-xs font-semibold text-foreground/70 leading-snug">{offer.fit}</p>
      </div>

      <div className="mb-7 pb-7 border-b border-border">
        <div className="flex items-end gap-2 mb-1">
          <span className="text-5xl font-bold text-foreground">${formatCurrency(offer.monthly_total)}</span>
          <span className="text-sm text-muted-foreground mb-2">/month</span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">${formatCurrency(offer.setup_total)} setup</p>
        <p className="text-xs text-muted-foreground text-left">
          Explicit bundle pricing. Compare-at: ${formatCurrency(offer.compare_at_setup)} setup and ${formatCurrency(offer.compare_at_monthly)}/mo a la carte.
        </p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-7">{offer.description}</p>

      <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-green-700">Bundle Savings</p>
        <p className="mt-2 text-sm font-semibold text-green-900">
          Save ${formatCurrency(offer.setup_savings)} setup and ${formatCurrency(offer.monthly_savings)}/mo.
        </p>
      </div>

      <ul className="space-y-3.5 flex-1 mb-9">
        {offer.included_services.map((service) => (
          <li key={service.service_key} className="flex items-start gap-3">
            <GlowingCheck />
            <span className="text-sm text-foreground/75">
              {service.name}
            </span>
          </li>
        ))}
      </ul>

      <a
        href={`/store?package=${offer.package_key}`}
        className="inline-flex items-center justify-center gap-2 h-12 rounded-full border-2 border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-200"
      >
        Load This Bundle in Store
        <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  );
}
