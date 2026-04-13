import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-44 md:pb-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium tracking-wide mb-8">
          AI-Powered Automation for Service Businesses
        </div>

        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] text-foreground">
          Stop Losing Leads.
          <br />
          <span className="text-primary">Book More Customers.</span>
        </h1>

        <p className="mt-6 md:mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We build done-for-you automation systems that respond to leads instantly,
          follow up automatically, recover missed calls, and turn more inquiries
          into booked appointments.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#book-demo">
            <Button size="lg" className="rounded-full px-8 text-base font-medium gap-2 h-12">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 text-base font-medium gap-2 h-12 border-border"
            >
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </Button>
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            No long-term contracts
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Setup in under 7 days
          </span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Done-for-you implementation
          </span>
        </div>
      </div>
    </section>
  );
}