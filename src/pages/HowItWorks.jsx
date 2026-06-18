import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Package, ClipboardList, Settings, TestTube2, Rocket, BarChart3, Zap, MessageSquare, FolderOpen, Activity } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const PROCESS_STEPS = [
  "Browse Systems",
  "Choose Package",
  "Guided AI Intake",
  "Setup Plan",
  "Remote Configuration",
  "Testing",
  "Launch",
];

const AI_BRAIN_LAYERS = [
  {
    icon: Package,
    title: "Selection Context",
    body: "Preserves the package or automation system a business selected — Starter, Growth, Pro, missed-call recovery, booking automation, follow-up, reviews, or reactivation.",
  },
  {
    icon: ClipboardList,
    title: "Guided Intake",
    body: "Collects business details, lead sources, booking links, CRM/tool stack, phone/email requirements, goals, and setup notes.",
  },
  {
    icon: FolderOpen,
    title: "Setup Plan",
    body: "Turns intake information into a clearer setup path: what needs to be configured, what access is missing, what automations are included, and what should be tested before launch.",
  },
  {
    icon: MessageSquare,
    title: "Message + Workflow Prep",
    body: "Uses onboarding sequences, business templates, and service context to help prepare messages, routing, follow-up structure, and automation logic.",
  },
  {
    icon: Activity,
    title: "Event + Status Tracking",
    body: "Logs important activity such as lead creation, workflow triggers, service status changes, emails, SMS activity, and setup progress where supported.",
  },
  {
    icon: Rocket,
    title: "Remote Launch Path",
    body: "Gives the client a clearer route from intake to remote configuration, testing, and launch review.",
  },
];

const FOUNDATION_POINTS = [
  "Package and service selection context",
  "Lead and website intake records",
  "Onboarding client records",
  "Client project status tracking",
  "Communication event logging",
  "Email onboarding sequence",
  "Business-specific templates",
  "Lead outcome analytics foundation",
  "Twilio SMS and Resend email support where configured",
  "AI voice automation rules where enabled",
];

const POST_SIGNUP_STEPS = [
  "Submit Intake",
  "Review Setup Needs",
  "Confirm Missing Access",
  "Configure Automations",
  "Test Workflow",
  "Launch Review",
];

const COMPARISON_ROWS = [
  {
    label: "Starts with",
    agency: "Vague discovery calls",
    clientsurge: "Package or system selection",
  },
  {
    label: "Business info",
    agency: "Re-explains from scratch each time",
    clientsurge: "Guided intake collects setup information",
  },
  {
    label: "Workflow setup",
    agency: "Custom one-off workflows built manually",
    clientsurge: "Preserves package and service context",
  },
  {
    label: "What's next",
    agency: "Buyer doesn't know what happens next",
    clientsurge: "Organizes setup into a remote workflow",
  },
  {
    label: "Tracking",
    agency: "Ad-hoc status updates",
    clientsurge: "Tracks leads, events, and project status where supported",
  },
];

export default function HowItWorks() {
  useEffect(() => {
    return setPageMetadata({
      title: "How It Works — ClientSurge AI Brain & Remote Fulfillment | ClientSurge Systems",
      description:
        "Learn how the ClientSurge AI Brain turns a business signup into a remote setup plan. Package selection, guided intake, setup checklists, automation templates, and remote configuration workflows.",
      canonicalPath: "/how-it-works",
      ogTitle: "How the ClientSurge AI Brain Works",
      ogDescription:
        "From package selection to guided intake to remote launch — see how ClientSurge organizes business automation setup.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main id="main-content" className="flex-1">

        {/* ── 1. Hero ── */}
        <section
          className="px-6 pb-16 pt-[calc(var(--cs-nav-height)+56px)] md:px-10"
          style={{
            background:
              "linear-gradient(135deg, #f7fbff 0%, #ffffff 50%, #eef8ff 100%)",
            borderBottom: "1px solid rgba(0,174,239,0.1)",
          }}
        >
          <div className="mx-auto max-w-4xl text-left">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4">
              Business AI Automation Store
            </p>
            <h1 className="font-titles text-3xl font-extrabold leading-tight text-foreground md:text-5xl mb-5">
              How the ClientSurge AI Brain Turns a Business Signup Into a Remote Setup Plan
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground max-w-2xl mb-8 md:text-lg">
              ClientSurge combines package selection, guided intake, setup checklists, automation templates, communication tracking, and remote configuration workflows so businesses can move from choosing an AI automation system to getting it prepared, tested, and launched.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/start"
                className="cs-btn-primary flex items-center gap-2"
                style={{ minHeight: "unset", minWidth: "unset", fontSize: "0.9rem" }}
              >
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Browse AI Automation Systems
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. Horizontal Process ── */}
        <section className="px-6 py-16 md:px-10" style={{ background: "#ffffff" }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h2 className="font-titles text-2xl font-bold text-foreground md:text-3xl">
                From Selection to Launch
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-10 max-w-2xl">
              The goal is simple: make buying business automation feel less like hiring an agency from scratch and more like choosing the system your business needs, answering the right setup questions, and moving into a clear remote installation path.
            </p>

            {/* Process steps */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-0 min-w-max">
                {PROCESS_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 w-28 text-center">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: i === 0 || i === PROCESS_STEPS.length - 1 ? "linear-gradient(135deg,#003B8F,#00AEEF)" : "#00AEEF" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold text-foreground leading-tight">{step}</span>
                    </div>
                    {i < PROCESS_STEPS.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-primary/50 mx-1 mb-4 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. AI Brain Layers ── */}
        <section className="px-6 py-16 md:px-10" style={{ background: "#f7fbff" }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h2 className="font-titles text-2xl font-bold text-foreground md:text-3xl">
                What the AI Brain Organizes
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-10 max-w-2xl">
              Six operating layers that turn business intake into a structured remote setup path.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AI_BRAIN_LAYERS.map((layer) => {
                const Icon = layer.icon;
                return (
                  <div
                    key={layer.title}
                    className="rounded-xl border border-border bg-white p-5 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground mb-2">{layer.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{layer.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 4. Honest Backend Foundation ── */}
        <section className="px-6 py-16 md:px-10" style={{ background: "#ffffff" }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h2 className="font-titles text-2xl font-bold text-foreground md:text-3xl">
                Built on a Real Automation Operating System Foundation
              </h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-8">
              ClientSurge is being built around real operating-system components for business automation, not just static landing pages. The platform foundation includes package selection, lead intake, service keys, onboarding records, client projects, communication events, and outcome analytics.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {FOUNDATION_POINTS.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{point}</span>
                </div>
              ))}
            </div>

            {/* Honesty note */}
            <div
              className="rounded-lg border p-4 text-sm text-muted-foreground leading-relaxed"
              style={{ borderColor: "rgba(0,174,239,0.2)", background: "rgba(0,174,239,0.04)" }}
            >
              <span className="font-semibold text-foreground">Note: </span>
              Some advanced orchestration and proof systems are still being hardened before they should be described as fully autonomous. ClientSurge uses guided intake and remote setup workflows to keep the process clear, trackable, and safer.
            </div>
          </div>
        </section>

        {/* ── 5. What Happens After Signup ── */}
        <section className="px-6 py-16 md:px-10" style={{ background: "#f7fbff" }}>
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h2 className="font-titles text-2xl font-bold text-foreground md:text-3xl">
                What Happens After You Start Setup
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-10 max-w-2xl">
              After the business submits intake, ClientSurge reviews package/service context, business details, lead sources, phone/email setup needs, CRM/booking tools, and access requirements. The goal is to move the business into a remote setup checklist so automations can be configured and tested before launch.
            </p>

            <div className="overflow-x-auto pb-2">
              <div className="flex items-start gap-0 min-w-max">
                {POST_SIGNUP_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center gap-2 w-32 text-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: "#003B8F" }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-xs font-semibold text-foreground leading-tight">{step}</span>
                    </div>
                    {i < POST_SIGNUP_STEPS.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-primary/40 mx-1 mb-5 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. Comparison Table ── */}
        <section className="px-6 py-16 md:px-10" style={{ background: "#ffffff" }}>
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 rounded-full bg-primary" />
              <h2 className="font-titles text-2xl font-bold text-foreground md:text-3xl">
                Why This Is Different From a Normal AI Agency
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
              Most AI agencies start with discovery calls and rebuild context from scratch each time. ClientSurge starts with your package selection and preserves context through the entire setup workflow.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#f7fbff" }}>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-1/4">Category</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground w-[37.5%]">Normal AI Agency</th>
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider w-[37.5%]" style={{ color: "#003B8F" }}>ClientSurge AI Automation Store</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.label} style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fcff" }}>
                      <td className="px-5 py-3.5 font-semibold text-foreground border-t border-border/50">{row.label}</td>
                      <td className="px-5 py-3.5 text-muted-foreground border-t border-border/50">{row.agency}</td>
                      <td className="px-5 py-3.5 text-foreground font-medium border-t border-border/50">
                        <span className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {row.clientsurge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── 7. Final CTA ── */}
        <section
          className="px-6 py-16 md:px-10 text-center"
          style={{
            background: "linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%)",
          }}
        >
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200/80 mb-4">
              Business AI Automation Store
            </p>
            <h2 className="font-titles text-2xl font-bold text-white md:text-3xl mb-4">
              Ready to Start With a System Instead of a Guess?
            </h2>
            <p className="text-blue-100/80 text-sm leading-relaxed mb-8">
              Choose your package or automation system, answer guided intake, and move into a clear remote setup path.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/start"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold transition-all hover:bg-blue-50"
                style={{ color: "#003B8F" }}
              >
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/store"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-all"
              >
                Browse Automation Store
              </Link>
              <Link
                to="/book"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-6 py-3 text-sm font-medium text-blue-100 hover:text-white hover:border-white/40 transition-all"
              >
                Not sure? Book a Free Automation Audit
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <MobileCallBar />
    </div>
  );
}