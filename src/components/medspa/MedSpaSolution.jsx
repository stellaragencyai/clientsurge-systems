import { Zap, RotateCcw, PhoneOff, CalendarCheck, RefreshCcw } from "lucide-react";

const solutions = [
  {
    icon: Zap,
    title: "Instant Lead Response",
    desc: "Every new inquiry gets an immediate, personalized reply — automatically. Under 60 seconds, every time.",
  },
  {
    icon: RotateCcw,
    title: "Automated Follow-Up Sequences",
    desc: "Smart messages keep following up at the right time until the lead books or opts out. Nothing is left to chance.",
  },
  {
    icon: PhoneOff,
    title: "Missed Call Text-Back",
    desc: "When a call goes unanswered, a text fires instantly. The conversation continues and the booking stays alive.",
  },
  {
    icon: CalendarCheck,
    title: "Seamless Booking Flow",
    desc: "Leads are guided directly to your consultation calendar — no back-and-forth, no manual scheduling.",
  },
  {
    icon: RefreshCcw,
    title: "Lead Reactivation",
    desc: "We re-engage old contacts who never booked. Past inquiries become new consultations.",
  },
];

export default function MedSpaSolution() {
  return (
    <section className="py-20 md:py-28 px-6 bg-[#FAFAF8] border-b border-[#EDE8DF]">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <p className="text-xs font-semibold text-[#A8874A] tracking-widest uppercase mb-4">
            The Fix
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C]">
            We Fix Your Follow-Up System. Completely.
          </h2>
          <p className="mt-4 text-[#6B6B6B] text-base leading-relaxed">
            Everything your front desk doesn't have time to do — we automate it.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {solutions.map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-[#EDE8DF] bg-white hover:border-[#C9A96E]/50 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#A8874A]/10 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-[#A8874A]" />
              </div>
              <h3 className="text-sm font-semibold text-[#1C1C1C] mb-2">{s.title}</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}