import { CalendarCheck, Clock, TrendingUp, Users, MessageSquare, DollarSign } from "lucide-react";

const benefits = [
  {
    icon: CalendarCheck,
    title: "More Booked Consultations",
    desc: "Every lead gets a fast response and a clear path to booking. More inquiries turn into confirmed appointments.",
  },
  {
    icon: Clock,
    title: "Faster Response Than Competitors",
    desc: "You respond in seconds. Your competitors take hours. You win the booking before they even see the notification.",
  },
  {
    icon: TrendingUp,
    title: "Stronger Lead Conversion",
    desc: "The same traffic you're already getting converts at a higher rate. No extra ad spend needed.",
  },
  {
    icon: Users,
    title: "Less Front Desk Overload",
    desc: "Your team stops chasing leads and starts focusing on clients in the room — where they should be.",
  },
  {
    icon: MessageSquare,
    title: "Fewer Missed Leads",
    desc: "Every inquiry — form, call, DM — gets captured and responded to. Nothing falls through the cracks.",
  },
  {
    icon: DollarSign,
    title: "More Revenue From Existing Leads",
    desc: "Old inquiries, missed calls, cold contacts — re-engaged and converted into appointments you already paid for.",
  },
];

export default function MedSpaBenefits() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left: image */}
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Outcomes</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              What This Means for Your Med Spa
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              The goal isn't just automation. The goal is more consultations booked, more revenue generated, and a front desk that isn't overwhelmed.
            </p>
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=85"
                alt="Happy med spa client"
                className="w-full h-64 object-cover object-top"
              />
            </div>
          </div>

          {/* Right: benefit cards */}
          <div className="space-y-4">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex gap-4 p-5 bg-[#FAFAF8] rounded-xl border border-border hover:border-primary/25 hover:shadow-sm transition-all duration-200">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-1">{b.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}