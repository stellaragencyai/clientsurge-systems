import { ArrowRight } from "lucide-react";
import { buildResponsiveImageProps } from "@/lib/imageOptimization";
import { FloatingStatBadges, ScrollIndicator } from "./IndustryHeroEnhancements";

export default function IndustryHero({ image, eyebrow, headline, highlightedWord, sub, subheadline, ctaLabel, cta, onBookDemo, painStats, industrySlug }) {
  // Split headline to highlight one word/phrase
  const headlineParts = highlightedWord
    ? headline.split(highlightedWord)
    : [headline];
  const imageProps = buildResponsiveImageProps(image, {
    widths: [768, 1200, 1600, 2000],
    sizes: "100vw",
    quality: 80,
  });
  const heroSub = sub || subheadline;
  const primaryCta = ctaLabel || cta || "Book Your Free Audit";

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "min(760px, 100svh)", display: "flex", alignItems: "center" }}>
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img
          {...imageProps}
          alt={eyebrow}
          width="1600"
          height="1000"
          className="w-full h-full object-cover object-center"
          loading="eager"
          decoding="async"
        />
        {/* Dark gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(6,14,28,0.78) 0%, rgba(6,14,28,0.62) 42%, rgba(6,14,28,0.36) 72%, rgba(6,14,28,0.18) 100%)",
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{
            background: "linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10" style={{ paddingTop: "clamp(6.5rem, 14vw, 8.5rem)", paddingBottom: "clamp(4rem, 9vw, 6rem)" }}>
        <div style={{ maxWidth: "min(640px, 100%)" }}>
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
              WebkitBackdropFilter: "blur(12px)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: "#34c759", boxShadow: "0 0 0 4px rgba(52,199,89,0.25)" }}
            />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              {eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold leading-[1.02] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.2rem, 4.4vw, 3.7rem)", color: "#fff" }}
          >
            {highlightedWord && headlineParts.length === 2 ? (
              <>
                {headlineParts[0]}
                <span
                  style={{
                    background: "linear-gradient(135deg, #e0f7ff 0%, #00AEEF 52%, #e0f7ff 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {highlightedWord}
                </span>
                {headlineParts[1]}
              </>
            ) : (
              headline
            )}
          </h1>

          {/* Sub */}
          <p
            className="text-lg leading-relaxed mb-10"
            style={{ color: "rgba(255,255,255,0.82)", maxWidth: "520px" }}
          >
            {heroSub}
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button
              type="button"
              onClick={onBookDemo}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                minHeight: "52px",
                padding: "0 28px",
                borderRadius: "9999px",
                border: "none",
                background: "linear-gradient(135deg, #0088CC 0%, #006BB0 46%, #003B8F 100%)",
                color: "#ffffff",
                fontSize: "0.95rem",
                fontWeight: "700",
                boxShadow: "0 4px 18px rgba(0,174,239,0.4)",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
            >
              {primaryCta}
              <ArrowRight style={{ width: "18px", height: "18px", flexShrink: 0 }} />
            </button>

            <a
              href="#demo-flow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "52px",
                padding: "0 24px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                WebkitBackdropFilter: "blur(12px)",
                backdropFilter: "blur(12px)",
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              See How It Works
            </a>
          </div>

          <p className="mt-5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            No contracts · Live in 5–7 days · Done for you
          </p>

          {/* Floating pain stat badges */}
          {painStats && <FloatingStatBadges stats={painStats} />}
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />
    </section>
  );
}