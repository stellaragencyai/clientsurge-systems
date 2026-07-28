import { useState, useEffect } from "react";
import { CheckCircle2, ShieldCheck, Wallet, ArrowRight, Sparkles, X } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "@/components/landing/MoneyBackGuarantee";
import Breadcrumb from "@/components/seo/Breadcrumb";
import CheckoutProgress from "@/components/checkout/CheckoutProgress";
import ScarcityBadge from "@/components/pricing/ScarcityBadge";
import EnhancedPricingCard from "@/components/pricing/EnhancedPricingCard";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import { PACKAGE_OFFERS, IMPLEMENTATION_INCLUSIONS, IMPLEMENTATION_LABEL } from "@/lib/salesCatalog";

const PACKAGE_COPY = {
  starter_system: {
    problem: "We miss calls or reply too late.",
    promise: "Lead capture, instant response, and missed-call recovery installed first.",
    cta: "Choose Starter System",
  },
  growth_system: {
    problem: "We need follow-up and booking handled.",
    promise: "Response, nurture, booking, and lead status tracking working together.",
    cta: "Choose Growth System",
  },
  pro_system: {
    problem: "We want the full lead recovery layer.",
    promise: "The complete system for response, booking, reviews, reactivation, reporting, and priority setup.",
    cta: "Choose Pro System",
  },
};

const PACKAGES = PACKAGE_OFFERS.filter((offer) => offer.checkout_enabled).map((offer) => ({
  key: offer.package_key,
  name: offer.name,
  badge: offer.badge,
  setup: `$${Number(offer.setup_total).toLocaleString()}`,
  monthly: `$${Number(offer.monthly_total).toLocaleString()}`,
  problem: PACKAGE_COPY[offer.package_key]?.problem || offer.fit,
  promise: PACKAGE_COPY[offer.package_key]?.promise || offer.description,
  features: offer.features,
  cta: PACKAGE_COPY[offer.package_key]?.cta || `Choose ${offer.name}`,
}));

const PROCESS_STEPS = ["Choose System", "Guided Intake", "Access Checklist", "Configuration", "Testing", "Launch Review"];

export default function PricingPageContent() {
  const [industryName, setIndustryName] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.shortName) setIndustryName(parsed.shortName);
    } catch {}
  }, []);

  const dismissIndustry = () => setIndustryName(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 pt-[calc(var(--cs-nav-height)+1rem)]">
        <Breadcrumb items={[{ label: "Pricing", path: "/pricing" }]} />
      </div>
      {industryName && (
        <div className="mx-auto max-w-3xl mt-4 px-6">
          <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground/80 flex-1">
              Based on your <strong className="text-foreground">{industryName}</strong> selection — compare the systems below and choose the closest starting point.
            </p>
            <button onClick={dismissIndustry} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Dismiss industry notice">
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
        <div className="flex justify-center mb-6">
          <ScarcityBadge />
        </div>
        <CheckoutProgress currentStep="compare" className="mt-6" />
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pricing-cards-grid">
          {PACKAGES.map((pkg, index) => (
            <EnhancedPricingCard key={pkg.key} pkg={pkg} index={index} />
          ))}
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground"><strong>Not sure?</strong> <a href="/contact" onClick={() => trackCTA("guided_chooser_pricing", "pricing_page")} className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80">Contact ClientSurge</a> and we will recommend the right starting point.</p>
        </div>
        <MoneyBackGuarantee />
      </section>

      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="cs-glow-card p-8 md:p-10">
          <div className="cs-section-header cs-section-header--center mb-8">
            <p className="cs-section-eyebrow">Required with every system</p>
            <div className="cs-section-title-row cs-section-header--center">
              <span className="cs-section-bar" />
              <h2 className="cs-section-title">{IMPLEMENTATION_LABEL} (One-Time)</h2>
            </div>
            <p className="cs-section-subtitle">
              Every package includes a one-time Professional AI Implementation fee so our team can configure,
              integrate, test, and launch your AI system. It is automatically added at checkout based on your
              selected system and cannot be removed — it is not sold as a standalone product.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {IMPLEMENTATION_INCLUSIONS.map((item) => (
              <div key={item} className="flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-sm text-foreground/80">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-semibold text-primary">Launch: $249 one-time</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-semibold text-primary">Growth: $499 one-time</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 font-semibold text-primary">Pro: $999 one-time</span>
          </div>
        </div>
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