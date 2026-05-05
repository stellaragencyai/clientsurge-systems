import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Heart,
  Home,
  MapPin,
  Sparkles,
  Wrench,
  X } from
"lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDemoBooking } from "./DemoBookingContext";
import {
  INDUSTRY_RECOMMENDATIONS_BY_ID,
  INDUSTRY_SELECTION_STORAGE_KEY } from
"@/lib/industryRecommendations";
import { acquireBodyScrollLock } from "@/lib/bodyScrollLock";

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
};

const industries = [
{
  id: "med-spa",
  icon: Sparkles,
  name: "Med Spas & Aesthetic Clinics",
  image:
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/741357982_Gemini_Generated_Image_hdkpn1hdkpn1hdkp.png"
},
{
  id: "dental",
  icon: Heart,
  name: "Dental & Orthodontics",
  image:
  "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95"
},
{
  id: "chiro-pt",
  icon: Building2,
  name: "Chiropractic & Physical Therapy",
  image:
  "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1200&q=95"
},
{
  id: "hvac",
  icon: Wrench,
  name: "HVAC, Plumbing & Home Services",
  image:
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=95"
},
{
  id: "roofing",
  icon: Home,
  name: "Roofing & Restoration",
  image:
  "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/3fcc65c06_Screenshot2026-04-21185605.png"
},
{
  id: "contractors",
  icon: MapPin,
  name: "Contractors & Trades",
  image:
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=95"
}];


function IndustryModal({ recommendation, onClose, onBookDemo }) {
  useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") onClose();};
    document.addEventListener("keydown", onKey);
    const releaseScrollLock = acquireBodyScrollLock("industry-recommendation-modal");
    return () => {
      document.removeEventListener("keydown", onKey);
      releaseScrollLock();
    };
  }, [onClose]);

  if (!recommendation) return null;

  return (
    <div
      className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] mx-auto"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(250,245,239,0.94) 100%)",
        border: "1.5px solid rgba(154,92,46,0.22)",
        boxShadow: "0 50px 130px rgba(0,0,0,0.45)"
      }}
      onClick={(e) => e.stopPropagation()}>
      
        {/* Header */}
        <div
        className="px-7 pt-7 pb-5 flex items-start justify-between gap-4 sticky top-0 rounded-t-[28px] z-10"
        style={{
          background: "linear-gradient(135deg, rgba(0,174,239,0.06) 0%, rgba(240,249,255,0.97) 100%)",
          borderBottom: "1px solid rgba(0,174,239,0.12)"
        }}>
        
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary mb-2">
              Recommended For {recommendation.shortName}
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Your Best-Fit AI Service Stack
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-lg">
              {recommendation.summary}
            </p>
          </div>
          <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-black/8 transition-colors">
          
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 space-y-6">
          {/* Recommended package */}
          <div
          className="rounded-2xl px-5 py-5"
          style={{ background: "rgba(255,255,255,0.78)", border: "1px solid rgba(154,92,46,0.14)" }}>
          
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Recommended Package</p>
            <h4 className="text-xl font-semibold text-foreground">{recommendation.recommendedPackage?.name}</h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{recommendation.recommendedPackage?.fit}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.18)", color: "#0088CC" }}>
                {recommendation.recommendedServices.length} services recommended
              </span>
              {recommendation.addOnsByReview.length ?
            <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ background: "rgba(0,174,239,0.06)", border: "1px solid rgba(0,174,239,0.15)", color: "rgba(0,80,160,0.7)" }}>
                  {recommendation.addOnsByReview.length} add-ons by review
                </span> :
            null}
            </div>
          </div>

          {/* Why it fits */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Why This Stack Fits</p>
            <div className="space-y-2">
              {recommendation.pressurePoints.map((point) =>
            <div key={point} className="rounded-2xl px-4 py-3" style={{ background: "rgba(0,174,239,0.04)", border: "1px solid rgba(0,174,239,0.12)" }}>
                  <p className="text-sm leading-6 text-foreground/78">{point}</p>
                </div>
            )}
            </div>
          </div>

          {/* Available services */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Recommended Services</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {recommendation.recommendedServices.map((service) =>
            <div key={service.product_id} className="rounded-2xl px-4 py-4" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,249,255,0.74) 100%)", border: "1px solid rgba(0,174,239,0.12)" }}>
                  <p className="text-sm font-semibold text-foreground">{service.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{service.whyThisMatters}</p>
                  <span className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ background: "rgba(0,174,239,0.08)", border: "1px solid rgba(0,174,239,0.14)", color: "#0088CC" }}>
                    {service.availability_label}
                  </span>
                </div>
            )}
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="px-7 py-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end" style={{ borderTop: "1px solid rgba(154,92,46,0.12)", background: "rgba(255,255,255,0.6)" }}>
          <a href="/store" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
            See The AI Store <ArrowRight className="w-4 h-4" />
          </a>
          <button type="button" onClick={onBookDemo} style={{ borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)", boxShadow: "0 4px 18px rgba(0,174,239,0.4)", border: "none", cursor: "pointer" }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "42px", padding: "0 24px", borderRadius: "9999px", background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)", color: "#ffffff", fontWeight: "700", fontSize: "0.875rem" }}>
              Book Your Free Demo <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
    </div>);

}

export default function Industries() {
  const sectionRef = useRef(null);
  const demoBooking = useDemoBooking();
  const [sectionVisible, setSectionVisible] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState(null);
  const [hoveredIndustryId, setHoveredIndustryId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const savedIndustryId = window.sessionStorage.getItem(INDUSTRY_SELECTION_STORAGE_KEY);
    if (savedIndustryId && INDUSTRY_RECOMMENDATIONS_BY_ID[savedIndustryId]) {
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

  const selectedRecommendation = selectedIndustryId ?
  INDUSTRY_RECOMMENDATIONS_BY_ID[selectedIndustryId] :
  null;

  const handleIndustrySelect = (industryId) => {
    setSelectedIndustryId(industryId);
    setModalOpen(true);
  };

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="pt-16 md:pt-24 pb-32 md:pb-40 px-0 bg-gradient-to-b from-card via-background via-70% to-slate-50/40">
      
      <div className="max-w-6xl mx-auto text-center px-6 pt-10 pb-14">
        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-primary">
          Choose Your Industry
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Built for Businesses That Win on{" "}
          <span className="text-primary">Fast Response</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
          Click your industry and we will show you the AI service stack we would recommend first, why it fits, and which pieces are available now versus by review.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 relative z-10" style={{ overflowX: "hidden" }}>
        {industries.map((industry, index) => {
          const Icon = industry.icon;
          const highlighted = hoveredIndustryId === industry.id;
          const isSelected = selectedIndustryId === industry.id;

          return (
            <motion.button
            key={industry.id}
            type="button"
            aria-label={industry.name}
            aria-pressed={isSelected}
            className="group relative block overflow-hidden h-[14rem] sm:h-[18rem] md:h-[27.6rem] text-left"
            onClick={() => handleIndustrySelect(industry.id)}
            onMouseEnter={() => setHoveredIndustryId(industry.id)}
            onMouseLeave={() => setHoveredIndustryId("")}
            onFocus={() => setHoveredIndustryId(industry.id)}
            onBlur={() => setHoveredIndustryId("")}
              animate={isSelected ? { scale: [1, 1.04, 1.02], zIndex: 2 } : { scale: 1, zIndex: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
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
              }}>
              
              <img
                src={industry.image}
                alt={industry.name}
                loading="lazy"
                decoding="async"
                width="600"
                height="442"
                className="absolute inset-0 h-full w-full object-cover" />
              
              {/* Unique per-industry SVG texture pattern */}
              {industryPatterns[industry.id]}
              

              <div
                className="absolute inset-0"
                style={{
                  background: highlighted ?
                  "linear-gradient(to bottom, rgba(10,10,14,0.28) 0%, rgba(10,10,14,0.74) 100%)" :
                  "linear-gradient(to bottom, rgba(10,10,14,0.18) 0%, rgba(10,10,14,0.66) 100%)"
                }} />
              

              <div
                className="absolute inset-0 border-2 transition-all duration-300"
                style={{
                  borderColor: isSelected ? "#00AEEF" : highlighted ? "#c8965c" : "rgba(255,255,255,0.08)",
                  boxShadow: isSelected ?
                  "inset 0 0 0 1px rgba(0,174,239,0.4), inset 0 0 32px rgba(0,174,239,0.15), 0 0 0 2px rgba(0,174,239,0.5), 0 0 24px rgba(0,174,239,0.3)" :
                  highlighted ?
                  "inset 0 0 0 1px rgba(245,217,168,0.26), inset 0 0 32px rgba(200,150,92,0.2), 0 0 0 2px rgba(200,150,92,0.34), 0 0 24px rgba(200,150,92,0.22)" :
                  "none"
                }} />
              {isSelected && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg z-20">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4"><path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
              



              <div className="absolute bottom-0 inset-x-0 px-5 pb-5 pt-12">
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    lineHeight: 1.3,
                    color: "#fff",
                    textShadow: "0 1px 10px rgba(0,0,0,0.4)",
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
                  
                  Click to see the recommended AI service stack for this niche.
                </p>
              </div>

              <div
                className="absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-out"
                style={{
                  width: highlighted ? "100%" : "0%",
                  background:
                  "linear-gradient(to right, #00AEEF, #009DFF, #00AEEF)"
                }} />
              
            </motion.button>);

        })}
      </div>

      <AnimatePresence>
        {modalOpen && selectedRecommendation &&
        <>
            <motion.div
            key="industry-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={() => setModalOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 199,
              background: "rgba(4,2,1,0.35)",
              backdropFilter: "blur(8px) saturate(0.8)",
              WebkitBackdropFilter: "blur(8px) saturate(0.8)"
            }} />
          
            <motion.div
            key="industry-modal-wrap"
            initial={{ opacity: 0, y: 140, scale: 0.72, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 60, scale: 0.88, rotateX: 4 }}
            transition={{
              type: "spring", stiffness: 260, damping: 26, mass: 0.9,
              opacity: { duration: 0.3, ease: "easeOut" }
            }}
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px 16px 32px",
              perspective: "1200px",
              pointerEvents: "none"
            }}>
            
              <div style={{ pointerEvents: "auto", width: "100%" }}>
                <IndustryModal
                recommendation={selectedRecommendation}
                onClose={() => setModalOpen(false)}
                onBookDemo={() => {setModalOpen(false);demoBooking?.openDemoBooking?.({ prefillIndustry: selectedRecommendation?.name || "" });}} />
              
              </div>
            </motion.div>
          </>
        }
      </AnimatePresence>
    </section>);

}