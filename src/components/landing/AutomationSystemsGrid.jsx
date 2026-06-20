import { Zap, Phone, MessageSquare, Calendar, Star, RefreshCw, ArrowRight, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";

const SYSTEMS = [
  {
    icon: Zap,
    title: "Lead Capture System",
    outcome: "Capture website, form, ad, and phone inquiries into an organized pipeline.",
    cta: "View Lead Capture System",
    href: "/store",
  },
  {
    icon: Phone,
    title: "Missed-Call Recovery System",
    outcome: "Respond to missed calls and after-hours inquiries before prospects call a competitor.",
    cta: "View Missed-Call System",
    href: "/store",
  },
  {
    icon: MessageSquare,
    title: "AI Follow-Up System",
    outcome: "Follow up by SMS and email until leads reply, book, or opt out.",
    cta: "View Follow-Up System",
    href: "/store",
  },
  {
    icon: Calendar,
    title: "Booking Automation System",
    outcome: "Move interested leads into appointments with reminders, confirmations, and booking links.",
    cta: "View Booking System",
    href: "/store",
  },
  {
    icon: Star,
    title: "Review Automation System",
    outcome: "Request reviews after completed jobs and surface unhappy customers earlier.",
    cta: "View Review System",
    href: "/store",
  },
  {
    icon: RefreshCw,
    title: "Reactivation System",
    outcome: "Re-engage old leads, past customers, no-shows, unbooked quotes, and cold opportunities.",
    cta: "View Reactivation System",
    href: "/store",
  },
];

const PROCESS_STEPS = [
  "Choose System",
  "AI Intake",
  "Setup Plan",
  "Remote Build",
  "Testing",
  "Launch",
];

const BRAIN_BULLETS = [
  "Collects business details through guided intake",
  "Preserves package and service context from signup",
  "Organizes required access and setup inputs",
  "Helps prepare workflow logic, messages, routing, and follow-up structure",
  "Supports remote installation and testing",
  "Gives the client a clearer path from signup to activation",
];

const PROOF_POINTS = [
  "Package-based service selection",
  "Lead scoring and intake records",
  "Twilio SMS and Resend email support",
  "Client onboarding sequence",
  "Service install status tracking",
  "Communication event logging",
  "Outcome analytics foundation",
];

export default function AutomationSystemsGrid() {
  const navigate = useNavigate();

  return (
    <>
      {/* ── Section 1: Browse Systems ── */}
      <section id="automation-systems" className="py-20 px-6 bg-background" style={{ scrollMarginTop: "var(--cs-anchor-offset)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="cs-eyebrow mb-3">AI Automation Marketplace</p>
            <h2 className="font-titles text-foreground mb-4">Browse Business AI Automation Systems</h2>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Choose from practical automation systems that solve real business problems: missed calls, slow follow-up, unbooked leads, forgotten quotes, review gaps, and old opportunities sitting untouched.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SYSTEMS.map(({ icon: Icon, title, outcome, cta, href }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,174,239,0.1)", border: "1px solid rgba(0,174,239,0.2)" }}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{outcome}</p>
                </div>
                <button
                  onClick={() => {
                    trackCTA(cta.toLowerCase().replace(/\s+/g, "_"), "automation_systems_grid");
                    navigate(href);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors self-start"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  {cta} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => { trackCTA("browse_all_systems", "automation_systems_grid"); navigate("/store"); }}
              className="cs-btn-primary inline-flex items-center gap-2"
            >
              Browse All Automation Systems <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 2: How the AI Brain Works ── */}
      <section className="py-20 px-6" style={{ background: "hsl(var(--muted))" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="cs-eyebrow mb-3">Remote Setup Engine</p>
            <h2 className="font-titles text-foreground mb-4">How the ClientSurge AI Brain Works</h2>
            <p className="text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed">
              ClientSurge does not just sell automation ideas. After a business chooses a system, the ClientSurge AI brain helps collect business details, lead sources, phone and email requirements, booking links, CRM details, and automation goals. It turns that information into a setup plan so the automation can be remotely configured, tested, and launched.
            </p>
          </div>

          {/* Horizontal process steps */}
          <div className="flex flex-wrap items-center justify-center mb-12">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3 py-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0088CC, #005691)" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{step}</span>
                </div>
                {i < PROCESS_STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 flex-shrink-0 mb-4" />
                )}
              </div>
            ))}
          </div>

          {/* Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {BRAIN_BULLETS.map((bullet) => (
              <div key={bullet} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{bullet}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => { trackCTA("start_remote_setup_brain", "ai_brain_section"); navigate("/book"); }}
              className="cs-btn-primary inline-flex items-center gap-2"
            >
              Start Remote Setup <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Section 3: Proof Strip ── */}
      <section className="py-12 px-6 bg-background border-t border-border">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">Built Around a Real Automation Operating System</h3>
          <p className="text-sm text-muted-foreground mb-6">The ClientSurge platform is built on a real automation infrastructure foundation — not a collection of disconnected tools.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {PROOF_POINTS.map((point) => (
              <span
                key={point}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border"
                style={{ background: "rgba(0,174,239,0.06)", borderColor: "rgba(0,174,239,0.2)", color: "#006BB0" }}
              >
                <Check className="w-3.5 h-3.5 flex-shrink-0" />
                {point}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}