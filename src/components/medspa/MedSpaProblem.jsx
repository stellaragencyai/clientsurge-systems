import { Clock, PhoneMissed, MessageSquareOff, CalendarX } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Slow Response Loses the Lead",
    desc: "The average med spa takes hours — sometimes days — to reply to a new inquiry. By then, your potential client has already booked elsewhere.",
  },
  {
    icon: PhoneMissed,
    title: "Missed Calls = Missed Bookings",
    desc: "Your front desk is occupied. A call goes unanswered. That client moves on. You paid for that lead — and lost it in silence.",
  },
  {
    icon: MessageSquareOff,
    title: "No Consistent Follow-Up",
    desc: "A lead who doesn't hear back in 24 hours has already gone cold. Without a system, most leads just fade out.",
  },
  {
    icon: CalendarX,
    title: "Consultations Slip Through the Cracks",
    desc: "Interested clients get busy. If no one follows up, they forget. That treatment never gets booked.",
  },
];

export default function MedSpaProblem() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white border-y border-[#EDE8DF]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
            The Real Issue
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C] leading-snug">
            Most Med Spas Lose Leads
            <br />
            After They Come In
          </h2>
          <p className="mt-4 text-[#6B6B6B] text-base leading-relaxed">
            It's not your marketing. It's what happens after a lead arrives.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {problems.map((p, i) => (
            <div
              key={i}
              className="flex gap-5 p-6 rounded-2xl border border-[#EDE8DF] bg-[#FAFAF8] hover:border-[#C9A96E]/40 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#A8874A]/10 flex items-center justify-center">
                <p.icon className="w-5 h-5 text-[#A8874A]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1C1C1C] mb-1">{p.title}</h3>
                <p className="text-sm text-[#6B6B6B] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}