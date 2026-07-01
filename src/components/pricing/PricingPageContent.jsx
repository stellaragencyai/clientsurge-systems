import { CheckCircle2, ShieldCheck, Wallet, ShoppingCart, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { useCart } from "@/lib/cartContext";
import { getPackageServices } from "@/lib/salesCatalog";
import MoneyBackGuarantee from "@/components/landing/MoneyBackGuarantee";

const CHECK_GREEN = "#16A34A";
const CHECK_GREEN_BG = "rgba(22, 163, 74, 0.1)";

const PACKAGES = [
  {
    key: "starter_system",
    name: "Starter System",
    layer: "Response Foundation",
    setup: "$797",
    monthly: "$497",
    problem: "We miss calls or reply too late.",
    promise: "Lead capture, instant response, and missed-call recovery installed first.",
    features: ["Instant lead response", "Missed-call text-back", "Lead capture foundation", "Owner notification", "Remote setup workflow"],
    cta: "Add Starter System",
    accent: "#0EA5E9",
    accentDark: "#0369A1",
    accentSoft: "rgba(14, 165, 233, 0.08)",
    accentBorder: "rgba(14,165,233,0.2)",
  },
  {
    key: "growth_system",
    name: "Growth System",
    layer: "Growth Engine",
    badge: "Recommended",
    setup: "$1,297",
    monthly: "$997",
    problem: "We need follow-up and booking handled.",
    promise: "Response, nurture, booking, and lead status tracking working together.",
    features: ["Everything in Starter", "14-day SMS/email nurture", "AI booking handoff", "Lead status tracking", "Testing workflow"],
    cta: "Add Growth System",
    accent: "#00AEEF",
    accentDark: "#005691",
    accentSoft: "rgba(0,174,239,0.1)",
    accentBorder: "rgba(0,174,239,0.45)",
  },
  {
    key: "pro_system",
    name: "Pro System",
    layer: "Revenue Operating Layer",
    setup: "$2,497",
    monthly: "$1,997",
    problem: "We want the full lead recovery layer.",
    promise: "The complete system for response, booking, reviews, reactivation, reporting, and priority setup.",
    features: ["Everything in Growth", "Lead reactivation", "Review automation", "Advanced reporting", "Priority launch support"],
    cta: "Add Pro System",
    accent: "#1D4ED8",
    accentDark: "#0F172A",
    accentSoft: "rgba(15, 23, 42, 0.06)",
    accentBorder: "rgba(15,23,42,0.16)",
  },
];

const PROCESS_STEPS = ["Choose System", "Guided Intake", "Access Checklist", "Configuration", "Testing", "Launch Review"];

export default function PricingPageContent() {
  const navigate = useNavigate();
  const { replaceItems, setCartOpen } = useCart();

  const handlePackageCTA = (pkg) => {
    trackCTA(`package_${pkg.key}`, "pricing_page");
    replaceItems(getPackageServices(pkg.key));
    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-[calc(var(--cs-nav-height)+40px)] pb-12 px-6 text-center">
        <p className="cs-eyebrow mb-3">ClientSurge AI Systems</p>
        <h1 className="font-titles text-foreground mb-4">Choose the System That Fixes Your Biggest Lead Flow Gap</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full recovery layer across reviews, reactivation, reporting, and priority setup.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "Proof Checked Before Launch" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
          ].map(({ Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Icon className="h-3.5 w-3.5" /> {text}
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => {
            const highlight = Boolean(pkg.badge);
            return (
              <article key={pkg.key} className="cs-card relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ borderColor: highlight ? "rgba(0,174,239,0.55)" : pkg.accentBorder, background: highlight ? "linear-gradient(160deg, #f0f9ff 0%, #ffffff 48%, #f8fbff 100%)" : "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)", boxShadow: highlight ? "0 22px 64px rgba(0,174,239,0.2), 0 4px 12px rgba(15,23,42,0.06)" : "0 10px 32px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)" }}>
                <div style={{ height: "4px", background: highlight ? "linear-gradient(90deg, #0079c1, #00AEEF)" : `linear-gradient(90deg, ${pkg.accent}, transparent)`, flexShrink: 0 }} />
                {pkg.badge && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2"><span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground">✦ {pkg.badge}</span></div>}
                <div className="p-7 flex flex-col flex-1" style={{ paddingTop: "32px" }}>
                  <span className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ background: pkg.accentSoft, border: `1px solid ${pkg.accentBorder}`, color: pkg.accentDark }}>
                    {pkg.layer}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pkg.accentDark }}>{pkg.problem}</p>
                  <h2 className="text-xl font-bold mb-2" style={{ color: "#0F172A" }}>{pkg.name}</h2>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{pkg.promise}</p>

                  <div className="mb-6 rounded-3xl p-5 text-left" style={{ background: highlight ? "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,249,255,0.92))" : "linear-gradient(180deg, #ffffff, rgba(248,250,252,0.92))", border: `1px solid ${pkg.accentBorder}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 24px rgba(15,23,42,0.05)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/50">Monthly plan</p>
                        <div className="flex items-end gap-1.5 mt-1.5">
                          <span className="font-extrabold tracking-tight" style={{ color: pkg.accentDark, fontSize: "clamp(1.85rem, 3.2vw, 2.25rem)", lineHeight: 1 }}>{pkg.monthly}</span>
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

                  <ul className="space-y-3.5 mb-8 flex-1">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: CHECK_GREEN_BG }}>
                          <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: CHECK_GREEN, strokeWidth: 2.8 }} />
                        </span>
                        <span className="text-sm text-foreground/85 leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => handlePackageCTA(pkg)} className={`${highlight ? "cs-btn-primary" : "cs-btn-secondary"} w-full text-center justify-center`} style={{ minHeight: "unset", minWidth: "unset" }}>
                    <ShoppingCart className="w-4 h-4 mr-1.5" /> {pkg.cta}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground"><strong>Not sure?</strong> <button onClick={() => { trackCTA("guided_chooser_pricing", "pricing_page"); navigate("/book"); }} className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80 bg-transparent border-none cursor-pointer" style={{ minHeight: "unset", minWidth: "unset" }}>Get help choosing</button> and we will recommend the right starting point.</p>
        </div>
        <MoneyBackGuarantee />
      </section>

      <section className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="cs-card p-8 md:p-10 text-center">
          <h2 className="font-titles text-foreground text-xl md:text-2xl font-bold mb-3">What Happens After You Choose</h2>
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto mb-8 leading-relaxed">
            After checkout, ClientSurge collects your business details, lead sources, phone and email requirements, booking links, CRM access, and launch goals through guided intake. Then we configure, test, and launch your selected system with proof before go-live.
          </p>
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
