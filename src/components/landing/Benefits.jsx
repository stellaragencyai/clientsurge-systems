import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CalendarCheck, ShieldCheck, Users, TrendingUp, DollarSign } from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Respond Before Your Competitor Does",
    desc: "First to respond wins the booking. Our systems reply in under 60 seconds — day, night, weekends.",
  },
  {
    icon: CalendarCheck,
    title: "A Fuller Calendar, Without More Effort",
    desc: "Automated booking flows mean more appointments confirmed and fewer no-shows draining your day.",
  },
  {
    icon: ShieldCheck,
    title: "Zero Leads Slipping Through",
    desc: "Every inquiry gets a response. Every follow-up gets sent. Nothing depends on someone remembering.",
  },
  {
    icon: Users,
    title: "Your Team Focuses on What Matters",
    desc: "When follow-up is automated, your staff focuses on clients in front of them — not chasing cold leads.",
  },
  {
    icon: TrendingUp,
    title: "Higher Conversions From the Same Traffic",
    desc: "You're already paying for leads. We help you convert more of them — without spending a dollar more on ads.",
  },
  {
    icon: DollarSign,
    title: "Revenue You Were Already Leaving on the Table",
    desc: "Missed calls, slow replies, forgotten leads. Our systems recover that revenue and turn it into bookings.",
  },
];

export default function Benefits() {
  return (
    <section className="py-24 md:py-32 px-6 bg-background transition-all duration-700">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Outcomes</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            What Changes When You <span className="text-primary">Automate</span>
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

        <div className="text-center mt-14">
          <a href="#book-demo">
            <Button className="rounded-full px-8 h-12 text-base font-semibold gap-2">
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}