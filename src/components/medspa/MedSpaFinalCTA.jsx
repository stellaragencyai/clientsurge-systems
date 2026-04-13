import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function MedSpaFinalCTA() {
  return (
    <section className="py-20 md:py-28 px-6 bg-secondary/30">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
          If your med spa is already getting leads, you should be converting more of them.
        </h2>
        <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
          Book a free 30-minute demo. No obligation. We'll show you exactly what's possible for your business.
        </p>

        <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
          <Button size="lg" className="rounded-lg px-8 h-12 text-base font-semibold gap-2 shadow-lg">
            Book Your Demo
            <ArrowRight className="w-4 h-4" />
          </Button>
        </a>

        <p className="text-sm text-muted-foreground mt-8">
          No long-term contracts. Live in under 7 days. Fully done-for-you.
        </p>
      </div>
    </section>
  );
}