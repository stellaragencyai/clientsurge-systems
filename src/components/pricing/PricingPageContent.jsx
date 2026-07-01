import { useState } from "react";
import { CheckCircle2, ShieldCheck, Wallet, ShoppingCart, ArrowRight, Zap, MessageSquareText, CalendarCheck, BarChart3, ClipboardCheck, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import { useCart } from "@/lib/cartContext";
import { getPackageServices } from "@/lib/salesCatalog";

const CHECK_GREEN = "#16A34A";
const CHECK_GREEN_BG = "rgba(22, 163, 74, 0.1)";

const GAPS = [
  ["starter_system", "Response Gap", "Slow replies and missed calls"],
  ["growth_system", "Follow-Up Gap", "Leads are not nurtured"],
  ["growth_system", "Booking Gap", "Interest is not turning into appointments"],
  ["pro_system", "Revenue Recovery Gap", "Old leads, reviews, and reporting need control"],
];

const PIPELINE_STEPS = ["Lead Captured", "Instant Response", "Follow-Up", "Booking", "Reporting", "Revenue Recovery"];

const PACKAGES = [
  {
    key: "starter_system",
    name: "Starter System",
    layer: "Response Foundation",
    setup: "$797",
    monthly: "$497",
    coverage: 35,
    problem: "We miss calls or reply too late.",
    promise: "Lead capture, instant response, and missed-call recovery installed first.",
    bestFor: "Best for businesses missing calls or responding too slowly.",
    flow: ["New Lead", "Instant Text", "Owner Alert"],
    groups: [["Capture", ["Instant lead response", "Lead capture foundation"]], ["Follow-Up", ["Missed-call text-back"]], ["Control", ["Owner notification", "Remote setup workflow"]]],
    cta: "Start With Response Foundation",
    accent: "#0EA5E9",
    accentDark: "#0369A1",
    accentSoft: "rgba(14, 165, 233, 0.08)",
    accentBorder: "rgba(14,165,233,0.22)",
    identity: "Foundation Layer",
  },
  {
    key: "growth_system",
    name: "Growth System",
    layer: "Growth Engine",
    badge: "Most Businesses Should Start Here",
    setup: "$1,297",
    monthly: "$997",
    coverage: 70,
    problem: "We need follow-up and booking handled.",
    promise: "Response, nurture, booking, and lead status tracking working together.",
    bestFor: "Best for businesses losing leads because follow-up is inconsistent.",
    flow: ["Lead", "Response", "Nurture", "Booking"],
    groups: [["Capture", ["Everything in Starter"]], ["Follow-Up", ["14-day SMS/email nurture", "Lead status tracking"]], ["Booking", ["AI booking handoff", "Testing workflow"]]],
    cta: "Build My Follow-Up Engine",
    accent: "#00AEEF",
    accentDark: "#005691",
    accentSoft: "rgba(0,174,239,0.1)",
    accentBorder: "rgba(0,174,239,0.45)",
    identity: "Active Growth Layer",
  },
  {
    key: "pro_system",
    name: "Pro System",
    layer: "Revenue Operating Layer",
    setup: "$2,497",
    monthly: "$1,997",
    coverage: 100,
    problem: "We want the full lead recovery layer.",
    promise: "The complete system for response, booking, reviews, reactivation, reporting, and priority setup.",
    bestFor: "Best for businesses that need full response, recovery, reporting, and review automation.",
    flow: ["Lead", "Reactivation", "Review", "Report", "Priority Support"],
    groups: [["Recovery", ["Everything in Growth", "Lead reactivation"]], ["Reputation", ["Review automation"]], ["Reporting", ["Advanced reporting", "Priority launch support"]]],
    cta: "Launch Full Lead Recovery System",
    accent: "#1D4ED8",
    accentDark: "#0F172A",
    accentSoft: "rgba(15, 23, 42, 0.06)",
    accentBorder: "rgba(15,23,42,0.18)",
    identity: "Executive Operating Layer",
  },
];

const PROCESS_STEPS = [
  ["Choose System", "Select the system that matches the lead-flow leak."],
  ["Guided Intake", "Submit business, lead, and access details."],
  ["Access Checklist", "Confirm phone, email, CRM, and booking access."],
  ["Configuration", "We build the automation layer and routing."],
  ["Testing", "Every form, alert, and handoff gets checked."],
  ["Launch Review", "You receive launch proof before go-live."],
];

const cardVariants = { hidden: { opacity: 0, y: 24 }, visible: (i) => ({ opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut", delay: i * 0.08 } }) };

function Flow({ pkg }) {
  return (
    <div className="mb-5 rounded-2xl px-3 py-3" style={{ background: pkg.accentSoft, border: `1px solid ${pkg.accentBorder}` }}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/45">System Flow</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {pkg.flow.map((step, i) => <div key={step} className="flex items-center gap-1.5"><span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-foreground/75 shadow-sm" style={{ border: `1px solid ${pkg.accentBorder}` }}>{step}</span>{i < pkg.flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-foreground/35" />}</div>)}
      </div>
    </div>
  );
}

export default function PricingPageContent() {
  const navigate = useNavigate();
  const { replaceItems, setCartOpen } = useCart();
  const [activeGap, setActiveGap] = useState("growth_system");
  const handlePackageCTA = (pkg) => { trackCTA(`package_${pkg.key}`, "pricing_page"); replaceItems(getPackageServices(pkg.key)); setCartOpen(true); };

  return (
    <div className="min-h-screen bg-background">
      <section className="pt-[calc(var(--cs-nav-height)+40px)] pb-10 px-6 text-center">
        <p className="cs-eyebrow mb-3">ClientSurge AI Systems</p>
        <h1 className="font-titles text-foreground mb-4 mx-auto max-w-5xl text-4xl md:text-6xl leading-[0.98] tracking-tight">Fix the Lead Flow Gap That’s Costing You Revenue</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-7">Choose the automation layer that matches where your follow-up system is leaking leads.</p>
        <div className="flex flex-wrap justify-center gap-3 mb-7">{[[ShieldCheck, "Secure Stripe Checkout"], [CheckCircle2, "Proof Checked Before Launch"], [Wallet, "Month-to-Month Billing"]].map(([Icon, text]) => <span key={text} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /> {text}</span>)}</div>

        <div className="mx-auto max-w-5xl rounded-3xl border border-primary/15 bg-white/80 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
            {GAPS.map(([key, label, helper]) => {
              const selected = activeGap === key;
              return <button key={label} type="button" onClick={() => setActiveGap(key)} onMouseEnter={() => setActiveGap(key)} className="rounded-2xl border px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5" style={{ minHeight: "unset", minWidth: "unset", borderColor: selected ? "rgba(0,174,239,0.55)" : "rgba(15,23,42,0.1)", background: selected ? "linear-gradient(180deg, rgba(240,249,255,0.95), #ffffff)" : "#ffffff", boxShadow: selected ? "0 12px 30px rgba(0,174,239,0.14)" : "0 4px 14px rgba(15,23,42,0.04)" }}><span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-foreground">{label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{helper}</span></button>;
            })}
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-6">{PIPELINE_STEPS.map((step, i) => <div key={step} className="relative rounded-2xl border border-primary/15 bg-primary/5 px-3 py-3 text-center"><span className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black text-primary shadow-sm">{i + 1}</span><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/75">{step}</p>{i < PIPELINE_STEPS.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-primary/45 md:block" />}</div>)}</div>
        </div>
      </section>

      <section className="px-6 pb-14 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg, index) => {
            const highlight = pkg.key === "growth_system";
            const active = activeGap === pkg.key;
            return (
              <motion.article key={pkg.key} custom={index} initial="hidden" animate="visible" variants={cardVariants} onMouseEnter={() => setActiveGap(pkg.key)} className="cs-card relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)]" style={{ opacity: active || highlight ? 1 : 0.74, transform: active || highlight ? "scale(1)" : "scale(0.985)", borderColor: active || highlight ? pkg.accentBorder : "rgba(15,23,42,0.1)", background: highlight ? "linear-gradient(160deg, #f0f9ff 0%, #ffffff 48%, #f8fbff 100%)" : "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)", boxShadow: active || highlight ? "0 22px 64px rgba(0,174,239,0.18), 0 4px 12px rgba(15,23,42,0.06)" : "0 10px 32px rgba(15,23,42,0.08), 0 1px 4px rgba(15,23,42,0.04)" }}>
                <div style={{ height: "5px", background: highlight ? "linear-gradient(90deg, #0079c1, #00AEEF)" : `linear-gradient(90deg, ${pkg.accent}, transparent)`, flexShrink: 0 }} />
                {pkg.badge && <div className="absolute top-3 left-1/2 z-10 -translate-x-1/2"><span className="inline-flex whitespace-nowrap items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] text-primary-foreground shadow-[0_10px_26px_rgba(0,174,239,0.28)]">✦ {pkg.badge}</span></div>}
                <div className="p-7 flex flex-col flex-1" style={{ paddingTop: pkg.badge ? "56px" : "32px" }}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><span className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ background: pkg.accentSoft, border: `1px solid ${pkg.accentBorder}`, color: pkg.accentDark }}>{pkg.layer}</span><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/40">{pkg.identity}</span></div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: pkg.accentDark }}>{pkg.problem}</p>
                  <h2 className="text-xl font-bold mb-2" style={{ color: "#0F172A" }}>{pkg.name}</h2>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{pkg.promise}</p>
                  <p className="mb-5 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-foreground/80" style={{ border: `1px solid ${pkg.accentBorder}` }}>{pkg.bestFor}</p>
                  <Flow pkg={pkg} />

                  <div className="mb-6 rounded-3xl p-5 text-left" style={{ background: highlight ? "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(240,249,255,0.92))" : "linear-gradient(180deg, #ffffff, rgba(248,250,252,0.94))", border: `1px solid ${pkg.accentBorder}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 24px rgba(15,23,42,0.05)" }}>
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/50">Monthly System</p><div className="mt-1.5 flex items-end gap-1.5 whitespace-nowrap"><span className="font-extrabold tracking-tight tabular-nums whitespace-nowrap" style={{ color: pkg.accentDark, fontSize: "clamp(1.65rem, 3vw, 2.05rem)", lineHeight: 1 }}>{pkg.monthly}</span><span className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-foreground/55">/mo</span></div></div><span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: pkg.accentDark, background: pkg.accentSoft, border: `1px solid ${pkg.accentBorder}` }}>Month-to-month</span></div>
                    <div className="mt-4 rounded-2xl px-4 py-3" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,23,42,0.08)" }}><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/45">One-time setup</p><span className="text-sm font-extrabold whitespace-nowrap" style={{ color: pkg.accentDark }}>+{pkg.setup} setup</span></div><p className="mt-1.5 text-xs text-foreground/55">Built, configured, and tested before launch.</p></div>
                  </div>

                  <div className="mb-6 rounded-2xl bg-white p-4" style={{ border: `1px solid ${pkg.accentBorder}` }}><div className="mb-2 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/45">Automation Coverage</span><span className="text-sm font-black" style={{ color: pkg.accentDark }}>{pkg.coverage}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pkg.coverage}%`, background: `linear-gradient(90deg, ${pkg.accent}, ${pkg.accentDark})` }} /></div></div>

                  <div className="w-full mb-4 flex items-center justify-between"><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/45">Installed Layers</span><span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ background: CHECK_GREEN_BG, color: CHECK_GREEN }}>Installed</span></div>
                  <div className="mb-8 flex-1 space-y-4">{pkg.groups.map(([title, items]) => <div key={`${pkg.key}-${title}`}><p className="mb-2 text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: pkg.accentDark }}>{title}</p><ul className="space-y-2.5">{items.map((feature) => <li key={feature} className="flex items-start gap-3"><motion.span initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 + index * 0.06, duration: 0.25 }} className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: CHECK_GREEN_BG }}><CheckCircle2 className="h-[18px] w-[18px]" style={{ color: CHECK_GREEN, strokeWidth: 2.8 }} /></motion.span><span className="text-sm text-foreground/85 leading-snug">{feature}</span></li>)}</ul></div>)}</div>
                  <button onClick={() => handlePackageCTA(pkg)} className={`${highlight ? "cs-btn-primary" : "cs-btn-secondary"} group w-full text-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(0,174,239,0.16)]`} style={{ minHeight: "unset", minWidth: "unset" }}><ShoppingCart className="w-4 h-4 mr-1.5" /> {pkg.cta}<ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" /></button>
                </div>
              </motion.article>
            );
          })}
        </div>
        <div className="text-center mt-8"><p className="text-sm text-muted-foreground"><strong>Not sure?</strong> <button onClick={() => { trackCTA("guided_chooser_pricing", "pricing_page"); navigate("/book"); }} className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80 bg-transparent border-none cursor-pointer" style={{ minHeight: "unset", minWidth: "unset" }}>Get help choosing</button> and we will recommend the right starting point.</p></div>
      </section>

      <section className="px-6 pb-16 max-w-6xl mx-auto"><div className="cs-card overflow-hidden p-6 md:p-8" style={{ borderColor: "rgba(0,174,239,0.22)", background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" }}><div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="h-8 w-8" /></div><div><h2 className="font-titles text-foreground text-2xl font-bold mb-2">30-Day Setup-Fee Guarantee</h2><p className="text-muted-foreground text-sm leading-relaxed max-w-4xl">If the installed system is not producing measurable lead-capture, response, or booking improvement in your first 30 days, we review the account and refund the setup fee when the guarantee terms are met. Monthly service cancellation follows the terms shown before checkout.</p><div className="mt-5 flex flex-wrap gap-2">{["30-day review window", "Setup-fee refund terms", "Month-to-month service"].map((item) => <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"><CheckCircle2 className="h-3.5 w-3.5" /> {item}</span>)}</div></div></div></div></section>

      <section className="px-6 pb-16 max-w-6xl mx-auto"><div className="cs-card p-8 md:p-10 text-center"><p className="cs-eyebrow mb-3">Launch Roadmap</p><h2 className="font-titles text-foreground text-2xl md:text-3xl font-bold mb-3">What Happens After You Choose</h2><p className="text-muted-foreground text-sm max-w-2xl mx-auto mb-9 leading-relaxed">After checkout, ClientSurge collects your business details, lead sources, phone and email requirements, booking links, CRM access, and launch goals through guided intake. Then we configure, test, and launch your selected system with proof before go-live.</p><div className="grid grid-cols-1 gap-4 md:grid-cols-6">{PROCESS_STEPS.map(([title, text], i) => { const icons = [Zap, MessageSquareText, ClipboardCheck, RefreshCcw, CalendarCheck, BarChart3]; const Icon = icons[i]; return <div key={title} className="relative rounded-2xl border border-primary/15 bg-primary/5 p-4 text-left"><div className="mb-3 flex items-center justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-primary shadow-sm">{i + 1}</span><Icon className="h-5 w-5 text-primary/70" /></div><h3 className="text-sm font-black text-foreground">{title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>{i < PROCESS_STEPS.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-primary/45 md:block" />}</div>; })}</div></div></section>
    </div>
  );
}
