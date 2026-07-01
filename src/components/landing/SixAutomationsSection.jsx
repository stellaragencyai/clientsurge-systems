import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";
import { MotionStyleShield, PremiumHoverCard, Reveal, StaggerGroup } from "./PremiumMotion.jsx";

const AUTOMATION_CARDS = [
  { id: "automation-lead-capture", label: "Lead Capture", description: "Turns forms, calls, ads, and website inquiries into one trackable pipeline.", icon: Zap, signal: "Capture" },
  { id: "automation-missed-call", label: "Missed-Call Recovery", description: "Texts missed callers quickly so the conversation can continue.", icon: Phone, signal: "Recover" },
  { id: "automation-follow-up", label: "Follow-Up", description: "Keeps leads moving until they reply, book, opt out, or become closed.", icon: MessageSquare, signal: "Nurture" },
  { id: "automation-booking", label: "AI Booking", description: "Moves interested prospects toward a confirmed appointment or handoff.", icon: Calendar, signal: "Book" },
  { id: "automation-reviews", label: "Reviews", description: "Requests reviews when the customer experience is fresh and the timing is right.", icon: Star, signal: "Reputation" },
  { id: "automation-reactivation", label: "Reactivation", description: "Brings old leads, past customers, no-shows, and unclosed quotes back into motion.", icon: RefreshCw, signal: "Win Back" },
];

export default function SixAutomationsSection() {
  return (
    <section className="relative py-20 md:py-32 bg-white overflow-hidden" style={{ background: "#ffffff" }} aria-labelledby="six-automations-title">
      <MotionStyleShield />
      <div
        className="absolute inset-x-0 top-0 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(0,174,239,0.11), transparent 64%)" }}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-16 md:mb-20" y={26}>
          <SectionHeader
            eyebrow="Core Automation Stack"
            title="The Systems That Protect Your Lead Flow"
            subtitle="ClientSurge packages the front-end workflows your business needs: capture, recover, follow up, book, request reviews, and reactivate opportunities before they go quiet."
            align="center"
            variant="light"
          />
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" delayChildren={0.06} staggerChildren={0.075}>
          {AUTOMATION_CARDS.map(({ id, label, description, icon: Icon, signal }) => (
            <PremiumHoverCard
              key={id}
              id={id}
              className="group rounded-xl p-6 md:p-8 transition-all duration-300 cs-cinematic-sheen"
              style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f8fcff 100%)",
                border: "1px solid rgba(0,174,239,0.18)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                scrollMarginTop: "var(--cs-anchor-offset)",
              }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                  style={{ background: "rgba(53,189,241,0.12)", border: "1px solid rgba(53,189,241,0.25)", boxShadow: "0 12px 28px rgba(53,189,241,0.12)" }}
                >
                  <Icon className="w-6 h-6" style={{ color: "#35BDF1" }} aria-hidden="true" />
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
                  style={{ background: "rgba(0,174,239,0.08)", color: "#0079c1", border: "1px solid rgba(0,174,239,0.16)" }}
                >
                  {signal}
                </span>
              </div>
              <h3 className="font-titles font-black text-black mb-2" style={{ fontSize: "1.125rem", lineHeight: 1.35, letterSpacing: "-0.015em" }}>{label}</h3>
              <p style={{ color: "rgba(10,22,40,0.7)", fontSize: "0.9rem", lineHeight: 1.68 }}>{description}</p>
              <div className="mt-6 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(0,174,239,0.10)" }} aria-hidden="true">
                <div className="h-full rounded-full transition-all duration-700 group-hover:w-full" style={{ width: "44%", background: "linear-gradient(90deg, #0079c1, #00AEEF)" }} />
              </div>
            </PremiumHoverCard>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
