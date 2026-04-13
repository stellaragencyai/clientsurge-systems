import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
      <div className="max-w-4xl mx-auto text-center">

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-10">
          Done-For-You AI Automation
        </div>

        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.08] text-foreground">
          Turn More Leads Into
          <br />
          <span className="text-primary">Booked Appointments.</span>
        </h1>

        <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We build systems that respond to every lead in under 60 seconds,
          follow up automatically, and fill your calendar —
          without adding work for your team.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#book-demo">
            <Button size="lg" className="rounded-full px-8 h-13 text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow">
              Book a Free Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <a href="#how-it-works">
            <Button variant="outline" size="lg" className="rounded-full px-8 h-13 text-base font-medium gap-2">
              See How It Works
              <ChevronDown className="w-4 h-4" />
            </Button>
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {["No long-term contracts", "Live in under 7 days", "Fully done-for-you"].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {t}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}