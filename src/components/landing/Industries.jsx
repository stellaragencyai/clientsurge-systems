import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Building2,
  Heart,
  Home,
  MapPin,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useDemoBooking } from "./DemoBookingContext";
import {
  INDUSTRY_RECOMMENDATIONS_BY_ID,
  INDUSTRY_SELECTION_STORAGE_KEY,
} from "@/lib/industryRecommendations";

const industries = [
  {
    id: "med-spa",
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    image:
      "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/741357982_Gemini_Generated_Image_hdkpn1hdkpn1hdkp.png",
  },
  {
    id: "dental",
    icon: Heart,
    name: "Dental & Orthodontics",
    image:
      "https://images.unsplash.com/photo-1644353740797-b85ffb378b3a?w=1200&q=95",
  },
  {
    id: "chiro-pt",
    icon: Building2,
    name: "Chiropractic & Physical Therapy",
    image:
      "https://images.unsplash.com/photo-1657470179447-0f5aa16daa91?w=1200&q=95",
  },
  {
    id: "hvac",
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    image:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=95",
  },
  {
    id: "roofing",
    icon: Home,
    name: "Roofing & Restoration",
    image:
      "https://media.base44.com/images/public/69dc4a79656fdba136d413d3/3fcc65c06_Screenshot2026-04-21185605.png",
  },
  {
    id: "contractors",
    icon: MapPin,
    name: "Contractors & Trades",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=95",
  },
];

function MobilePanelSection({ title, isOpen, onToggle, children, countLabel }) {
  return (
    <div
      className="rounded-2xl border border-[rgba(154,92,46,0.12)] bg-white/78 overflow-hidden"
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          {countLabel || (isOpen ? "Hide" : "Show")}
        </span>
      </button>
      {isOpen ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function MobileIndustryRecommendationDrawer({
  recommendation,
  isOpen,
  onClose,
  onBookDemo,
}) {
  if (!recommendation || !isOpen) {
    return null;
  }

  const previewServices = recommendation.recommendedServices.slice(0, 3);

  return (
    <div className="lg:hidden mt-5">
      <div
        className="rounded-[26px] overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,245,239,0.92) 100%)",
          border: "1.5px solid rgba(154,92,46,0.16)",
          boxShadow: "0 18px 44px rgba(26,18,9,0.1)",
        }}
      >
        <div
          className="px-5 pt-5 pb-4 flex items-start justify-between gap-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(154,92,46,0.03) 100%)",
            borderBottom: "1px solid rgba(154,92,46,0.1)",
          }}
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
              Recommended For {recommendation.shortName}
            </p>
            <h3 className="font-display text-2xl font-bold text-foreground leading-tight">
              Best-Fit AI Stack
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {recommendation.summary}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary border border-primary/15 bg-white/70"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <div
            className="rounded-2xl px-4 py-4"
            style={{
              background: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(154,92,46,0.12)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-2">
              Recommended Package
            </p>
            <p className="text-lg font-semibold text-foreground">
              {recommendation.recommendedPackage?.name}
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {recommendation.recommendedPackage?.fit}
            </p>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary mb-3">
              Start With These
            </p>
            <div className="grid gap-3">
              {previewServices.map((service) => (
                <div
                  key={service.product_id}
                  className="rounded-2xl px-4 py-4"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(250,245,239,0.74) 100%)",
                    border: "1px solid rgba(154,92,46,0.12)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {service.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {service.whyThisMatters}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{
                        background: "rgba(154,92,46,0.08)",
                        border: "1px solid rgba(154,92,46,0.14)",
                        color: "#9a5c2e",
                      }}
                    >
                      {service.availability_label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onBookDemo}
              style={{
                borderRadius: "9999px",
                padding: "2px",
                background:
                  "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
                boxShadow: "0 4px 18px rgba(120,70,20,0.26)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  height: "46px",
                  padding: "0 20px",
                  borderRadius: "9999px",
                  background:
                    "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                  color: "#f5e6d0",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                }}
              >
                Book Your Free Demo
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <a
              href="/store"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              See The Full AI Store
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function IndustryRecommendationPanel({ recommendation, onBookDemo }) {
  const [openMobileSection, setOpenMobileSection] = useState("available");

  useEffect(() => {
    setOpenMobileSection("available");
  }, [recommendation?.shortName]);

  if (!recommendation) {
    return null;
  }

  return (
    <div
      className="mt-10 md:mt-12 rounded-[28px] overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(250,245,239,0.9) 100%)",
        border: "1.5px solid rgba(154,92,46,0.18)",
        boxShadow: "0 18px 54px rgba(0,0,0,0.08)",
      }}
    >
      <div
        className="px-6 md:px-8 pt-7 md:pt-8 pb-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(154,92,46,0.08) 0%, rgba(154,92,46,0.03) 100%)",
          borderBottom: "1px solid rgba(154,92,46,0.12)",
        }}
      >
        <p className="text-xs font-semibold text-primary tracking-[0.24em] uppercase mb-3">
          Recommended For {recommendation.shortName}
        </p>
        <div className="grid lg:grid-cols-[1.3fr,0.9fr] gap-6 lg:gap-8 items-start">
          <div>
            <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Your Best-Fit AI Service Stack
            </h3>
            <p className="mt-4 text-base md:text-lg text-foreground/72 leading-relaxed">
              {recommendation.summary}
            </p>
            <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              {recommendation.whyItWorks}
            </p>
          </div>

          <div
            className="rounded-2xl px-5 py-5"
            style={{
              background: "rgba(255,255,255,0.72)",
              border: "1px solid rgba(154,92,46,0.14)",
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
              Recommended Package
            </p>
            <h4 className="text-xl font-semibold text-foreground">
              {recommendation.recommendedPackage?.name}
            </h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {recommendation.recommendedPackage?.fit}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                style={{
                  background: "rgba(154,92,46,0.08)",
                  border: "1px solid rgba(154,92,46,0.14)",
                  color: "#9a5c2e",
                }}
              >
                {recommendation.recommendedServices.length} services recommended
              </span>
              {recommendation.addOnsByReview.length ? (
                <span
                  className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    background: "rgba(26,18,9,0.05)",
                    border: "1px solid rgba(26,18,9,0.08)",
                    color: "rgba(26,18,9,0.65)",
                  }}
                >
                  {recommendation.addOnsByReview.length} add-ons by review
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:grid px-6 md:px-8 py-7 md:py-8 lg:grid-cols-[0.9fr,1.1fr] gap-7">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4">
            Why This Stack Fits
          </p>
          <div className="space-y-3">
            {recommendation.pressurePoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl px-4 py-4"
                style={{
                  background: "rgba(154,92,46,0.05)",
                  border: "1px solid rgba(154,92,46,0.12)",
                }}
              >
                <p className="text-sm leading-6 text-foreground/78">{point}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-4">
            Available Now
          </p>
          <div className="grid gap-3">
            {recommendation.recommendedServices.map((service) => (
              <div
                key={service.product_id}
                className="rounded-2xl px-4 py-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(250,245,239,0.72) 100%)",
                  border: "1px solid rgba(154,92,46,0.12)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{service.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {service.whyThisMatters}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      background: "rgba(154,92,46,0.08)",
                      border: "1px solid rgba(154,92,46,0.14)",
                      color: "#9a5c2e",
                    }}
                  >
                    {service.availability_label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {recommendation.addOnsByReview.length ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mt-6 mb-4">
                Add-Ons By Review
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {recommendation.addOnsByReview.map((product) => (
                  <div
                    key={product.product_id}
                    className="rounded-2xl px-4 py-4"
                    style={{
                      background: "rgba(26,18,9,0.04)",
                      border: "1px solid rgba(26,18,9,0.08)",
                    }}
                  >
                    <p className="text-sm font-semibold text-foreground">{product.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="lg:hidden px-5 py-5 space-y-3">
        <MobilePanelSection
          title="Why this stack fits"
          countLabel={`${recommendation.pressurePoints.length} reasons`}
          isOpen={openMobileSection === "why"}
          onToggle={() =>
            setOpenMobileSection((current) => (current === "why" ? "" : "why"))
          }
        >
          <div className="space-y-3">
            {recommendation.pressurePoints.map((point) => (
              <div
                key={point}
                className="rounded-2xl px-4 py-4"
                style={{
                  background: "rgba(154,92,46,0.05)",
                  border: "1px solid rgba(154,92,46,0.12)",
                }}
              >
                <p className="text-sm leading-6 text-foreground/78">{point}</p>
              </div>
            ))}
          </div>
        </MobilePanelSection>

        <MobilePanelSection
          title="Available now"
          countLabel={`${recommendation.recommendedServices.length} services`}
          isOpen={openMobileSection === "available"}
          onToggle={() =>
            setOpenMobileSection((current) =>
              current === "available" ? "" : "available"
            )
          }
        >
          <div className="grid gap-3">
            {recommendation.recommendedServices.map((service) => (
              <div
                key={service.product_id}
                className="rounded-2xl px-4 py-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(250,245,239,0.72) 100%)",
                  border: "1px solid rgba(154,92,46,0.12)",
                }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{service.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {service.whyThisMatters}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      background: "rgba(154,92,46,0.08)",
                      border: "1px solid rgba(154,92,46,0.14)",
                      color: "#9a5c2e",
                    }}
                  >
                    {service.availability_label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </MobilePanelSection>

        {recommendation.addOnsByReview.length ? (
          <MobilePanelSection
            title="Add-ons by review"
            countLabel={`${recommendation.addOnsByReview.length} add-ons`}
            isOpen={openMobileSection === "addons"}
            onToggle={() =>
              setOpenMobileSection((current) =>
                current === "addons" ? "" : "addons"
              )
            }
          >
            <div className="grid gap-3">
              {recommendation.addOnsByReview.map((product) => (
                <div
                  key={product.product_id}
                  className="rounded-2xl px-4 py-4"
                  style={{
                    background: "rgba(26,18,9,0.04)",
                    border: "1px solid rgba(26,18,9,0.08)",
                  }}
                >
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              ))}
            </div>
          </MobilePanelSection>
        ) : null}
      </div>

      <div
        className="px-6 md:px-8 py-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
        style={{
          borderTop: "1px solid rgba(154,92,46,0.12)",
          background: "rgba(255,255,255,0.6)",
        }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          This recommendation keeps the experience specific to {recommendation.shortName.toLowerCase()} while staying aligned to the real services we can install today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="/store"
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            See The AI Store
            <ArrowRight className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onBookDemo}
            style={{
              borderRadius: "9999px",
              padding: "2px",
              background:
                "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              boxShadow: "0 4px 18px rgba(120,70,20,0.3)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "44px",
                padding: "0 24px",
                borderRadius: "9999px",
                background:
                  "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#f5e6d0",
                fontWeight: "700",
                fontSize: "0.95rem",
              }}
            >
              Book Your Free Demo
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Industries() {
  const sectionRef = useRef(null);
  const demoBooking = useDemoBooking();
  const [sectionVisible, setSectionVisible] = useState(false);
  const [selectedIndustryId, setSelectedIndustryId] = useState("med-spa");
  const [hoveredIndustryId, setHoveredIndustryId] = useState("");
  const [mobileRecommendationOpen, setMobileRecommendationOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const savedIndustryId = window.sessionStorage.getItem(
      INDUSTRY_SELECTION_STORAGE_KEY
    );

    if (savedIndustryId && INDUSTRY_RECOMMENDATIONS_BY_ID[savedIndustryId]) {
      setSelectedIndustryId(savedIndustryId);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      INDUSTRY_SELECTION_STORAGE_KEY,
      selectedIndustryId
    );
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

  const selectedRecommendation =
    INDUSTRY_RECOMMENDATIONS_BY_ID[selectedIndustryId] ||
    INDUSTRY_RECOMMENDATIONS_BY_ID["med-spa"];

  const handleIndustrySelect = (industryId) => {
    setSelectedIndustryId(industryId);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileRecommendationOpen(true);
    }
  };

  return (
    <section
      id="industries"
      ref={sectionRef}
      className="py-24 md:py-32 px-0 bg-gradient-to-b from-card via-background to-card"
    >
      <div className="max-w-6xl mx-auto mb-16 px-6">
        <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-primary">
          Choose Your Industry
        </p>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
          Built for Businesses That Win on{" "}
          <span className="text-primary">Fast Response</span>
        </h2>
        <p className="mt-4 text-muted-foreground text-lg max-w-3xl leading-relaxed">
          Click your industry and we will show you the AI service stack we would recommend first, why it fits, and which pieces are available now versus by review.
        </p>
      </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {industries.map((industry, index) => {
          const Icon = industry.icon;
          const highlighted = hoveredIndustryId === industry.id;

          return (
            <button
              key={industry.id}
              type="button"
              className="group relative block overflow-hidden h-[17.5rem] sm:h-[21rem] md:h-[27.6rem] text-left"
              onClick={() => handleIndustrySelect(industry.id)}
              onMouseEnter={() => setHoveredIndustryId(industry.id)}
              onMouseLeave={() => setHoveredIndustryId("")}
              onFocus={() => setHoveredIndustryId(industry.id)}
              onBlur={() => setHoveredIndustryId("")}
              style={{
                opacity: sectionVisible ? 1 : 0,
                transform: sectionVisible ? "translateY(0)" : "translateY(32px)",
                transition: `opacity 600ms ease ${index * 100}ms, transform 600ms ease ${
                  index * 100
                }ms`,
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <img
                src={industry.image}
                alt={industry.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div
                className="absolute inset-0"
                style={{
                  background: highlighted
                    ? "linear-gradient(to bottom, rgba(10,10,14,0.28) 0%, rgba(10,10,14,0.74) 100%)"
                    : "linear-gradient(to bottom, rgba(10,10,14,0.18) 0%, rgba(10,10,14,0.66) 100%)",
                }}
              />

              <div
                className="absolute inset-0 border-2 transition-all duration-300"
                style={{
                  borderColor: highlighted ? "#c8965c" : "rgba(255,255,255,0.08)",
                  boxShadow: highlighted
                    ? "inset 0 0 0 1px rgba(245,217,168,0.26), inset 0 0 32px rgba(200,150,92,0.2), 0 0 0 2px rgba(200,150,92,0.34), 0 0 24px rgba(200,150,92,0.22)"
                    : "none",
                }}
              />

              <div className="absolute top-5 left-5 right-5 flex items-start justify-between gap-3">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                  }}
                >
                  <Icon style={{ width: "18px", height: "18px", color: "#fff" }} />
                </div>

              </div>

              <div className="absolute bottom-0 inset-x-0 px-5 pb-5 pt-12">
                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    lineHeight: 1.3,
                    color: "#fff",
                    textShadow: "0 1px 10px rgba(0,0,0,0.4)",
                    margin: 0,
                  }}
                >
                  {industry.name}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.74)",
                    margin: "8px 0 0",
                  }}
                >
                  Click to see the recommended AI service stack for this niche.
                </p>
              </div>

              <div
                className="absolute bottom-0 left-0 h-[2px] transition-all duration-500 ease-out"
                style={{
                  width: highlighted ? "100%" : "0%",
                  background:
                    "linear-gradient(to right, #c8965c, #f5d9a8, #c8965c)",
                }}
              />
            </button>
          );
        })}
      </div>

      <div className="max-w-6xl mx-auto px-6">
        <MobileIndustryRecommendationDrawer
          recommendation={selectedRecommendation}
          isOpen={mobileRecommendationOpen}
          onClose={() => setMobileRecommendationOpen(false)}
          onBookDemo={() => demoBooking?.openDemoBooking?.()}
        />
      </div>

      <div className="hidden lg:block max-w-6xl mx-auto px-6">
        <IndustryRecommendationPanel
          recommendation={selectedRecommendation}
          onBookDemo={() => demoBooking?.openDemoBooking?.()}
        />
      </div>
    </section>
  );
}
