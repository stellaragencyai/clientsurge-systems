import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import SectionHeader from "@/components/design-system/SectionHeader";
import IndustryContextBanner from "./IndustryContextBanner";

const CHECK_GREEN = "#16A34A";
const CHECK_GREEN_BG = "rgba(22, 163, 74, 0.1)";

const PACKAGES = [
  {
    name: "Starter",
    title: "Starter System",
    layer: "Response Foundation",
    description: "Best for businesses that need every new inquiry and missed call answered fast before leads disappear.",
    price: "$497",
    setup: "$797",
    includes: ["Lead capture", "Instant SMS response", "Missed-call text-back", "Owner notification", "CRM handoff where supported", "Basic follow-up path"],
    cta: "Start With Starter",
    packageId: "starter_system",
    highlight: false,
    accent: "#0EA5E9",
    accentDark: "#0369A1",
    accentSoft: "rgba(14, 165, 233, 0.08)",
    accentBorder: "rgba(14,165,233,0.2)",
  },
  {
    name: "Growth",
    title: "Growth System",
    layer: "Growth Engine",
    description: "Best for steady lead flow that needs response, follow-up, booking, and review systems working together.",
    price: "$997",
    setup: "$1,297",
    includes: ["Everything in Starter", "Multi-step SMS/email follow-up", "AI booking handoff", "Lead status tracking", "Review request system", "Client dashboard"],
    cta: "Start With Growth",
    packageId: "growth_system",
    highlight: true,
    accent: "#00AEEF",
    accentDark: "#005691",
    accentSoft: "rgba(0,174,239,0.1)",
    accentBorder: "rgba(0,174,239,0.45)",
  },
  {
    name: "Pro",
    title: "Pro System",
    layer: "Revenue Operating Layer",
    description: "Best for businesses that want the full revenue operating layer installed and managed.",
    price: "$1,997",
    setup: "$2,497",
    includes: ["Everything in Growth", "Full website build/design", "Lead reactivation", "Advanced reporting", "Priority setup", "Expanded automation stack"],
    cta: "Start With Pro",
    packageId: "pro_system",
    highlight: false,
    accent: "#1D4ED8",
    accentDark: "#0F172A",
    accentSoft: "rgba(15, 23, 42, 0.06)",
    accentBorder: "rgba(15,23,42,0.16)",
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
              <div className="flex flex-col flex-1 rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5" style={{ background: pkg.highlight ? "linear-gradient(160deg, #f0f9ff 0%, #ffffff 48%, #f8fbff 100%)" : "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)", border: pkg.highlight ? "2px solid rgba(0,174,239,0.55)" : `1.5px solid ${pkg.accentBorder}`, boxShadow: pkg.highlight ? "0 24px 70px rgba(0,174,239,0.22), 0 0 0 1px rgba(0,174,239,0.1), 0 4px 12px rgba(0,0,0,0.06)" : "0 10px 32px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)", minHeight: "600px" }}>
                <div style={{ height: "4px", background: pkg.highlight ? "linear-gradient(90deg, #0079c1, #00AEEF)" : `linear-gradient(90deg, ${pkg.accent}, transparent)`, flexShrink: 0 }} />
                <div className="p-9 md:p-11 flex flex-col flex-1 items-center text-center">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ background: pkg.accentSoft, border: `1px solid ${pkg.accentBorder}`, color: pkg.accentDark }}>
                    {pkg.layer}
                  </span>
                  <h3 className="font-titles font-bold mb-3" style={{ color: "#0F172A", fontSize: "clamp(1.22rem, 2vw, 1.55rem)" }}>{pkg.title}</h3>
                  <p className="text-sm text-foreground/80 mb-8 leading-relaxed">{pkg.description}</p>

                  <div className="mb-7 w-full rounded-3xl p-5 text-left" style={{ background: pkg.highlight ? "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,249,255,0.92))" : "linear-gradient(180deg, #ffffff, rgba(248,250,252,0.92))", border: `1px solid ${pkg.accentBorder}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 24px rgba(15,23,42,0.05)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/50">Monthly plan</p>
                        <div className="flex items-end gap-1.5 mt-1.5">
                          <span className="font-extrabold tracking-tight" style={{ color: pkg.accentDark, fontSize: "clamp(1.85rem, 3.2vw, 2.25rem)", lineHeight: 1 }}>{pkg.price}</span>
                          <span className="text-xs text-foreground/55 font-bold mb-1 uppercase tracking-[0.12em]">/mo</span>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: pkg.accentDark, background: pkg.accentSoft, border: `1px solid ${pkg.accentBorder}` }}>
                        No contract
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: "rgba(255,255,255,0.78)", border: "1px solid rgba(15,23,42,0.08)" }}>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/45">One-time setup</p>
                        <p className="text-xs text-foreground/55 mt-0.5">Setup & configuration</p>
                      </div>
                      <span className="text-sm font-extrabold" style={{ color: pkg.accentDark }}>{pkg.setup}</span>
                    </div>
                  </div>

                  <div className="w-full mb-4 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/45">Included</span>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: CHECK_GREEN_BG, color: CHECK_GREEN }}>
                      Installed
                    </span>
                  </div>

                  <ul className="space-y-3.5 w-full text-left flex-1 mb-8">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: CHECK_GREEN_BG }}>
                          <CheckCircle2 aria-hidden="true" className="w-[18px] h-[18px]" style={{ color: CHECK_GREEN, strokeWidth: 2.8 }} />
                        </span>
                        <span className="text-sm text-foreground/85 leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section", { package_id: pkg.packageId });
                      window.location.href = getPackageCheckoutPath(pkg.packageId);
                    }}
                    className="w-full text-center inline-flex items-center justify-center gap-2 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer"
                    style={pkg.highlight ? { background: "linear-gradient(90deg, #0079c1, #005691)", color: "#fff", padding: "14px 24px", boxShadow: "0 4px 18px rgba(0,121,193,0.4)", border: "1px solid transparent" } : { background: "rgba(255,255,255,0.78)", color: pkg.accentDark, padding: "13px 24px", border: `1.5px solid ${pkg.accentBorder}` }}
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
