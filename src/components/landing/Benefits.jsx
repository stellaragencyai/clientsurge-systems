import { Clock, CalendarCheck, ShieldCheck, Users, TrendingUp, DollarSign } from "lucide-react";

const benefits = [
  { icon: Clock, title: "Faster Response Times", desc: "Respond to every lead in under 60 seconds — day or night." },
  { icon: CalendarCheck, title: "More Booked Appointments", desc: "Automated booking flows remove friction and increase show rates." },
  { icon: ShieldCheck, title: "Fewer Missed Leads", desc: "No lead goes unanswered. Every inquiry gets a response." },
  { icon: Users, title: "Less Manual Work", desc: "Free your team from repetitive follow-up so they can focus on patients and clients." },
  { icon: TrendingUp, title: "Higher Conversion Rates", desc: "Consistent follow-up turns more inquiries into paying customers." },
  { icon: DollarSign, title: "More Revenue From Existing Demand", desc: "Stop leaving money on the table. Convert the leads you're already generating." },
];

export default function Benefits() {
  return (
    <section className="py-20 md:py-28 px-6 bg-card border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            Real Results
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            What This Means For Your Business
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <b.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}