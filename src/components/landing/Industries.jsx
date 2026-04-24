import { useEffect, useRef, useState } from "react";
import { Building2, Heart, Home, MapPin, Sparkles, Wrench, X } from "lucide-react";
import IndustryBlueprintModal from "./IndustryBlueprintModal";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    isLive: true,
    blueprintKey: "med-spa",
    image: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/741357982_Gemini_Generated_Image_hdkpn1hdkpn1hdkp.png",
  },
  {
    icon: Heart,
    name: "Dental & Orthodontics",
    isLive: false,
    blueprintKey: "dental",
    image: "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95",
  },
  {
    icon: Building2,
    name: "Chiropractic & Physical Therapy",
    isLive: false,
    blueprintKey: null,
    image: "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1200&q=95",
  },
  {
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    isLive: false,
    blueprintKey: "hvac",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=95",
  },
  {
    icon: Home,
    name: "Roofing & Restoration",
    isLive: false,
    blueprintKey: null,
    image: "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/3fcc65c06_Screenshot2026-04-21185605.png",
  },
  {
    icon: MapPin,
    name: "Contractors & Trades",
    isLive: false,
    blueprintKey: null,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=95",
  },
];

function ComingSoonModal({ name, onClose }) {
  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", zIndex: 40 }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 50,
          maxWidth: "440px",
          width: "90%",
          background: "linear-gradient(135deg, #fdfcfa 0%, #f8f4ee 100%)",
          borderRadius: "20px",
          border: "1.5px solid rgba(154,92,46,0.2)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          padding: "40px 36px",
          textAlign: "center",
          animation: "csModalIn 0.38s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <button
          onClick={onClose}
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", color: "rgba(26,18,9,0.4)" }}
        >
          <X style={{ width: "18px", height: "18px" }} />
        </button>
        <div style={{ fontSize: "42px", marginBottom: "16px" }}>🚧</div>
        <p style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9a5c2e", marginBottom: "10px" }}>
          Coming Soon
        </p>
        <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1a1209", margin: "0 0 12px" }}>{name}</h2>
        <p style={{ fontSize: "14px", color: "rgba(26,18,9,0.6)", lineHeight: 1.6, margin: "0 0 28px" }}>
          We're actively building the dedicated track for this industry. Book a demo and we'll walk you through how we'd set it up for your business today.
        </p>
        <a
          href="/book"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: "48px",
            padding: "0 32px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            color: "#f5e6d0",
            fontWeight: "700",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          Book a Demo
        </a>
        <style>{`
          @keyframes csModalIn {
            from { opacity: 0; transform: translate(-50%, -46%) scale(0.9); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>
      </div>
    </>
  );
}

export default function Industries() {
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [comingSoonIndustry, setComingSoonIndustry] = useState(null);

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

  const handleCardClick = (industry) => {
    if (industry.isLive && industry.blueprintKey) {
      setSelectedBlueprint(industry.blueprintKey);
    } else if (!industry.isLive) {
      setComingSoonIndustry(industry.name);
    }
  };

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
          return (
            <div
              key={industry.name}
              className="group relative block overflow-hidden cursor-pointer h-[27.6rem]"
              onClick={() => handleCardClick(industry)}
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
                style={industry.isLive ? {} : { filter: "grayscale(70%) brightness(0.55)" }}
              />

              {/* Dark overlay for coming soon */}
              {!industry.isLive && (
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, rgba(10,10,14,0.35) 0%, rgba(10,10,14,0.72) 100%)" }}
                />
              )}

              {/* Live cards: gradient overlay for text readability */}
              {industry.isLive && (
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(10,10,14,0.6) 100%)" }}
                />
              )}

              {/* Coming soon badge */}
              {!industry.isLive && (
                <div className="absolute top-4 left-4">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      background: "rgba(200,150,92,0.18)",
                      border: "1px solid rgba(200,150,92,0.35)",
                      backdropFilter: "blur(8px)",
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#c8965c",
                    }}
                  >
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Industry name — bottom center */}
              <div className="absolute bottom-0 inset-x-0 flex items-end justify-center pb-5 px-4">
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    letterSpacing: "0.04em",
                    color: industry.isLive ? "#fff" : "rgba(255,255,255,0.65)",
                    textAlign: "center",
                    textShadow: "0 1px 6px rgba(0,0,0,0.5)",
                    margin: 0,
                  }}
                >
                  {industry.name}
                </p>
              </div>

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

      {comingSoonIndustry && (
        <ComingSoonModal
          name={comingSoonIndustry}
          onClose={() => setComingSoonIndustry(null)}
        />
      )}
    </section>
  );
}