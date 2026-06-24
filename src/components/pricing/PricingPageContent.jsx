import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, ChevronRight, CheckCircle2, ShieldCheck, Wallet, HelpCircle } from "lucide-react";
import { trackCTA } from "@/lib/analytics";
import { getSelectedIndustryRecommendation, INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import MoneyBackGuarantee from "@/components/landing/MoneyBackGuarantee";

const PACKAGES = [
  {
    key: "starter_system",
    name: "Starter System",
    setup: "$797",
    monthly: "$497",
    positioning: "For businesses that need the essential lead capture and missed-call recovery foundation installed fast.",
    highlight: false,
    features: [
      "Instant Lead Response",
      "Missed-Call Recovery",
      "Basic setup guidance",
      "Owner notification / CRM handoff where supported",
      "Remote setup workflow",
    ],
    cta: "Choose Starter",
    ctaStyle: "secondary",
  },
  {
    key: "growth_system",
    name: "Growth System",
    badge: "Recommended",
    setup: "$1,297",
    monthly: "$997",
    positioning: "For businesses that want a complete lead-to-booking system.",
    highlight: true,
    features: [
      "Everything in Starter",
      "AI Follow-Up / 14-Day Nurture Sequence",
      "AI Booking Agent",
      "Stronger lead routing and follow-up structure",
      "Remote setup and testing workflow",
    ],
    cta: "Choose Growth",
    ctaStyle: "primary",
  },
  {
    key: "pro_system",
    name: "Pro System",
    setup: "$2,497",
    monthly: "$1,997",
    positioning: "For businesses that want the full revenue recovery engine.",
    highlight: false,
    features: [
      "Everything in Growth",
      "Lead Reactivation",
      "Review Request Automation",
      "Advanced automation setup coverage",
      "Higher-touch remote setup and launch support",
    ],
    cta: "Choose Pro",
    ctaStyle: "secondary",
  },
];

const COMPARISON_ROWS = [
  { label: "Instant Lead Response",        starter: true,  growth: true,  pro: true },
  { label: "Missed-Call Recovery",          starter: true,  growth: true,  pro: true },
  { label: "AI Follow-Up / Nurture",        starter: false, growth: true,  pro: true },
  { label: "AI Booking Agent",              starter: false, growth: true,  pro: true },
  { label: "Review Request Automation",     starter: false, growth: false, pro: true },
  { label: "Lead Reactivation",             starter: false, growth: false, pro: true },
  { label: "Remote setup workflow",         starter: true,  growth: true,  pro: true },
  { label: "Testing / launch checklist",    starter: true,  growth: true,  pro: true },
  { label: "Best for",                      starter: "Essentials", growth: "Full System", pro: "Revenue Recovery" },
];

const PROCESS_STEPS = [
  "Choose Package",
  "Guided AI Intake",
  "Access Checklist",
  "Remote Configuration",
  "Testing",
  "Launch",
];

const FAQ_ITEMS = [
  {
    q: "Do I need a new website?",
    a: "No. ClientSurge automation systems work with your existing website and lead sources where supported. A new website can be added as part of the Pro System, but it's not required to start.",
  },
  {
    q: "Can this work with my existing CRM?",
    a: "CRM handoff and routing are supported where the CRM accepts webhook-based lead delivery. We confirm specific CRM compatibility during guided intake.",
  },
  {
    q: "Do I need Twilio, email, or booking tools?",
    a: "ClientSurge uses Twilio for SMS and Resend for email delivery as part of the remote setup workflow. Booking links can use your existing calendar tool — we confirm requirements during intake.",
  },
  {
    q: "Can I start with an audit first?",
    a: "Yes. You can book a free automation audit before choosing a package. The audit helps identify which systems fit your current lead flow and follow-up gaps.",
  },
  {
    q: "What happens after I choose a package?",
    a: "After choosing a package, ClientSurge collects business details, lead sources, phone and email requirements, booking links, CRM details, and automation goals through guided AI intake. The system then organizes a setup plan so the automations can be configured, tested, and launched.",
  },
  {
    q: "What if I am not sure which package fits?",
    a: "Book a free audit and we'll walk through your lead volume, follow-up gaps, and goals to recommend the right starting point. Most businesses start with Growth.",
  },
];

function ComparisonCell({ value }) {
  if (value === true) return <Check className="w-5 h-5 text-green-600 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-xs font-medium text-muted-foreground">{value}</span>;
}

export default function PricingPageContent() {
  const navigate = useNavigate();
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const sync = () => {
      const stored = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
      setSelectedIndustry(stored ? getSelectedIndustryRecommendation() : null);
    };
    sync();
    window.addEventListener("clientsurge:industry-selected", sync);
    return () => window.removeEventListener("clientsurge:industry-selected", sync);
  }, []);

  const handlePackageCTA = (pkg) => {
    trackCTA(`package_${pkg.key}`, "pricing_page");
    navigate(`/product-signup?package=${pkg.key}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="pt-[calc(var(--cs-nav-height)+40px)] pb-12 px-6 text-center">
        <p className="cs-eyebrow mb-3">Business AI Automation Packages</p>
        <h1 className="font-titles text-foreground mb-4">Choose Your Business AI Automation Package</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Start with the automation bundle that matches your current lead volume, follow-up gaps, and remote setup needs.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {[
            { Icon: ShieldCheck, text: "Secure Stripe Checkout" },
            { Icon: CheckCircle2, text: "No Long-Term Contract" },
            { Icon: Wallet, text: "Month-to-Month Billing" },
          ].map(({ Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg border"
              style={{ background: "rgba(0,174,239,0.08)", borderColor: "rgba(0,174,239,0.28)", color: "#00AEEF" }}
            >
              <Icon className="h-3.5 w-3.5" /> {text}
            </span>
          ))}
        </div>

        {selectedIndustry && (
          <div className="max-w-xl mx-auto mb-6 rounded-lg border border-primary/15 bg-primary/5 px-5 py-3 text-left">
            <p className="text-xs font-semibold text-primary tracking-wider uppercase mb-1">
              Recommended for {selectedIndustry.shortName}
            </p>
            <p className="text-sm font-semibold text-foreground">
              Start with the {selectedIndustry.recommendedPackage?.name}
            </p>
          </div>
        )}
      </div>

      {/* Quick selector */}
      <div className="px-6 pb-8 max-w-3xl mx-auto">
        <div className="rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm font-semibold text-foreground mb-3 text-center">Not sure where to start?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Just getting started", sub: "Need lead capture + missed-call recovery", pkg: "Starter" },
              { label: "Want more bookings", sub: "Need follow-up, nurture + booking automation", pkg: "Growth", highlight: true },
              { label: "Full revenue recovery", sub: "Want reviews, reactivation + full stack", pkg: "Pro" },
            ].map((opt) => (
              <button
                key={opt.pkg}
                onClick={() => { trackCTA(`quick_select_${opt.pkg.toLowerCase()}`, "pricing_page"); navigate(`/product-signup?package=${opt.pkg.toLowerCase()}_system`); }}
                className={`rounded-lg border p-3 text-left transition-all hover:border-primary/50 hover:bg-primary/5 ${opt.highlight ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <p className="font-semibold text-foreground text-xs mb-0.5">{opt.label}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{opt.sub}</p>
                <p className="text-primary text-xs font-bold mt-1.5">→ {opt.pkg} System</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Package Cards */}
      <div className="px-6 pb-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.key}
              className={`relative rounded-xl border flex flex-col transition-all ${
                pkg.highlight
                  ? "border-primary shadow-lg"
                  : "border-border"
              }`}
              style={pkg.highlight ? { boxShadow: "0 8px 32px rgba(0,174,239,0.18)", background: "linear-gradient(160deg, rgba(0,174,239,0.04) 0%, #ffffff 60%)" } : {}}
            >
              {pkg.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(90deg, #0079c1, #005691)" }}
                  >
                    ✦ {pkg.badge}
                  </span>
                </div>
              )}
              <div className="p-7 flex flex-col flex-1" style={{ paddingTop: pkg.badge ? "28px" : "28px" }}>
                <h3 className="text-lg font-bold text-foreground mb-1">{pkg.name}</h3>
                <p className="text-xs text-muted-foreground mb-5 leading-relaxed">{pkg.positioning}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-foreground">{pkg.monthly}</span>
                    <span className="text-sm text-muted-foreground font-semibold">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{pkg.setup} one-time setup</p>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`/product-signup?package=${pkg.key}`}
                  onClick={() => trackCTA(`package_${pkg.key}`, "pricing_page")}
                  className={pkg.ctaStyle === "primary" ? "cs-btn-primary w-full text-center justify-center" : "w-full text-center justify-center inline-flex items-center rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors py-3 px-4"}
                  style={{ minHeight: "unset", minWidth: "unset", textDecoration: "none" }}
                >
                  {pkg.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            <strong>Not sure which plan fits?</strong>{" "}
            <button
              onClick={() => { trackCTA("book_audit_pricing", "pricing_page"); navigate("/book"); }}
              className="text-primary font-semibold underline underline-offset-4 hover:text-primary/80 bg-transparent border-none cursor-pointer"
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              Book a free audit
            </button>
            {" "}and we'll recommend the right starting point.
          </p>
        </div>

        <MoneyBackGuarantee />
      </div>

      {/* Comparison Table */}
      <div className="px-6 pb-16 max-w-5xl mx-auto">
        <h2 className="font-titles text-foreground text-2xl md:text-3xl font-bold text-center mb-8">Compare Packages</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground w-1/2">Feature</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Starter</th>
                <th className="text-center px-4 py-3 font-semibold text-primary">Growth</th>
                <th className="text-center px-4 py-3 font-semibold text-foreground">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                  <td className="px-5 py-3 font-medium text-foreground">{row.label}</td>
                  <td className="px-4 py-3 text-center"><ComparisonCell value={row.starter} /></td>
                  <td className="px-4 py-3 text-center"><ComparisonCell value={row.growth} /></td>
                  <td className="px-4 py-3 text-center"><ComparisonCell value={row.pro} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* What Happens After You Choose */}
      <div className="px-6 pb-16 max-w-5xl mx-auto">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-10">
          <h2 className="font-titles text-foreground text-xl md:text-2xl font-bold text-center mb-3">What Happens After You Choose</h2>
          <p className="text-muted-foreground text-sm text-center max-w-2xl mx-auto mb-8 leading-relaxed">
            After you choose a package, ClientSurge collects the business details, lead sources, phone and email requirements, booking links, CRM details, and automation goals needed to prepare remote setup. The system then organizes the setup plan so the automations can be configured, tested, and launched with a clear client checklist.
          </p>

          {/* Horizontal process */}
          <div className="flex flex-wrap items-center justify-center gap-0">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center">
                <div className="flex flex-col items-center gap-2 px-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0088CC, #005691)" }}
                  >
                    {i + 1}
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center whitespace-nowrap">{step}</span>
                </div>
                {i < PROCESS_STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 mb-4" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => { trackCTA("start_remote_setup_pricing", "pricing_page"); navigate("/start"); }}
              className="cs-btn-primary inline-flex items-center gap-2"
            >
              Start Remote Setup
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="px-6 pb-20 max-w-3xl mx-auto">
        <h2 className="font-titles text-foreground text-xl md:text-2xl font-bold text-center mb-8">Common Questions</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-foreground hover:bg-muted/30 transition-colors"
                style={{ minHeight: "unset", minWidth: "unset" }}
              >
                <span>{item.q}</span>
                <HelpCircle className={`w-4 h-4 flex-shrink-0 transition-colors ${openFaq === i ? "text-primary" : "text-muted-foreground"}`} />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}