import { Zap, MessageSquare, PhoneOff, CalendarCheck, RotateCcw } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Response',
    desc: 'Every inquiry gets a personalized response within 60 seconds—even at 2 AM.',
  },
  {
    icon: MessageSquare,
    title: 'Automated Follow-Up',
    desc: 'Multi-step sequences that nurture leads until they book or opt out.',
  },
  {
    icon: PhoneOff,
    title: 'Missed Call Recovery',
    desc: 'When you miss a call, a text fires instantly to keep the conversation alive.',
  },
  {
    icon: CalendarCheck,
    title: 'Booking Conversion Flow',
    desc: 'Leads guided directly to your calendar. No back-and-forth emails.',
  },
  {
    icon: RotateCcw,
    title: 'Old Lead Reactivation',
    desc: "Generate revenue from leads you've already paid for. They get a second chance.",
  },
];

export default function SolutionSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-card">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground text-center mb-4">
          We fix the exact point
        </h2>
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-primary text-center mb-16">
          where bookings are lost.
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="flex flex-col">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}