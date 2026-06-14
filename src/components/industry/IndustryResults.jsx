import { ArrowRight, TrendingUp, Calendar, Zap } from "lucide-react";

const METRIC_ICONS = [TrendingUp, Calendar, Zap];

export default function IndustryResults({ metrics, testimonial, finalCta = "Free Automation Audit", onBookDemo }) {
  const isReadinessNote = testimonial?.type === "readiness";

  return (
    <section
      id="results"
      className="px-4 py-16 md:px-6 md:py-24 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)" }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,174,239,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-[0.18em] mb-4"
            style={{
              background: "rgba(0,174,239,0.1)",
              border: "1px solid rgba(0,174,239,0.25)",
              color: "#0088CC",
            }}
          >
            Launch Targets
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            What This System Is Designed To Improve
          </h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ background: "linear-gradient(90deg, #00AEEF, #003B8F)" }} />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {metrics.map((m, i) => {
            const Icon = METRIC_ICONS[i % METRIC_ICONS.length];
            return (
              <div
                key={i}
                className="rounded-xl px-6 py-8 text-center relative overflow-hidden group"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,136,204,0.14)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 12px 32px rgba(0,59,143,0.08)",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,59,143,0.14), 0 0 0 1px rgba(0,174,239,0.12)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.03), 0 12px 32px rgba(0,59,143,0.08)";
                }}
              >
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: "linear-gradient(90deg, #00AEEF, #003B8F)" }} />

                {/* Icon badge */}
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-4"
                  style={{ background: "rgba(0,174,239,0.1)", color: "#0088CC" }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <p
                  className="text-4xl md:text-5xl font-black mb-2 leading-none"
                  style={{
                    background: "linear-gradient(135deg, #0088CC 0%, #003B8F 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {m.value}
                </p>
                <p className="text-sm font-semibold text-foreground/70 leading-snug">{m.label}</p>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        {testimonial && (
          <div
            className="rounded-2xl px-7 py-8 md:px-10 md:py-10 mb-10 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #002D6E 0%, #005A9C 46%, #0099D9 100%)",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05), 0 20px 56px rgba(0,59,143,0.28), 0 0 0 1px rgba(255,255,255,0.08) inset",
            }}
          >
            {/* Decorative orb */}
            <div
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,174,239,0.25) 0%, transparent 70%)" }}
            />
            <div
              className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
            />

            {!isReadinessNote && (
              <div
                className="absolute top-4 left-6 text-8xl font-black leading-none select-none pointer-events-none"
                style={{ color: "rgba(255,255,255,0.08)", fontFamily: "Georgia, serif" }}
              >
                "
              </div>
            )}
            {isReadinessNote && (
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/60 relative z-10">
                {testimonial.label}
              </p>
            )}
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed mb-6 relative z-10" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>
              {isReadinessNote ? testimonial.quote : `"${testimonial.quote}"`}
            </p>
            <div className="flex items-center gap-3 relative z-10">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.3)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{testimonial.name}</p>
                <p className="text-white/65 text-xs">{testimonial.business}</p>
              </div>
              {/* Stars */}
              <div className="ml-auto hidden sm:flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: "#FFD700", fontSize: "14px" }}>★</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button
            type="button"
            onClick={onBookDemo}
            style={{
              borderRadius: "10px",
              padding: "2px",
              background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)",
              boxShadow: "0 0 0 1px rgba(0,174,239,0.5), 0 8px 28px rgba(0,174,239,0.45), 0 2px 8px rgba(0,107,176,0.3)",
              border: "none",
              cursor: "pointer",
              transition: "transform 0.22s ease, box-shadow 0.22s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 0 0 1.5px rgba(0,174,239,0.85), 0 12px 36px rgba(0,159,212,0.6), 0 4px 16px rgba(0,159,212,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 0 0 1px rgba(0,174,239,0.5), 0 8px 28px rgba(0,174,239,0.45), 0 2px 8px rgba(0,107,176,0.3)";
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "52px",
                padding: "0 40px",
                borderRadius: "9px",
                background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "1rem",
                letterSpacing: "0.01em",
              }}
            >
              {finalCta}
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </span>
          </button>
          <p className="text-xs text-muted-foreground mt-4">Free audit · Month-to-month after setup · Launch timing depends on onboarding and provider access</p>
        </div>
      </div>
    </section>
  );
}