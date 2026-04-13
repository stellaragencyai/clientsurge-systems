import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function MedSpaHero() {
  return (
    <section className="pt-32 pb-20 md:pt-52 md:pb-36 px-6">
      <div className="max-w-4xl mx-auto text-center">

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A96E]/30 bg-[#C9A96E]/8 text-[#A8874A] text-xs font-semibold tracking-widest uppercase mb-10">
          For Med Spas & Aesthetic Clinics
        </div>

        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-[#1C1C1C]">
          Turn More Med Spa Leads Into
          <br />
          <span className="text-[#A8874A]">Booked Appointments.</span>
          <br />
          Automatically.
        </h1>

        <p className="mt-7 text-lg md:text-xl text-[#6B6B6B] max-w-2xl mx-auto leading-relaxed">
          Your system responds to every inquiry in under 60 seconds, follows up
          automatically, and books consultations — without your front desk
          lifting a finger.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#medspa-cta">
            <Button
              size="lg"
              className="rounded-full px-9 h-13 text-base font-semibold gap-2 bg-[#A8874A] hover:bg-[#8f7040] text-white shadow-md hover:shadow-lg transition-all"
            >
              Book a Free Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
          <a href="#medspa-flow">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-9 h-13 text-base font-medium border-[#D6C5A8] text-[#6B6B6B] hover:text-[#1C1C1C] hover:border-[#A8874A]"
            >
              See How It Works
            </Button>
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[#9B9B9B]">
          {[
            "Live in under 7 days",
            "No extra front desk work",
            "Month-to-month, no contracts",
          ].map((t, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E]" />
              {t}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}