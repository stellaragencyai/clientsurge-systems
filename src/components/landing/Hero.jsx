import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!bizType || !leads) return;
    setStep("done");
  };

  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
      <div className="max-w-4xl mx-auto text-center">

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-10">
          Done-For-You AI Automation
        </div>

        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] text-foreground">
          Turn More Leads Into
          <br />
          <span className="text-primary">Booked Appointments.</span>
        </h1>

        <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We build systems that respond to every lead in under 60 seconds,
          follow up automatically, and fill your calendar —
          without adding work for your team.
        </p>

        {/* Step: default CTA */}
        {step === "cta" && (
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 h-13 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
              onClick={() => setStep("form")}
            >
              Book a Free Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            >
              See a real example →
            </button>
          </div>
        )}

        {/* Step: micro-qualifying form */}
        {step === "form" && (
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