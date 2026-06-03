export default function IndustryPainBar({ stats }) {
  return (
    <section className="relative z-20 px-4 pb-12 md:px-6 md:pb-16" style={{ background: "#ffffff" }}>
      <div className="max-w-6xl mx-auto" style={{ marginTop: "clamp(-3.5rem, -5vw, -2rem)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-lg px-6 py-6 text-center"
              style={{
                background: "#ffffff",
                border: "1px solid rgba(0,136,204,0.14)",
                boxShadow: "0 14px 36px rgba(0,59,143,0.09)",
              }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p
                className="font-bold mb-1"
                style={{ fontSize: "clamp(2rem, 4vw, 2.7rem)", color: "#005f99", lineHeight: 1.02, fontFamily: "var(--font-display)" }}
              >
                {stat.value}
              </p>
              <p className="text-sm font-semibold leading-snug" style={{ color: "rgba(5,19,46,0.82)" }}>
                {stat.label}
              </p>
              {stat.sub && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{stat.sub}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
