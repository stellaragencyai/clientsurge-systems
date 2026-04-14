import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter System",
    subtitle: "Best for smaller or lower-volume businesses getting started with automation",
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

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 px-6 bg-gradient-to-b from-background to-card">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Pricing & Packages</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
            Choose the Right Automation System for Your Business
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            We install done-for-you systems that respond to leads instantly, automate follow-up, and help turn more inquiries into booked appointments.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <div
              key={i}
              className="relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={
                plan.highlight
                  ? {
                      background: "#fff",
                      border: "2px solid hsl(var(--primary))",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                    }
                  : {
                      background: "#fff",
                      border: "1px solid hsl(var(--border))",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    }
              }
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full tracking-wide shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Top accent bar for highlighted card */}
              {plan.highlight && (
                <div className="h-1 w-full bg-primary" />
              )}

              <div className="flex flex-col flex-1 p-8">
                {/* Plan name & subtitle */}
                <div className="mb-6">
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">{plan.subtitle}</p>
                </div>

                {/* Pricing */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-4xl font-bold text-foreground">{plan.monthly}</span>
                    <span className="text-sm text-muted-foreground mb-1.5">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.setup}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{plan.desc}</p>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-primary" : "text-foreground/40"}`} />
                      <span className="text-sm text-foreground/75">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a href="#book-demo">
                  <Button
                    className={`w-full h-12 rounded-full font-semibold gap-2 ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-foreground/5 text-foreground hover:bg-foreground/10 border border-border"
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    Book a Demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom trust note */}
        <div className="mt-14 text-center max-w-xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Not sure which option is right for your business? Book a quick demo and we'll recommend the best fit based on your lead flow, follow-up process, and goals.
          </p>
          <a href="#book-demo">
            <Button className="rounded-full px-8 h-12 font-semibold gap-2">
              Book Your Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>

      </div>
    </section>
  );
}