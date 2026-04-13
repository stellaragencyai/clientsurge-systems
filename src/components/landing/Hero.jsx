import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatCounter from "./StatCounter";
import ConversationModal from "./ConversationModal";

const businessTypes = [
  "Med Spa / Aesthetic Clinic",
  "Real Estate Agency",
  "Home Services",
  "Dental / Medical Practice",
  "Salon / Wellness Studio",
  "Other Service Business",
];

export default function Hero() {
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState("cta"); // "cta" | "form" | "done"
  const [bizType, setBizType] = useState("");
  const [leads, setLeads] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bizType || !leads) return;
    setSaving(true);
    await base44.entities.Lead.create({
      business_type: bizType,
      monthly_leads: leads,
      status: "new",
    });
    setSaving(false);
    setStep("done");
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 bg-gradient-to-b from-background to-card overflow-hidden">
      {/* Gold ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none" style={{background: 'radial-gradient(ellipse, rgba(161,120,35,0.18) 0%, transparent 70%)'}} />

      <div className="max-w-4xl mx-auto text-center relative z-10">

        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] text-foreground">
          Stop Losing Leads.
          <br />
          <span className="text-primary" style={{textShadow: '0 0 40px rgba(161,120,35,0.45)'}}>Automate Follow-Up.</span>
          <br />
          Book More Customers.
        </h1>

        <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Done-for-you AI systems that capture leads, respond instantly, automate follow-up, recover missed calls, and increase booked customers.
        </p>

        {/* Step: default CTA */}
        {step === "cta" && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo-booking">
              <Button
                size="lg"
                className="rounded-full px-8 h-13 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-13 text-base font-semibold gap-2"
              >
                See How It Works
              </Button>
            </a>
          </div>
        )}

        {/* Step: micro-qualifying form */}
        {step === "form" && !showModal && (
          <form
            onSubmit={handleSubmit}
            className="mt-10 max-w-md mx-auto bg-card border border-border rounded-2xl p-6 shadow-lg text-left"
          >
            <p className="text-sm font-semibold text-foreground mb-4">
              Tell us a bit about your business — we'll tailor the demo.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  What type of business do you run?
                </label>
                <select
                  value={bizType}
                  onChange={(e) => setBizType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  <option value="">Select your business type…</option>
                  {businessTypes.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  How many leads do you get per month?
                </label>
                <select
                  value={leads}
                  onChange={(e) => setLeads(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  <option value="">Select range…</option>
                  <option value="<25">Less than 25</option>
                  <option value="25-75">25 – 75</option>
                  <option value="75-200">75 – 200</option>
                  <option value="200+">200+</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <Button type="button" variant="outline" className="rounded-full flex-1 text-sm" onClick={() => setStep("cta")}>
                Back
              </Button>
              <a href="#book-demo" className="flex-1">
                <Button type="submit" className="rounded-full w-full text-sm font-semibold gap-2" onClick={handleSubmit}>
                  Book My Demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </form>
        )}

        {/* Step: done */}
        {step === "done" && (
          <div className="mt-10 max-w-md mx-auto bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">Perfect — we know exactly what to show you.</p>
            <p className="text-sm text-muted-foreground mb-5">
              Book your slot below. Your demo will be tailored to <span className="text-foreground font-medium">{bizType}</span>.
            </p>
            <a href="#book-demo">
              <Button className="rounded-full px-8 h-11 text-sm font-semibold gap-2">
                Choose a Time
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["No long-term contracts", "Live in under 7 days", "Fully done-for-you"].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t}
            </span>
          ))}
        </div>

        {/* Animated stat counters */}
        <StatCounter />

      </div>

      {showModal && <ConversationModal onClose={() => setShowModal(false)} />}
    </section>
  );
}