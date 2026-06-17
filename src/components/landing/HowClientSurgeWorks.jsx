import { ArrowRight, Monitor, ClipboardCheck, Wrench, ShieldCheck, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trackCTA } from "@/lib/analytics";

const STEPS = [
  {
    id: "choose",
    icon: Monitor,
    number: "1",
    title: "Choose your system",
    description:
      "Compare Starter, Growth, and Pro, then select the package that matches how much of your lead flow you want automated.",
  },
  {
    id: "setup",
    icon: ClipboardCheck,
    number: "2",
    title: "Complete setup",
    description:
      "Submit the business details, website needs, phone/CRM information, booking preferences, and messaging requirements needed to configure the system.",
  },
  {
    id: "build",
    icon: Wrench,
    number: "3",
    title: "We build and connect it",
    description:
      "ClientSurge connects the website, lead capture, CRM handoff, SMS/email follow-up, booking path, review requests, and reactivation modules included in your package.",
  },
  {
    id: "test",
    icon: ShieldCheck,
    number: "4",
    title: "Test before activation",
    description:
      "The system is checked with test leads, message flow verification, routing review, and setup confirmation before it is treated as live.",
  },
  {
    id: "track",
    icon: BarChart3,
    number: "5",
    title: "Track the lead flow",
    description:
      "Use the dashboard and status updates to monitor leads, messages, bookings, setup progress, and automation activity.",
  },
];

export default function HowClientSurgeWorks() {
  const navigate = useNavigate();

  return (
    <section
      id="how-it-works"
      className="py-16 md:py-24 px-4 md:px-6"
      style={{ background: "linear-gradient(180deg, #f7fbff 0%, #ffffff 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="cs-eyebrow mb-3">How ClientSurge Works</p>
          <h2
            className="font-titles text-[#001B44] text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            From package selection to live lead flow
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Choose the system that fits your lead flow, complete setup, and ClientSurge connects the
            website, CRM handoff, and automation modules that move leads from first contact to booked
            appointment.
          </p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex flex-col rounded-lg p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "hsl(var(--card))",
                  border: "1px solid rgba(0,136,204,0.14)",
                  boxShadow:
                    "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {/* Step number */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0,136,204,0.12), rgba(0,174,239,0.06))",
                      border: "1px solid rgba(0,136,204,0.18)",
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "#0088CC" }} />
                  </div>
                  <span
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: "#0088CC" }}
                  >
                    Step {step.number}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className="font-bold text-foreground text-base mb-2.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-foreground/75 leading-relaxed flex-1">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              trackCTA("compare_packages", "how_it_works");
              navigate("/pricing");
            }}
            className="cs-btn-primary"
            style={{ padding: "0 36px", height: "52px", fontSize: "0.9rem" }}
          >
            Compare Packages <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              trackCTA("view_included_automations", "how_it_works");
              navigate("/automations");
            }}
            className="inline-flex items-center justify-center h-[52px] px-8 rounded-lg border-2 border-primary/25 bg-background/80 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
          >
            View Included Automations <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        </div>
      </div>
    </section>
  );
}