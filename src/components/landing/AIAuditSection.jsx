import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Loader2, Sparkles, Target, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";

const industries = [
  "Med Spas & Aesthetic Clinics",
  "Dental & Orthodontics",
  "Chiropractic & Physical Therapy",
  "HVAC, Plumbing & Home Services",
  "Roofing & Restoration",
  "Contractors & Trades",
];

export default function AIAuditSection() {
  const [form, setForm] = useState({
    website: "",
    industry: industries[0],
    monthlyLeads: "25-50",
    bookingMethod: "Online form + manual follow-up",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!form.website.trim()) {
      setError("Enter your website so the audit has context.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const audit = await base44.integrations.Core.InvokeLLM({
        prompt: `You are auditing a service business website for lead response, follow-up, booking flow, and conversion friction.

Business details:
- Website: ${form.website}
- Industry: ${form.industry}
- Monthly leads: ${form.monthlyLeads}
- Current booking method: ${form.bookingMethod}

Return a concise audit as JSON with:
- audit_score: number from 0 to 100
- biggest_leak: short sentence
- top_fixes: array of exactly 3 short fixes
- likely_recovered_revenue: short sentence
- next_best_step: short sentence
`,
        response_json_schema: {
          type: "object",
          properties: {
            audit_score: { type: "number" },
            biggest_leak: { type: "string" },
            top_fixes: { type: "array", items: { type: "string" } },
            likely_recovered_revenue: { type: "string" },
            next_best_step: { type: "string" },
          },
          required: ["audit_score", "biggest_leak", "top_fixes", "likely_recovered_revenue", "next_best_step"],
        },
      });
      setResult(audit);
    } catch (e) {
      setError("The audit could not be generated right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">AI Instant Audit</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Get a 60-second AI audit of your current lead flow
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl">
            Enter your website and a little context. We will highlight the most likely booking leaks and the fastest automation wins.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Website</label>
              <input
                value={form.website}
                onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourbusiness.com"
                className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Industry</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {industries.map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Monthly leads</label>
                <select
                  value={form.monthlyLeads}
                  onChange={(e) => setForm((prev) => ({ ...prev, monthlyLeads: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {["0-25", "25-50", "50-100", "100+"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Booking method</label>
                <select
                  value={form.bookingMethod}
                  onChange={(e) => setForm((prev) => ({ ...prev, bookingMethod: e.target.value }))}
                  className="w-full h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {["Online form + manual follow-up", "Calendly or scheduler link", "Phone-first booking", "No clear booking process"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
              Generate AI Audit
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm min-h-[420px]">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <TriangleAlert className="w-8 h-8 text-primary/70 mb-4" />
              <p className="text-lg font-semibold text-foreground">Your audit will appear here</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                We will score your current setup, surface the most likely booking leak, and recommend the fastest next fix.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Audit score</p>
                  <p className="font-display text-5xl font-semibold text-foreground">{result.audit_score}<span className="text-lg text-muted-foreground">/100</span></p>
                </div>
                <Link to="/book" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                  Book a review call
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Biggest likely leak</p>
                  <p className="text-sm text-foreground">{result.biggest_leak}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Top fixes</p>
                  <ul className="space-y-2">
                    {result.top_fixes?.map((fix) => (
                      <li key={fix} className="text-sm text-foreground/80">• {fix}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55 mb-2">Likely upside</p>
                  <p className="text-sm text-foreground">{result.likely_recovered_revenue}</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Next best step</p>
                  <p className="text-sm text-foreground">{result.next_best_step}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
