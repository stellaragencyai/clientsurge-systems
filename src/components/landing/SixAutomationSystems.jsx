import { ArrowRight, CalendarCheck, Inbox, MessageSquare, PhoneCall, RefreshCw, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SIX_AUTOMATIONS } from "@/lib/sixAutomations";
import { MotionIconBadge, premiumEase, revealContainer, revealItem } from "./PremiumHomepageMotion";

const ICONS = {
  inbox: Inbox,
  phone: PhoneCall,
  message: MessageSquare,
  calendar: CalendarCheck,
  star: Star,
  refresh: RefreshCw,
};

export default function SixAutomationSystems() {
  return (
    <section id="six-automations" className="px-4 py-12 md:px-6 md:py-20" style={{ background: "#ffffff" }}>
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-8 md:mb-10 max-w-3xl"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={revealItem} className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "#0088CC" }}>
            The core offer
          </motion.p>
          <motion.h2 variants={revealItem} className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            The 6 ClientSurge Automation Systems
          </motion.h2>
          <motion.p variants={revealItem} className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            ClientSurge Systems packages the essential revenue automations local service businesses need to capture,
            follow up, book, review, and reactivate customers without adding staff.
          </motion.p>
        </motion.div>

        <motion.div
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {SIX_AUTOMATIONS.map((automation, index) => {
            const Icon = ICONS[automation.icon] || MessageSquare;

            return (
              <motion.div
                key={automation.slug}
                variants={revealItem}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ duration: 0.25, ease: premiumEase }}
                className="relative"
              >
                <motion.span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: "-1px",
                    borderRadius: "8px",
                    background: "rgba(0,136,204,0.14)",
                  }}
                />
                <Link
                  to={automation.routePath}
                  className="cinematic-corner-card group relative block rounded-lg bg-white p-4 md:p-5 no-underline transition-shadow duration-200 hover:shadow-lg"
                  style={{ border: "1px solid rgba(0,136,204,0.12)" }}
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <MotionIconBadge className="h-11 w-11 rounded-lg">
                      <Icon className="h-5 w-5" style={{ color: "#0088CC" }} />
                    </MotionIconBadge>
                    <span className="text-xs font-bold text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                  </div>

                  <h3 className="mb-2 text-base md:text-xl font-bold leading-tight text-foreground">{automation.title}</h3>
                  <p className="mb-4 hidden text-sm leading-6 text-muted-foreground sm:block">{automation.summary}</p>

                  <div className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: "#0088CC" }}>
                    See how it works
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
