import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Wallet,
  ShoppingCart,
  Zap,
  Globe,
  Server,
  ClipboardCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import CSButton from "@/components/design-system/CSButton";
import IndustryContextBanner from "./IndustryContextBanner";

const PACKAGES = [
  {
    name: "Starter",
    title: "Starter System",
    tagline: "Response Foundation",
    subtitle: "Best for businesses that need instant response and missed-call recovery first.",
    description: "Capture every new inquiry and missed call before leads disappear. The essential response foundation.",
    featureIntro: "Start with the two response automations that stop new leads and missed calls from going cold.",
    price: "$497",
    setupPrice: "$797",
    automationCount: 2,
    websiteScope: "Connects to your existing site",
    hostingScope: "Uses your current hosting",
    qaScope: "Launch-Proof QA: lead path + response flow tested",
    automations: [
      "Instant Lead Response",
      "Missed-Call Text-Back",
    ],
    cta: "Add to Cart",
    packageId: "starter_system",
    highlight: false,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.20)",
    accentBorderHover: "rgba(0,174,239,0.55)",
  },
  {
    name: "Growth",
    title: "Growth System",
    tagline: "Most Popular",
    subtitle: "Best for steady lead flow that needs response, recovery, nurture, and booking.",
    description: "Automated follow-up and booking handoff working together — our most popular package.",
    featureIntro: "Includes the Starter automations, then adds nurture and booking handoff.",
    price: "$997",
    setupPrice: "$1,297",
    automationCount: 4,
    websiteScope: "Connects to your existing site",
    hostingScope: "Uses your current hosting",
    qaScope: "Launch-Proof QA: lead path, response flow, booking handoff + proof logs",
    automations: [
      "Instant Lead Response",
      "Missed-Call Text-Back",
      "14-Day Nurture Sequence",
      "AI Booking Agent Handoff",
    ],
    cta: "Add to Cart",
    packageId: "growth_system",
    highlight: true,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.58)",
    accentBorderHover: "rgba(0,174,239,0.58)",
  },
  {
    name: "Pro",
    title: "Pro System",
    tagline: "Full Revenue Layer",
    subtitle: "Best for teams that want the full response, reactivation, review, and website layer.",
    description: "The full revenue operating layer — website, reactivation, reviews, reporting, and expanded automation. Done-for-you.",
    featureIntro: "Includes the Growth automations, then adds reactivation and review automation.",
    price: "$1,997",
    setupPrice: "$2,497",
    automationCount: 6,
    websiteScope: "Full website build & design included",
    hostingScope: "Hosting included for your website",
    qaScope: "Launch-Proof QA + proof logs + priority setup",
    automations: [
      "Instant Lead Response",
      "Missed-Call Text-Back",
      "14-Day Nurture Sequence",
      "AI Booking Agent Handoff",
      "Lead Reactivation Engine",
      "Review Request Automation",
    ],
    cta: "Add to Cart",
    packageId: "pro_system",
    highlight: false,
    accent: "#003B8F",
    accentBorder: "rgba(0,59,143,0.18)",
    accentBorderHover: "rgba(0,174,239,0.55)",
  },
];

const ASSURANCE_PILLS = [
  { Icon: ShieldCheck, text: "Secure Stripe checkout" },
  { Icon: Wallet, text: "No lock-in contracts" },
  { Icon: CheckCircle2, text: "Proof checked before launch" },
  { Icon: Zap, text: "SMS + email included" },
  { Icon: ClipboardCheck, text: "Fully managed setup" },
];

const getPackageCheckoutPath = (packageId) => `/product-signup?package=${encodeURIComponent(packageId)}`;

export default function ThreeSystemsSection() {
  return (
    <section id="pricing" className="nebula-pricing pt-10 md:pt-14 pb-16 md:pb-24 px-5 sm:px-6 overflow-visible">
      <style>{`
        .nebula-pricing {
          background:
            radial-gradient(circle at 50% 15%, rgba(0,174,239,0.12), transparent 30%),
            linear-gradient(180deg, #f8fdff 0%, #f3fbff 54%, #ffffff 100%);
        }
        .cs-pricing-card {
          min-height: 820px;
          display: flex;
          flex-direction: column;
          border-radius: 28px;
          overflow: hidden;
          font-family: 'Montserrat', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .cs-pricing-card-inner {
          min-height: 100%;
          display: flex;
          flex: 1;
          flex-direction: column;
          padding: 46px 36px 34px;
        }
        .cs-pricing-copy-zone {
          min-height: 190px;
        }
        .cs-pricing-title {
          margin: 0;
          color: #06122b;
          font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
          font-size: clamp(1.55rem, 2.35vw, 1.9rem);
          font-weight: 900;
          line-height: 1.03;
          letter-spacing: -0.055em;
        }
        .cs-pricing-popular-line {
          margin-top: 12px;
          color: #0095d9;
          font-size: 0.86rem;
          font-weight: 900;
          line-height: 1;
        }
        .cs-pricing-subtitle {
          margin: 14px 0 0;
          max-width: 310px;
          color: #53637c;
          font-size: 0.92rem;
          font-weight: 750;
          line-height: 1.45;
        }
        .cs-pricing-description {
          margin: 30px 0 0;
          max-width: 318px;
          color: #52627a;
          font-size: 0.98rem;
          font-weight: 600;
          line-height: 1.62;
        }
        .cs-pricing-price-zone {
          min-height: 128px;
          margin-top: 4px;
        }
        .cs-pricing-price-row {
          display: flex;
          align-items: flex-end;
          gap: 9px;
          line-height: 1;
        }
        .cs-pricing-price {
          color: #06122b;
          font-family: 'Montserrat', 'Inter', system-ui, sans-serif;
          font-size: clamp(2.85rem, 4.7vw, 3.45rem);
          font-weight: 950;
          line-height: 0.94;
          letter-spacing: -0.072em;
        }
        .cs-pricing-period {
          padding-bottom: 0.45rem;
          color: #60718f;
          font-size: 0.88rem;
          font-weight: 850;
          letter-spacing: -0.02em;
        }
        .cs-pricing-setup-pill {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          margin-top: 14px;
          border: 1px solid rgba(0,174,239,0.22);
          border-radius: 999px;
          background: rgba(0,174,239,0.10);
          padding: 6px 14px;
          color: #0079c1;
          font-size: 0.78rem;
          font-weight: 900;
          line-height: 1;
        }
        .cs-pricing-contract {
          margin-top: 13px;
          color: #61718f;
          font-size: 0.78rem;
          font-weight: 650;
          line-height: 1.35;
        }
        .cs-pricing-divider {
          margin: 30px 0 28px;
          height: 1px;
          width: 100%;
          background: rgba(0,174,239,0.14);
        }
        .cs-pricing-feature-intro {
          min-height: 68px;
          color: #52627a;
          font-size: 0.98rem;
          font-weight: 650;
          line-height: 1.62;
        }
        .cs-pricing-feature-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin: 28px 0 0;
          padding: 0;
          list-style: none;
        }
        .cs-pricing-feature-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          min-height: 22px;
          color: #506078;
          font-size: 0.93rem;
          font-weight: 650;
          line-height: 1.42;
        }
        .cs-pricing-feature-row svg {
          width: 16px;
          height: 16px;
          flex: 0 0 16px;
          margin-top: 2px;
        }
        .cs-pricing-ops {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px solid rgba(0,174,239,0.12);
        }
        .cs-pricing-ops-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: #5a6983;
          font-size: 0.765rem;
          font-weight: 600;
          line-height: 1.48;
        }
        .cs-pricing-ops-row svg {
          width: 14px;
          height: 14px;
          flex: 0 0 14px;
          margin-top: 2px;
          color: #00AEEF;
        }
        .cs-pricing-card-footer {
          margin-top: auto;
          padding-top: 34px;
        }
        .cs-pricing-cta {
          height: 54px;
          width: 100%;
          transition: transform 0.15s ease, box-shadow 0.25s ease, background 0.25s ease, border-color 0.25s ease;
        }
        .cs-pricing-cta:active {
          transform: scale(0.97);
        }
        .cs-pricing-footer-note {
          margin-top: 16px;
          color: #64748b;
          font-size: 0.76rem;
          font-weight: 650;
          line-height: 1.35;
          text-align: center;
        }
        .cs-pricing-glow {
          position: absolute;
          inset: -55px -24px -20px;
          background: radial-gradient(ellipse 78% 58% at 50% 36%, rgba(0,174,239,0.13) 0%, rgba(0,174,239,0.05) 42%, transparent 72%);
          pointer-events: none;
          z-index: 0;
          border-radius: 38px;
        }
        @media (min-width: 1024px) {
          .cs-pricing-card {
            min-height: 850px;
          }
          .cs-pricing-feature-list {
            gap: 20px;
          }
        }
        @media (max-width: 1023px) {
          .cs-pricing-card-inner {
            padding: 42px 32px 32px;
          }
          .cs-pricing-copy-zone,
          .cs-pricing-price-zone,
          .cs-pricing-feature-intro {
            min-height: auto;
          }
        }
        @media (max-width: 767px) {
          .cs-pricing-card {
            min-height: auto;
          }
        }
        @media (pointer: fine) {
          .cs-pricing-card-hover:not([data-growth="true"]):hover {
            border-color: var(--hover-border) !important;
            transform: translateY(-4px);
            box-shadow: 0 18px 46px rgba(0,174,239,0.14), 0 0 0 1px rgba(0,174,239,0.09), 0 6px 14px rgba(0,0,0,0.05) !important;
          }
          .cs-pricing-cta[data-highlight="false"]:hover {
            box-shadow: 0 8px 22px rgba(0,174,239,0.18) !important;
            border-color: rgba(0,174,239,0.55) !important;
            background: rgba(0,174,239,0.055) !important;
          }
          .cs-pricing-cta[data-highlight="true"]:hover {
            transform: translateY(-2px);
            box-shadow: 0 16px 34px rgba(0,92,170,0.34), 0 0 0 1px rgba(0,174,239,0.10) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-pricing-card-hover,
          .cs-pricing-cta {
            transition: none !important;
          }
          .cs-pricing-card-hover:hover,
          .cs-pricing-cta:hover {
            transform: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <CSSectionHeader
          eyebrow="AI Systems Storefront"
          title="Pick Your AI System — Add to Cart and Check Out"
          subtitle="Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full lead recovery layer. No demos, no sales calls — just add to cart and we handle the rest."
          align="center"
        />

        <IndustryContextBanner />

        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Nothing goes live until the lead path, response flow, booking handoff, and proof logs are tested.
          </p>
        </div>

        <div className="relative pt-8">
          <div className="cs-pricing-glow" aria-hidden="true" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {PACKAGES.map((pkg) => {
              const isGrowth = pkg.highlight;
              return (
                <div key={pkg.name} className="relative flex flex-col">
                  {isGrowth && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-black whitespace-nowrap"
                        style={{
                          background: "linear-gradient(135deg, #00AEEF 0%, #005bb8 100%)",
                          color: "#ffffff",
                          boxShadow: "0 10px 28px rgba(0,121,193,0.36)",
                          letterSpacing: "0.01em",
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Most Popular
                      </span>
                    </div>
                  )}

                  <div
                    className="cs-pricing-card cs-pricing-card-hover"
                    data-growth={isGrowth ? "true" : "false"}
                    style={{
                      background: isGrowth
                        ? "linear-gradient(155deg, #f0fbff 0%, #eaf8ff 46%, #f9fdff 100%)"
                        : "linear-gradient(155deg, #ffffff 0%, #f8fcff 100%)",
                      border: isGrowth
                        ? "2px solid rgba(0,174,239,0.60)"
                        : `1.5px solid ${pkg.accentBorder}`,
                      boxShadow: isGrowth
                        ? "0 24px 72px rgba(0,174,239,0.20), 0 0 0 1px rgba(0,174,239,0.09), 0 8px 18px rgba(2,8,23,0.05)"
                        : "0 14px 44px rgba(15,23,42,0.055), 0 2px 8px rgba(15,23,42,0.035)",
                      ["--hover-border"]: pkg.accentBorderHover,
                    }}
                  >
                    <div className="cs-pricing-card-inner">
                      <div className="cs-pricing-copy-zone">
                        <h3 className="cs-pricing-title">{pkg.title}</h3>
                        {isGrowth && <p className="cs-pricing-popular-line">Most Popular</p>}
                        <p className="cs-pricing-subtitle">{pkg.subtitle}</p>
                        <p className="cs-pricing-description">{pkg.description}</p>
                      </div>

                      <div className="cs-pricing-price-zone">
                        <div className="cs-pricing-price-row" aria-label={`${pkg.price} per month`}>
                          <span className="cs-pricing-price">{pkg.price}</span>
                          <span className="cs-pricing-period">/month</span>
                        </div>
                        <div className="cs-pricing-setup-pill">{pkg.setupPrice} one-time setup</div>
                        <p className="cs-pricing-contract">No long-term contracts. Cancel anytime.</p>
                      </div>

                      <div className="cs-pricing-divider" aria-hidden="true" />

                      <div className="cs-pricing-feature-intro">
                        {pkg.featureIntro}
                      </div>

                      <ul className="cs-pricing-feature-list">
                        {pkg.automations.map((item) => (
                          <li key={item} className="cs-pricing-feature-row">
                            <CheckCircle2
                              aria-hidden="true"
                              style={{ color: "#22C55E", strokeWidth: 2.6 }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="cs-pricing-ops">
                        <div className="cs-pricing-ops-row">
                          <Zap aria-hidden="true" />
                          <span><strong>{pkg.automationCount} automations</strong> included in this system.</span>
                        </div>
                        <div className="cs-pricing-ops-row">
                          <Globe aria-hidden="true" />
                          <span><strong>Website:</strong> {pkg.websiteScope}</span>
                        </div>
                        <div className="cs-pricing-ops-row">
                          <Server aria-hidden="true" />
                          <span><strong>Hosting:</strong> {pkg.hostingScope}</span>
                        </div>
                        <div className="cs-pricing-ops-row">
                          <ShieldCheck aria-hidden="true" />
                          <span><strong>QA:</strong> {pkg.qaScope}</span>
                        </div>
                      </div>

                      <div className="cs-pricing-card-footer">
                        <button
                          type="button"
                          onClick={() => {
                            trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section", { package_id: pkg.packageId });
                            window.location.href = getPackageCheckoutPath(pkg.packageId);
                          }}
                          className="cs-pricing-cta inline-flex items-center justify-center gap-2 rounded-full font-black text-sm cursor-pointer"
                          style={isGrowth
                            ? {
                                background: "linear-gradient(90deg, #0095d9 0%, #005bb8 100%)",
                                color: "#fff",
                                border: "1px solid rgba(0,91,184,0.15)",
                                boxShadow: "0 14px 32px rgba(0,92,170,0.28)",
                              }
                            : {
                                background: "rgba(255,255,255,0.72)",
                                color: "#0079c1",
                                border: "1.5px solid rgba(0,174,239,0.35)",
                                boxShadow: "0 8px 22px rgba(15,23,42,0.035)",
                              }
                          }
                          data-highlight={isGrowth ? "true" : "false"}
                        >
                          <ShoppingCart className="w-4 h-4" /> {pkg.cta}
                        </button>
                        <p className="cs-pricing-footer-note">
                          {pkg.setupPrice} setup &middot; {pkg.price}/mo &middot; cancel anytime
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {ASSURANCE_PILLS.map(({ Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black"
              style={{
                background: "rgba(0,174,239,0.075)",
                borderColor: "rgba(0,174,239,0.22)",
                color: "#0079c1",
              }}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {text}
            </span>
          ))}
        </div>

        <div className="text-center mt-10 mb-2">
          <p className="text-sm text-foreground/85 max-w-2xl mx-auto leading-relaxed">
            <strong>Not sure which system fits?</strong> Most service businesses start with Growth because it adds nurture and booking to the response foundation.
          </p>
        </div>

        <MoneyBackGuarantee />

        <div className="text-center mt-6 space-y-4">
          <CSButton
            to="/store"
            variant="primary"
            size="md"
            iconRight={ArrowRight}
            onClick={() => trackCTA("browse_automation_store", "three_systems_section")}
          >
            Browse the Automation Store
          </CSButton>
          <div>
            <Link to="/automations" onClick={() => trackCTA("view_automations", "three_systems_section")} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
              View Automation Stack
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/70 mt-6 mx-auto" style={{ maxWidth: "420px" }}>
          All packages include done-for-you setup. No long-term contracts. Cancel anytime. Secure checkout via Stripe.
        </p>
      </div>
    </section>
  );
}
