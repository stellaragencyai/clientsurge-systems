import { useEffect, useRef, useState } from "react";
import { ArrowRight, Building2, Heart, Home, MapPin, Sparkles, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import IndustryBlueprintModal from "./IndustryBlueprintModal";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    problem: "Missing consultations and no-shows costing revenue.",
    desc: "Instant response, consultation reminders, and tighter booking follow-up.",
    result: "Best current fit",
    href: "/med-spa",
    image: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/741357982_Gemini_Generated_Image_hdkpn1hdkpn1hdkp.png",
    cta: "Explore this industry",
  },
  {
    icon: Heart,
    name: "Dental & Orthodontics",
    problem: "New patient inquiries cool off before they become booked consults.",
    desc: "Faster response, reminder flows, and cleaner follow-up for dental practices.",
    result: "Launching next",
    href: "/industries#dental",
    image: "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95",
    cta: "See industry roadmap",
  },
  {
    icon: Building2,
    name: "Chiropractic & Physical Therapy",
    problem: "Leads hesitate or disappear before scheduling an evaluation.",
    desc: "Automated response and reactivation for practices that live on booked visits.",
    result: "Launching next",
    href: "/industries#chiropractic",
    image: "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1200&q=95",
    cta: "See industry roadmap",
  },
  {
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    problem: "Missed calls and estimate requests go stale while teams are on the job.",
    desc: "24/7 lead capture, missed-call text-back, and appointment handoff for field teams.",
    result: "Launching next",
    href: "/industries#hvac",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=95",
    cta: "See industry roadmap",
  },
  {
    icon: Home,
    name: "Roofing & Restoration",
    problem: "High-intent estimate requests slip away when response is slow.",
    desc: "Fast callback, estimate follow-up, and missed-call recovery for urgent jobs.",
    result: "Launching next",
    href: "/industries#roofing",
    image: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/3fcc65c06_Screenshot2026-04-21185605.png",
    cta: "See industry roadmap",
  },
  {
    icon: MapPin,
    name: "Contractors & Trades",
    problem: "Quote requests cool off before someone follows up.",
    desc: "Faster response and better quote follow-up for service businesses.",
    result: "General-fit category",
    href: "/industries#contractors",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=95",
    cta: "See industry roadmap",
  },
];

export default function Industries() {
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);

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
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="py-24 md:py-32 px-0 bg-gradient-to-b from-card via-background to-card"
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-16 px-6">
        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-primary">
          Choose Your Industry
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
          Built for Businesses That Win on{" "}
          <span className="text-primary">Fast Response</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-2xl leading-relaxed">
          Start with the live med spa page, or explore the six industry tracks the system is designed around.
        </p>
      </div>

      {/* Cards grid */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {industries.map((industry, index) => {
          const Icon = industry.icon;
          return (
            <div
              key={industry.name}
              className="group relative block overflow-hidden cursor-pointer h-[27.6rem]"
              onClick={() => {
                const blueprintKey = industry.href.includes("med-spa") ? "med-spa" : industry.href.split("#")[1];
                if (["med-spa", "hvac", "dental"].includes(blueprintKey)) {
                  setSelectedBlueprint(blueprintKey);
                }
              }}
              style={{
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 600ms ease ${index * 100}ms, transform 600ms ease ${index * 100}ms`,
              }}
            >
              {/* Full background image */}
              <img
                src={industry.image}
                alt={industry.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              
              {/* Gold border on hover */}
              <div
                className="absolute inset-0 border-2 pointer-events-none transition-opacity duration-400"
                style={{ borderColor: "#c8965c", opacity: 0 }}
                ref={(el) => {
                  if (!el) return;
                  const card = el.closest(".group");
                  if (!card) return;
                  card.addEventListener("mouseenter", () => { el.style.opacity = "1"; });
                  card.addEventListener("mouseleave", () => { el.style.opacity = "0"; });
                }}
              />

              {/* Bottom border accent line */}
              <div
                className="absolute bottom-0 left-0 h-[2px] w-0 transition-all duration-500 ease-out group-hover:w-full"
                style={{ background: "linear-gradient(to right, #c8965c, #f5d9a8, #c8965c)" }}
              />
            </div>
          );
        })}
      </div>

              {selectedBlueprint && (
              <IndustryBlueprintModal
              industry={selectedBlueprint}
              onClose={() => setSelectedBlueprint(null)}
              />
              )}
              </section>
              );
              }