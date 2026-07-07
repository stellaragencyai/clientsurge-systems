import { motion, useReducedMotion } from "framer-motion";
import { Search, Map, Link2, TestTube, Rocket } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const STEPS = [
  { num: "01", icon: Search, title: "Audit Your Lead Flow", desc: "We review where leads enter, where they stall, and where follow-up breaks." },
  { num: "02", icon: Map, title: "Map the Revenue Leaks", desc: "Missed calls, slow replies, dead leads, and booking friction get turned into action points." },
  { num: "03", icon: Link2, title: "Connect the Automation Stack", desc: "Lead capture, SMS/email response, AI follow-up, booking, and reactivation are tied together." },
  { num: "04", icon: TestTube, title: "Test the Path End-to-End", desc: "The system is tested from inquiry to response to booking handoff." },
  { num: "05", icon: Rocket, title: "Launch and Monitor", desc: "You get a working lead response system with visibility into what is happening." },
];

function scrollToSection(id, ctaName, location) {
  trackCTA(ctaName, location);
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function WhatHappensAfter() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#ffffff" }}>
      {/* Subtle blue glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,174,239,0.04) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <CSSectionHeader
          eyebrow="Implementation Process"
          title="What Happens After You Start"
          subtitle="A clear, proven process — not a black box. Here's exactly how we get your lead response system live."
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-2xl p-6 cs-card-shadow"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,174,239,0.12)",
                }}
              >
                {/* Connector line — desktop only */}
                {i < STEPS.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-12 -right-3 w-6 h-px"
                    style={{ background: "linear-gradient(90deg, rgba(0,174,239,0.4), transparent)" }}
                  />
                )}

                <span
                  className="absolute top-4 right-4 text-2xl font-black opacity-10"
                  style={{ fontFamily: "'Montserrat', sans-serif", color: "#00AEEF" }}
                >
                  {step.num}
                </span>

                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(0,174,239,0.12)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "#00AEEF" }} />
                </div>

                <h3 className="font-bold mb-2" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1rem", lineHeight: 1.35, color: "#111318" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "#3a3d47" }}>{step.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <a
            href="/contact"
            onClick={() => trackCTA("free_audit_cta_click", "what_happens_after")}
            className="cs-btn-primary inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold text-white"
            style={{ minHeight: "unset", minWidth: "unset" }}
          >
            Request Free Automation Audit
          </a>
          <button
            onClick={() => scrollToSection("pricing", "compare_packages", "what_happens_after")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-foreground transition-all duration-300 hover:bg-primary/5"
            style={{ background: "#ffffff", border: "1.5px solid rgba(0,174,239,0.3)", minHeight: "unset", minWidth: "unset" }}
          >
            Compare Packages
          </button>
        </div>
      </div>
    </section>
  );
}