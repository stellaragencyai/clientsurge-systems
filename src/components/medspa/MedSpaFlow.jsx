import { ArrowRight } from "lucide-react";

const steps = [
  { label: "Lead Comes In", sub: "Form, call, or message" },
  { label: "Instant Response", sub: "Under 60 seconds" },
  { label: "Follow-Up Sequence", sub: "Until they book" },
  { label: "Booking Confirmed", sub: "Direct to your calendar" },
  { label: "Client Walks In", sub: "Revenue earned" },
];

export default function MedSpaFlow() {
  return (
    <section id="medspa-flow" className="py-20 md:py-28 px-6 bg-white border-y border-[#EDE8DF]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
            The Process
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C]">
            From Lead to Booked — Automatically
          </h2>
          <p className="mt-4 text-[#6B6B6B] text-base">
            Every step happens without your team having to think about it.
          </p>
        </div>

        {/* Desktop flow */}
        <div className="hidden md:flex items-center justify-between gap-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#A8874A] flex items-center justify-center text-white font-bold text-sm mb-3 shadow-md">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <p className="text-xs font-semibold text-[#1C1C1C] leading-snug">{step.label}</p>
                <p className="text-[10px] text-[#9B9B9B] mt-0.5">{step.sub}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-[#C9A96E] flex-shrink-0 -mt-6" />
              )}
            </div>
          ))}
        </div>

        {/* Mobile flow */}
        <div className="md:hidden space-y-3">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex items-center gap-4 p-4 rounded-xl border border-[#EDE8DF] bg-[#FAFAF8]">
                <div className="w-10 h-10 rounded-full bg-[#A8874A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1C1C]">{step.label}</p>
                  <p className="text-xs text-[#9B9B9B]">{step.sub}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex justify-center py-1">
                  <div className="w-0.5 h-4 bg-[#D6C5A8]" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 rounded-2xl bg-[#A8874A]/5 border border-[#C9A96E]/20 text-center">
          <p className="text-sm text-[#6B6B6B]">
            This entire journey — from first contact to confirmed appointment — happens{" "}
            <span className="font-semibold text-[#1C1C1C]">without your team managing it.</span>
          </p>
        </div>
      </div>
    </section>
  );
}