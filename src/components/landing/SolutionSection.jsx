import { motion, useReducedMotion } from "framer-motion";
import { CalendarCheck2, MessageSquareText, RefreshCw, Zap } from "lucide-react";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const STEPS = [
  {
    icon: Zap,
    step: "01",
    title: "Capture",
    description:
      "Website forms, calls, and inquiries enter one organized workflow so each new opportunity has a clear starting point.",
  },
  {
    icon: MessageSquareText,
    step: "02",
    title: "Respond",
    description:
      "Configured response and missed-call text-back workflows acknowledge new leads consistently and move the conversation forward.",
  },
  {
    icon: CalendarCheck2,
    step: "03",
    title: "Follow Up and Book",
    description:
      "Package-appropriate nurture and booking handoffs keep qualified leads moving without relying on someone to remember every touchpoint.",
  },
  {
    icon: RefreshCw,
    step: "04",
    title: "Retain and Reactivate",
    description:
      "Where included, review requests and reactivation workflows support the customer relationship after the initial inquiry or appointment.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function SolutionSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="solution" className="relative overflow-hidden bg-white py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0,174,239,0.045) 0%, transparent 48%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-5 sm:px-8 lg:px-10">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-70px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <CSSectionHeader
            eyebrow="How ClientSurge Works"
            title="One clear path from inquiry to booked customer."
            subtitle="ClientSurge connects lead capture, response, follow-up, booking, and the package-specific workflows your business selects into one understandable operating sequence."
            align="center"
          />
        </motion.div>

        <motion.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, margin: "-70px" }}
          className="relative mt-10 md:mt-12"
        >
          <div
            className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px bg-sky-200 lg:block"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.step}
                  variants={shouldReduceMotion ? {} : itemVariants}
                  className="relative flex h-full min-h-[265px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_14px_38px_rgba(15,23,42,0.07)]"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-[#008fc9]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black tracking-[0.16em] text-slate-300">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="mt-6 font-titles text-xl font-black tracking-[-0.025em] text-slate-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                    {step.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-sm font-semibold leading-6 text-slate-500">
          Your selected package determines which automation modules are configured and activated.
        </p>
      </div>
    </section>
  );
}
