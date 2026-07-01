import { ArrowRight, CheckCircle2, PhoneCall, CalendarCheck, MessageSquare, Star, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { trackCTA } from "@/lib/analytics";

const AUTOMATION_PILLS = [
  "Lead Capture",
  "Missed-Call Recovery",
  "Follow-Up",
  "AI Booking",
  "Reviews",
  "Reactivation",
];

const CONTROL_CENTER_EVENTS = [
  {
    icon: Zap,
    title: "New Lead Captured",
    detail: "Website form submitted",
    status: "Captured",
  },
  {
    icon: MessageSquare,
    title: "AI Response Sent",
    detail: "SMS sent in 12 seconds",
    status: "Active",
  },
  {
    icon: PhoneCall,
    title: "Missed Call Recovered",
    detail: "Callback text delivered",
    status: "Recovered",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booked",
    detail: "Google Calendar updated",
    status: "Booked",
  },
  {
    icon: Star,
    title: "Review Request Queued",
    detail: "Follow-up automation scheduled",
    status: "Ready",
  },
];

const PROOF_TOOLS = ["Twilio", "Stripe", "Google Workspace", "Resend", "AI Voice"];

export default function CinematicHero() {
  const shouldReduceMotion = useReducedMotion();

  const scrollToSection = (id, eventName) => {
    trackCTA(eventName, "hero");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const MockupShell = shouldReduceMotion ? "div" : motion.div;

  return (
    <>
      <style>{`
        .cs-hero-shield,
        .cs-hero-shield h1,
        .cs-hero-shield h2,
        .cs-hero-shield h3,
        .cs-hero-shield p,
        .cs-hero-shield span,
        .cs-hero-shield div,
        .cs-hero-shield button,
        .cs-hero-shield a {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .cs-hero-shield .cs-hero-eyebrow {
          color: #35BDF1 !important;
          -webkit-text-fill-color: #35BDF1 !important;
        }
        .cs-hero-shield .cs-hero-subcopy {
          color: #D4D8E0 !important;
          -webkit-text-fill-color: #D4D8E0 !important;
        }
        .cs-hero-shield .cs-muted {
          color: #AEB7C8 !important;
          -webkit-text-fill-color: #AEB7C8 !important;
        }
        .cs-hero-shield .cs-cyan-text {
          color: #35BDF1 !important;
          -webkit-text-fill-color: #35BDF1 !important;
        }
        .cs-hero-grid {
          background-image:
            linear-gradient(rgba(53, 189, 241, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(53, 189, 241, 0.055) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse at 50% 45%, black 0%, transparent 74%);
        }
        .cs-hero-pulse-line {
          background: linear-gradient(90deg, transparent, rgba(53, 189, 241, 0.34), transparent);
        }
        .cs-control-card {
          border: 1px solid rgba(53, 189, 241, 0.16);
          background: linear-gradient(135deg, rgba(8, 20, 44, 0.92), rgba(5, 14, 31, 0.86));
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.24);
        }
        .cs-control-row {
          border: 1px solid rgba(53, 189, 241, 0.13);
          background: rgba(255, 255, 255, 0.035);
          transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
        }
        .cs-control-row:hover {
          transform: translateY(-2px);
          border-color: rgba(53, 189, 241, 0.34);
          background: rgba(53, 189, 241, 0.07);
        }
        .cs-hero-secondary-btn:hover,
        .cs-system-pill:hover {
          transform: translateY(-2px);
          border-color: rgba(53, 189, 241, 0.52) !important;
          background: rgba(53, 189, 241, 0.10) !important;
        }
      `}</style>

      <section
        className="cs-hero-shield relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: "calc(100svh - var(--cs-nav-height))", background: "#061025" }}
        aria-label="ClientSurge AI automation storefront"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 42%, #0A1B38 0%, #061025 66%, #040C1C 100%)" }}
          />
          <div className="cs-hero-grid absolute inset-0 opacity-80" />
          <div className="cs-hero-pulse-line absolute left-0 right-0 top-[28%] h-px opacity-60" />
          <div className="cs-hero-pulse-line absolute left-0 right-0 bottom-[22%] h-px opacity-30" />
          {!shouldReduceMotion && (
            <>
              <motion.div
                className="absolute rounded-full"
                style={{
                  top: "12%",
                  left: "6%",
                  width: 360,
                  height: 360,
                  background: "radial-gradient(circle, rgba(53,189,241,0.12), transparent 70%)",
                  filter: "blur(90px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, 25, 0], y: [0, 15, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute rounded-full"
                style={{
                  bottom: "10%",
                  right: "5%",
                  width: 420,
                  height: 420,
                  background: "radial-gradient(circle, rgba(53,189,241,0.10), transparent 70%)",
                  filter: "blur(100px)",
                  willChange: "transform",
                }}
                animate={{ x: [0, -20, 0], y: [0, -12, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          )}
        </div>

        <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-20 sm:px-6 md:px-8 md:pb-16 md:pt-24 lg:grid-cols-[0.52fr_0.48fr] lg:gap-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.div
              className="cs-hero-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontSize: "clamp(0.7rem, 1vw, 0.82rem)",
                fontWeight: 800,
                letterSpacing: "0.25em",
                textShadow: "0 0 16px rgba(53,189,241,0.4)",
                textTransform: "uppercase",
                margin: "0 0 16px 0",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              AI Automation Storefront
            </motion.div>

            <motion.h1
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              style={{
                fontFamily: "'Montserrat', 'Helvetica Neue', Arial, sans-serif",
                fontSize: "clamp(2.45rem, 4.8vw, 5.15rem)",
                fontWeight: 800,
                lineHeight: 0.98,
                letterSpacing: "-0.045em",
                margin: "0 0 22px 0",
                textTransform: "uppercase",
                textWrap: "balance",
                textShadow: "0 2px 28px rgba(0, 0, 0, 0.65)",
                maxWidth: "880px",
                fontFeatureSettings: "'kern' 1",
              }}
            >
              <span style={{ display: "block", color: "#FFFFFF" }}>Turn Your Website Into a</span>
              <span style={{ display: "block", color: "#FFFFFF" }}>24/7 AI Sales Machine</span>
            </motion.h1>

            <motion.p
              className="cs-hero-subcopy"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "clamp(1rem, 1.55vw, 1.2rem)",
                fontWeight: 400,
                lineHeight: 1.65,
                maxWidth: "700px",
                margin: "0 0 24px 0",
                letterSpacing: "-0.011em",
              }}
            >
              We install AI systems that capture leads, respond instantly, recover missed calls, book appointments, and follow up automatically — all tested before launch.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22 }}
              className="mb-7 w-full max-w-3xl"
            >
              <div className="cs-cyan-text mb-3 text-xs font-extrabold uppercase tracking-[0.24em]">6 Installed AI Systems</div>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                {AUTOMATION_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className="cs-system-pill inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200"
                    style={{ borderColor: "rgba(53,189,241,0.28)", background: "rgba(8,20,44,0.72)", color: "#D4D8E0" }}
                  >
                    {pill}
                  </span>
                ))}
                <span
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-extrabold shadow-[0_0_24px_rgba(53,189,241,0.16)]"
                  style={{ borderColor: "rgba(53,189,241,0.5)", background: "rgba(53,189,241,0.12)", color: "#FFFFFF" }}
                >
                  Optional AI Phone Receptionist
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="mb-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row lg:items-start"
            >
              <button
                onClick={() => scrollToSection("pricing", "hero_pricing_click")}
                type="button"
                className="cs-btn-primary"
                style={{ width: "100%", maxWidth: "300px", height: "58px", padding: "0 34px", boxShadow: "0 20px 46px rgba(5, 165, 225, 0.24)" }}
              >
                See Plans & Pricing <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection("automations", "hero_how_it_works_click")}
                type="button"
                className="cs-hero-secondary-btn inline-flex items-center justify-center rounded-full border text-sm font-bold transition-all duration-200"
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "58px",
                  borderColor: "rgba(53, 189, 241, 0.4)",
                  background: "rgba(8, 20, 44, 0.7)",
                  color: "#FFFFFF",
                }}
              >
                Watch How It Works
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.34 }}
              className="space-y-3 text-center lg:text-left"
            >
              <p className="cs-hero-subcopy text-xs font-bold uppercase tracking-[0.16em]">
                No long-term contracts · Month-to-month · Launch proof checked before install
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start" aria-label="Implementation stack proof">
                {PROOF_TOOLS.map((tool) => (
                  <span key={tool} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-300" />
                    {tool}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          <MockupShell
            className="relative mx-auto w-full max-w-xl lg:mx-0"
            {...(!shouldReduceMotion
              ? {
                  initial: { opacity: 0, y: 22, scale: 0.98 },
                  animate: { opacity: 1, y: [0, -8, 0], scale: 1 },
                  transition: { opacity: { duration: 0.5, delay: 0.36 }, y: { duration: 8, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.5, delay: 0.36 } },
                }
              : {})}
          >
            <div className="absolute -inset-6 rounded-[2.25rem] bg-sky-400/10 blur-3xl" />
            <div className="cs-control-card relative rounded-[2rem] p-4 sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="cs-cyan-text text-xs font-extrabold uppercase tracking-[0.2em]">Live Install Preview</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">ClientSurge AI Control Center</h2>
                </div>
                <div className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em]">
                  Online
                </div>
              </div>

              <div className="space-y-3">
                {CONTROL_CENTER_EVENTS.map(({ icon: Icon, title, detail, status }) => (
                  <div key={title} className="cs-control-row flex items-center gap-3 rounded-2xl p-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10">
                      <Icon className="h-5 w-5 text-sky-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{title}</p>
                      <p className="cs-muted truncate text-xs font-medium">{detail}</p>
                    </div>
                    <span className="rounded-full border border-sky-300/25 bg-sky-300/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {status}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["24/7", "Response"],
                  ["6", "AI Systems"],
                  ["Proof", "Checked"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-center">
                    <div className="cs-cyan-text text-lg font-black leading-none">{value}</div>
                    <div className="cs-muted mt-1 text-[10px] font-bold uppercase tracking-[0.12em]">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </MockupShell>
        </div>
      </section>
    </>
  );
}
