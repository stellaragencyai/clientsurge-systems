import { Bot, CalendarCheck, Headphones, MessageSquareText, PhoneCall, RotateCcw, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemoBooking } from "./DemoBookingContext";

const services = [
  {
    icon: Workflow,
    title: "Website plus AI install engine",
    body: "Connect the public website, checkout package, onboarding intake, CRM records, and remote install workspace into one launch path.",
  },
  {
    icon: Headphones,
    title: "AI voice agents and phone receptionist",
    body: "Answer inbound calls, qualify urgent opportunities, collect contact details, and route ready prospects toward booking instead of voicemail.",
  },
  {
    icon: MessageSquareText,
    title: "Six automation service stack",
    body: "Package lead capture, missed-call text-back, AI follow-up, booking, reviews, and reactivation as the core customer offer.",
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
    icon: PhoneCall,
    title: "Missed-call recovery",
    body: "Trigger instant text-back when a call is missed so high-intent leads stay in conversation before they contact a competitor.",
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
        <div className="max-w-3xl">
          <p className="text-xs font-bold tracking-[0.28em] uppercase text-primary mb-4">
            AI lead conversion systems
          </p>
          <h2
            id="ai-automation-overview"
            className="font-display text-3xl md:text-5xl font-bold tracking-tight text-foreground leading-tight"
          >
            A complete website foundation around the six automations customers actually buy.
          </h2>
          <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">
            ClientSurge Systems is the front end of a larger lead conversion engine. We build high-converting business websites and connect them to AI-powered response, phone, booking, review, and reactivation automations so local service companies can capture more demand without adding front-desk headcount.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2" aria-label="Industries served">
          {industries.map((industry) => (
            <span
              key={industry}
              className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              {industry}
            </span>
          ))}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10">
              <Bot className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl md:text-4xl font-bold tracking-tight text-foreground">
              Built so a customer can choose a package and move into remote AI installation.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The system focuses on the moments that decide revenue: the visitor understands the offer, picks one of the three packages, completes checkout, submits onboarding details, and enters the install workspace where the AI automation stack can be configured and tested.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={demoBooking?.openDemoBooking}
                className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Book Your Free Automation Audit
              </button>
              <Link
                to="/automations"
                className="inline-flex items-center justify-center rounded-full border border-primary/25 bg-white px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                View AI Automations
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
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
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
