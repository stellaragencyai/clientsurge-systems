import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Heart,
  Home,
  MapPin,
  Sparkles,
  Wrench,
} from "lucide-react";
import { INDUSTRY_SELECTION_STORAGE_KEY } from "@/lib/industryRecommendations";
import { buildResponsiveImageProps } from "@/lib/imageOptimization";
import medSpaIndustryImage from "@/assets/industry-medspa.webp";
import roofingIndustryImage from "@/assets/industry-roofing.webp";

const industryPatterns = {
  "med-spa": (
    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pat-medspa" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="10" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="16" cy="16" r="4" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pat-medspa)" />
    </svg>
  ),
  dental: (
    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pat-dental" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <line x1="0" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1" />
          <line x1="14" y1="0" x2="14" y2="28" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pat-dental)" />
    </svg>
  ),
  "chiro-pt": (
    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pat-chiro" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <polygon points="20,4 36,36 4,36" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pat-chiro)" />
    </svg>
  ),
  hvac: (
    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pat-hvac" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <rect x="4" y="4" width="16" height="16" fill="none" stroke="white" strokeWidth="1" />
          <rect x="9" y="9" width="6" height="6" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pat-hvac)" />
    </svg>
  ),
  roofing: (
    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pat-roofing" x="0" y="0" width="36" height="20" patternUnits="userSpaceOnUse">
          <path d="M0,20 L18,0 L36,20" fill="none" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pat-roofing)" />
    </svg>
  ),
  contractors: (
    <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="pat-contractors" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="30" y2="30" stroke="white" strokeWidth="1" />
          <line x1="30" y1="0" x2="0" y2="30" stroke="white" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#pat-contractors)" />
    </svg>
  ),
};

const industries = [
  {
    id: "med-spa",
    category: "Health",
    routePath: "/med-spa",
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    summary: "Automate consultation booking, lead nurture, no-show reduction, and membership follow-up.",
    accent: {
      color: "#38bdf8",
      soft: "rgba(56,189,248,0.18)",
      glow: "rgba(56,189,248,0.28)",
      iconBg: "rgba(56,189,248,0.18)",
    },
    image: medSpaIndustryImage,
  },
  {
    id: "dental",
    category: "Health",
    routePath: "/dental",
    icon: Heart,
    name: "Dental & Orthodontics",
    summary: "Handle new patient leads, emergency inquiries, reminders, and unfinished treatment follow-up.",
    accent: {
      color: "#0ea5e9",
      soft: "rgba(14,165,233,0.18)",
      glow: "rgba(14,165,233,0.28)",
      iconBg: "rgba(14,165,233,0.18)",
    },
    image: "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95",
  },
  {
    id: "chiro-pt",
    category: "Health",
    routePath: "/chiropractic",
    icon: Building2,
    name: "Chiropractic & Physical Therapy",
    summary: "Capture new patient demand, reduce drop-off, and reactivate unfinished care plans.",
    accent: {
      color: "#2563eb",
      soft: "rgba(37,99,235,0.16)",
      glow: "rgba(37,99,235,0.24)",
      iconBg: "rgba(37,99,235,0.16)",
    },
    image: "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1200&q=95",
  },
  {
    id: "hvac",
    category: "Trades",
    routePath: "/hvac",
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    summary: "Recover urgent missed calls, route service requests fast, and follow up on estimates automatically.",
    accent: {
      color: "#0284c7",
      soft: "rgba(2,132,199,0.18)",
      glow: "rgba(2,132,199,0.28)",
      iconBg: "rgba(2,132,199,0.18)",
    },
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=95",
  },
  {
    id: "roofing",
    category: "Property",
    routePath: "/roofing",
    icon: Home,
    name: "Roofing & Restoration",
    summary: "Handle storm-season spikes, inspection booking, estimate follow-up, and dormant lead recovery.",
    accent: {
      color: "#075985",
      soft: "rgba(7,89,133,0.18)",
      glow: "rgba(7,89,133,0.28)",
      iconBg: "rgba(7,89,133,0.18)",
    },
    image: roofingIndustryImage,
  },
  {
    id: "contractors",
    category: "Trades",
    routePath: "/contractors",
    icon: MapPin,
    name: "Contractors & Trades",
    summary: "Move quote requests faster, revive stale opportunities, and keep project inquiries organized.",
    accent: {
      color: "#1d4ed8",
      soft: "rgba(29,78,216,0.16)",
      glow: "rgba(29,78,216,0.24)",
      iconBg: "rgba(29,78,216,0.16)",
    },
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=95",
  },
];

export default function Industries() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [sectionVisible, setSectionVisible] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);
  const [hoveredIndustryId, setHoveredIndustryId] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const CATEGORIES = ["All", "Health", "Trades", "Property"];
  const visibleIndustries = activeCategory === "All"
    ? industries
    : industries.filter((industry) => industry.category === activeCategory);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const savedIndustryId = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
    if (savedIndustryId && industries.some((industry) => industry.id === savedIndustryId)) {
      setSelectedIndustryId(savedIndustryId);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !selectedIndustryId) return;
    window.sessionStorage.setItem(INDUSTRY_SELECTION_STORAGE_KEY, selectedIndustryId);
    window.dispatchEvent(new CustomEvent("clientsurge:industry-selected"));
  }, [selectedIndustryId]);

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleIndustrySelect = (industry) => {
    setSelectedIndustryId(industry.id);
    navigate(industry.routePath);
  };

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="bg-gradient-to-b from-card via-background via-70% to-slate-50/40 px-0 pb-24 pt-16 md:pb-32 md:pt-24"
    >
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-10 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-primary">Choose Your Industry</p>
        <h2
          className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Built for Businesses That Win on <span className="text-primary">Fast Response</span>
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Pick your niche to see the ClientSurge system we would lead with first, why it fits, and how the
          stack maps to the way that business actually closes jobs.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Filter industries by category">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                aria-pressed={isActive}
                className="rounded-full text-xs font-bold transition-all"
                style={{
                  padding: "0.5rem 1rem",
                  border: `1px solid ${isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                  background: isActive ? "hsl(var(--primary))" : "transparent",
                  color: isActive ? "#ffffff" : "hsl(var(--muted-foreground))",
                  boxShadow: isActive ? "var(--cs-glow-sm)" : "none",
                }}
              >
                {cat === "All" ? "All industries" : cat}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 px-6 md:grid-cols-2 lg:grid-cols-3"
        style={{ overflowX: "hidden", gridAutoRows: "minmax(300px, auto)" }}
      >
        {visibleIndustries.map((industry, index) => {
          const Icon = industry.icon;
          const highlighted = hoveredIndustryId === industry.id;
          const isSelected = selectedIndustryId === industry.id;
          const accent = industry.accent;
          const isTrending = index === 0;
          const rowSpan = index % 3 === 0 ? "span 2" : "span 1";
          const imageProps = buildResponsiveImageProps(industry.image, {
            widths: [480, 720, 960, 1200],
            sizes: "(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw",
            quality: 80,
          });

          return (
            <button
              key={industry.id}
              type="button"
              aria-label={industry.name}
              aria-pressed={isSelected}
              className="group relative block min-h-[300px] overflow-hidden rounded-[28px] text-left md:min-h-[340px]"
              onClick={() => handleIndustrySelect(industry)}
              onMouseEnter={() => setHoveredIndustryId(industry.id)}
              onMouseLeave={() => setHoveredIndustryId("")}
              onFocus={() => setHoveredIndustryId(industry.id)}
              onBlur={() => setHoveredIndustryId("")}
              style={{
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 600ms ease ${index * 100}ms, transform 600ms ease ${index * 100}ms`,
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
                position: "relative",
                zIndex: isSelected ? 2 : 1,
                scale: highlighted ? "1.015" : isSelected ? "1.02" : "1",
                contentVisibility: "auto",
                containIntrinsicSize: "380px 340px",
                gridRow: rowSpan,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(145deg, ${accent.color} 0%, #0a2240 52%, #061120 100%)`,
                }}
              />

              <img
                {...imageProps}
                alt={industry.name}
                loading="lazy"
                decoding="async"
                width="600"
                height="442"
                className="absolute inset-0 h-full w-full object-cover mix-blend-luminosity opacity-[0.22]"
                style={{ filter: "grayscale(0.35) saturate(0.7) contrast(1.05) brightness(0.78)" }}
                fetchpriority={index === 0 ? "high" : "auto"}
              />

              {industryPatterns[industry.id]}

              <div
                className="absolute inset-0"
                style={{
                  background: highlighted
                    ? "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(5,16,34,0.12) 28%, rgba(5,16,34,0.88) 100%)"
                    : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(5,16,34,0.1) 28%, rgba(5,16,34,0.9) 100%)",
                }}
              />

              <div
                className="absolute inset-0 border-2 transition-all duration-300"
                style={{
                  borderColor: isSelected ? accent.color : highlighted ? accent.color : "rgba(255,255,255,0.08)",
                  boxShadow:
                    isSelected || highlighted
                      ? `inset 0 0 0 1px ${accent.soft}, 0 0 0 2px ${accent.glow}`
                      : "none",
                }}
              />

              {isSelected && (
                <div className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path
                      d="M5 12l4 4 10-10"
                      stroke="#fff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "999px",
                      background: accent.color,
                      boxShadow: `0 0 0 5px ${accent.soft}`,
                    }}
                  />
                  Industry System
                </span>
                {isTrending && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      borderRadius: "999px",
                      padding: "6px 11px",
                      background: "linear-gradient(135deg, rgba(212,175,55,0.28), rgba(212,175,55,0.16))",
                      border: "1px solid rgba(212,175,55,0.42)",
                      color: "#F5E6B8",
                      fontSize: "10px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      boxShadow: "0 0 14px rgba(212,175,55,0.30)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#E5C978" }} />
                    Trending
                  </span>
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-12" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(5,16,34,0.35) 30%, rgba(5,16,34,0.78) 100%)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
                <div
                  className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border backdrop-blur-sm transition-transform duration-300"
                  style={{
                    background: highlighted || isSelected ? accent.iconBg : "rgba(255,255,255,0.12)",
                    borderColor: highlighted || isSelected ? accent.soft : "rgba(255,255,255,0.14)",
                    boxShadow: highlighted || isSelected ? `0 10px 30px ${accent.glow}` : "none",
                    transform: highlighted ? "translateY(-2px) scale(1.02)" : "none",
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: highlighted || isSelected ? accent.color : "#ffffff" }} />
                </div>

                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: "800",
                    lineHeight: 1.16,
                    color: "#ffffff",
                    textShadow: "0 1px 12px rgba(0,0,0,0.76)",
                    margin: 0,
                  }}
                >
                  {industry.name}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.78)",
                    margin: "10px 0 0",
                    maxWidth: "92%",
                    opacity: 1,
                  }}
                >
                  {industry.summary}
                </p>

                <div
                  style={{
                    marginTop: "16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    opacity: highlighted || isSelected ? 1 : 0.82,
                  }}
                >
                  View system
                  <span
                    aria-hidden="true"
                    style={{
                      transform: highlighted ? "translateX(4px)" : "translateX(0)",
                      transition: "transform 0.25s ease",
                    }}
                  >
                    →
                  </span>
                </div>
              </div>

              <div
                className="absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-out"
                style={{
                  width: highlighted ? "100%" : "0%",
                  background: `linear-gradient(to right, ${accent.color}, #ffffff, ${accent.color})`,
                }}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}