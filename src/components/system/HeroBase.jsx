import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * HeroBase — Reusable hero foundation supporting multiple variants.
 * Does NOT replace existing heroes yet — this is the foundation component
 * that future heroes will migrate to.
 *
 * Props:
 *   title         — string (required)
 *   subtitle      — string
 *   primaryCTA    — { label: string, onClick: fn }
 *   secondaryCTA  — { label: string, onClick: fn }
 *   image         — string (URL for image variant)
 *   badge         — string (small pill above title)
 *   variant       — "gradient" | "image" | "industry" | "product" (default: "gradient")
 *   children      — extra content (stats, trust badges, etc.)
 */
export default function HeroBase({
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  image,
  badge,
  variant = "gradient",
  children,
}) {
  const isImageVariant = variant === "image" || (variant === "industry" && image);

  return (
    <section
      className="relative overflow-hidden flex items-center justify-center min-h-[100svh]"
      style={
        isImageVariant && image
          ? {
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              background:
                "linear-gradient(180deg, #f8fcff 0%, #ffffff 40%, #f0f7ff 100%)",
            }
      }
    >
      {isImageVariant && image && <div className="absolute inset-0 bg-black/40" />}

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center flex flex-col items-center pt-20 pb-24">
        {badge && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/25 px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-semibold text-primary tracking-wide uppercase">
              {badge}
            </span>
          </div>
        )}

        <h1
          className="font-montserrat font-black tracking-tighter leading-[1.05] mb-6"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            color: isImageVariant ? "#ffffff" : "#000000",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="max-w-2xl mb-10"
            style={{
              fontSize: "clamp(1.05rem, 2vw, 1.25rem)",
              lineHeight: 1.7,
              color: isImageVariant ? "rgba(255,255,255,0.85)" : "#3a3d47",
            }}
          >
            {subtitle}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {primaryCTA && (
            <button
              onClick={primaryCTA.onClick}
              className="cs-btn-primary"
              style={{ minHeight: "52px" }}
            >
              {primaryCTA.label}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {secondaryCTA && (
            <button
              onClick={secondaryCTA.onClick}
              className="btn-secondary"
              style={{ minHeight: "52px" }}
            >
              {secondaryCTA.label}
            </button>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}