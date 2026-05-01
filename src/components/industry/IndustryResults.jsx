import { ArrowRight } from "lucide-react";

export default function IndustryResults({ metrics, onBookDemo }) {
  return (
    <section id="results" className="py-16 md:py-20 px-4 md:px-6" style={{ background: "rgba(253,251,248,0.98)", overflowX: "hidden" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary mb-3">Real Results</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            What Businesses Like Yours See
          </h2>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-2xl px-6 py-6 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(250,245,238,0.95) 100%)",
                border: "1.5px solid rgba(154,92,46,0.18)",
                boxShadow: "0 4px 18px rgba(111,67,31,0.07)",
              }}
            >
              <p className="text-4xl font-black text-primary mb-2">{m.value}</p>
              <p className="text-sm font-semibold text-foreground/80 leading-snug">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Testimonial */}
        {testimonial && (
          <div
            className="rounded-3xl px-8 py-8 mb-10 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #7a4825 0%, #9a5c2e 46%, #c8965c 100%)",
              boxShadow: "0 12px 40px rgba(122,72,37,0.25)",
            }}
          >
            <div
              className="absolute top-4 left-6 text-6xl font-black leading-none select-none pointer-events-none"
              style={{ color: "rgba(255,255,255,0.12)" }}
            >
              "
            </div>
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed mb-5 relative z-10">
              "{testimonial.quote}"
            </p>
            <div className="flex items-center gap-3 relative z-10">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
              >
                {testimonial.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-bold text-sm">{testimonial.name}</p>
                <p className="text-white/70 text-xs">{testimonial.business}</p>
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
              borderRadius: "9999px",
              padding: "2px",
              background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              boxShadow: "0 8px 28px rgba(120,70,20,0.35)",
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
                height: "52px",
                padding: "0 36px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#f5e6d0",
                fontWeight: "700",
                fontSize: "1rem",
              }}
            >
              Get This System For Your Business
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </span>
          </button>
          <p className="text-xs text-muted-foreground mt-3">Free demo · No contracts · Live in 5–7 days</p>
        </div>
      </div>
    </section>
  );
}