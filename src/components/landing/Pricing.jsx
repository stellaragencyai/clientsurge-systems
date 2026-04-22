import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

// Glowing Green Checkmark Component
function GlowingCheck() {
  return (
    <svg
      className="w-4 h-4 flex-shrink-0 mt-0.5"
      viewBox="0 0 24 24"
      fill="none"
      style={{
        filter: "drop-shadow(0 0 6px rgba(34,197,94,0.6))",
        animation: "checkPulse 2s ease-in-out infinite",
      }}
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
    fit: "Best for businesses under 30 leads per month",
    subtitle: "For businesses just getting started with automation.",
    desc: "A simple automation system to respond faster and capture more opportunities without complexity.",
    setup: "$997 setup",
    monthly: "$397",
    features: [
      "Instant response to new leads by SMS",
      "Basic confirmation email",
      "1 follow-up SMS message",
      "1 follow-up email",
      "Booking link integration",
      "Simple lead tracking dashboard",
      "System setup and launch support",
    ],
    highlight: false,
  },
  {
    name: "Growth System",
    fit: "Best for most businesses already generating steady leads",
    badge: "Most Popular",
    subtitle: "Best for businesses actively generating leads and wanting more bookings",
    desc: "The best option for businesses that want stronger follow-up, better lead conversion, and more automation built into the customer journey.",
    setup: "$1,997 setup",
    monthly: "$797",
    features: [
      "Everything in Starter",
      "Full follow-up sequence across multiple touchpoints",
      "Missed call text-back system",
      "Smart lead response logic",
      "Combined email and SMS follow-up",
      "Improved lead tracking and status pipeline",
      "Conversion-focused message templates",
      "14 days of optimization after launch",
      "Monthly performance check-in",
    ],
    highlight: true,
  },
  {
    name: "Pro System",
    fit: "Best for higher-volume teams that want deeper automation",
    subtitle: "Best for higher-volume businesses ready to scale and maximize conversions",
    desc: "Deeper automation, stronger reactivation, more optimization, and an advanced follow-up system for businesses serious about growth.",
    setup: "$3,500 setup",
    monthly: "$1,500",
    features: [
      "Everything in Growth",
      "Old lead reactivation campaigns",
      "Advanced follow-up and nurture flows",
      "Multi-channel messaging strategy",
      "Enhanced dashboard and tracking",
      "Ongoing optimization and improvements",
      "Priority support",
      "Monthly strategy session",
    ],
    highlight: false,
  },
];

export default function Pricing() {
  const demoBooking = useDemoBooking();
  return (
    <section id="pricing" className="nebula-pricing py-24 md:py-32 px-6 overflow-visible">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Pricing & Packages</p>
          <h2 className="font-inter text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
           Choose the System That Turns Your Leads Into Booked Clients
          </h2>
          <p className="mt-5 text-foreground font-semibold text-base mb-3">
            Most businesses recover the cost with just a few additional bookings.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We install done-for-you systems that respond to leads instantly, automate follow-up, and help turn more inquiries into booked appointments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <PricingCard key={i} plan={plan} demoBooking={demoBooking} />
          ))}
        </div>

        <div className="mt-12 max-w-5xl mx-auto rounded-3xl border border-border bg-card/80 p-6 md:p-8 shadow-sm">
          <div className="max-w-2xl mb-6">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3">What&apos;s Included In Setup</p>
            <h3 className="font-titles text-2xl md:text-3xl font-bold text-foreground">
              We handle the implementation work, not just the strategy
            </h3>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Your setup fee covers the actual buildout, launch prep, and handoff work required to get the system live.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Lead-response flow mapping and message logic",
              "SMS and email follow-up sequence setup",
              "Booking-link or booking-process integration",
              "Missed-call response setup when included in your plan",
              "Launch testing, polish, and go-live support",
              "Short onboarding call plus implementation handoff",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background px-4 py-4 flex items-start gap-3">
                <GlowingCheck />
                <p className="text-sm text-foreground/80">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center max-w-xl mx-auto border-t border-border pt-10">
          <p className="text-foreground font-semibold text-base mb-5">
            Not sure which system fits your business? We will recommend the best option based on your lead flow.
          </p>
          {demoBooking ? (
            <button
              type="button"
              onClick={demoBooking.openDemoBooking}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border-2 border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-200"
            >
              Book Your Free Demo
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <a
              href="/book"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded-full border-2 border-primary/40 bg-primary/5 text-sm font-semibold text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-200"
            >
              Book Your Free Demo
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>

      </div>

      <style>{`
        /* Card Gradient Shift on Hover */
        .pricing-card {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease, background 0.35s ease;
          position: relative;
          background: linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.58) 100%);
        }
        .pricing-card.highlight-glow {
          background: linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.84) 100%);
        }
        .pricing-card.highlight-hover {
          background: linear-gradient(135deg, rgba(255,248,235,0.98) 0%, rgba(245,217,168,0.4) 100%);
        }
        .pricing-card:hover {
          border-color: #c8965c !important;
          box-shadow: 0 14px 36px rgba(160, 90, 20, 0.16), 0 2px 10px rgba(0, 0, 0, 0.06) !important;
        }
        
        /* Floating Accent Dots Behind Cards */
        .pricing-card::before {
          content: '';
          position: absolute;
          top: 10%;
          right: -5%;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(200,150,92,0.15) 0%, transparent 70%);
          animation: drift 8s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .pricing-card:nth-child(2)::before {
          animation-delay: -2s;
        }
        .pricing-card:nth-child(3)::before {
          animation-delay: -4s;
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
          background-size: 200% 200%;
          animation: shimmer 3.5s ease-in-out infinite;
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
          animation: shineWave 3s ease-in-out infinite;
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
        
        /* Animations */
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shineWave {
          0% { left: -100%; }
          100% { left: 100%; }
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
        @keyframes checkPulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(34,197,94,0.6)); }
          50% { filter: drop-shadow(0 0 12px rgba(34,197,94,0.9)); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-30px) translateX(-10px); }
          75% { transform: translateY(-15px) translateX(15px); }
        }
      `}</style>
    </section>
  );
}

function PricingCard({ plan, demoBooking }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
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
            ? "0 20px 54px rgba(160,90,20,0.22), inset 0 1px 0 rgba(255,255,255,0.9)"
            : "0 8px 30px rgba(160,90,20,0.14), inset 0 1px 0 rgba(255,255,255,0.8)"
          : isHovered
            ? "0 16px 36px rgba(160,90,20,0.12), inset 0 1px 0 rgba(255,255,255,0.85)"
            : "0 4px 24px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
        transform: isHovered ? "translateY(-4px)" : plan.highlight ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.35s ease",
        zIndex: plan.highlight ? 2 : 1,
      }}
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

      {plan.badge && (
        <div className="pricing-badge-float" style={{ zIndex: 30 }}>
          <span
            className="inline-block text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-xl"
            style={{ background: "linear-gradient(135deg, #9a5c2e 0%, #c8965c 50%, #7a4825 100%)" }}
          >
            {plan.badge}
          </span>
        </div>
      )}

      <div className="flex flex-col flex-1 p-6 md:p-8 lg:p-10 relative z-10">
        <div className="mb-7">
          <h3 className="font-display text-2xl font-semibold text-foreground mb-2">{plan.name}</h3>
          {plan.highlight && <p className="text-xs font-bold text-primary mb-2">Best choice for most businesses.</p>}
          <p className="text-xs font-semibold text-foreground/70 leading-snug">{plan.fit}</p>
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
              <GlowingCheck />
              <span className="text-sm text-foreground/75">{feature}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            if (demoBooking) {
              demoBooking.openDemoBooking();
              return;
            }
            window.location.href = "/book";
          }}
          className="w-full shiny-brown-btn focus:ring-2 focus:ring-primary focus:outline-none"
          onMouseEnter={(event) => {
            event.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
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
      </div>
    </div>
  );
}