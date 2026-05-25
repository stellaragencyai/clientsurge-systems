import { Bot, CalendarCheck, Headphones, MessageSquareText, PhoneCall, RotateCcw, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useDemoBooking } from "./DemoBookingContext";
import {
  CinematicButton,
  CinematicCard,
  MotionIconBadge,
  premiumEase,
  revealContainer,
  revealItem,
} from "./PremiumHomepageMotion";

const services = [
  {
    icon: Headphones,
    title: "AI voice agents and phone receptionist",
    body: "Answer inbound calls, qualify urgent opportunities, collect contact details, and route ready prospects toward booking instead of voicemail.",
  },
  {
    icon: PhoneCall,
    title: "Missed-call recovery",
    body: "Trigger instant text-back when a call is missed so high-intent leads stay in conversation before they contact a competitor.",
  },
  {
    icon: MessageSquareText,
    title: "Instant lead response",
    body: "Respond to web forms, ad leads, and direct inquiries in under 60 seconds with personalized SMS and email follow-up.",
  },
  {
    icon: CalendarCheck,
    title: "AI booking systems",
    body: "Move ready prospects from conversation to confirmed appointment with booking links, reminders, and no-click follow-up.",
  },
  {
    icon: RotateCcw,
    title: "Lead nurturing and reactivation",
    body: "Keep new leads warm for 14 days and bring old leads back with controlled SMS and email campaigns.",
  },
  {
    icon: Workflow,
    title: "Workflow automation",
    body: "Connect the website, lead pipeline, notifications, CRM handoff, and review requests so the operation runs with less manual chasing.",
  },
];

const industries = [
  "roofing",
  "HVAC",
  "plumbing",
  "dental",
  "med spa",
  "chiropractic",
  "contractors",
  "home services",
];

const steps = [
  {
    title: "Audit the lead flow",
    body: "We identify where calls, forms, follow-up, and booking handoffs currently break down.",
  },
  {
    title: "Build the automation system",
    body: "We configure the AI receptionist, missed-call recovery, response templates, nurture logic, booking flow, and tracking.",
  },
  {
    title: "Launch and optimize",
    body: "Your system goes live with reporting, message tuning, and clear next actions for every lead source.",
  },
];

export default function HomepageConversionContent() {
  const demoBooking = useDemoBooking();

  return (
    <section
      aria-labelledby="ai-automation-overview"
      className="px-4 md:px-6 py-16 md:py-24"
      style={{ background: "#ffffff" }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="max-w-3xl"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.p variants={revealItem} className="text-xs font-bold tracking-[0.28em] uppercase text-primary mb-4">
            AI lead conversion systems
          </motion.p>
          <motion.h2
            variants={revealItem}
            id="ai-automation-overview"
            className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
          >
            Websites, voice agents, and follow-up automation built for local service revenue.
          </motion.h2>
          <motion.p variants={revealItem} className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            ClientSurge Systems is the front end of a larger lead conversion engine. We build high-converting business websites and connect them to AI-powered response, phone, booking, and workflow automations so local service companies can capture more demand without adding front-desk headcount.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap gap-2"
          aria-label="Industries served"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {industries.map((industry, index) => (
            <motion.span
              key={industry}
              className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
              variants={revealItem}
              whileHover={{ y: -3, scale: 1.04 }}
              transition={{ duration: 0.32, delay: index * 0.01 }}
            >
              {industry}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          variants={revealContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {services.map(({ icon: Icon, title, body }, index) => (
            <CinematicCard
              as={motion.article}
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              variants={revealItem}
              animate={{ y: [0, index % 2 === 0 ? -5 : -8, 0] }}
              whileHover={{ y: -7, scale: 1.015 }}
              transition={{
                y: { duration: 5.2 + index * 0.24, repeat: Infinity, ease: "easeInOut" },
                scale: { duration: 0.25 },
              }}
            >
              <motion.span
                aria-hidden="true"
                initial={{ x: "-125%" }}
                whileInView={{ x: "125%" }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.3, delay: 0.2 + index * 0.06, ease: premiumEase }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.82), transparent)",
                }}
              />
              <MotionIconBadge className="mb-4 h-10 w-10 rounded-xl">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </MotionIconBadge>
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </CinematicCard>
          ))}
        </motion.div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.28 }}
            transition={{ duration: 0.7, ease: premiumEase }}
          >
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
              <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl md:text-4xl font-bold tracking-tight text-foreground">
              Built to recover the leads local businesses already paid for.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The system focuses on the moments that decide revenue: who answers the phone, how fast a new inquiry gets a response, whether follow-up actually happens, and whether ready prospects reach the booking step.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <CinematicButton
                onClick={demoBooking?.openDemoBooking}
                strength={0.1}
                innerClassName="text-sm"
              >
                Get Your Free Audit
              </CinematicButton>
              <Link
                to="/automations"
                className="inline-flex items-center justify-center rounded-full border border-primary/25 bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                View AI Automations
              </Link>
            </div>
          </motion.div>

          <motion.div
            className="relative grid gap-3"
            variants={revealContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.22 }}
          >
            <motion.div
              aria-hidden="true"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.75, ease: premiumEase }}
              style={{
                position: "absolute",
                left: "18px",
                top: "24px",
                bottom: "24px",
                width: "1px",
                background: "linear-gradient(to bottom, rgba(0,174,239,0.02), rgba(0,174,239,0.55), rgba(0,174,239,0.02))",
                transformOrigin: "top",
              }}
            />
            {steps.map((step, index) => (
              <motion.article
                key={step.title}
                className="cinematic-data-pulse flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
                variants={revealItem}
              >
                <span
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
