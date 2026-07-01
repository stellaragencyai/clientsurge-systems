import { PhoneOff, Clock, FileText, Users } from "lucide-react";
import SectionHeader from "@/components/design-system/SectionHeader";
import { MotionStyleShield, PremiumHoverCard, Reveal, StaggerGroup } from "./PremiumMotion.jsx";

const LEAKS = [
  { icon: PhoneOff, title: "Missed Calls", desc: "A prospect calls with intent. If nobody responds, the opportunity can disappear.", metric: "Intent" },
  { icon: Clock, title: "Slow Replies", desc: "Lead interest drops fast when the next step waits on manual follow-up.", metric: "Delay" },
  { icon: FileText, title: "Forgotten Quotes", desc: "Quotes and estimates stall when nobody has a structured follow-up path.", metric: "Stall" },
  { icon: Users, title: "Unworked Old Leads", desc: "Past inquiries, no-shows, and dormant contacts often still have buying intent.", metric: "Reactivate" },
];

export default function RevenueLeakSection() {
  return (
    <section className="relative py-16 md:py-24 overflow-hidden" style={{ background: "#ffffff" }}>
      <MotionStyleShield />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(0,174,239,0.055) 0%, transparent 50%), radial-gradient(ellipse at 85% 50%, rgba(0,59,143,0.045) 0%, transparent 52%)" }}
        aria-hidden="true"
      />
      <div
        className="absolute left-1/2 top-1/2 h-[1px] w-[86vw] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.20), transparent)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <Reveal y={24}>
          <SectionHeader
            eyebrow="Lead Flow Gaps"
            title="Your Business Is Losing Bookings at the Delay Points"
            subtitle="Most teams do not need another dashboard. They need the first response, follow-up, booking handoff, review request, and reactivation path to stop depending on memory."
            align="center"
          />
        </Reveal>

        <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" delayChildren={0.08} staggerChildren={0.08}>
          {LEAKS.map((leak) => {
            const Icon = leak.icon;
            return (
              <PremiumHoverCard
                key={leak.title}
                className="rounded-2xl p-6 cs-card-shadow cs-cinematic-sheen group"
                lift={7}
                glow="0 24px 64px rgba(0, 59, 143, 0.14)"
                style={{ background: "linear-gradient(180deg, #ffffff 0%, #f9fcff 100%)", border: "1px solid rgba(0,174,239,0.14)" }}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 transition-transform duration-300 group-hover:scale-105">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] rounded-full px-3 py-1" style={{ color: "#0079c1", background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.16)" }}>
                    {leak.metric}
                  </span>
                </div>
                <h3 className="font-bold mb-2" style={{ fontSize: "1.05rem", lineHeight: 1.3, color: "#111318" }}>{leak.title}</h3>
                <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "#3a3d47" }}>{leak.desc}</p>
              </PremiumHoverCard>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
