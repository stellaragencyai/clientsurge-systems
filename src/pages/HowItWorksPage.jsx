import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const PROCESS_STEPS = [
  { label: "Browse Systems", desc: "Choose the automation system or package that fits your business." },
  { label: "Choose Package", desc: "Starter, Growth, or Pro — or start with a single automation." },
  { label: "Guided AI Intake", desc: "Answer setup questions about your business, tools, and lead sources." },
  { label: "Setup Plan", desc: "ClientSurge organizes what needs configuring and what access is needed." },
  { label: "Remote Configuration", desc: "Automations are configured against your business context remotely." },
  { label: "Testing", desc: "Workflows are checked before being treated as live." },
  { label: "Launch", desc: "Go-live with a clear setup record and tracked status." },
];

const AI_BRAIN_LAYERS = [
  {
    label: "A. Selection Context",
    body: "Preserves the package or automation system a business selected, such as Starter, Growth, Pro, missed-call recovery, booking automation, follow-up, reviews, or reactivation.",
  },
  {
    label: "B. Guided Intake",
    body: "Collects business details, lead sources, booking links, CRM/tool stack, phone/email requirements, goals, and setup notes.",
  },
  {
    label: "C. Setup Plan",
    body: "Turns intake information into a clearer setup path: what needs to be configured, what access is missing, what automations are included, and what should be tested before launch.",
  },
  {
    label: "D. Message + Workflow Prep",
    body: "Uses onboarding sequences, business templates, and service context to help prepare messages, routing, follow-up structure, and automation logic.",
  },
  {
    label: "E. Event + Status Tracking",
    body: "Logs important activity such as lead creation, workflow triggers, service status changes, emails, SMS activity, and setup progress where supported.",
  },
  {
    label: "F. Remote Launch Path",
    body: "Gives the client a clearer route from intake to remote configuration, testing, and launch review.",
  },
];

const FOUNDATION_ITEMS = [
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

const AFTER_SIGNUP_STEPS = [
  "Submit Intake",
  "Review Setup Needs",
  "Confirm Missing Access",
  "Configure Automations",
  "Test Workflow",
  "Launch Review",
];

const COMPARISON_ROWS = [
  {
    aspect: "Starting point",
    agency: "Vague discovery calls",
    cs: "Package/system selection",
  },
  {
    aspect: "Business context",
    agency: "Re-explains the business from scratch",
    cs: "Guided intake collects setup information",
  },
  {
    aspect: "Workflow building",
    agency: "Custom one-off workflows built manually",
    cs: "Preserves package and service context",
  },
  {
    aspect: "Buyer visibility",
    agency: "Buyer does not know what happens next",
    cs: "Organizes setup into a remote workflow",
  },
  {
    aspect: "Tracking",
    agency: "Typically no status tracking",
    cs: "Tracks leads, communication events, and project status where supported",
  },
];

export default function HowItWorksPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "How It Works — ClientSurge AI Brain & Remote Setup | ClientSurge Systems",
      description:
        "See how the ClientSurge AI Brain turns a business signup into a remote setup plan: package selection, guided intake, setup checklists, automation templates, communication tracking, and remote configuration.",
      canonicalPath: "/how-it-works",
      ogTitle: "How the ClientSurge AI Brain Works",
      ogDescription:
        "Package selection, guided intake, remote setup checklists, and communication tracking — see how ClientSurge organizes the remote AI automation setup process.",
    });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1">

        {/* ── Hero ── */}
        <section className="pt-[calc(var(--cs-nav-height)+48px)] pb-16 px-6 bg-white">
          <div className="max-w-3xl mx-auto text-left">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-4">
              Business AI Automation Packages
            </p>
            <h1 className="font-titles text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-4">
              How the ClientSurge AI Brain Turns a Business Signup Into a Remote Setup Plan
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mb-8">
              ClientSurge combines package selection, guided intake, setup checklists, automation templates, communication tracking, and remote configuration workflows so businesses can move from choosing an AI automation system to getting it prepared, tested, and launched.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/start" className="cs-btn-primary" style={{ minHeight: "unset", minWidth: "unset", fontSize: "0.875rem" }}>
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Compare AI Automation Systems
              </Link>
            </div>
          </div>
        </section>

        {/* ── Horizontal Process ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Process</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              From Selection to Launch
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-10">
              The goal is simple: make buying business automation feel less like hiring an agency from scratch and more like choosing the system your business needs, answering the right setup questions, and moving into a clear remote installation path.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PROCESS_STEPS.map((step, i) => (
                <div key={step.label} className="rounded-lg border border-border bg-white p-5 relative">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">{step.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI Brain Operating Layers ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">AI Brain</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">
              What the AI Brain Organizes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AI_BRAIN_LAYERS.map((layer) => (
                <div key={layer.label} className="rounded-lg border border-border p-5 bg-white">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{layer.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{layer.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Foundation ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Foundation</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              Built on a Real Automation Operating System Foundation
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-8">
              ClientSurge is being built around real operating-system components for business automation, not just static landing pages. The platform foundation includes package selection, lead intake, service keys, onboarding records, client projects, communication events, and outcome analytics.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {FOUNDATION_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4 max-w-2xl">
              Some advanced orchestration and proof systems are still being hardened before they should be described as fully autonomous. ClientSurge uses guided intake and remote setup workflows to keep the process clear, trackable, and safer.
            </p>
          </div>
        </section>

        {/* ── After Signup ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">After Signup</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              What Happens After You Start Setup
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-8">
              After the business submits intake, ClientSurge reviews package/service context, business details, lead sources, phone/email setup needs, CRM/booking tools, and access requirements. The goal is to move the business into a remote setup checklist so automations can be configured and tested before launch.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {AFTER_SIGNUP_STEPS.map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-semibold text-foreground">
                    {step}
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Differentiation</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">
              Why This Is Different From a Normal AI Agency
            </h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground w-1/4">Aspect</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground w-3/8">Normal AI Agency</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary w-3/8">ClientSurge Store</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row, i) => (
                    <tr key={row.aspect} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                      <td className="px-4 py-3 font-semibold text-foreground text-xs">{row.aspect}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.agency}</td>
                      <td className="px-4 py-3 text-foreground font-medium">{row.cs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="py-16 px-6 bg-white border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Ready to Start With a System Instead of a Guess?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Choose your package, complete guided intake, and move into a clear remote setup workflow.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/start" className="cs-btn-primary" style={{ minHeight: "unset", minWidth: "unset", fontSize: "0.875rem" }}>
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Compare Packages
              </Link>
              <Link to="/book" className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors">
                Book a Free Audit
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
