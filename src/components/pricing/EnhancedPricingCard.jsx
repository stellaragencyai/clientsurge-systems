import { CheckCircle2, ShoppingCart, Zap, Rocket, Crown } from "lucide-react";
import { trackCTA } from "@/lib/analytics";

const TIER_ICONS = {
  starter_system: Zap,
  growth_system: Rocket,
  pro_system: Crown,
};

const TIER_ACCENTS = {
  starter_system: "#0079c1",
  growth_system: "#00AEEF",
  pro_system: "#D4AF37",
};

const TIER_VALUE_PRICES = {
  starter_system: "$1,497",
  growth_system: "$2,997",
  pro_system: "$5,997",
};

const packageReviewHref = (packageKey) => `/store?package=${encodeURIComponent(packageKey)}`;

export default function EnhancedPricingCard({ pkg, index }) {
  const highlight = Boolean(pkg.badge);
  const Icon = TIER_ICONS[pkg.key] || Zap;
  const accent = TIER_ACCENTS[pkg.key] || "#0079c1";
  const valuePrice = TIER_VALUE_PRICES[pkg.key];

  return (
    <article
      className={`pricing-card-glassmorphism pricing-card-stagger relative flex flex-col overflow-hidden ${highlight ? "pricing-gradient-border" : ""}`}
      style={{ animationDelay: `${index * 0.15}s` }}
    >
      {/* Top accent glow bar */}
      <div
        className="pricing-accent-bar"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, color: accent }}
      />

      {/* Best Value Ribbon */}
      {pkg.badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
          <span className="pricing-badge-pulse inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md">
            ✦ {pkg.badge}
          </span>
        </div>
      )}

      <div className="p-7 flex flex-col flex-1" style={{ paddingTop: "32px" }}>
        {/* Tier icon badge */}
        <div className="flex items-center justify-center mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${accent}15, ${accent}08)`, border: `1px solid ${accent}30` }}
          >
            <Icon className="w-6 h-6" style={{ color: accent }} />
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{pkg.problem}</p>
        <h2 className="font-titles text-xl font-bold text-foreground mb-2">{pkg.name}</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{pkg.promise}</p>

        {/* Refined Pricing Hierarchy with value strikethrough */}
        <div className="mb-6">
          {valuePrice && (
            <p className="text-xs text-muted-foreground/50 line-through mb-0.5 font-medium">{valuePrice}/mo value</p>
          )}
          <div className="flex items-baseline gap-1">
            <span className="pricing-price-mono text-4xl font-extrabold text-foreground">{pkg.monthly}</span>
            <span className="text-xs text-muted-foreground font-medium">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{pkg.setup} one-time setup</p>
        </div>

        {/* Feature list with premium checkmarks */}
        <ul className="space-y-3 mb-8 flex-1">
          {pkg.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 group transition-colors duration-200">
              <div
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${accent}12` }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
              <span className="text-sm text-foreground/75 transition-colors duration-200 group-hover:text-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA with press-down micro-interaction */}
        <a
          href={packageReviewHref(pkg.key)}
          onClick={() => trackCTA(`package_${pkg.key}`, "pricing_page")}
          className={`pricing-press-down ${highlight ? "cs-btn-primary cs-cta-glow" : "cs-btn-primary"} w-full text-center justify-center no-underline`}
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <ShoppingCart className="w-4 h-4 mr-1.5" /> {pkg.cta}
        </a>
      </div>
    </article>
  );
}