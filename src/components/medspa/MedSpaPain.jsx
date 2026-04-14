const stats = [
  { value: "78%", label: "of clients choose the first business that responds" },
  { value: "5 min", label: "response window before conversion rates drop sharply" },
  { value: "1 in 3", label: "missed calls never call back a second time" },
];

export default function MedSpaPain() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left content */}
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">The Cost of Slow Response</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6 leading-snug">
              Every delayed response<br />can cost you a client.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              Med spa leads are not loyal. They are looking for a solution. The first business that responds with confidence gets the booking.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              Delayed follow-up doesn't just lose a lead. It hands revenue directly to whoever responded faster. If you're running ads and not following up within minutes, you're wasting your budget.
            </p>
            <div className="p-5 bg-destructive/5 border border-destructive/15 rounded-xl">
              <p className="text-base font-semibold text-foreground">
                You're already paying for attention. The problem is what happens after you get it.
              </p>
            </div>
          </div>

          {/* Right: stats + image */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85"
                alt="Med spa consultation"
                className="w-full h-52 object-cover object-top"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-[#FAFAF8] border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}