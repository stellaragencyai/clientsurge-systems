import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.12)",
    accentGlow: "rgba(0,174,239,0.18)",
  },
  {
    name: "Growth",
    title: "Growth System",
    description: "Best for businesses that need more bookings and stronger follow-up.",
    price: "$997",
    setup: "$1,297 setup",
    includes: [
      "Multi-step SMS/email follow-up",
      "Booking automation",
      "Review request system",
      "Lead status tracking",
      "Client dashboard",
    ],
    cta: "Start With Growth",
    href: "/pricing",
    highlight: true,
    accent: "#00AEEF",
    accentBorder: "rgba(0,174,239,0.45)",
    accentGlow: "rgba(0,174,239,0.28)",
  },
  {
    name: "Pro",
    title: "Pro System",
    description: "Best for businesses that want the complete lead recovery system.",
    price: "$1,997",
    setup: "$2,497 setup",
    includes: [
      "Full website build/design",
      "Lead reactivation",
      "Advanced reporting",
      "Priority setup",
      "Expanded automation stack",
    ],
    cta: "Start With Pro",
    href: "/pricing",
    highlight: false,
    accent: "#003B8F",
    accentBorder: "rgba(0,59,143,0.18)",
    accentGlow: "rgba(0,59,143,0.16)",
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
          <p className="cs-eyebrow mb-3">AI Growth Systems</p>
          <div className="flex items-center gap-4">
            <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: "#00AEEF", minHeight: "48px", boxShadow: "0 0 14px rgba(0,174,239,0.5)" }} />
            <h2 className="font-titles text-[#00050F] text-3xl md:text-5xl font-bold">
              Choose Your AI Growth System
            </h2>
          </div>
          <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-5">
          {PACKAGES.map((pkg, idx) => (
            <motion.div
              key={pkg.name}
              className="relative"
              style={{ paddingTop: pkg.highlight ? "28px" : 0 }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Floating "Recommended" pill badge */}
              {pkg.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold"
                    style={{
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(0,174,239,0.25)",
                      color: "#006BB0",
                      boxShadow: "0 2px 12px rgba(0,174,239,0.18), 0 0 0 2px rgba(0,174,239,0.06)",
                    }}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: "#00AEEF" }} />
                    Recommended
                  </span>
                </div>
              )}

              <div
                className="flex flex-col rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  background: "#ffffff",
                  border: `1px solid ${pkg.accentBorder}`,
                  boxShadow: pkg.highlight
                    ? `0 8px 32px ${pkg.accentGlow}, 0 2px 8px rgba(0,0,0,0.04)`
                    : "0 2px 12px rgba(0,0,0,0.04)",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 1px ${pkg.accentGlow}, 0 0 32px ${pkg.accentGlow}, 0 8px 32px ${pkg.accentGlow}`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = pkg.accent;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = pkg.highlight
                    ? `0 8px 32px ${pkg.accentGlow}, 0 2px 8px rgba(0,0,0,0.04)`
                    : "0 2px 12px rgba(0,0,0,0.04)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = pkg.accentBorder;
                }}
              >
                <div className="p-8 md:p-10 flex flex-col flex-1 items-center text-center" style={{ minHeight: "580px" }}>
                  {/* Title + subtitle */}
                  <h3 className="font-titles text-[#00050F] text-xl md:text-2xl font-bold mb-2 mt-4">
                    {pkg.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-7">{pkg.description}</p>

                  {/* Feature list */}
                  <ul className="space-y-3.5 w-full text-left flex-1 mb-6">
                    {pkg.includes.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: pkg.accent }} />
                        <span className="text-sm text-[#0A1628] leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price */}
                  <div className="mb-6 w-full">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#00050F]">{pkg.price}</span>
                      <span className="text-sm text-muted-foreground font-semibold">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">{pkg.setup}</p>
                  </div>

                  {/* CTA at bottom */}
                  <Link
                    to={pkg.href}
                    onClick={() => trackCTA(`package_${pkg.name.toLowerCase()}`, "three_systems_section")}
                    className="cs-btn-primary w-full text-center"
                    style={{
                      background: pkg.highlight
                        ? "linear-gradient(135deg, #00AEEF 0%, #003B8F 100%)"
                        : `linear-gradient(135deg, ${pkg.accent} 0%, ${pkg.accent}dd 100%)`,
                      boxShadow: pkg.highlight
                        ? `0 0 20px ${pkg.accentGlow}, 0 4px 12px rgba(0,0,0,0.08)`
                        : `0 0 12px ${pkg.accentGlow}, 0 2px 8px rgba(0,0,0,0.04)`,
                    }}
                  >
                    {pkg.cta} <ArrowRight className="w-4 h-4 inline ml-1" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guidance text */}
        <div className="text-center mt-10 mb-2">
          <p className="text-sm text-foreground/60 max-w-2xl mx-auto leading-relaxed">
            <strong>Not sure which system fits?</strong> Most local service businesses start with Growth — it includes nurture sequences and AI scheduling for the fastest path to more booked appointments.
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
            See Plans &amp; Pricing <ArrowRight className="w-4 h-4 inline ml-1" />
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