import { X } from "lucide-react";

const problems = [
  { title: "Leads not answered fast enough", desc: "By the time someone follows up, the lead has already booked elsewhere." },
  { title: "Missed calls become lost appointments", desc: "Every unanswered phone call is a potential consultation you will never get back." },
  { title: "Front desk teams get overwhelmed", desc: "Your staff is focused on clients in the room — not chasing new inquiries." },
  { title: "Follow-ups are inconsistent or forgotten", desc: "Manual outreach is unreliable. Some leads get follow-up. Most don't." },
  { title: "Old leads go cold and are never re-engaged", desc: "Your database is full of past inquiries that could still become bookings." },
];

const channels = ["Instagram", "Website", "Phone Calls", "Google Ads", "Referrals", "Facebook"];

export default function MedSpaProblem() {
  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Real Problem</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-5">
            Most Med Spas Don't Have a Lead Problem. They Have a <span className="text-primary">Follow-Up Problem.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            You're already getting inquiries through multiple channels. The problem is what happens next — or what <em>doesn't</em> happen.
          </p>
        </div>

        {/* Channels */}
        <div className="flex flex-wrap justify-center gap-3 mb-14">
          {channels.map((c, i) => (
            <span key={i} className="px-4 py-2 bg-white border border-border rounded-full text-sm font-medium text-foreground/70">
              {c}
            </span>
          ))}
        </div>

        {/* Two-column: image + problem list */}
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=85"
              alt="Med spa reception"
              className="w-full h-72 md:h-full object-cover"
            />
          </div>

          <div className="space-y-4">
            {problems.map((p, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white rounded-xl border border-border hover:border-destructive/30 hover:shadow-sm transition-all">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">{p.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
            <p className="text-sm font-semibold text-foreground/60 pt-2 pl-1 italic">
              That is where bookings and revenue are quietly lost.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}