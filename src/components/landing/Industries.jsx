import { Sparkles, Heart, Building2, Home, MapPin, Wrench, ArrowRight } from "lucide-react";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    problem: "Missing consultations, no-shows costing revenue.",
    desc: "Capture aesthetic & injectable inquiries instantly. Confirm appointments and reduce no-shows with automated follow-up sequences.",
    result: "2.4× more consultations booked • 34% fewer no-shows",
    href: "/med-spa",
    image: "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=800&q=80",
  },
  {
    icon: Heart,
    name: "Wellness Studios",
    problem: "Leads dropping off before membership conversion.",
    desc: "Instantly follow up with trial class inquiries. Reactivate dormant members and convert more paid leads without extra ad spend.",
    result: "58% higher conversion rates • 3× faster response time",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  },
  {
    icon: Building2,
    name: "Real Estate Agents & Brokers",
    problem: "Slow response time loses showings to competitors.",
    desc: "Respond to property inquiries within minutes. Automate showing scheduling, follow-ups, and buyer nurturing from first contact to closing.",
    result: "5× more showings scheduled • 42% faster lead response",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  },
  {
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    problem: "Can't respond to service calls while on the job.",
    desc: "Field teams stay focused while automated systems capture estimate requests, book appointments, and follow up on pending quotes.",
    result: "65% more jobs booked • 24/7 lead capture & response",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80",
  },
  {
    icon: Home,
    name: "Contractors, Electricians & Trades",
    problem: "Losing bids to whoever responds first.",
    desc: "Instant quote request responses keep you top-of-mind when crews are on-site. Win more contracts with intelligent bid tracking.",
    result: "3.2× more quotes accepted • Higher win rates on bids",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
  },
  {
    icon: MapPin,
    name: "Local Service Businesses",
    problem: "Paying for leads but not converting them.",
    desc: "Capture leads across all channels. Automated follow-up, appointment reminders, and reactivation campaigns turn paid traffic into bookings.",
    result: "2–3× ROAS on marketing spend • 40% more appointments",
    href: "#book-demo",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="bg-gradient-to-b from-card via-background to-card">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center pt-24 pb-14 px-6">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Who We Work With</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight">
          <span className="text-foreground">Built for </span>
          <span className="text-primary">Businesses</span>
          <span className="text-foreground"> That Run on </span>
          <span className="text-primary">Bookings</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          Pick your industry — we'll show you exactly how it works for you.
        </p>
      </div>

      {/* Full-bleed 3-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        {industries.map((ind, i) => {
          const Icon = ind.icon;
          return (
            <a
              key={i}
              href={ind.href}
              className="group relative flex flex-col overflow-hidden"
              style={{ minHeight: "480px" }}
            >
              {/* Image — 70% */}
              <div className="relative overflow-hidden" style={{ height: "70%" }}>
                <img
                  src={ind.image}
                  alt={ind.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/50" />
                {/* Icon badge */}
                <div className="absolute top-5 left-5 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Content — 30% */}
              <div className="relative flex-1 bg-white px-6 py-5 flex flex-col justify-between border-t border-border group-hover:bg-primary/5 transition-colors duration-300">
                <div>
                  <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">
                    {ind.name}
                  </h3>
                  <p className="text-xs font-medium text-primary/80 italic mb-2">{ind.problem}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{ind.desc}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-primary/70">{ind.result}</p>
                  <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </div>

              {/* Border between cards */}
              {i % 3 !== 2 && (
                <div className="absolute top-0 right-0 w-px h-full bg-border/40 hidden md:block" />
              )}
            </a>
          );
        })}
      </div>

      <div className="pb-24" />
    </section>
  );
}