import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  CalendarCheck2,
  MessageSquareText,
  PhoneCall,
  RefreshCw,
  Send,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";

const AUTOMATIONS = [
  {
    title: "Instant Lead Response",
    description:
      "Acknowledges new inquiries through the configured channels and gives each lead a clear next step.",
    packageLabel: "Starter & up",
    icon: Send,
  },
  {
    title: "Missed-Call Text-Back",
    description:
      "Sends a configured text after a missed call so potential customers do not disappear without a response.",
    packageLabel: "Starter & up",
    icon: PhoneCall,
  },
  {
    title: "14-Day Lead Nurture",
    description:
      "Keeps following up through a defined SMS and email sequence until the lead responds, books, or opts out.",
    packageLabel: "Growth & up",
    icon: MessageSquareText,
  },
  {
    title: "AI Booking Handoff",
    description:
      "Moves interested leads toward your existing booking process and reduces manual back-and-forth.",
    packageLabel: "Growth & up",
    icon: CalendarCheck2,
  },
  {
    title: "Review Requests",
    description:
      "Requests customer feedback at the configured point after service, with timing aligned to your workflow.",
    packageLabel: "Pro",
    icon: Star,
  },
  {
    title: "Lead Reactivation",
    description:
      "Re-engages dormant inquiries, no-shows, and unclosed opportunities through a structured outreach campaign.",
    packageLabel: "Pro",
    icon: RefreshCw,
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function SixAutomationsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative overflow-hidden bg-[#F7FBFE] py-16 md:py-24"
      aria-label="Six ClientSurge automation modules"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent"
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
            eyebrow="What ClientSurge Installs"
            title="Six focused automations. One connected system."
            subtitle="Each module solves a specific gap in the lead journey. Your package determines which modules are configured, tested, and activated for your business."
            align="center"
          />
        </motion.div>

        <motion.div
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5"
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : "hidden"}
          whileInView={shouldReduceMotion ? {} : "visible"}
          viewport={{ once: true, margin: "-70px" }}
        >
          {AUTOMATIONS.map(({ title, description, packageLabel, icon: Icon }) => (
            <motion.article
              key={title}
              variants={shouldReduceMotion ? {} : cardVariants}
              className="flex h-full min-h-[250px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.065)] transition-colors duration-200 hover:border-sky-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-[#008fc9]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#0079a8]">
                  {packageLabel}
                </span>
              </div>

              <h3 className="mt-6 font-titles text-xl font-black leading-tight tracking-[-0.025em] text-slate-950">
                {title}
              </h3>
              <p className="mt-3 text-sm font-medium leading-7 text-slate-600">
                {description}
              </p>
            </motion.article>
          ))}
        </motion.div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-sky-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#008fc9]">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">Configured around your service business.</p>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                HVAC, dental, roofing, plumbing, med spas, legal services, and other appointment-driven businesses.
              </p>
            </div>
          </div>

          <Link
            to="/industries"
            onClick={() => trackCTA("six_automations_view_industries", "six_automations")}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-5 text-sm font-black text-[#0079a8] transition-colors hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-[#00AEEF] focus:ring-offset-2"
          >
            View Industries
          </Link>
        </div>
      </div>
    </section>
  );
}
