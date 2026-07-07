import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Wallet, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "./MoneyBackGuarantee";
import SectionHeader from "@/components/design-system/SectionHeader";
import IndustryContextBanner from "./IndustryContextBanner";

const PACKAGES = [
  {
    name: "Starter",
    title: "Starter System",
    description: "Capture every new inquiry and missed call before leads disappear. The essential response foundation.",
    price: "$497",
    setup: "$797 setup",
    stats: ["6 automation components", "Website connection", "Managed hosting"],
    includes: ["Lead capture", "Instant SMS response", "Missed-call text-back", "Owner notification", "CRM handoff where supported", "Basic follow-up path"],
    platform: ["Website creation: existing website connection plus lead capture path", "Hosting: managed automation hosting and client intake workspace", "Launch proof: lead path, SMS delivery, and owner alert test"],
    cta: "Add to Cart",
    packageId: "starter_system",
    highlight: false,
    accent: "#00AEEF",
  },
  {
    name: "Growth",
    title: "Growth System",
    description: "Automated follow-up, booking handoff, and review systems working together — our most popular package.",
    price: "$997",
    setup: "$1,297 setup",
    stats: ["10 automation components", "Booking path setup", "Dashboard hosting"],
    includes: ["Everything in Starter", "14-day SMS/email nurture", "AI booking handoff", "Lead status tracking", "Review request system", "Client dashboard"],
    platform: ["Website creation: conversion path tuning plus booking route setup", "Hosting: managed automation, dashboard, and lead-flow hosting", "Launch proof: booking handoff test, nurture QA, and proof logs"],
    cta: "Add to Cart",
    packageId: "growth_system",
    highlight: true,
    accent: "#00AEEF",
  },
  {
    name: "Pro",
    title: "Pro System",
    description: "The full revenue operating layer — website, reactivation, reporting, and expanded automation. Done-for-you.",
    price: "$1,997",
    setup: "$2,497 setup",
    stats: ["13 automation/system components", "Full website build", "Website + stack hosting"],
    includes: ["Everything in Growth", "Full website build/design", "Lead reactivation", "Advanced reporting", "Priority setup", "Expanded automation stack", "Conversion pages", "Launch review"],
    platform: ["Website creation: full website build/design plus conversion pages", "Hosting: managed website hosting plus automation stack hosting", "Launch proof: expanded QA, reporting proof, and priority launch review"],
    cta: "Add to Cart",
    packageId: "pro_system",
    highlight: false,
    accent: "#003B8F",
  },
];

const getPackageCheckoutPath = (packageId) => `/product-signup?package=${encodeURIComponent(packageId)}`;

const cardClass = (highlight) => [
  "relative flex min-h-[760px] flex-col overflow-hidden rounded-[1.35rem] border bg-white transition-all duration-300",
  highlight
    ? "border-[rgba(0,174,239,0.62)] shadow-[0_22px_70px_rgba(0,174,239,0.24)] md:scale-[1.015]"
    : "border-[rgba(0,174,239,0.16)] shadow-xl hover:-translate-y-2 hover:border-[#00AEEF] hover:shadow-[0_24px_72px_rgba(0,174,239,0.24)]",
].join(" ");

export default function ThreeSystemsSection() {
  return (
    <section id="pricing" className="nebula-pricing relative isolate overflow-hidden px-6 pt-10 pb-16 md:pt-14 md:pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-16 h-72 w-[52rem] -translate-x-1/2 rounded-full bg-[rgba(0,174,239,0.10)] blur-3xl" />
        <div className="absolute bottom-24 right-[-12rem] h-80 w-80 rounded-full bg-[rgba(0,59,143,0.08)] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="AI Systems Storefront"
          title="Pick Your AI System — Add to Cart and Check Out"
          subtitle="Starter fixes response gaps. Growth adds follow-up and booking. Pro adds the full lead recovery layer. No demos, no sales calls — just add to cart and we handle the rest."
        />

        <IndustryContextBanner />

        <div className="mb-6 text-center">
          <p className="mx-auto max-w-3xl text-sm font-semibold leading-relaxed text-foreground/80">
            Nothing goes live until the lead path, response flow, booking handoff, and proof logs are tested.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "Proof Checked Before Launch" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
          ].map(({ Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(0,174,239,0.28)] bg-[rgba(0,174,239,0.08)] px-4 py-2 text-xs font-bold text-primary shadow-[0_8px_28px_rgba(0,174,239,0.10)]">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {text}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 items-stretch gap-7 pt-6 md:grid-cols-3 lg:gap-8">
          {PACKAGES.map((pkg) => (
            <div key={pkg.name} className="relative flex flex-col">
              {pkg.highlight && (
                <div className="absolute -top-5 left-1/2 z-10 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0079c1] to-[#005691] px-5 py-2 text-xs font-black uppercase tracking-[0.16em] text-white shadow-[0_8px_26px_rgba(0,121,193,0.45)]">
                    <Sparkles className="h-3.5 w-3.5" /> Most Popular
                  </span>
                </div>
              )}

              <div className={cardClass(pkg.highlight)} style={{ background: pkg.highlight ? "radial-gradient(circle at top, rgba(0,174,239,0.16), #ffffff 48%)" : "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)" }}>
                <div className="h-1.5 w-full flex-shrink-0" style={{ background: `linear-gradient(90deg, transparent, ${pkg.accent}, transparent)` }} />
                <div className="flex flex-1 flex-col p-7 text-left md:p-8 lg:p-9">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-primary">{pkg.name} package</p>
                      <h3 className="font-titles text-2xl font-black leading-tight text-black">{pkg.title}</h3>
                    </div>
                    <div className="rounded-2xl border border-[rgba(0,174,239,0.22)] bg-white px-3 py-2 text-right shadow-sm">
                      <span className="block text-2xl font-black leading-none text-black">{pkg.stats[0].split(" ")[0]}</span>
                      <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/55">included</span>
                    </div>
                  </div>

                  <p className="mb-5 text-sm leading-relaxed text-foreground/80">{pkg.description}</p>

                  <div className="mb-5 grid gap-2.5">
                    {pkg.stats.map((stat) => (
                      <div key={stat} className="rounded-xl border border-[rgba(0,174,239,0.15)] bg-[rgba(0,174,239,0.055)] px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-primary">
                        {stat}
                      </div>
                    ))}
                  </div>

                  <div className="mb-5 rounded-2xl border border-[rgba(0,174,239,0.16)] bg-white/80 p-4">
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-foreground/70">Automation stack</p>
                    <ul className="space-y-2.5">
                      {pkg.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: item.startsWith("Everything in") ? "#9CA3AF" : pkg.accent, strokeWidth: 2.6 }} />
                          <span className="text-sm font-semibold leading-snug text-[#111318]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-7 grid gap-3">
                    {pkg.platform.map((item) => {
                      const [label, value] = item.split(": ");
                      return (
                        <div key={item} className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
                          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.15em] text-primary">{label}</p>
                          <p className="text-sm font-semibold leading-snug text-foreground/82">{value}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-auto rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                    <div className="mb-5 border-b border-slate-100 pb-5 text-center">
                      <div className="flex items-end justify-center gap-1.5 leading-none">
                        <span className="font-extrabold tracking-[-0.055em] text-black" style={{ fontSize: "clamp(1.9rem, 3.2vw, 2.45rem)", fontFamily: "'Montserrat', sans-serif" }}>{pkg.price}</span>
                        <span className="pb-1.5 text-sm font-black text-foreground/60">/mo</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-foreground/55">plus {pkg.setup}</p>
                    </div>
                    <Link to={getPackageCheckoutPath(pkg.packageId)} onClick={() => trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section", { package_id: pkg.packageId })} className={pkg.highlight ? "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#0079c1] to-[#005691] px-6 py-3.5 text-sm font-black text-white no-underline shadow-[0_8px_22px_rgba(0,121,193,0.38)] transition-all hover:-translate-y-0.5" : "inline-flex w-full items-center justify-center gap-2 rounded-full border border-[rgba(0,174,239,0.35)] bg-white px-6 py-3.5 text-sm font-black text-[#0079c1] no-underline transition-all hover:-translate-y-0.5 hover:border-[#00AEEF] hover:bg-[rgba(0,174,239,0.08)]"}>
                      <ShoppingCart className="h-4 w-4" /> {pkg.cta}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 mb-2 text-center">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-foreground/85">
            <strong>Not sure which system fits?</strong> Most service businesses start with Growth because it adds nurture and booking to the response foundation.
          </p>
        </div>

        <MoneyBackGuarantee />

        <div className="mt-6 space-y-4 text-center">
          <Link to="/store" onClick={() => trackCTA("browse_automation_store", "three_systems_section")} className="cs-btn-primary inline-flex">
            Browse the Automation Store <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
          <div>
            <Link to="/automations" onClick={() => trackCTA("view_automations", "three_systems_section")} className="text-sm font-semibold text-primary underline underline-offset-4 transition-colors hover:text-primary/80">
              View Automation Stack
            </Link>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-[420px] text-center text-xs text-foreground/70">
          All packages include done-for-you setup. No long-term contracts. Cancel anytime. Secure checkout via Stripe.
        </p>
      </div>
    </section>
  );
}
