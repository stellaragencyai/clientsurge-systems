import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const plans = [
  {
    name: "Starter System",
    subtitle: "For businesses just getting started with automation (limited functionality).",
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
    badge: "Most Popular",
    subtitle: "Best for businesses actively generating leads and wanting more bookings",
    desc: "The best option for businesses that want stronger follow-up, better lead conversion, and more automation built into the customer journey.",
    setup: "$1,997 setup",
    monthly: "$797",
    features: [
      "Everything in Starter",
      "Full follow-up sequence — multiple touchpoints",
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

function scrollToDemo(e) {
  e.preventDefault();
  const el = document.getElementById("book-demo");
  if (!el) return;
  const start = window.scrollY;
  const target = el.getBoundingClientRect().top + window.scrollY - 80;
  const distance = target - start;
  const duration = 1100;
  let startTime = null;
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const step = (ts) => {
    if (!startTime) startTime = ts;
    const progress = Math.min((ts - startTime) / duration, 1);
    window.scrollTo(0, start + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 md:py-36 px-6 bg-gradient-to-b from-background to-card overflow-visible">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-20">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Pricing & Packages</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Choose the System That Turns Your Leads Into Booked Clients
          </h2>
          <p className="mt-5 text-foreground font-semibold text-base mb-3">
            Most businesses recover the cost with just a few additional bookings.
          </p>
          <p className="text-muted-foreground text-lg leading-relaxed">
            We install done-for-you systems that respond to leads instantly, automate follow-up, and help turn more inquiries into booked appointments.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <PricingCard key={i} plan={plan} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center max-w-xl mx-auto">
          <p className="text-foreground font-semibold text-base mb-4">
            Not sure which system fits your business? We'll recommend the best option based on your lead flow.
          </p>
          <button onClick={scrollToDemo} className="shiny-brown-btn" onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35), 0 1px 4px rgba(0,0,0,0.15)";
          }}>
            <span className="shiny-brown-inner flex items-center justify-center gap-2 h-12 px-8 rounded-full font-semibold text-sm">
              Book a 10-Min Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

      </div>

      <style>{`
        .pricing-card {
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .pricing-card:hover {
          border-color: #c8965c !important;
          border-width: 3px !important;
          box-shadow: 0 8px 40px rgba(160,90,20,0.25), 0 2px 10px rgba(0,0,0,0.08) !important;
        }
        .pricing-badge-float {
          position: absolute;
          top: -14px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          white-space: nowrap;
        }

        /* Brown shiny button */
        .shiny-brown-btn {
          display: inline-block;
          border-radius: 9999px;
          padding: 2px;
          background: linear-gradient(135deg, #a0714f 0%, #c8965c 30%, #f5d9a8 50%, #c8965c 70%, #7a4f2e 100%);
          box-shadow: 0 4px 18px rgba(120, 70, 20, 0.35), 0 1px 4px rgba(0,0,0,0.15);
          transition: box-shadow 0.3s ease, transform 0.3s ease;
          cursor: pointer;
          border: none;
          background-size: 200% 200%;
          animation: shineMove 3s ease infinite;
        }
        .shiny-brown-btn:hover {
          box-shadow: 0 8px 32px rgba(120, 70, 20, 0.5), 0 2px 8px rgba(0,0,0,0.2);
          transform: translateY(-2px);
        }
        .shiny-brown-inner {
          background: linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%);
          border-radius: 9999px;
          color: #f5e6d0;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }
        @keyframes shineMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
}

function PricingCard({ plan }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="pricing-card relative flex flex-col rounded-2xl overflow-visible transition-all duration-300"
      style={
        {
          background: "#fff",
          border: isHovered ? "3px solid #c8965c" : "2px solid hsl(var(--border))",
          boxShadow: isHovered ? "0 8px 40px rgba(160,90,20,0.25), 0 2px 10px rgba(0,0,0,0.08)" : "0 4px 20px rgba(0,0,0,0.05)",
          paddingTop: isHovered ? "0px" : "0px",
        }
      }
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge — hover only */}
      {plan.badge && isHovered && (
        <div className="pricing-badge-float animate-in fade-in zoom-in duration-300">
          <span className="inline-block bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold px-5 py-1.5 rounded-full tracking-wide shadow-xl">
            ⭐ {plan.badge}
          </span>
        </div>
      )}



      <div className="flex flex-col flex-1 p-10">
        {/* Plan name & subtitle */}
        <div className="mb-7">
          <h3 className="font-display text-2xl font-semibold text-foreground mb-2">{plan.name}</h3>
          {plan.highlight && <p className="text-xs font-bold text-primary mb-2">Best choice for most businesses.</p>}
          <p className="text-xs text-muted-foreground leading-snug">{plan.subtitle}</p>
        </div>

        {/* Pricing */}
        <div className="mb-7 pb-7 border-b border-border">
          <div className="flex items-end gap-2 mb-1">
            <span className="text-5xl font-bold text-foreground">{plan.monthly}</span>
            <span className="text-sm text-muted-foreground mb-2">/month</span>
          </div>
          <p className="text-xs text-muted-foreground">{plan.setup}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-7">{plan.desc}</p>

        {/* Features */}
        <ul className="space-y-3.5 flex-1 mb-9">
          {plan.features.map((f, j) => (
            <li key={j} className="flex items-start gap-3">
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-primary" : "text-foreground/35"}`} />
              <span className="text-sm text-foreground/75">{f}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button onClick={scrollToDemo} className="w-full shiny-brown-btn" onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 40px rgba(161,120,35,0.6), 0 4px 18px rgba(120,70,20,0.35)";
          }} onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(120,70,20,0.35), 0 1px 4px rgba(0,0,0,0.15)";
          }}>
          <span className="shiny-brown-inner w-full flex items-center justify-center gap-2 h-12 rounded-full font-semibold text-sm">
            Book a Demo
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}