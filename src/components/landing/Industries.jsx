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
      { threshold: 0.18 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32 px-6 bg-gradient-to-b from-card via-background to-card"
    >
      <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center">
        <div className="h-44 w-[34rem] rounded-full bg-primary/10 blur-3xl" />
      </div>
      <div className="pointer-events-none absolute left-[-8rem] top-1/3 h-52 w-52 rounded-full bg-white/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] bottom-12 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto mb-14 max-w-4xl rounded-[2rem] border border-white/40 bg-white/65 px-8 py-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase mb-4">Choose Your Industry</p>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
          Built for Businesses That Win on <span className="text-primary">Fast Response and Better Booking</span>
        </h2>
        <p className="mt-5 text-muted-foreground text-lg md:text-xl">
          Start with the live med spa page, or explore the six industry tracks the system is designed around.
        </p>
      </div>

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

      <div className="relative mx-auto grid max-w-[112rem] grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
        {industries.map((industry, index) => {
          const Icon = industry.icon;
          return (
            <article
              key={industry.name}
              className="group relative overflow-hidden rounded-[2rem] border border-slate-500/95 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(255,251,246,0.76))] shadow-[0_22px_56px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/10 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:border-[#8f6848] hover:shadow-[0_34px_86px_rgba(15,23,42,0.14)]"
              style={{
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(28px)",
                transition: `opacity 560ms ease ${index * 120}ms, transform 560ms ease ${index * 120}ms, box-shadow 500ms ease, border-color 500ms ease`,
              }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="absolute inset-y-0 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/35 to-transparent blur-xl transition-transform duration-700 group-hover:translate-x-[180%]" />
              </div>
              <div className="pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-[#f6dfb6]/40 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(201,156,110,0.16),transparent_40%)] opacity-90" />
              <div className="relative h-[16.5rem] overflow-hidden md:h-[16.5rem]">
                <img
                  src={industry.image}
                  alt={industry.name}
                  loading="lazy"
                  className="h-full w-full object-cover saturate-[0.96] transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/40 bg-black/30 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-md">
                  <Icon className="w-3.5 h-3.5" />
                  {industry.result}
                </div>
              </div>

              <div className="relative p-7 md:p-8">
                <h3 className="font-serif text-[1.25rem] font-semibold leading-tight text-slate-900 mb-4">{industry.name}</h3>
                <div className="mb-4 h-px w-full bg-gradient-to-r from-[#9a6c45]/25 via-[#c8965c]/55 to-transparent" />
                <p className="mb-3 font-serif text-[1.08rem] font-semibold leading-relaxed text-slate-900">{industry.problem}</p>
                <p className="mb-6 text-[15px] leading-7 text-slate-600">{industry.desc}</p>
                <Link
                  to={industry.href}
                  className="inline-flex items-center gap-2 rounded-full border border-[#b98b61]/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(252,245,234,0.9))] px-4 py-2.5 text-sm font-semibold text-[#8a5a32] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#a0714f] hover:bg-white"
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