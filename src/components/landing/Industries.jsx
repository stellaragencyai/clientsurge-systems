import { useEffect, useRef, useState } from "react";
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
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setSectionVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32 px-6 bg-gradient-to-b from-card via-background to-card"
    >
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
        <div className="h-44 w-[34rem] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute left-[-8rem] top-1/3 h-52 w-52 rounded-full bg-white/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] bottom-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      {/* Header */}
      <div className="relative mx-auto mb-14 max-w-4xl rounded-[2rem] border border-white/40 bg-white/65 px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase mb-4">Choose Your Industry</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
          Built for Businesses That Win on <span className="text-primary">Fast Response and Better Booking</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg md:text-xl">
          Start with the live med spa page, or explore the six industry tracks the system is designed around.
        </p>
      </div>

      {/* Pills */}
      <div className="relative mx-auto mb-12 flex max-w-[108rem] flex-wrap items-center justify-center gap-3 rounded-[2rem] border border-white/30 bg-white/45 px-5 py-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] backdrop-blur-lg">
        {industries.map((industry, index) => (
          <span
            key={`${industry.name}-pill`}
            className="inline-flex items-center rounded-full border border-white/60 bg-white/75 px-5 py-2.5 text-xs font-semibold text-foreground/80 shadow-sm"
            style={{
              opacity: sectionVisible ? 1 : 0,
              transform: sectionVisible ? "translateY(0)" : "translateY(10px)",
              transition: `opacity 480ms ease ${index * 60}ms, transform 480ms ease ${index * 60}ms`,
            }}
          >
            {industry.name}
          </span>
        ))}
      </div>

      {/* Cards grid */}
      <div className="relative mx-auto grid max-w-[112rem] grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry, index) => {
          const Icon = industry.icon;
          return (
            <Link
              to={industry.href}
              key={industry.name}
              className="industry-card group relative block overflow-hidden rounded-2xl shadow-[0_8px_40px_rgba(15,23,42,0.14)] ring-1 ring-black/10"
              style={{
                aspectRatio: "4 / 3",
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 560ms ease ${index * 120}ms, transform 560ms ease ${index * 120}ms`,
              }}
            >
              {/* Full-card photo */}
              <img
                src={industry.image}
                alt={industry.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
              />

              {/* Permanent dark gradient at bottom so title is always legible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

              {/* Status pill */}
              <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white backdrop-blur-md">
                <Icon className="w-3 h-3" />
                {industry.result}
              </div>

              {/* Default state: title only at bottom */}
              <div className="industry-title absolute inset-x-0 bottom-0 px-6 pb-5 transition-all duration-400 ease-out group-hover:translate-y-2 group-hover:opacity-0">
                <h3 className="font-display text-xl font-bold leading-tight text-white">
                  {industry.name}
                </h3>
              </div>

              {/* Hover overlay: rich brown panel slides up */}
              <div className="industry-hover-panel absolute inset-x-0 bottom-0 flex flex-col justify-end px-6 pb-6 pt-10 translate-y-full opacity-0 transition-all duration-450 ease-out group-hover:translate-y-0 group-hover:opacity-100"
                style={{ background: "linear-gradient(to top, rgba(90,50,18,0.97) 0%, rgba(107,63,31,0.92) 55%, transparent 100%)" }}
              >
                {/* Gold accent line */}
                <div className="mb-3 h-[2px] w-8 rounded-full bg-[#c8965c]" />
                <h3 className="font-display text-lg font-bold leading-tight text-white mb-2">
                  {industry.name}
                </h3>
                <p className="mb-1.5 text-sm font-semibold leading-snug text-white/90">{industry.problem}</p>
                <p className="mb-4 text-xs leading-relaxed text-white/65">{industry.desc}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-[#f5d9a8]">
                  {industry.cta}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <style>{`
        .industry-card {
          transition-property: opacity, transform, box-shadow;
        }
        .industry-card:hover {
          box-shadow: 0 24px 64px rgba(107,63,31,0.35), 0 4px 16px rgba(0,0,0,0.12);
        }
        .industry-hover-panel {
          transition: transform 420ms cubic-bezier(0.4, 0, 0.2, 1), opacity 380ms ease;
        }
        .industry-title {
          transition: opacity 250ms ease, transform 300ms ease;
        }
      `}</style>
    </section>
  );
}