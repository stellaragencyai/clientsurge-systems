import { Button } from "@/components/ui/button";
import { UserPlus, Zap, MessageCircle, CalendarCheck, BadgeCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Lead Comes In",
    desc: "A potential customer fills out a form, calls your business, or sends a message.",
  },
  {
    num: "02",
    icon: Zap,
    title: "Instant Response",
    desc: "Within seconds, they receive a personalized text or chat message — automatically.",
  },
  {
    num: "03",
    icon: MessageCircle,
    title: "Automated Follow-Up",
    desc: "A smart sequence nurtures the lead with the right messages at the right time.",
  },
  {
    num: "04",
    icon: CalendarCheck,
    title: "Booking Secured",
    desc: "The lead is guided to book an appointment directly on your calendar.",
  },
  {
    num: "05",
    icon: BadgeCheck,
    title: "Customer Converted",
    desc: "They show up, pay, and become a loyal customer — all from a lead that might've been lost.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            The Process
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            From first contact to booked appointment — fully automated.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

          <div className="space-y-8 md:space-y-0">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div key={i} className="relative md:grid md:grid-cols-2 md:gap-12 md:py-8">
                  {/* Center dot */}
                  <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm font-bold z-10">
                    {step.num}
                  </div>

                  <div className={`${isLeft ? "md:text-right md:pr-16" : "md:col-start-2 md:pl-16"}`}>
                    <div className={`flex items-start gap-4 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                      <div className="md:hidden flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {step.num}
                      </div>
                      <div>
                        <div className={`flex items-center gap-3 mb-2 ${isLeft ? "md:justify-end" : ""}`}>
                          <step.icon className="w-5 h-5 text-primary" />
                          <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isLeft && <div className="hidden md:block" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-14">
          <a href="#book-demo">
            <Button className="rounded-full px-8 h-12 text-base font-medium gap-2">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}