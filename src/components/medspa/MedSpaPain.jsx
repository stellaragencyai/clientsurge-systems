const stats = [
  { value: "78%", label: "Book with whoever responds first" },
  { value: "5 min", label: "Critical response window" },
  { value: "1 in 3", label: "Never call back twice" },
];

const sources = "Sources: Lead Response Management Study · Harvard Business Review · Salesforce State of Sales Report";

export default function MedSpaPain() {
  return (
    <section className="py-24 md:py-32 px-6 bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          {/* Left content */}
          <div>
            <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Financial Reality</p>
            <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6 leading-snug">
              You're already paying for leads. You're just not closing them.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              <span className="font-semibold text-foreground">First response wins.</span> Med spa leads book with whoever answers first.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              You're running ads. Someone calls. Your team is busy. They book someone else instead.
            </p>
            <div className="p-5 bg-primary/5 border border-primary/15 rounded-xl">
              <p className="text-base font-semibold text-foreground">
                <span className="text-primary">Every missed moment is lost revenue.</span>
              </p>
            </div>
          </div>

          {/* Right: stats + image */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85"
                alt="Med spa consultation"
                loading="lazy"
                className="w-full h-52 object-cover object-top"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {stats.map((s, i) => (
                <div key={i} className="bg-[#FAFAF8] border border-border rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-primary mb-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">{sources}</p>
          </div>
        </div>
      </div>
    </section>
  );
}