import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function MedSpaFinalCTA() {
  return (
    <section id="medspa-cta" className="py-24 md:py-36 px-6 bg-[#1C1C1C]">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-semibold text-[#C9A96E] tracking-widest uppercase mb-6">
          Ready to Convert More
        </p>

        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-snug mb-6">
          If Your Med Spa Is Already Getting Leads,
          <br />
          <span className="text-[#C9A96E]">You Should Be Converting More of Them.</span>
        </h2>

        <p className="text-[#9B9B9B] text-base md:text-lg leading-relaxed max-w-xl mx-auto mb-10">
          Book a free 30-minute call. We'll show you exactly where you're losing bookings and what an automated system would look like for your specific spa — no obligation.
        </p>

        <a href="https://calendly.com" target="_blank" rel="noopener noreferrer">
          <Button
            size="lg"
            className="rounded-full px-10 h-14 text-base font-semibold gap-2 bg-[#A8874A] hover:bg-[#C9A96E] text-white shadow-lg transition-all"
          >
            Book Your Free Demo
            <ArrowRight className="w-5 h-5" />
          </Button>
        </a>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-[#6B6B6B]">
          {[
            "Free 30-min call",
            "No commitment",
            "Live in 5–7 days",
          ].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[#6B6B6B]" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}