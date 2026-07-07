import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Wallet, ShoppingCart, Zap, Globe, Server, ClipboardCheck } from "lucide-react";
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
    description: "Capture every new inquiry and missed call before leads disappear. The essential response foundation.",
    price: "$497",
    setup: "$797 setup",
    automationCount: 6,
    websiteScope: "Connects to your existing site",
    hostingScope: "Uses your current hosting",
    qaScope: "Launch-Proof QA: lead path + response flow tested",
    automations: [
      "Instant Lead Response (SMS)",
      "Missed-Call Text-Back",
      "Owner Notification",
      "CRM Handoff (where supported)",
      "Basic Follow-Up Path",
      "Lead Capture Form Integration",
    ],
    cta: "Add to Cart",
    packageId: "starter_system",
    highlight: false,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.14)",
    accentBorderHover: "rgba(0,174,239,0.50)",
  },
  {
    name: "Growth",
    title: "Growth System",
    tagline: "Most Popular",
    description: "Automated follow-up, booking handoff, and review systems working together — our most popular package.",
    price: "$997",
    setup: "$1,297 setup",
    automationCount: 11,
    websiteScope: "Connects to your existing site",
    hostingScope: "Uses your current hosting",
    qaScope: "Launch-Proof QA: lead path, response flow, booking handoff + proof logs",
    automations: [
      "Everything in Starter, plus:",
      "14-Day Nurture Sequence (SMS + Email)",
      "AI Booking Agent Handoff",
      "Review Request Engine",
      "Lead Status & Pipeline Tracking",
      "Client Portal Dashboard",
    ],
    cta: "Add to Cart",
    packageId: "growth_system",
    highlight: true,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.55)",
    accentBorderHover: "rgba(0,174,239,0.55)",
  },
  {
    name: "Pro",
    title: "Pro System",
    tagline: "Full Revenue Layer",
    description: "The full revenue operating layer — website, reactivation, reporting, and expanded automation. Done-for-you.",
    price: "$1,997",
    setup: "$2,497 setup",
    automationCount: 16,
    websiteScope: "Full website build & design included",
    hostingScope: "Hosting included for your website",
    qaScope: "Launch-Proof QA + proof logs + priority setup",
    automations: [
      "Everything in Growth, plus:",
      "Full Website Build & Design",
      "Lead Reactivation Engine",
      "Advanced Revenue Reporting",
      "Expanded Automation Stack",
      "Priority Setup & Onboarding",
    ],
    cta: "Add to Cart",
    packageId: "pro_system",
    highlight: false,
    accent: "#003B8F",
    accentBorder: "rgba(0,59,143,0.18)",
    accentBorderHover: "rgba(0,174,239,0.50)",
  },
];

const getPackageCheckoutPath = (packageId) => `/product-signup?package=${encodeURIComponent(packageId)}`;

export default function ThreeSystemsSection() {
  return (
    <section id="pricing" className="nebula-pricing pt-10 md:pt-14 pb-16 md:pb-24 px-6 overflow-visible">
      <style>{`
        .cs-pricing-card {
          min-height: 690px;
          display: flex;
          flex-direction: column;
        }
        @media (max-width: 767px) {
          .cs-pricing-card { min-height: auto; }
        }
        .cs-pricing-glow {
          position: absolute;
          inset: -40px -20px -20px -20px;
          background: radial-gradient(ellipse 80% 60% at 50% 35%, rgba(0,174,239,0.10) 0%, rgba(0,174,239,0.04) 40%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          border-radius: 32px;
        }
        .cs-pricing-cta {
          transition: transform 0.15s ease, box-shadow 0.25s ease;
        }
        .cs-pricing-cta:active {
          transform: scale(0.97);
        }
        .cs-pricing-cta-secondary:hover {
          background: rgba(0,174,239,0.06);
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

        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "Proof Checked Before Launch" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
          ].map(({ Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border" style={{ background: "rgba(0,174,239,0.08)", borderColor: "rgba(0,174,239,0.28)", color: "#00AEEF" }}>
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {text}
            </span>
          ))}
        </div>

        <div className="relative pt-8">
          {/* Improvement 2: Blue radial background glow behind the grid */}
          <div className="cs-pricing-glow" aria-hidden="true" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {PACKAGES.map((pkg) => {
              const isGrowth = pkg.highlight;
              const canHoverLift = !isGrowth;
              return (
                <div key={pkg.name} className="relative flex flex-col">
                  {isGrowth && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <span className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold whitespace-nowrap pricing-badge-pulse" style={{ background: "linear-gradient(135deg, #0079c1, #00AEEF)", color: "#ffffff", boxShadow: "0 4px 18px rgba(0,121,193,0.45)" }}>
                        <Sparkles className="w-3 h-3" /> {pkg.tagline}
                      </span>
                    </div>
                  )}
                  <div
                    className="cs-pricing-card cs-pricing-card-hover rounded-2xl overflow-hidden"
                    data-growth={isGrowth ? "true" : "false"}
                    style={{
                      background: isGrowth ? "linear-gradient(160deg, #f0f9ff 0%, #ffffff 50%)" : "#ffffff",
                      border: isGrowth
                        ? "2px solid rgba(0,174,239,0.55)"
                        : `1.5px solid ${pkg.accentBorder}`,
                      boxShadow: isGrowth
                        ? "0 20px 60px rgba(0,174,239,0.22), 0 0 0 1px rgba(0,174,239,0.1), 0 4px 12px rgba(0,0,0,0.06)"
                        : "0 6px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                      // Improvement 3 & 4: Growth border stays; Starter/Pro hover lights up border + lift
                      ["--hover-border"]: pkg.accentBorderHover,
                    }}
                  >
                    {/* Improvement 5: Premium top accent gradient bar */}
                    <div
                      style={{
                        height: "5px",
                        flexShrink: 0,
                        background: isGrowth
                          ? "linear-gradient(90deg, #003B8F 0%, #0079c1 30%, #00AEEF 60%, #0079c1 100%)"
                          : "linear-gradient(90deg, rgba(0,174,239,0.3) 0%, #00AEEF 50%, rgba(0,174,239,0.3) 100%)",
                        boxShadow: isGrowth ? "0 0 12px rgba(0,174,239,0.4)" : "0 0 8px rgba(0,174,239,0.2)",
                      }}
                    />

                    <div className="p-8 md:p-10 flex flex-col flex-1">
                      {/* Header */}
                      <div className="text-center mb-5">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: pkg.accent }}>
                          {pkg.tagline}
                        </p>
                        <h3 className="font-titles text-black font-bold mb-2" style={{ fontSize: "clamp(1.25rem, 2.2vw, 1.55rem)" }}>
                          {pkg.title}
                        </h3>
                        <p className="text-sm text-foreground/70 leading-relaxed max-w-xs mx-auto">{pkg.description}</p>
                      </div>

                      {/* Improvement 6: Automation/component count chips */}
                      <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,174,239,0.10)", color: "#0079c1", border: "1px solid rgba(0,174,239,0.20)" }}>
                          <Zap className="w-3 h-3" /> {pkg.automationCount} Automations
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(0,59,143,0.08)", color: "#003B8F", border: "1px solid rgba(0,59,143,0.15)" }}>
                          <Globe className="w-3 h-3" /> {pkg.websiteScope.includes("Full") ? "Website Inc." : "No Website"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.10)", color: "#B8941F", border: "1px solid rgba(212,175,55,0.20)" }}>
                          <ClipboardCheck className="w-3 h-3" /> Launch-Proof QA
                        </span>
                      </div>

                      {/* Improvement 7: Automation stack list */}
                      <ul className="space-y-2.5 w-full text-left flex-1 mb-5">
                        {pkg.automations.map((item, idx) => {
                          const isCarried = item.startsWith("Everything in");
                          return (
                            <li key={item} className="flex items-start gap-2.5">
                              <CheckCircle2 aria-hidden="true" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: isCarried ? "#9CA3AF" : pkg.accent, strokeWidth: 2.5 }} />
                              <span className="text-[13px] leading-snug" style={{ color: isCarried ? "#9CA3AF" : "#111318", fontWeight: isCarried ? 600 : 500 }}>
                                {item}
                              </span>
                            </li>
                          );
                        })}
                      </ul>

                      {/* Improvement 8, 9, 10: Explicit website / hosting / QA wording */}
                      <div className="space-y-2 mb-6 text-left">
                        <div className="flex items-start gap-2 text-[12px] text-foreground/75">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary/70" />
                          <span><span className="font-bold">Website:</span> {pkg.websiteScope}</span>
                        </div>
                        <div className="flex items-start gap-2 text-[12px] text-foreground/75">
                          <Server className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary/70" />
                          <span><span className="font-bold">Hosting:</span> {pkg.hostingScope}</span>
                        </div>
                        <div className="flex items-start gap-2 text-[12px] text-foreground/75">
                          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary/70" />
                          <span><span className="font-bold">QA:</span> {pkg.qaScope}</span>
                        </div>
                      </div>

                      {/* Improvement 11: Bottom docked premium price block */}
                      <div
                        className="mt-auto rounded-xl p-5"
                        style={{
                          background: isGrowth ? "linear-gradient(180deg, rgba(0,174,239,0.06) 0%, rgba(0,174,239,0.02) 100%)" : "linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)",
                          border: "1px solid rgba(0,174,239,0.12)",
                        }}
                      >
                        <div className="flex items-end justify-center gap-1.5 mb-1" style={{ lineHeight: 1 }}>
                          <span className="font-extrabold tracking-tight text-black pricing-price-mono" style={{ fontSize: "clamp(1.85rem, 3.5vw, 2.4rem)", letterSpacing: "-0.045em", fontFamily: "'Montserrat', sans-serif" }}>
                            {pkg.price}
                          </span>
                          <span className="text-sm text-foreground/55 font-bold" style={{ paddingBottom: "0.4rem" }}>/mo</span>
                        </div>
                        <p className="text-xs text-foreground/55 font-semibold text-center mb-4">
                          plus {pkg.setup} &middot; month-to-month
                        </p>

                        {/* Improvement 12: Strengthened CTA hierarchy + micro-interactions */}
                        <button
                          type="button"
                          onClick={() => {
                            trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section", { package_id: pkg.packageId });
                            window.location.href = getPackageCheckoutPath(pkg.packageId);
                          }}
                          className="cs-pricing-cta w-full text-center inline-flex items-center justify-center gap-2 rounded-full font-bold text-sm cursor-pointer border-none pricing-press-down"
                          style={isGrowth
                            ? { background: "linear-gradient(90deg, #0079c1, #005691)", color: "#fff", padding: "15px 24px", boxShadow: "0 4px 18px rgba(0,121,193,0.4), 0 0 0 0 rgba(0,174,239,0)" }
                            : { background: "transparent", color: "#0079c1", padding: "14px 24px", border: "1.5px solid rgba(0,174,239,0.35)" }
                          }
                          data-highlight={isGrowth ? "true" : "false"}
                        >
                          <ShoppingCart className="w-4 h-4" /> {pkg.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

      <style>{`
        /* Improvement 3 & 4: Hover only on Starter/Pro — border lights up + lift. Growth stays static. */
        @media (pointer: fine) {
          .cs-pricing-card-hover:not([data-growth="true"]):hover {
            border-color: var(--hover-border) !important;
            transform: translateY(-3px);
            box-shadow: 0 12px 40px rgba(0,174,239,0.15), 0 0 0 1px rgba(0,174,239,0.08), 0 4px 12px rgba(0,0,0,0.06) !important;
          }
          .cs-pricing-cta[data-highlight="false"]:hover {
            box-shadow: 0 4px 18px rgba(0,174,239,0.25) !important;
            border-color: rgba(0,174,239,0.50) !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-pricing-card-hover, .cs-pricing-cta, .pricing-press-down { transition: none !important; }
          .cs-pricing-card-hover:hover { transform: none !important; }
        }
      `}</style>
    </section>
  );
}