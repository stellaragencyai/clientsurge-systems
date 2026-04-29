import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import { getSelectedIndustryRecommendation, INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import CustomerProofCards from "./CustomerProofCards";
import MoneyBackGuarantee from "./MoneyBackGuarantee";

function SimpleCheck() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0 mt-0.5"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2" />
      <path
        d="M8 12l3 3 5-5"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const plans = [
  {
    name: "Starter System",
    fit: "For businesses that need faster response and basic lead capture",
    subtitle: "For businesses that need faster response and basic lead capture.",
    desc: "An AI lead conversion system that ensures every new inquiry gets a fast response, enters a simple follow-up flow, and has a clear path to booking.",
    setup: "$997 setup",
    monthly: "$397",
    features: [
      "Instant SMS response to every new lead",
      "Basic email confirmation",
      "Simple automated follow-up sequence",
      "Booking link integration",
      "Basic lead tracking dashboard",
      "System setup and launch support",
    ],
    highlight: false,
  },
  {
    name: "Growth System",
    fit: "For businesses already getting leads and losing revenue through slow response or weak follow-up",
    badge: "Most Popular",
    subtitle: "For businesses already getting leads and losing revenue through slow response or weak follow-up.",
    desc: "A full missed-call recovery and automated follow-up system built for businesses that want to stop losing bookings they already earned.",
    setup: "$1,997 setup",
    monthly: "$797",
    features: [
      "Everything in Starter",
      "Missed call text-back system",
      "Multi-touch SMS and email follow-up",
      "Conversion-focused message templates",
      "Improved lead tracking and pipeline",
      "14 days of post-launch optimization",
      "Monthly performance check-in",
      "Conversion-focused landing page included when needed",
    ],
    highlight: true,
  },
  {
    name: "Pro System",
    fit: "For businesses that want the full revenue recovery engine",
    subtitle: "For businesses that want the full revenue recovery engine.",
    desc: "The complete AI-assisted booking automation and revenue recovery system — old leads reactivated, every inquiry tracked, and the full pipeline optimized.",
    setup: "$3,500 setup",
    monthly: "$1,500",
    features: [
      "Everything in Growth",
      "Old lead reactivation campaigns",
      "Advanced nurture flows",
      "AI-assisted follow-up logic",
      "Enhanced dashboard and tracking",
      "Priority optimization and support",
      "Monthly strategy session",
      "Conversion-focused landing page or site improvement included",
    ],
    highlight: false,
  },
];

export default function Pricing() {
  const demoBooking = useDemoBooking();
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncIndustry = () => {
      // Only show recommendation if user has explicitly selected an industry in this session
      const storedId = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
      setSelectedIndustry(storedId ? getSelectedIndustryRecommendation() : null);
    };

    syncIndustry();
    window.addEventListener("storage", syncIndustry);
    window.addEventListener("clientsurge:industry-selected", syncIndustry);

    return () => {
      window.removeEventListener("storage", syncIndustry);
      window.removeEventListener("clientsurge:industry-selected", syncIndustry);
    };
  }, []);

  return (
    <section id="pricing" className="nebula-pricing py-24 md:py-32 px-6 overflow-visible">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Pricing & Packages</p>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
           Most Businesses Already Have the Leads — Here's What It Costs to Stop Losing Them
          </h2>
          <p className="mt-5 text-foreground font-semibold text-base mb-3">
            Recovery happens fast. Most clients cover their entire investment with just 2–3 additional bookings per month.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We install done-for-you AI lead conversion systems that respond instantly, automate follow-up, and turn more of your existing demand into booked appointments.
          </p>
          <div
            className="mt-6 inline-block rounded-2xl px-5 py-3 text-sm text-foreground/75 leading-relaxed max-w-xl mx-auto"
            style={{ borderRadius: "16px" }}
            style={{
              background: "rgba(154,92,46,0.05)",
              border: "1px solid rgba(154,92,46,0.12)",
            }}
          >
            <span className="font-semibold text-foreground/90">On websites and landing pages:</span>{" "}
            These are only included when they strengthen the conversion system. The real product is the automated system that captures, follows up, and books more leads.
          </div>
        </div>

        {selectedIndustry ? (
          <div className="max-w-4xl mx-auto mb-10 rounded-3xl border border-primary/15 bg-primary/5 px-6 py-5 text-center">
            <p className="text-xs font-semibold text-primary tracking-[0.22em] uppercase mb-2">
              Recommended For {selectedIndustry.shortName}
            </p>
            <p className="text-lg font-semibold text-foreground">
              Start with the {selectedIndustry.recommendedPackage?.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {selectedIndustry.summary}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <PricingCard
              key={i}
              plan={plan}
              demoBooking={demoBooking}
              selectedIndustry={selectedIndustry}
            />
          ))}
        </div>

        <CustomerProofCards />

        <MoneyBackGuarantee />

        <div className="max-w-2xl mb-6 mt-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What&apos;s Included In Setup</p>
          <h3 className="font-titles text-2xl md:text-3xl font-bold text-foreground">
            We build and install the system for you — not just the strategy
          </h3>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Your setup fee covers the full buildout of your AI lead conversion system — launch prep, messaging logic, booking flow, and handoff — done for you.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-3 mb-14">
          {[
            "AI lead conversion system setup and message logic",
            "Automated SMS and email follow-up sequence",
            "Booking link or booking flow integration",
            "Missed-call recovery system setup when included",
            "Launch testing, polish, and go-live support",
            "Onboarding call plus full implementation handoff",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 py-1">
              <SimpleCheck />
              <p className="text-sm text-foreground/80">{item}</p>
            </div>
          ))}
        </div>

        <div className="text-center max-w-xl mx-auto border-t border-border pt-10">
          <p className="text-foreground font-semibold text-base mb-5">
            Not sure which system fits your business? We will recommend the best option based on your lead flow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {demoBooking ? (
              <button
                type="button"
                onClick={() =>
                  demoBooking.openDemoBooking({
                    prefillIndustry: selectedIndustry?.name || "",
                  })
                }
                style={{
                  borderRadius: "9999px",
                  padding: "2px",
                  background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                  boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 28px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem" }}>
                  Book Your Free Demo <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            ) : (
              <a
                href="/book"
                style={{
                  borderRadius: "9999px",
                  padding: "2px",
                  background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                  boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
                  display: "inline-block",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "48px", padding: "0 28px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "0.95rem" }}>
                  Book Your Free Demo <ArrowRight className="w-4 h-4" />
                </span>
              </a>
            )}
            <a
              href="#lead-leakage"
              className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-primary/30 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all duration-200"
            >
              Get a Free Lead Leakage Audit
            </a>
          </div>
        </div>

      </div>

      <style>{`
        .pricing-card {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.35s ease;
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%);
        }
        .dark .pricing-card {
          background: linear-gradient(135deg, rgba(30,22,14,0.88) 0%, rgba(20,15,8,0.72) 100%) !important;
          border-color: rgba(200,150,92,0.18) !important;
        }
        .dark .pricing-card.highlight-glow {
          background: linear-gradient(135deg, rgba(40,28,16,0.96) 0%, rgba(28,20,10,0.88) 100%) !important;
          border-color: rgba(200,150,92,0.35) !important;
        }
        .pricing-card.highlight-glow {
          background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 100%);
        }
        .pricing-card.highlight-hover {
          background: linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(245,217,168,0.4) 100%);
        }
        .pricing-card::before {
          content: '';
          position: absolute;
          top: 10%;
          right: -5%;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,150,92,0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .pricing-card:nth-child(3)::before {
          top: auto;
          bottom: 5%;
          right: auto;
          left: -5%;
        }
        
        .pricing-badge-float {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          white-space: nowrap;
        }
        
        .shiny-brown-btn {
          display: inline-block;
          border-radius: 9999px;
          padding: 2px;
          background: linear-gradient(90deg, #a0714f 0%, #c8965c 30%, #f5d9a8 50%, #c8965c 70%, #7a4f2e 100%);
          box-shadow: 0 4px 18px rgba(120, 70, 20, 0.35), 0 1px 4px rgba(0, 0, 0, 0.15);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          cursor: pointer;
          border: none;
          position: relative;
        }
        .shiny-brown-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          border-radius: 9999px;
          pointer-events: none;
        }
        .shiny-brown-btn:hover {
          box-shadow: 0 8px 32px rgba(120, 70, 20, 0.5), 0 2px 8px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }
        .shiny-brown-inner {
          background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%);
          border-radius: 9999px;
          color: #f5e6d0;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}

function PricingCard({ plan, demoBooking, selectedIndustry }) {
  const [isHovered, setIsHovered] = useState(false);
  const isRecommended = selectedIndustry?.recommendedPackage?.name === plan.name;

  return (
    <motion.div
      className={`pricing-card relative flex flex-col rounded-2xl transition-all duration-300 ${
        plan.highlight ? "highlight-glow" : ""
      } ${isHovered && plan.highlight ? "highlight-hover" : ""}`}
      style={{
        overflow: "visible",
        background: isHovered
          ? "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.88) 100%)"
          : plan.highlight
            ? "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%)",
        backdropFilter: plan.highlight ? "blur(20px)" : "blur(14px)",
        WebkitBackdropFilter: plan.highlight ? "blur(20px)" : "blur(14px)",
        border: plan.highlight
          ? isHovered ? "2px solid rgba(200,150,92,0.72)" : "2px solid rgba(200,150,92,0.4)"
          : isHovered ? "2px solid rgba(200,150,92,0.45)" : "1.5px solid rgba(154,92,46,0.15)",
        boxShadow: plan.highlight
          ? isHovered
            ? "0 24px 64px rgba(160,90,20,0.28), inset 0 1px 0 rgba(255,255,255,0.9)"
            : "0 12px 40px rgba(160,90,20,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
          : isHovered
            ? "0 14px 36px rgba(160,90,20,0.15), inset 0 1px 0 rgba(255,255,255,0.85)"
            : "0 6px 22px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
        perspective: "1200px",
      }}
      animate={isHovered ? { rotateY: 6, rotateX: -2, scale: 1.03 } : { rotateY: 0, rotateX: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.highlight && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: isHovered
              ? "0 0 0 1px rgba(200,150,92,0.45), 0 0 48px rgba(200,150,92,0.16)"
              : "0 0 0 1px rgba(200,150,92,0.28), 0 0 30px rgba(200,150,92,0.08)",
            transition: "box-shadow 0.35s ease",
            borderRadius: "inherit",
          }}
        />
      )}

      {(plan.badge || isRecommended) && (
        <div className="pricing-badge-float" style={{ zIndex: 30 }}>
          <span
            className="inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-xl"
            style={{ background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)" }}
          >
            {isRecommended
              ? `Best fit for ${selectedIndustry.shortName}`
              : plan.badge}
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 relative z-10">
        <div className="mb-7">
          <h3 className="font-display text-2xl font-semibold text-foreground mb-2">{plan.name}</h3>
          {plan.highlight && <p className="text-xs font-bold text-primary mb-2">Most Popular — Best for businesses losing 20+ leads/month</p>}
          {isRecommended && (
            <p className="text-xs font-bold text-primary mb-2">
              Recommended for {selectedIndustry.shortName}
            </p>
          )}
          <p className="text-xs font-semibold text-foreground/70 leading-snug">{plan.fit}</p>
        </div>
        {/* Value justification above the price */}
        <div className="mb-5 text-xs text-muted-foreground leading-relaxed px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
          {plan.highlight
            ? "Most clients recover this cost with just 2–3 additional bookings per month."
            : plan.monthly === "$397"
            ? "Even one extra booking per month typically covers the monthly fee."
            : "High-volume businesses often recover this within the first week of going live."}
        </div>

        <div className="mb-7 pb-7 border-b border-border">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-bold text-foreground">{plan.monthly}</span>
            <span className="text-sm text-muted-foreground mb-2">/month</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{plan.setup}</p>
          <p className="text-xs text-muted-foreground text-left">
            One-time setup fee plus monthly service. No long-term contracts. Cancel anytime.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-7">{plan.desc}</p>

        <ul className="space-y-3.5 flex-1 mb-9">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-3"
              style={{
                animation: `slideIn 0.5s ease-out ${index * 0.05}s both`,
              }}
            >
              <SimpleCheck />
              <span className="text-sm text-foreground/75">{feature}</span>
            </li>
          ))}
        </ul>

        {plan.highlight ? (
          <button
            type="button"
            onClick={() => {
              if (demoBooking) {
                demoBooking.openDemoBooking({
                  prefillIndustry: selectedIndustry?.name || "",
                });
                return;
              }
              window.location.href = "/book";
            }}
            className="w-full shiny-brown-btn focus:ring-2 focus:ring-primary focus:outline-none"
            onMouseEnter={(event) => {
              event.currentTarget.style.boxShadow = "0 8px 32px rgba(161,120,35,0.46), 0 4px 18px rgba(120,70,20,0.35)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35), 0 1px 4px rgba(0,0,0,0.15)";
            }}
          >
            <span className="shiny-brown-inner w-full flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-sm">
              Book Your Free Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (demoBooking) {
                demoBooking.openDemoBooking({
                  prefillIndustry: selectedIndustry?.name || "",
                });
                return;
              }
              window.location.href = "/book";
            }}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-full border border-primary/25 bg-white/82 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            Book Your Free Demo
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}