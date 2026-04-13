export default function MedSpaPain() {
  return (
    <section className="py-20 md:py-28 px-6 bg-white">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-block px-4 py-2 bg-destructive/10 rounded-lg mb-6">
          <p className="text-sm font-semibold text-destructive">The Real Cost</p>
        </div>

        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-6">
          Every Delayed Response Costs You Clients
        </h2>

        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Your competitors respond faster. Leads go to them. Revenue stays on the table. This happens automatically with your current system.
        </p>

        <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-8">
          <p className="text-3xl font-semibold text-foreground mb-2">
            Missed Lead Response = Lost Booking
          </p>
          <p className="text-muted-foreground">
            The first business to respond typically wins the appointment. Speed is everything.
          </p>
        </div>
      </div>
    </section>
  );
}