import { ArrowRight, Building2, Heart, Home, MapPin, Sparkles, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    problem: "Missing consultations and no-shows costing revenue.",
    desc: "Instant response, consultation reminders, and tighter booking follow-up for aesthetic inquiries.",
    result: "Best current fit",
    href: "/med-spa",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=85",
    cta: "Explore this industry",
  },
  {
    icon: Heart,
    name: "Dental & Orthodontics",
    problem: "New patient inquiries cool off before they ever turn into booked consults.",
    desc: "Faster response, reminder flows, and cleaner follow-up for practices that rely on consultation and treatment bookings.",
    result: "Launching next",
    href: "/industries#dental",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=85",
    cta: "See industry roadmap",
  },
  {
    icon: Building2,
    name: "Chiropractic & Physical Therapy",
    problem: "Leads hesitate or disappear before they ever schedule an evaluation.",
    desc: "Automated response and reactivation for practices that live on booked evaluations and recurring visits.",
    result: "Launching next",
    href: "/industries#chiropractic",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=900&q=85",
    cta: "See industry roadmap",
  },
  {
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    problem: "Missed calls and estimate requests go stale while teams are on the job.",
    desc: "24/7 lead capture, missed-call text-back, and cleaner appointment handoff for field teams.",
    result: "Launching next",
    href: "/industries#hvac",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=900&q=85",
    cta: "See industry roadmap",
  },
  {
    icon: Home,
    name: "Roofing & Restoration",
    problem: "High-intent estimate requests slip away when response is slow.",
    desc: "Fast callback, estimate follow-up, and missed-call recovery for teams where urgency closes jobs.",
    result: "Launching next",
    href: "/industries#roofing",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=85",
    cta: "See industry roadmap",
  },
  {
    icon: MapPin,
    name: "Contractors & Trades",
    problem: "Quote requests cool off before someone follows up.",
    desc: "Faster response and better quote follow-up for service businesses that win work through responsiveness.",
    result: "General-fit category",
    href: "/industries#contractors",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=85",
    cta: "See industry roadmap",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card via-background to-card">
      <div className="max-w-3xl mx-auto text-center mb-14">
        <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Choose Your Industry</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
          Built for Businesses That Win on <span className="text-primary">Fast Response and Better Booking</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg">
          Start with the live med spa page, or explore the six industry tracks the system is designed around.
        </p>
      </div>

      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-3 mb-10">
        {industries.map((industry) => (
          <span
            key={`${industry.name}-pill`}
            className="inline-flex items-center rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground/80 shadow-sm"
          >
            {industry.name}
          </span>
        ))}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {industries.map((industry) => {
          const Icon = industry.icon;
          return (
            <article
              key={industry.name}
              className="group overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="relative h-60 overflow-hidden">
                <img
                  src={industry.image}
                  alt={industry.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                  <Icon className="w-3.5 h-3.5" />
                  {industry.result}
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <h3 className="font-display text-2xl font-semibold text-white leading-tight">{industry.name}</h3>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm font-semibold text-foreground mb-2">{industry.problem}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{industry.desc}</p>
                <Link
                  to={industry.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {industry.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
