import { useState, useEffect } from "react";
import { CheckCircle2, ShieldCheck, Wallet, ShoppingCart, ArrowRight, Sparkles, X } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "@/components/landing/MoneyBackGuarantee";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";
import ScarcityBadge from "@/components/pricing/ScarcityBadge";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";

const PACKAGES = [
  {
    key: "starter_system",
    name: "Starter System",
    setup: "$797",
    monthly: "$497",
    problem: "We miss calls or reply too late.",
    promise: "Lead capture, instant response, and missed-call recovery installed first.",
    features: ["Instant lead response", "Missed-call text-back", "Lead capture foundation", "Owner notification", "Remote setup workflow"],
    cta: "Review Starter System",
  },
  {
    key: "growth_system",
    name: "Growth System",
    badge: "Recommended",
    setup: "$1,297",
    monthly: "$997",
    problem: "We need follow-up and booking handled.",
    promise: "Response, nurture, booking, and lead status tracking working together.",
    features: ["Everything in Starter", "14-day SMS/email nurture", "AI booking handoff", "Lead status tracking", "Testing workflow"],
    cta: "Review Growth System",
  },
  {
    key: "pro_system",
    name: "Pro System",
    setup: "$2,497",
    monthly: "$1,997",
    problem: "We want the full lead recovery layer.",
    promise: "The complete system for response, booking, reviews, reactivation, reporting, and priority setup.",
    features: ["Everything in Growth", "Lead reactivation", "Review automation", "Advanced reporting", "Priority launch support"],
    cta: "Review Pro System",
  },
];

const PROCESS_STEPS = ["Choose System", "Guided Intake", "Access Checklist", "Configuration", "Testing", "Launch Review"];
const packageReviewHref = (packageKey) => `/store?package=${encodeURIComponent(packageKey)}`;

export default function PricingPageContent() {
  const [industryName, setIndustryName] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.shortName) setIndustryName(parsed.shortName);
      }
    } catch {}
  }, []);

  const dismissIndustry = () => setIndustryName(null);

  return (
    <div className="min-h-screen bg-background">
      {industryName && (
        <div className="mx-auto max-w-3xl mt-4 px-6">
          <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground/80 flex-1">
              Based on your <strong className="text-foreground">{industryName}</strong> selection — we've highlighted the recommended system below.
            </p>
            <button onClick={dismissIndustry} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <section className="pt-[calc(var(--cs-nav-height)+3rem)] pb-12 px-6 text-center">
        <div className="cs-section-header cs-section-header--center mb-6">
          <p className="cs-section-eyebrow">ClientSurge AI Systems</p>
          <div className="cs-section-title-row cs-section-header--center">
            <span className="cs-section-bar" />
            <h1 className="cs-section-title">Choose the System That Fixes Your Biggest Lead Flow Gap</h1>
          </div>
          <p className="cs-section-subtitle">
            Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full recovery layer across
            reviews, reactivation, reporting, and priority setup.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "Proof Checked Before Launch" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
          ].map(({ Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary cs-glow-card" style={{ border: "1px solid rgba(0,174,239,0.25)" }}>
              <Icon className="h-3.5 w-3.5" /> {text}
            </span>
          ))}
        </div>
        {/* Finding #93: Urgency/scarcity trigger */}
        <div className="flex justify-center mb-6">
          <ScarcityBadge />
        </div>
        <CheckoutProgress currentStep="compare" className="mt-6" />
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pricing-cards-grid">
          {PACKAGES.map((pkg) => {
            const highlight = Boolean(pkg.badge);
            return (
              <article key={pkg.key} className={`cs-glow-card relative flex flex-col ${highlight ? "ring-2 ring-primary/40" : ""}`}>
                {pkg.badge && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10"><span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">✦ {pkg.badge}</span></div>}
                <div className="p-7 flex flex-col flex-1" style={{ paddingTop: "32px" }}>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{pkg.problem}</p>
                  <h2 className="font-titles text-xl font-bold text-foreground mb-2">{pkg.name}</h2>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{pkg.promise}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold text-foreground">{pkg.monthly}</span><span className="text-sm text-muted-foreground font-semibold">/mo</span>
                    <p className="text-xs text-muted-foreground mt-1">{pkg.setup} one-time setup</p>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" /><span className="text-sm text-foreground/85">{feature}</span></li>
                    ))}
                  </ul>
                  <a
                    href={packageReviewHref(pkg.key)}
                    onClick={() => trackCTA(`package_${pkg.key}`, "pricing_page")}
                    className={`${highlight ? "cs-btn-primary cs-cta-glow" : "cs-btn-primary"} w-full text-center justify-center no-underline`}
                    style={{ minHeight: "unset", minWidth: "unset" }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1.5" /> {pkg.cta}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground"><strong>Not sure?</strong> <a href="/book" onClick={() => trackCTA("guided_chooser_pricing", "pricing_page")} className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80">Get help choosing</a> and we will recommend the right starting point.</p>
        </div>
        <MoneyBackGuarantee />
      </section>

      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="cs-glow-card p-8 md:p-10 text-center">
          <div className="cs-section-header cs-section-header--center mb-8">
            <div className="cs-section-title-row cs-section-header--center">
              <span className="cs-section-bar" />
              <h2 className="cs-section-title">What Happens After You Choose</h2>
            </div>
            <p className="cs-section-subtitle">
              After checkout, ClientSurge collects your business details, lead sources, phone and email requirements,
              booking links, CRM access, and launch goals through guided intake. Then we configure, test, and launch
              your selected system with proof before go-live.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-foreground">{step}</div>
                {i < PROCESS_STEPS.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}