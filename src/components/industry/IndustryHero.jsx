import { ArrowRight } from "lucide-react";

export default function IndustryHero({ image, eyebrow, headline, highlightedWord, sub, ctaLabel = "Book Your Free Demo", onBookDemo }) {
  // Split headline to highlight one word/phrase
  const headlineParts = highlightedWord
    ? headline.split(highlightedWord)
    : [headline];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0 z-0">
        <img
          src={image}
          alt={eyebrow}
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        {/* Dark gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(105deg, rgba(10,7,3,0.82) 0%, rgba(10,7,3,0.68) 42%, rgba(10,7,3,0.38) 72%, rgba(10,7,3,0.18) 100%)",
          }}
        />
        {/* Bottom fade */}
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{
            background: "linear-gradient(to top, rgba(253,251,248,1) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-32 md:py-40 w-full">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.22)",
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
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.2rem)", color: "#fff" }}
          >
            {highlightedWord && headlineParts.length === 2 ? (
              <>
                {headlineParts[0]}
                <span
                  style={{
                    background: "linear-gradient(135deg, #f5d9a8 0%, #c8965c 50%, #f5d9a8 100%)",
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
            {sub}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onBookDemo}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                minHeight: "56px",
                padding: "0 32px",
                borderRadius: "9999px",
                border: "none",
                background: "linear-gradient(135deg, #7a4825 0%, #9a5c2e 46%, #c8965c 100%)",
                color: "#fff8ee",
                fontSize: "1rem",
                fontWeight: "700",
                boxShadow: "0 16px 36px rgba(0,0,0,0.35)",
                cursor: "pointer",
              }}
            >
              {ctaLabel}
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </button>

            <a
              href="#how-it-works"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: "56px",
                padding: "0 28px",
                borderRadius: "9999px",
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                color: "rgba(255,255,255,0.9)",
                fontSize: "14px",
                fontWeight: "600",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              See How It Works
            </a>
          </div>

          <p className="mt-5 text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            No contracts · Live in 5–7 days · Done for you
          </p>
        </div>
      </div>
    </section>
  );
}