import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const includes = [
  "Full lead capture system — built and integrated for you",
  "Instant response automation via SMS and chat",
  "Multi-step follow-up sequences, written and scheduled",
  "Missed call text-back system",
  "Lead reactivation campaigns for your existing database",
  "Booking flow connected to your calendar",
  "CRM pipeline automation — tagging, tasks, status updates",
  "Ongoing support and optimization included",
];

export default function CoreOffer() {
  return (
    <section className="py-24 md:py-32 px-6 bg-gradient-to-b from-background via-card to-background">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Package</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            A <span className="text-primary">Complete</span> System, Implemented for You
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            This isn't software you have to figure out. We build, install, and manage the entire system — so your only job is showing up for the appointments it generates.
          </p>
        </div>

        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/30 p-8 md:p-12 shadow-lg hover:bg-white/50 hover:border-white/40 transition-all">
          <div className="grid md:grid-cols-2 gap-4 mb-10">
            {includes.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm text-foreground leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm mb-6">
              Fully tailored to your business. Designed to generate revenue from day one.
            </p>
            <a href="#book-demo">
              <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold gap-2 hover:shadow-xl hover:scale-105 transition-all">
                Book a Demo
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}