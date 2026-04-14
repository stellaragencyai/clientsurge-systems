import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatCounter from "./StatCounter";
import ConversationModal from "./ConversationModal";

const TICKER_EVENTS = [
  "🟢 New lead captured — Austin, TX",
  "📅 Appointment booked — Miami, FL",
  "💬 Follow-up sent automatically — Denver, CO",
  "📞 Missed call recovered — Phoenix, AZ",
  "🟢 New lead captured — Nashville, TN",
  "📅 Consultation booked — Los Angeles, CA",
  "💬 Lead re-engaged — Chicago, IL",
  "📞 Missed call recovered — Atlanta, GA",
];

function LiveTicker() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % TICKER_EVENTS.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-card border border-border rounded-full shadow-sm overflow-hidden">
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span
        className="text-xs font-medium text-foreground/80 transition-all duration-400"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(6px)" }}
      >
        {TICKER_EVENTS[index]}
      </span>
    </div>
  );
}

const businessTypes = [
  "Med Spa / Aesthetic Clinic",
  "Real Estate Agency",
  "Home Services",
  "Dental / Medical Practice",
  "Salon / Wellness Studio",
  "Other Service Business",
];

export default function Hero() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState("cta"); // "cta" | "form" | "done"
  const [bizType, setBizType] = useState("");
  const [leads, setLeads] = useState("");
  const [saving, setSaving] = useState(false);
  const [hoveredForm, setHoveredForm] = useState(false);

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
            <Button
              size="lg"
              onClick={() => navigate("/start")}
              className="rounded-full px-8 h-13 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
            <button
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById("how-it-works");
                if (!target) return;
                const start = window.scrollY;
                const end = target.getBoundingClientRect().top + window.scrollY - 64;
                const distance = end - start;
                const duration = 1200;
                let startTime = null;
                const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                const step = (timestamp) => {
                  if (!startTime) startTime = timestamp;
                  const progress = Math.min((timestamp - startTime) / duration, 1);
                  window.scrollTo(0, start + distance * easeInOutCubic(progress));
                  if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
              }}
            >
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-13 text-base font-semibold gap-2"
              >
                See How It Works
              </Button>
            </button>
          </div>
        )}

        {/* Step: micro-qualifying form */}
        {step === "form" && !showModal && (
          <form
            onSubmit={handleSubmit}
            onMouseEnter={() => setHoveredForm(true)}
            onMouseLeave={() => setHoveredForm(false)}
            className={`mt-10 max-w-md mx-auto bg-card rounded-2xl p-6 shadow-lg text-left transition-all ${hoveredForm ? "border border-slate-600" : "border border-transparent"}`}
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
              <Button type="submit" className="rounded-full flex-1 text-sm font-semibold gap-2" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : 'Book My Demo'}
                <ArrowRight className="w-4 h-4" />
              </Button>
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
            <Button onClick={() => navigate("/start")} className="rounded-full px-8 h-11 text-sm font-semibold gap-2">
              Choose a Time
              <ArrowRight className="w-4 h-4" />
            </Button>
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

        {/* Live-feeling activity ticker */}
        <div className="mt-10 flex items-center justify-center">
          <LiveTicker />
        </div>

      </div>

      {showModal && <ConversationModal onClose={() => setShowModal(false)} />}
    </section>
  );
}