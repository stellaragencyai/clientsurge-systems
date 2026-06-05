import { ArrowRight } from "lucide-react";

export default function IndustryResults({ metrics, testimonial, onBookDemo }) {
  return (
    <section id="results" className="px-4 py-14 md:px-6 md:py-20" style={{ background: "#ffffff", overflowX: "hidden" }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">Launch Targets</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            What This System Is Designed To Improve
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-lg px-6 py-7 text-center"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,136,204,0.15)",
                boxShadow: "0 12px 34px rgba(0,59,143,0.08)",
              }}
            >
              <p className="text-4xl md:text-5xl font-black text-primary mb-2">{m.value}</p>
              <p className="text-sm font-semibold text-foreground/80 leading-snug">{m.label}</p>
            </div>
          ))}
        </div>

        {testimonial && (
          <div
            className="rounded-lg px-6 py-7 md:px-8 md:py-8 mb-10 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #003B8F 0%, #006BB0 46%, #00AEEF 100%)",
              boxShadow: "0 18px 48px rgba(0,59,143,0.22)",
            }}
          >
            <div
              className="absolute top-4 left-6 text-6xl font-black leading-none select-none pointer-events-none"
              style={{ color: "rgba(255,255,255,0.12)" }}
            >
              "
            </div>
            <p className="text-white text-base md:text-xl font-medium leading-relaxed mb-5 relative z-10">
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

        <div className="text-center">
          <button
            type="button"
            onClick={onBookDemo}
            style={{
              borderRadius: "8px",
              padding: "2px",
              background: "linear-gradient(135deg,#00AEEF 0%,#009DFF 45%,#003B8F 100%)",
              boxShadow: "0 8px 28px rgba(0,174,239,0.4)",
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
                borderRadius: "7px",
                background: "linear-gradient(135deg,#0088CC 0%,#006BB0 40%,#003B8F 100%)",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "1rem",
              }}
            >
              Get This System For Your Business
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </span>
          </button>
          <p className="text-xs text-muted-foreground mt-3">Free audit - Month-to-month after setup - Launch timing depends on onboarding and provider access</p>
        </div>
      </div>
    </section>
  );
}
