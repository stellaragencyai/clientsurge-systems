import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section id="book-demo" className="py-24 md:py-32 px-6 bg-white transition-all duration-700">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-6">Ready to Start?</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight">
          You're Already Getting Leads.
          <br />
          <span className="text-primary">Let's Make Sure You're Converting Them.</span>
        </h2>
        <p className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Book a free 30-minute demo. We'll map out exactly where you're losing bookings and show you what an automated system would look like for your business — no obligation.
        </p>

        <div className="mt-10">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-base font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
            >
              Book Your Free Demo
              <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          {["Free 30-min call", "No commitment required", "Live in 5–7 days"].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}