import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const includes = [
  "Lead capture system setup & integration",
  "Instant response automation (SMS & chat)",
  "Multi-step follow-up sequences",
  "Missed call text-back system",
  "Lead reactivation campaigns",
  "Booking flow integration",
  "CRM pipeline automation",
  "Ongoing optimization & support",
];

export default function CoreOffer() {
  return (
    <section className="py-20 md:py-28 px-6 bg-card border-y border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            The Complete Package
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Done-For-You Automation System
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
            We handle everything — strategy, setup, and optimization. You focus on running
            your business while we build the system that fills your calendar.
          </p>
        </div>

        <div className="bg-background rounded-3xl border border-border p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-4">
            {includes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm text-foreground font-medium leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm mb-6">
              Tailored to your business. Fully managed. Designed to pay for itself.
            </p>
            <a href="#book-demo">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-medium gap-2">
                Book a Demo to Learn More
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}