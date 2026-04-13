export default function PositioningSection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-background">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-8">
          Built specifically for med spas
        </h2>

        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>
            High-ticket consultations require speed. A prospect who's interested at 2 PM but doesn't hear from you until the next morning? They've already booked with someone else.
          </p>
          <p>
            You're already spending money on advertising to get these leads. But you're losing half of them in the follow-up phase—the one thing you can actually control.
          </p>
          <p>
            We solve that. And we do it in a way that feels natural to your clients, not robotic or pushy.
          </p>
        </div>

        <div className="mt-12 p-8 bg-card rounded-xl border border-border">
          <p className="text-foreground font-semibold mb-2">The opportunity is real.</p>
          <p className="text-muted-foreground">
            If you're getting 20 leads per month and converting 5, fixing just the response time typically converts 8–10. That's not a 20% improvement. That's a 60% improvement.
          </p>
        </div>
      </div>
    </section>
  );
}