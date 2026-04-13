const items = [
  "Leads responded to in under 60 seconds",
  "Average 3× increase in booking rate",
  "Setup complete in 5–7 business days",
  "Used by Med Spas, Clinics & Home Services",
  "Month-to-month — no lock-in",
];

export default function TrustBar() {
  return (
    <section className="py-6 border-y border-border bg-muted/40">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-2.5 text-sm font-medium text-foreground/80">
              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}