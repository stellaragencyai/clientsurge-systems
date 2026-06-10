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
        {/* Dark gradient overlay for readability — deeper for roofing/warm-toned images */}
        <div
          className="absolute inset-0"
          style={{
            background:
              `linear-gradient(105deg, rgba(4,10,22,0.88) 0%, rgba(4,10,22,0.70) 42%, rgba(4,10,22,0.42) 72%, rgba(4,10,22,0.20) 100%)`,
          }}
        />
        {/* Subtle blue glow from left edge — ties hero to brand color */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 50% 80% at 0% 50%, rgba(0,174,239,0.10) 0%, transparent 60%)",
          }}
        />
        {/* Bottom fade — blends into page background, not hard white */}
        <div
          className="absolute inset-x-0 bottom-0 h-64"
          style={{
            background: "linear-gradient(to top, hsl(210,100%,99%) 0%, rgba(250,253,255,0.85) 40%, transparent 100%)",
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
              style={{ background: "#00AEEF", boxShadow: "0 0 0 4px rgba(0,174,239,0.30)", animation: "heroEyebrowPulse 2.4s ease-in-out infinite" }}
            />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/90">
              {eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold leading-[1.02] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.2rem, 4.4vw, 3.7rem)", color: "#fff", fontWeight: 900, letterSpacing: "-0.025em", textWrap: "balance", textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}
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
            style={{ color: "rgba(255,255,255,0.88)", maxWidth: "min(600px, 92%)", textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}
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
                border: "1.5px solid rgba(0,174,239,0.6)",
                background: "rgba(0,174,239,0.12)",
                WebkitBackdropFilter: "blur(12px)",
                backdropFilter: "blur(12px)",
                color: "rgba(255,255,255,0.95)",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
                boxShadow: "0 0 20px rgba(0,174,239,0.15)",
              }}
            >
              See How It Works
            </a>
          </div>

          <p className="mt-5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>
            No contracts · Live in 5–7 days · Done for you
          </p>

          {/* Floating pain stat badges */}
          {painStats && <FloatingStatBadges stats={painStats} />}
        </div>
      </div>

      {/* Scroll indicator */}
      <ScrollIndicator />

      <style>{`
        @keyframes heroEyebrowPulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(0,174,239,0.30); }
          50% { box-shadow: 0 0 0 6px rgba(0,174,239,0.12); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="heroEyebrowPulse"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}