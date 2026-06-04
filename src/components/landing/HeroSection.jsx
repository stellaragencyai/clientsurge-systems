import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection({
  badge,
  title,
  titleHighlight,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  trustBadges,
  stats,
  backgroundType = "gradient", // "gradient" or "image"
  backgroundImage,
  backgroundImageAlt,
  backgroundGradient,
  children, // for extra content like ticker or stats
  videoUrl,
}) {
  const [showModal, setShowModal] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Parallax offsets per layer
  const p1 = scrollY * -0.12;
  const p2 = scrollY * -0.06;
  const p3 = scrollY * -0.02;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "transparent",
        minHeight: "100vh",
        paddingTop: "0",
        paddingBottom: "0",
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Background image if applicable */}
      {backgroundType === "image" && backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={backgroundImage}
            alt={backgroundImageAlt || `${title}${titleHighlight ? ` ${titleHighlight}` : ""} hero background`}
            width="1600"
            height="1000"
            className="w-full h-full object-cover object-top"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>
      )}

      {/* Content */}
      <div ref={sectionRef} className="relative z-10 flex items-center justify-center w-full h-full" style={{padding: "28px 20px"}}>
        <div className="max-w-4xl mx-auto text-center pt-20 pb-24 md:pt-28 md:pb-40 px-4 sm:px-6">
          {/* Badge */}
          {badge && (
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 backdrop-blur-sm rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">{badge}</span>
            </div>
          )}

          {/* Heading — parallax depth layers */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.1] mb-5 md:mb-6" style={{color: backgroundType === "image" ? "white" : "inherit", textShadow: backgroundType === "image" ? "0 2px 12px rgba(0,0,0,0.5)" : "none"}}>
            {title ? (
              <span
                className="inline-block will-change-transform"
                style={{ transform: `translateY(${p1}px)`, transition: "transform 0.1s linear" }}
              >
                {title}
              </span>
            ) : null}
            {titleHighlight && (
              <>
                <br />
                <span
                  className="text-primary inline-block will-change-transform"
                  style={{ transform: `translateY(${p2}px)`, transition: "transform 0.1s linear" }}
                >
                  {titleHighlight}
                </span>
              </>
            )}
          </h1>

          {/* Subtitle (optional) */}
          {subtitle && (
            <p
              className="text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-4 will-change-transform"
              style={{
                color: backgroundType === "image" ? "white" : "inherit",
                textShadow: backgroundType === "image" ? "0 1px 6px rgba(0,0,0,0.4)" : "none",
                transform: `translateY(${p3}px)`,
                transition: "transform 0.1s linear",
              }}
            >
              {subtitle}
            </p>
          )}

          {/* Description (optional small text) */}
          {description && (
            <p className="text-sm max-w-xl mx-auto mb-8 font-medium" style={{color: backgroundType === "image" ? "rgba(255,255,255,0.78)" : "inherit"}}>
              {description}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 md:mb-10">
            {primaryCTA && (
              <button
                onClick={primaryCTA.onClick}
                style={{
                  display: "inline-block",
                  borderRadius: "8px",
                  padding: "2px",
                  background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)",
                  boxShadow: "0 12px 28px rgba(0,88,160,0.24)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    height: "52px",
                    padding: "0 32px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: "1rem",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {primaryCTA.label}
                  <ArrowRight className="w-4 h-4" />
                </span>
              </button>
            )}

            {secondaryCTA && (
              <Button size="lg" variant="outline" onClick={secondaryCTA.onClick} className="rounded-lg px-8 h-[52px] text-base font-semibold gap-2">
                {secondaryCTA.label}
                {secondaryCTA.icon && <secondaryCTA.icon className="w-4 h-4" />}
              </Button>
            )}
          </div>

          {/* Trust badges */}
          {trustBadges && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm" style={{color: backgroundType === "image" ? "rgba(255,255,255,0.7)" : "inherit"}}>
              {trustBadges.map((badge, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {badge}
                </span>
              ))}
            </div>
          )}

          {/* Additional content (stats, ticker, etc.) */}
          {children}
        </div>
      </div>
    </section>
  );
}
