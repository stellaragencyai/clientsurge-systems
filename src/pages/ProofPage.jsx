import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import MobileCallBar from "@/components/landing/MobileCallBar";
import { setPageMetadata } from "@/lib/seo";

const FOUNDATION_ITEMS = [
  "Package and service selection context",
  "Business intake and lead records",
  "Onboarding client records",
  "Client project setup status",
  "Communication event logging",
  "Email onboarding sequence",
  "Business-specific templates",
  "Lead outcome analytics foundation",
  "Twilio SMS support where configured",
  "Resend email support where configured",
  "AI voice automation rules where enabled",
];

const EXPECTATION_CARDS = [
  {
    title: "Clear Package Context",
    body: "Your selected package or automation system should stay attached to your intake record so setup does not start from scratch.",
  },
  {
    title: "Guided Setup Intake",
    body: "The system asks for business details, lead sources, booking tools, CRM/tool stack, phone/email requirements, timeline, and notes.",
  },
  {
    title: "Remote Setup Checklist",
    body: "The setup path should make missing information and required access obvious before configuration begins.",
  },
  {
    title: "Communication Tracking",
    body: "Important actions such as lead creation, workflow triggers, SMS/email activity, and service status changes can be logged where supported.",
  },
  {
    title: "Testing Before Launch",
    body: "Automations should be checked before they are treated as live for a customer.",
  },
  {
    title: "Human Review Where Needed",
    body: "Some setup steps still require review, access approval, or provider configuration. ClientSurge does not pretend every integration is instant or automatic.",
  },
];

const NO_FAKE_LIST = [
  "We do not invent client testimonials.",
  "We do not fake revenue results.",
  "We do not claim every integration is instant.",
  "We do not treat untested automations as live.",
  "We do not hide that some setup inputs require client access or approval.",
  "We do not call something fully autonomous until the proof layer supports it.",
];

const PREVIEW_CARDS = [
  { label: "Remote Setup Checklist", desc: "What access is needed, what is configured, what is missing — organized by service." },
  { label: "Package-to-Service Mapping", desc: "Which automations are included in Starter, Growth, and Pro packages." },
  { label: "Lead Intake Record Fields", desc: "Business name, email, phone, lead sources, website, consent, and UTM context." },
  { label: "Missed-Call Recovery Flow", desc: "Missed call → SMS text-back within minutes → follow-up sequence if no reply." },
  { label: "Follow-Up Sequence Structure", desc: "Day 0 instant response → Day 1 follow-up → Day 3 check-in → Day 7 reactivation." },
  { label: "Setup Status Path", desc: "Payment received → Onboarding → Access verified → Setup in progress → QA → Go-live." },
  { label: "Communication Event Types", desc: "lead_created, sms_sent, email_sent, booking_created, status_update, order_paid." },
];

const SAFE_INPUT_FLOW = [
  "Clean Inputs",
  "Better Setup Plan",
  "Faster Configuration",
  "Safer Testing",
  "Cleaner Launch",
];

const FAQ_ITEMS = [
  {
    q: "Is everything fully automatic after I sign up?",
    a: "ClientSurge uses AI-powered intake and remote setup workflows, but some integrations and launch steps may require review, access, or provider configuration.",
  },
  {
    q: "Do I need to give access to my CRM, website, phone, or email tools?",
    a: "Some automations require access or setup details. The intake and checklist should make missing requirements clear.",
  },
  {
    q: "Can I start without knowing exactly what I need?",
    a: "Yes. Start with the audit path or choose a package and provide your business details. The setup process can clarify what is missing.",
  },
  {
    q: "Are results guaranteed?",
    a: "No. ClientSurge can improve response systems and follow-up infrastructure, but revenue depends on offer, market, traffic, sales process, and execution.",
  },
  {
    q: "Will automations be tested before launch?",
    a: "They should be tested before being treated as live.",
  },
  {
    q: "What makes this different from hiring a regular AI agency?",
    a: "ClientSurge starts with defined automation systems, guided intake, package/service context, setup tracking, and a repeatable remote setup model.",
  },
];

export default function ProofPage() {
  useEffect(() => {
    return setPageMetadata({
      title: "Proof — What ClientSurge Is Actually Built On | ClientSurge Systems",
      description:
        "Honest proof that ClientSurge is more than an AI agency landing page. See what the platform foundation supports today, what buyers should expect, and what we do not fake.",
      canonicalPath: "/proof",
      ogTitle: "Proof That ClientSurge Is More Than an AI Agency Landing Page",
      ogDescription:
        "Package selection, guided intake, remote setup checklists, service tracking, communication logs, and outcome analytics foundations — see what exists today.",
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
              Honest Platform Proof
            </p>
            <h1 className="font-titles text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-4">
              Proof That ClientSurge Is More Than an AI Agency Landing Page
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-2xl mb-8">
              ClientSurge is being built as a business automation operating system: package selection, guided intake, remote setup checklists, service tracking, communication logs, and outcome analytics foundations working together to support remote AI automation setup.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/start" className="cs-btn-primary" style={{ minHeight: "unset", minWidth: "unset", fontSize: "0.875rem" }}>
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>
        </section>

        {/* ── What Exists Today ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Platform Foundation</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">
              What the Platform Foundation Already Supports
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {FOUNDATION_ITEMS.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-border bg-white px-4 py-3">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 leading-relaxed">
                <strong>Honest note:</strong> These are operating-system foundations. Some advanced orchestration, proof gates, and optimization layers are still being hardened before they should be described as fully autonomous.
              </p>
            </div>
          </div>
        </section>

        {/* ── Buyer Confidence Flow ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Risk Reduction</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              How Risk Is Reduced During Remote Setup
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-8">
              ClientSurge reduces setup risk by collecting the right business information first, preserving package/service context, organizing missing access requirements, and separating configuration from launch. Automations should be tested before they are treated as live.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {["Choose System", "Guided Intake", "Access Checklist", "Remote Configuration", "Testing", "Launch Review"].map((step, i, arr) => (
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

        {/* ── What You Can Expect ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Buyer Expectations</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">
              What You Can Expect
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {EXPECTATION_CARDS.map((card) => (
                <div key={card.title} className="rounded-lg border border-border bg-white p-5">
                  <h3 className="text-sm font-bold text-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── What We Do Not Fake ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" />
              <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
                What ClientSurge Does Not Fake
              </h2>
            </div>
            <div className="space-y-3">
              {NO_FAKE_LIST.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-lg border border-border px-4 py-3 bg-white">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Proof Preview ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">See the System</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2">
              See the System Before You Buy
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-xl">
              These are examples of how the platform organizes setup information — not fake screenshots or invented results.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PREVIEW_CARDS.map((card) => (
                <div key={card.label} className="rounded-lg border border-primary/15 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{card.label}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Safe Remote Setup ── */}
        <section className="py-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Setup Quality</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              Remote Setup Is Powerful — But It Needs Clean Inputs
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mb-8">
              The better the business provides its website, lead sources, booking tools, CRM, phone/email requirements, and access instructions, the faster the setup can move. ClientSurge uses guided intake and setup checklists to reduce confusion and avoid guessing.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {SAFE_INPUT_FLOW.map((step, i, arr) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-semibold text-foreground">
                    {step}
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">FAQ</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">
              Common Questions
            </h2>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item) => (
                <div key={item.q} className="rounded-lg border border-border bg-white p-5">
                  <p className="text-sm font-bold text-foreground mb-2">{item.q}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 px-6 bg-white border-t border-border">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
              Ready to Start With a System Instead of a Guess?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Choose a package, complete guided intake, and move into a remote setup workflow.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/start" className="cs-btn-primary" style={{ minHeight: "unset", minWidth: "unset", fontSize: "0.875rem" }}>
                Start Remote Setup <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/store" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors">
                Browse Automation Store
              </Link>
              <Link to="/book" className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors text-xs">
                Not sure? Book a Free Audit
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