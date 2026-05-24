import { ArrowRight, CalendarCheck2, MessageSquareText, PhoneCall, Workflow } from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";

const walkthroughSteps = [
  {
    icon: MessageSquareText,
    title: "A new lead comes in",
    body: "A prospect submits a form, calls after hours, or responds to an ad. Instead of waiting in a queue, that inquiry is captured immediately.",
  },
  {
    icon: PhoneCall,
    title: "The system responds fast",
    body: "ClientSurge triggers an instant reply or missed-call text-back so the business shows up while intent is still high.",
  },
  {
    icon: Workflow,
    title: "Follow-up keeps moving",
    body: "If the lead does not book right away, automated follow-up continues across the next touchpoints without relying on front-desk memory.",
  },
  {
    icon: CalendarCheck2,
    title: "The lead gets to booking",
    body: "When the prospect is ready, the system pushes them into a booking flow or the right handoff, creating more confirmed appointments with less manual effort.",
  },
];

export default function AutomationWalkthrough() {
  const demoBooking = useDemoBooking();
  return (
    <section id="automation-walkthrough" className="py-20 md:py-28 px-6 bg-gradient-to-b from-card to-background">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Automation Walkthrough</p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            What The Automation Actually Does For Your Business
          </h2>
          <p className="mt-5 text-muted-foreground text-lg leading-relaxed">
            This is the detailed sequence behind the service: faster response, fewer missed opportunities, and a cleaner path from inquiry to booked appointment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {walkthroughSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="rounded-2xl border border-primary/15 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Step {index + 1}</p>
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-background p-6 md:p-8">
          <h3 className="text-lg font-semibold text-foreground mb-3">Short transcript for search and sales</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Most businesses do not need more leads. They need faster follow-up. ClientSurge installs a done-for-you system that captures new inquiries, responds quickly, recovers missed calls, and keeps follow-up moving until the lead books or is routed correctly. That means fewer dropped opportunities, less manual chasing, and more visibility into what is working.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <a href="/med-spa" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors">
              See the med spa version
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/contact" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors">
              Ask a question
              <ArrowRight className="w-4 h-4" />
            </a>
            {demoBooking ? (
              <button
                type="button"
                onClick={demoBooking.openDemoBooking}
                className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
              >
                Make the Leap
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <a href="/book" className="inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors">
                Make the Leap
                <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

