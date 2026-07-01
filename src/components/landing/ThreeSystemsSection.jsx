import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import SectionHeader from "@/components/design-system/SectionHeader";
import IndustryContextBanner from "./IndustryContextBanner";

const PACKAGES = [
  {
    name: "Starter",
    title: "Starter System",
    description: "Best for businesses that need every new inquiry and missed call answered fast before leads disappear.",
    price: "$497",
    setup: "$797 setup",
    includes: ["Lead capture", "Instant SMS response", "Missed-call text-back", "Owner notification", "CRM handoff where supported", "Basic follow-up path"],
    cta: "Start With Starter",
    packageId: "starter_system",
    highlight: false,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.12)",
  },
  {
    name: "Growth",
    title: "Growth System",
    description: "Best for steady lead flow that needs response, follow-up, booking, and review systems working together.",
    price: "$997",
    setup: "$1,297 setup",
    includes: ["Everything in Starter", "Multi-step SMS/email follow-up", "AI booking handoff", "Lead status tracking", "Review request system", "Client dashboard"],
    cta: "Start With Growth",
    packageId: "growth_system",
    highlight: true,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.45)",
  },
  {
    name: "Pro",
    title: "Pro System",
    description: "Best for businesses that want the full revenue operating layer installed and managed.",
    price: "$1,997",
    setup: "$2,497 setup",
    includes: ["Everything in Growth", "Full website build/design", "Lead reactivation", "Advanced reporting", "Priority setup", "Expanded automation stack"],
    cta: "Start With Pro",
    packageId: "pro_system",
    highlight: false,
    accent: "#003B8F",
    accentBorder: "rgba(0,59,143,0.18)",
  },
];

const getPackageCheckoutPath = (packageId) => `/store?package=${encodeURIComponent(packageId)}`;

export default function ThreeSystemsSection() {
  return (
    <section id="pricing" className="nebula-pricing pt-10 md:pt-14 pb-16 md:pb-24 px-6 overflow-visible">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Packaged AI Systems"
          title="Pick the AI System That Matches Your Lead Flow"
          subtitle="Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full lead recovery layer across website, capture, booking, reviews, reactivation, and reporting."
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-5 items-stretch">
          {PACKAGES.map((pkg) => (
            <div key={pkg.name} className="relative flex flex-col" style={{ paddingTop: pkg.highlight ? "32px" : 0 }}>
              {pkg.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold" style={{ background: "linear-gradient(135deg, #0079c1, #005691)", color: "#ffffff", boxShadow: "0 4px 18px rgba(0,121,193,0.45)" }}>
                    <Sparkles className="w-3 h-3" /> Recommended
                  </span>
                </div>
              )}
              <div className="flex flex-col flex-1 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5" style={{ background: pkg.highlight ? "linear-gradient(160deg, #f0f9ff 0%, #ffffff 50%)" : "#ffffff", border: pkg.highlight ? "2px solid rgba(0,174,239,0.55)" : `1.5px solid ${pkg.accentBorder}`, boxShadow: pkg.highlight ? "0 20px 60px rgba(0,174,239,0.22), 0 0 0 1px rgba(0,174,239,0.1), 0 4px 12px rgba(0,0,0,0.06)" : "0 6px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)", minHeight: "580px" }}>
                {pkg.highlight && <div style={{ height: "4px", background: "linear-gradient(90deg, #0079c1, #00AEEF)", flexShrink: 0 }} />}
                <div className="p-9 md:p-11 flex flex-col flex-1 items-center text-center">
                  <h3 className="font-titles text-black font-bold mb-3 mt-3" style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)" }}>{pkg.title}</h3>
                  <p className="text-sm text-foreground/80 mb-8 leading-relaxed">{pkg.description}</p>
                  <ul className="space-y-4 w-full text-left flex-1 mb-8">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 aria-hidden="true" className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: pkg.accent, strokeWidth: 2.5 }} />
                        <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mb-7 w-full pt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="font-extrabold tracking-tight text-black" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)" }}>{pkg.price}</span>
                      <span className="text-sm text-foreground/60 font-semibold">/mo</span>
                    </div>
                    <p className="text-xs text-foreground/70 mt-2">{pkg.setup}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section", { package_id: pkg.packageId });
                      window.location.href = getPackageCheckoutPath(pkg.packageId);
                    }}
                    className="w-full text-center inline-flex items-center justify-center gap-2 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer border-none"
                    style={pkg.highlight ? { background: "linear-gradient(90deg, #0079c1, #005691)", color: "#fff", padding: "14px 24px", boxShadow: "0 4px 18px rgba(0,121,193,0.4)" } : { background: "transparent", color: "#0079c1", padding: "13px 24px", border: "1.5px solid rgba(0,174,239,0.35)" }}
                  >
                    {pkg.cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10 mb-2">
          <p className="text-sm text-foreground/85 max-w-2xl mx-auto leading-relaxed">
            <strong>Not sure which system fits?</strong> Most service businesses start with Growth because it adds nurture and booking to the response foundation.
          </p>
        </div>

        <MoneyBackGuarantee />

        <div className="text-center mt-6 space-y-4">
          <Link to="/pricing" onClick={() => trackCTA("compare_packages", "three_systems_section")} className="cs-btn-primary inline-flex">
            Compare Packages <ArrowRight className="w-4 h-4 inline ml-1" />
          </Link>
          <div>
            <Link to="/automations" onClick={() => trackCTA("view_automations", "three_systems_section")} className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
              View Automation Stack
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-foreground/70 mt-6 mx-auto" style={{ maxWidth: "420px" }}>
          All packages include done-for-you setup. No long-term contracts. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
