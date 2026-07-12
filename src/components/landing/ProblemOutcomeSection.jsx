import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock3, FileText, PhoneOff } from "lucide-react";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const LEAD_GAPS = [
  {
    icon: PhoneOff,
    problem: "A missed call or new inquiry waits too long.",
    outcome: "The lead receives an immediate, consistent first response, including missed-call text-back.",
  },
  {
    icon: Clock3,
    problem: "Follow-up depends on someone remembering to send it.",
    outcome: "A structured nurture path keeps the conversation moving until the lead responds, books, or opts out.",
  },
  {
    icon: FileText,
    problem: "Quotes, no-shows, and older leads disappear from view.",
    outcome: "Reactivation workflows return past opportunities to a clear, trackable follow-up process.",
  },
];

export default function ProblemOutcomeSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <CSSectionHeader
          eyebrow="Problem → Outcome"
          title="Most leads are not lost. They are left waiting."
          subtitle="ClientSurge replaces missed calls, delayed replies, and forgotten follow-up with a clear path from inquiry to booked customer."
          align="center"
        />

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-10 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.08)] md:mt-12"
        >
          {LEAD_GAPS.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.problem}
                className={`grid items-center gap-5 px-5 py-6 sm:px-7 md:grid-cols-[minmax(0,0.9fr)_48px_minmax(0,1.1fr)] md:gap-6 md:px-8 md:py-7 ${
                  index > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Where the lead stalls</p>
                    <h3 className="mt-1.5 text-base font-black leading-6 tracking-[-0.02em] text-slate-950 sm:text-lg">
                      {item.problem}
                    </h3>
                  </div>
                </div>

                <div className="hidden justify-center md:flex" aria-hidden="true">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-[#008fc9]">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-sky-50/70 px-4 py-4 sm:px-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00AEEF]" aria-hidden="true" />
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#008fc9]">With ClientSurge</p>
                    <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-700 sm:text-[15px]">
                      {item.outcome}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
