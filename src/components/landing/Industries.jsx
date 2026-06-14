import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Droplets,
  Heart,
  Home,
  MapPin,
  Sparkles,
  Wrench,
  Scale,
  KeyRound } from
"lucide-react";
import { INDUSTRY_SELECTION_STORAGE_KEY } from
"@/lib/industryRecommendations";
import { buildResponsiveImageProps } from "@/lib/imageOptimization";

// Unique SVG pattern per industry — lightweight, inline, no external deps
const industryPatterns = {
  "med-spa": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-medspa" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="16" cy="16" r="10" fill="none" stroke="white" strokeWidth="1"/>
        <circle cx="16" cy="16" r="4" fill="white"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-medspa)"/>
    </svg>
  ),
  "dental": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-dental" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <line x1="0" y1="14" x2="28" y2="14" stroke="white" strokeWidth="1"/>
        <line x1="14" y1="0" x2="14" y2="28" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-dental)"/>
    </svg>
  ),
  "chiro-pt": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-chiro" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <polygon points="20,4 36,36 4,36" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-chiro)"/>
    </svg>
  ),
  "hvac": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-hvac" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
        <rect x="4" y="4" width="16" height="16" fill="none" stroke="white" strokeWidth="1"/>
        <rect x="9" y="9" width="6" height="6" fill="white"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-hvac)"/>
    </svg>
  ),
  "plumbing": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-plumbing" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M15 3 C22 12 25 17 25 22 A10 10 0 0 1 5 22 C5 17 8 12 15 3Z" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-plumbing)"/>
    </svg>
  ),
  "roofing": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-roofing" x="0" y="0" width="36" height="20" patternUnits="userSpaceOnUse">
        <path d="M0,20 L18,0 L36,20" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-roofing)"/>
    </svg>
  ),
  "contractors": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-contractors" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="30" y2="30" stroke="white" strokeWidth="1"/>
        <line x1="30" y1="0" x2="0" y2="30" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-contractors)"/>
    </svg>
  ),
  "real-estate": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-realestate" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect x="6" y="16" width="28" height="20" fill="none" stroke="white" strokeWidth="1"/>
        <polygon points="4,16 20,4 36,16" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-realestate)"/>
    </svg>
  ),
  "personal-injury": (
    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="pat-law" x="0" y="0" width="34" height="34" patternUnits="userSpaceOnUse">
        <line x1="17" y1="2" x2="17" y2="32" stroke="white" strokeWidth="1"/>
        <line x1="6" y1="10" x2="28" y2="10" stroke="white" strokeWidth="1"/>
        <ellipse cx="17" cy="32" rx="8" ry="2" fill="none" stroke="white" strokeWidth="1"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#pat-law)"/>
    </svg>
  ),
};

const industries = [
{
  id: "med-spa",
  routePath: "/med-spa",
  icon: Sparkles,
  name: "Med Spas & Aesthetic Clinics",
  accent: {
    color: "#38bdf8",
    soft: "rgba(56,189,248,0.18)",
    glow: "rgba(56,189,248,0.28)",
    iconBg: "rgba(56,189,248,0.18)"
  },
  image:
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/741357982_Gemini_Generated_Image_hdkpn1hdkpn1hdkp.png"
},
{
  id: "dental",
  routePath: "/dental",
  icon: Heart,
  name: "Dental & Orthodontics",
  accent: {
    color: "#0ea5e9",
    soft: "rgba(14,165,233,0.18)",
    glow: "rgba(14,165,233,0.28)",
    iconBg: "rgba(14,165,233,0.18)"
  },
  image:
  "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95"
},
{
  id: "chiro-pt",
  routePath: "/chiropractic",
  icon: Building2,
  name: "Chiropractic & Physical Therapy",
  accent: {
    color: "#2563eb",
    soft: "rgba(37,99,235,0.16)",
    glow: "rgba(37,99,235,0.24)",
    iconBg: "rgba(37,99,235,0.16)"
  },
  image:
  "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1200&q=95"
},
{
  id: "hvac",
  routePath: "/hvac",
  icon: Wrench,
  name: "HVAC & Heating/Cooling",
  accent: {
    color: "#0284c7",
    soft: "rgba(2,132,199,0.18)",
    glow: "rgba(2,132,199,0.28)",
    iconBg: "rgba(2,132,199,0.18)"
  },
  image:
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=95"
},
{
  id: "plumbing",
  routePath: "/plumbing",
  icon: Droplets,
  name: "Plumbing & Drain Services",
  accent: {
    color: "#0891b2",
    soft: "rgba(8,145,178,0.18)",
    glow: "rgba(8,145,178,0.28)",
    iconBg: "rgba(8,145,178,0.18)"
  },
  image:
  "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&q=95"
},
{
  id: "roofing",
  routePath: "/roofing",
  icon: Home,
  name: "Roofing & Restoration",
  accent: {
    color: "#075985",
    soft: "rgba(7,89,133,0.18)",
    glow: "rgba(7,89,133,0.28)",
    iconBg: "rgba(7,89,133,0.18)"
  },
  image:
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/3fcc65c06_Screenshot2026-04-21185605.png"
},
{
  id: "contractors",
  routePath: "/contractors",
  icon: MapPin,
  name: "Contractors & Trades",
  accent: {
    color: "#1d4ed8",
    soft: "rgba(29,78,216,0.16)",
    glow: "rgba(29,78,216,0.24)",
    iconBg: "rgba(29,78,216,0.16)"
  },
  image:
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=95"
},
{
  id: "real-estate",
  routePath: "/real-estate",
  icon: KeyRound,
  name: "Real Estate Agents",
  accent: {
    color: "#10b981",
    soft: "rgba(16,185,129,0.18)",
    glow: "rgba(16,185,129,0.28)",
    iconBg: "rgba(16,185,129,0.18)"
  },
  image:
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=95"
},
{
  id: "personal-injury",
  routePath: "/personal-injury",
  icon: Scale,
  name: "Personal Injury Law",
  accent: {
    color: "#8b5cf6",
    soft: "rgba(139,92,246,0.18)",
    glow: "rgba(139,92,246,0.28)",
    iconBg: "rgba(139,92,246,0.18)"
  },
  image:
  "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=95"
}];


const FILTER_TAGS = [
  { id: "all", label: "All Industries" },
  { id: "health", label: "Health & Medical" },
  { id: "home", label: "Home Services" },
  { id: "professional", label: "Professional" },
];

const INDUSTRY_TAGS = {
  "med-spa": "health",
  "dental": "health",
  "chiro-pt": "health",
  "hvac": "home",
  "plumbing": "home",
  "roofing": "home",
  "contractors": "home",
  "real-estate": "professional",
  "personal-injury": "professional",
};

export default function Industries() {
  const sectionRef = useRef(null);
  const navigate = useNavigate();
  const [sectionVisible, setSectionVisible] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);
  const [hoveredIndustryId, setHoveredIndustryId] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

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

  const filteredIndustries = activeFilter === "all"
    ? industries
    : industries.filter(i => INDUSTRY_TAGS[i.id] === activeFilter);

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="pt-16 md:pt-24 pb-32 md:pb-40 px-0 bg-gradient-to-b from-card via-background via-70% to-slate-50/40">
      
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-10">
         <div className="flex flex-col items-center text-center">
           <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3" style={{ color: "var(--cs-electric)" }}>
             Choose Your Industry
           </p>
           <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight max-w-4xl" style={{ fontFamily: "Montserrat, sans-serif" }}>
             Built for Businesses That Win on{" "}
             <span className="text-primary">Fast Response</span>
           </h2>
           <p className="mt-4 text-muted-foreground text-lg max-w-3xl leading-relaxed">
             Click your industry and we will show you the AI service stack we would recommend first, why it fits, and which pieces are available now versus by review.
           </p>
         </div>

        {/* Filter pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-6 pb-4">
          {FILTER_TAGS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeFilter === f.id
                  ? "text-white border-transparent shadow-sm"
                  : "bg-background/80 text-muted-foreground border-border hover:text-foreground"
              }`}
            style={activeFilter === f.id ? { background: "var(--cs-gradient)", boxShadow: "var(--cs-glow-sm)" } : { borderColor: "rgba(0,174,239,0.22)" }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="w-full max-w-none mx-auto grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 relative z-10"
        style={{ overflowX: "hidden" }}>
        {filteredIndustries.map((industry, index) => {
          const Icon = industry.icon;
          const highlighted = hoveredIndustryId === industry.id;
          const isSelected = selectedIndustryId === industry.id;
          const accent = industry.accent;
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
            className="group relative block overflow-hidden min-h-[100svh] md:min-h-[50svh] text-left"
            onClick={() => handleIndustrySelect(industry)}
            onMouseEnter={() => setHoveredIndustryId(industry.id)}
            onMouseLeave={() => setHoveredIndustryId("")}
            onFocus={() => setHoveredIndustryId(industry.id)}
            onBlur={() => setHoveredIndustryId("")}
              style={{
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 600ms ease ${index * 100}ms, transform 600ms ease ${
                index * 100}ms`,
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
                position: "relative",
                zIndex: isSelected ? 2 : 1,
              }}>
              
              <img
                {...imageProps}
                alt={`${industry.name} service illustration`}
                loading="lazy"
                decoding="async"
                width="600"
                height="442"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ filter: "saturate(1) contrast(1.03) brightness(0.98)" }} />

              {/* Unique per-industry SVG texture pattern */}
              {industryPatterns[industry.id]}


              <div
                className="absolute inset-0"
                style={{
                  background: highlighted ?
                  "linear-gradient(to bottom, rgba(3,7,18,0) 0%, rgba(3,7,18,0) 30%, rgba(3,7,18,0.48) 100%)" :
                  "linear-gradient(to bottom, rgba(3,7,18,0) 0%, rgba(3,7,18,0) 30%, rgba(3,7,18,0.44) 100%)"
                }} />
              

              <div
                className="absolute inset-0 border-2 transition-all duration-300"
                style={{
                  borderColor: isSelected ? accent.color : highlighted ? accent.color : "rgba(255,255,255,0.08)",
                  boxShadow: isSelected ?
                  `inset 0 0 0 1px ${accent.soft}, 0 0 0 2px ${accent.glow}` :
                  highlighted ?
                  `inset 0 0 0 1px ${accent.soft}, 0 0 0 2px ${accent.glow}` :
                  "none"
                }} />
              {isSelected && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg z-20">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              



              <div className="absolute bottom-0 inset-x-0 px-5 pb-5 pt-12">
                <div
                  className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border backdrop-blur-sm transition-transform duration-300"
                  style={{
                    background: highlighted || isSelected ? accent.iconBg : "rgba(255,255,255,0.12)",
                    borderColor: highlighted || isSelected ? accent.soft : "rgba(255,255,255,0.14)",
                    boxShadow: highlighted || isSelected ? `0 10px 30px ${accent.glow}` : "none",
                    transform: highlighted ? "translateY(-2px) scale(1.02)" : "none"
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: highlighted || isSelected ? accent.color : "#ffffff" }} />
                </div>
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    lineHeight: 1.3,
                    color: "#ffffff",
                    textShadow: "0 1px 12px rgba(0,0,0,0.76)",
                    margin: 0
                  }}>
                  
                  {industry.name}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.74)",
                    margin: "8px 0 0",
                    opacity: highlighted ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}>
                  
                  Open the industry landing page for this niche.
                </p>
              </div>

              <div
                className="absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-out"
                style={{
                  width: highlighted ? "100%" : "0%",
                  background: `linear-gradient(to right, ${accent.color}, #ffffff, ${accent.color})`
                }} />
              
            </button>);

        })}
      </div>

    </section>);

}