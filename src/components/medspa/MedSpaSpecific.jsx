import { Sparkles, DollarSign, Clock, Users } from "lucide-react";

const points = [
  {
    icon: Sparkles,
    title: "Consultation-Based Business Model",
    desc: "Every treatment starts with a consultation. Automating that booking step alone can dramatically increase your treatment revenue.",
  },
  {
    icon: DollarSign,
    title: "High-Ticket Treatments Demand Fast Trust",
    desc: "Clients considering Botox, filler, or laser are evaluating multiple options. A fast, professional response builds confidence — and wins the booking.",
  },
  {
    icon: Clock,
    title: "Speed is Non-Negotiable",
    desc: "In aesthetics, hesitation fades fast. Clients who don't hear back quickly often talk themselves out of it — or find someone else.",
  },
  {
    icon: Users,
    title: "Front Desks Can't Do Everything",
    desc: "Managing walk-ins, calls, and online inquiries simultaneously is impossible. Automation handles the overflow so nothing gets dropped.",
  },
];

export default function MedSpaSpecific() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white border-y border-[#EDE8DF]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
            Made for You
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C]">
            Built Specifically for Med Spas
          </h2>
          <p className="mt-4 text-[#6B6B6B] text-base leading-relaxed">
            We understand how your business works — consultation-led, high-value, and relationship-driven. Our systems are designed around that model.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {points.map((p, i) => (
            <div
              key={i}
              className="flex gap-5 p-7 rounded-2xl border border-[#EDE8DF] bg-[#FAFAF8] hover:border-[#C9A96E]/40 transition-colors"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#A8874A]/10 flex items-center justify-center">
                <p.icon className="w-5 h-5 text-[#A8874A]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1C1C1C] mb-2">{p.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}