import { ArrowRight, CheckCircle2, ShieldCheck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import MoneyBackGuarantee from "./MoneyBackGuarantee";

const PACKAGES = [
  {
    name: "Starter",
    title: "Starter System",
    description: "Best for businesses that need the basics fixed.",
    price: "$497",
    setup: "$797 setup",
    includes: [
      "AI-ready landing/website setup",
      "Lead capture",
      "Instant lead response",
      "Missed-call text-back",
      "CRM handoff",
      "Basic follow-up",
    ],
    cta: "Start With Starter",
    href: "/pricing",
    highlight: false,
  },
  {
    name: "Growth",
    title: "Growth System",
    description: "Best for businesses that need more bookings and stronger follow-up.",
    price: "$997",
    setup: "$1,297 setup",
    includes: [
      "Everything in Starter",
      "Multi-step SMS/email follow-up",
      "Booking automation",
      "Review request system",
      "Lead status tracking",
      "Client dashboard",
    ],
    cta: "Start With Growth",
    href: "/pricing",
    highlight: true,
  },
  {
    name: "Pro",
    title: "Pro System",
    description: "Best for businesses that want the complete lead recovery system.",
    price: "$1,997",
    setup: "$2,497 setup",
    includes: [
      "Everything in Growth",
      "Full website build/design",
      "Lead reactivation",
      "Advanced reporting",
      "Priority setup",
      "Expanded automation stack",
    ],
    cta: "Start With Pro",
    href: "/pricing",
    highlight: false,
  },
];

export default function ThreeSystemsSection() {
  return (
    <section
      id="pricing"
      className="nebula-pricing pt-10 md:pt-14 pb-16 md:pb-24 px-6 overflow-visible"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-12">
          <p className="cs-eyebrow mb-3">Compare AI Growth Systems</p>
          <h2 className="font-titles text-[#001B44] text-3xl md:text-5xl font-bold mb-4">
            Compare Packages
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Choose the package that matches how much of your lead flow you want ClientSurge to handle — from essential capture and response to a complete website, follow-up, booking, review, and reactivation system.
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "No Long-Term Contract" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
          ].map(({ Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border"
              style={{
                background: "rgba(0,174,239,0.08)",
                borderColor: "rgba(0,174,239,0.28)",
                color: "#00AEEF",
              }}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {text}
            </span>
          ))}
        </div>

        {/* Package cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className="flex flex-col rounded-xl overflow-hidden transition-all duration-300"
              style={{
                background: "#ffffff",
                border: pkg.highlight ? "2px solid #00AEEF" : "1px solid rgba(0,174,239,0.15)",
                boxShadow: pkg.highlight
                  ? "0 16px 48px rgba(0,174,239,0.15), 0 4px 12px rgba(0,0,0,0.06)"
                  : "0 2px 16px rgba(0,0,0,0.05)",
                transform: pkg.highlight ? "scale(1.03)" : "scale(1)",
              }}
            >
              {pkg.highlight && (
                <div
                  className="text-center py-2.5 text-xs font-bold text-white uppercase tracking-wider"
                  style={{ background: "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)" }}
                >
                  Most Popular
                </div>
              )}
              <div className="p-6 md:p-8 flex flex-col flex-1">
                <div className="mb-5">
                  <h3 className="font-titles text-[#001B44] text-xl md:text-2xl font-bold mb-1">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl md:text-4xl font-black text-[#001B44]">{pkg.price}</span>
                    <span className="text-sm text-muted-foreground font-medium">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pkg.setup}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#00AEEF" }} />
                      <span className="text-sm text-[#0A1628] leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={pkg.href}
                  onClick={() => trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section")}
                  className="cs-btn-primary w-full text-center"
                  style={pkg.highlight ? {
                    background: "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)",
                    boxShadow: "0 8px 28px rgba(0,174,239,0.35)",
                  } : {}}
                >
                  {pkg.cta} <ArrowRight className="w-4 h-4 inline ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Guidance text */}
        <div className="text-center mt-10 mb-2">
          <p className="text-sm text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            <strong>Not sure which plan fits?</strong> Most local service businesses start with Growth — it includes nurture sequences and AI scheduling for the fastest path to more booked appointments.
          </p>
        </div>

        {/* 30-day guarantee */}
        <MoneyBackGuarantee />

        {/* Bottom CTA row */}
        <div className="text-center mt-6 space-y-4">
          <Link
            to="/pricing"
            onClick={() => trackCTA("compare_packages", "three_systems_section")}
            className="cs-btn-primary inline-flex"
          >
            Compare Packages <ArrowRight className="w-4 h-4 inline ml-1" />
          </Link>
          <div>
            <Link
              to="/automations"
              onClick={() => trackCTA("view_automations", "three_systems_section")}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              View Included Automations
            </Link>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          All packages include done-for-you setup. No long-term contracts. Cancel anytime.
        </p>
      </div>
    </section>
  );
}