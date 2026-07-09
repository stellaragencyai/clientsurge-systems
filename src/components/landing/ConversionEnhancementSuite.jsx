import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Gauge,
  LockKeyhole,
  MessageSquareText,
  PhoneMissed,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  UserCheck,
  Workflow,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

const omittedEnhancements = [
  "Content library filters",
  "Automation glossary expansion",
  "Founder biography block",
  "Lesson-quality style badges",
  "Standalone refund-card expansion",
];

const trustLedger = [
  {
    claim: "Instant lead response and missed-call recovery have internal QA proof.",
    status: "QA proof",
    evidence: "Base44 proof logs exist, but production-customer proof is still required.",
  },
  {
    claim: "ClientSurge can install packaged lead-capture automations.",
    status: "Build in progress",
    evidence: "Installation OS and checklist records exist; production order proof is still gated.",
  },
  {
    claim: "Checkout and onboarding are launch-critical.",
    status: "Needs proof",
    evidence: "Real non-test paid order and onboarding handoff are still required before aggressive sales traffic.",
  },
  {
    claim: "Dashboard metrics are truth-gated.",
    status: "Active guardrail",
    evidence: "Unverified metrics should show warning/blocked states instead of fake green checks.",
  },
];

const automationMap = [
  {
    icon: MessageSquareText,
    title: "Lead Capture",
    copy: "Turn forms, calls, and audit requests into tracked lead records with source and consent data.",
  },
  {
    icon: TimerReset,
    title: "Instant Response",
    copy: "Send fast confirmation by SMS/email so good prospects do not sit cold.",
  },
  {
    icon: PhoneMissed,
    title: "Missed-Call Recovery",
    copy: "Trigger a text-back when a call is missed and log the recovery attempt.",
  },
  {
    icon: CalendarCheck,
    title: "Booking Handoff",
    copy: "Push qualified leads toward a booking path instead of vague follow-up.",
  },
  {
    icon: Workflow,
    title: "Nurture Sequence",
    copy: "Follow up over time while respecting replies, opt-outs, and consent.",
  },
  {
    icon: BadgeCheck,
    title: "Proof Logging",
    copy: "Record what actually ran, what failed, and what is safe to show.",
  },
];

const packageFit = {
  starter: {
    label: "Starter System",
    score: 62,
    bestFor: "Businesses that need the website and lead-capture path cleaned up first.",
    includes: ["Website conversion cleanup", "Lead form routing", "Basic response path"],
  },
  growth: {
    label: "Growth System",
    score: 82,
    bestFor: "Businesses losing leads from slow response, missed calls, or inconsistent follow-up.",
    includes: ["Instant response", "Missed-call recovery", "Nurture follow-up", "Booking handoff"],
  },
  pro: {
    label: "Pro System",
    score: 93,
    bestFor: "Businesses that want the full operating system with proof, status, and deeper automation.",
    includes: ["Everything in Growth", "Review/reactivation flows", "Client proof dashboard", "Advanced status tracking"],
  },
};

const proofCards = [
  { label: "Public claim", value: "Must have source", icon: FileCheck2 },
  { label: "Metric", value: "Needs timestamp", icon: BarChart3 },
  { label: "Automation", value: "Needs proof log", icon: ClipboardCheck },
  { label: "Client status", value: "No fake green checks", icon: ShieldCheck },
];

const readinessQuestions = [
  "Do you know how many calls or form leads you miss each week?",
  "Does every website lead get a response in under 5 minutes?",
  "Do missed calls receive a professional text-back automatically?",
  "Are quote requests routed into one tracked lead system?",
  "Can you prove what follow-up happened after a lead submitted?",
];

const supportWindows = [
  { type: "Billing or checkout", window: "Same business day target", icon: LockKeyhole },
  { type: "Install/setup blocker", window: "Priority queue after purchase", icon: Workflow },
  { type: "General question", window: "1 business day target", icon: MessageSquareText },
];

const demoProgress = [
  "Order received",
  "Business profile collected",
  "Automation checklist created",
  "Provider credentials verified",
  "Test lead sent",
  "Client launch approval",
];

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function scoreLabel(score) {
  if (score >= 4) return "High leakage risk";
  if (score >= 2) return "Moderate leakage risk";
  return "Low known leakage risk";
}

export default function ConversionEnhancementSuite() {
  const [answers, setAnswers] = useState({});
  const [selectedFit, setSelectedFit] = useState("growth");
  const [auditUrl, setAuditUrl] = useState("");

  const readinessScore = useMemo(() => {
    const yesCount = Object.values(answers).filter(Boolean).length;
    return readinessQuestions.length - yesCount;
  }, [answers]);

  const fit = packageFit[selectedFit];

  return (
    <section id="enhanced-proof-funnel" className="bg-background py-16 md:py-24 px-4 border-y border-border/70">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-5">
            <Sparkles className="h-4 w-4" />
            20 conversion upgrades installed into the public story
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-5">
            A proof-first funnel for businesses that are leaking leads.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            This section turns ClientSurge from a feature list into a buyer journey: diagnose the leak, choose the right system, understand the install path, and see what still requires proof before public claims are trusted.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-2xl font-bold text-foreground">Free Website Lead Leakage Audit</h3>
                <p className="text-sm text-muted-foreground">Real lead magnet, clear next step, no vague demo request.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                "Slow response check",
                "Missed-call risk check",
                "CTA and form friction review",
                "Follow-up gap diagnosis",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <label className="text-sm font-semibold text-foreground" htmlFor="audit-url">Website to audit</label>
              <div className="mt-2 flex flex-col sm:flex-row gap-3">
                <input
                  id="audit-url"
                  value={auditUrl}
                  onChange={(event) => setAuditUrl(event.target.value)}
                  placeholder="https://yourbusiness.com"
                  className="min-h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Link
                  to={`/start${auditUrl ? `?website=${encodeURIComponent(auditUrl)}` : ""}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Start Audit <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Audit requests should create a WebsiteLead with source page, consent, UTM, and requested channel data.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <Gauge className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Brutal Readiness Score</h3>
            </div>
            <div className="space-y-3">
              {readinessQuestions.map((question, index) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => setAnswers((current) => ({ ...current, [index]: !current[index] }))}
                  className="w-full text-left rounded-2xl border border-border bg-background p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {answers[index] ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" /> : <XCircle className="h-5 w-5 text-muted-foreground mt-0.5" />}
                    <span className="text-sm text-foreground">{question}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-muted/60 p-5">
              <div className="text-3xl font-bold text-foreground">{readinessScore}/5</div>
              <p className="text-sm font-semibold text-primary mt-1">{scoreLabel(readinessScore)}</p>
              <p className="text-xs text-muted-foreground mt-2">This is an educational diagnostic, not a guarantee. It tells the prospect where the conversation should start.</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Route className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Interactive Automation Map</h3>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {automationMap.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="relative rounded-2xl border border-border bg-background p-4">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-bold text-primary mb-1">Step {index + 1}</div>
                    <h4 className="font-bold text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.copy}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">No-Hype Promise</h3>
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>ClientSurge should not claim fake client wins, fake revenue lift, or fake live automation status.</p>
              <p>Every metric needs a source, timestamp, and status: trusted, warning, blocked, or unknown.</p>
              <p>That is not weakness. It is how you build a system customers can trust.</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <FileCheck2 className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Public Trust Ledger</h3>
            </div>
            <div className="space-y-4">
              {trustLedger.map((row) => (
                <div key={row.claim} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-foreground">{row.claim}</h4>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{row.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{row.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <ClipboardCheck className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Dashboard Demo Preview</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-5">
              {proofCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-2xl bg-muted/50 p-4">
                    <Icon className="h-5 w-5 text-primary mb-3" />
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p className="font-bold text-foreground">{card.value}</p>
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>Demo dashboard data must be labeled sample/demo. Production dashboards should only show client-safe proof when the evidence exists.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <UserCheck className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Package Fit Engine</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {Object.keys(packageFit).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedFit(key)}
                  className={classNames(
                    "rounded-xl border px-3 py-2 text-xs font-bold transition-colors",
                    selectedFit === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {packageFit[key].label.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="rounded-2xl bg-muted/50 p-5">
              <div className="text-sm font-bold text-primary">{fit.score}% fit</div>
              <h4 className="text-xl font-bold text-foreground mt-1">{fit.label}</h4>
              <p className="text-sm text-muted-foreground mt-2">{fit.bestFor}</p>
              <ul className="mt-4 space-y-2">
                {fit.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Clock3 className="h-6 w-6 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">What Happens After Purchase</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {demoProgress.map((step, index) => (
                <div key={step} className="rounded-2xl border border-border bg-background p-4">
                  <div className="text-xs font-bold text-primary mb-2">{String(index + 1).padStart(2, "0")}</div>
                  <p className="font-semibold text-foreground">{step}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">This removes checkout anxiety and makes the installation path visible before a prospect pays.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground mb-4">Support Expectations</h3>
            <div className="space-y-3">
              {supportWindows.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.type} className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
                    <Icon className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">{item.type}</p>
                      <p className="text-sm text-muted-foreground">{item.window}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground mb-4">CTA Hierarchy</h3>
            <div className="space-y-3">
              <Link to="/start" className="flex items-center justify-between rounded-2xl bg-primary px-5 py-4 font-bold text-primary-foreground">
                Start Free Audit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/pricing" className="flex items-center justify-between rounded-2xl border border-border bg-background px-5 py-4 font-bold text-foreground">
                Compare Packages <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/contact" className="flex items-center justify-between rounded-2xl border border-border bg-background px-5 py-4 font-bold text-muted-foreground">
                Ask a Question <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-foreground mb-4">20 Included, 5 Intentionally Left Out</h3>
            <p className="text-sm text-muted-foreground mb-4">The least useful ideas were not added because they distract from the revenue path right now.</p>
            <ul className="space-y-2">
              {omittedEnhancements.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <XCircle className="h-4 w-4 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
