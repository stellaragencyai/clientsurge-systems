import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemoBooking } from "./DemoBookingContext";

const industries = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
];

const routeMap = {
  book: { href: "/book", label: "Free Automation Audit" },
  med_spa: { href: "/med-spa", label: "See the Med Spa Page" },
  industries: { href: "/industries", label: "Explore Industries" },
  contact: { href: "/contact", label: "Talk to Our Team" },
};

export default function AIRoutingForm() {
  const demoBooking = useDemoBooking();
  const [form, setForm] = useState({
    industry: industries[0],
    urgency: "Need help this month",
    leadVolume: "25-50 leads/month",
    mainNeed: "Fix lead follow-up and booking leaks",
  });
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const handleRoute = async () => {
    setLoading(true);
    setRecommendation(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an AI concierge routing a website visitor to the best next step.

Visitor details:
- Industry: ${form.industry}
- Urgency: ${form.urgency}
- Lead volume: ${form.leadVolume}
- Main need: ${form.mainNeed}

Return JSON with:
- route: exactly one of "book", "med_spa", "industries", "contact"
- summary: one short sentence
- reason: one short sentence explaining why
`,
        response_json_schema: {
          type: "object",
          properties: {
            route: { type: "string" },
            summary: { type: "string" },
            reason: { type: "string" },
          },
          required: ["route", "summary", "reason"],
        },
      });
      setRecommendation(result);
    } finally {
      setLoading(false);
    }
  };

  const cta = recommendation ? routeMap[recommendation.route] || routeMap.book : routeMap.book;
  const shouldOpenModal = cta.href === "/book" && Boolean(demoBooking);

  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-5xl mx-auto rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-border">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">AI Routing Form</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Tell us where you are, and we will route you to the best next step
            </h2>
            <p className="mt-4 text-muted-foreground text-base">
              This helps colder visitors avoid the wrong CTA and helps higher-intent visitors get to the right conversation faster.
            </p>

            <div className="mt-8 space-y-4">
              <SelectField label="Industry" value={form.industry} onChange={(value) => setForm((prev) => ({ ...prev, industry: value }))} options={industries} />
              <SelectField label="Urgency" value={form.urgency} onChange={(value) => setForm((prev) => ({ ...prev, urgency: value }))} options={["Need help this week", "Need help this month", "Researching options"]} />
              <SelectField label="Lead volume" value={form.leadVolume} onChange={(value) => setForm((prev) => ({ ...prev, leadVolume: value }))} options={["0-25 leads/month", "25-50 leads/month", "50-100 leads/month", "100+ leads/month"]} />
              <SelectField label="Main need" value={form.mainNeed} onChange={(value) => setForm((prev) => ({ ...prev, mainNeed: value }))} options={["Fix lead follow-up and booking leaks", "Need a clearer industry solution", "Want pricing and implementation details", "Need a custom conversation first"]} />
            </div>

            <button
              onClick={handleRoute}
              disabled={loading}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Route Me Intelligently
            </button>
          </div>

          <div className="p-8 md:p-10 bg-background">
            {!recommendation ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <p className="text-lg font-semibold text-foreground">Your recommendation will appear here</p>
                <p className="mt-3 text-sm text-muted-foreground max-w-sm">
                  We will recommend whether you should book now, explore an industry page, or talk to us first.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Recommended path</p>
                <h3 className="font-display text-3xl font-semibold text-foreground mb-3">{cta.label}</h3>
                <p className="text-sm text-foreground mb-4">{recommendation.summary}</p>
                <div className="rounded-2xl border border-border bg-card p-4 mb-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Why this route</p>
                  <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
                </div>
                {shouldOpenModal ? (
                  <button
                    type="button"
                    onClick={demoBooking.openDemoBooking}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    {cta.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <Link
                    to={cta.href}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    {cta.label}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

