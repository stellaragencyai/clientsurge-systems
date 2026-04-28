export default function IndustryPainBar({ stats }) {
  return (
    <section className="py-10 md:py-14 px-4 md:px-6" style={{ background: "rgba(253,251,248,0.98)" }}>
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl px-6 py-6 text-center"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,245,238,0.95) 100%)",
                border: "1.5px solid rgba(212,184,142,0.38)",
                boxShadow: "0 4px 18px rgba(111,67,31,0.07)",
              }}
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <p
                className="font-bold mb-1"
                style={{ fontSize: "2rem", color: "#9a5c2e", lineHeight: 1.1 }}
              >
                {stat.value}
              </p>
              <p className="text-sm font-semibold text-foreground/80 leading-snug">
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