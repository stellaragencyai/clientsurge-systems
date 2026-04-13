import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
  return (
    <section id="book-demo" className="py-20 md:py-28 px-6 bg-foreground text-background">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight">
          If You're Already Getting Leads, You Should Be Converting{" "}
          <span className="text-primary">More of Them</span>
        </h2>
        <p className="mt-6 text-background/70 text-lg max-w-xl mx-auto leading-relaxed">
          Book a free demo call to see exactly how our automation systems can
          help you respond faster, follow up smarter, and fill your calendar.
        </p>

        <div className="mt-10">
          <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
            <Button
              size="lg"
              className="rounded-full px-10 h-14 text-lg font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Book Your Demo
              <ArrowRight className="w-5 h-5" />
            </Button>
          </a>
        </div>

        <p className="mt-6 text-background/50 text-sm">
          Free consultation · No commitment · See results in 30 days
        </p>
      </div>
    </section>
  );
}