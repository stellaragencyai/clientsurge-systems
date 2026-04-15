export default function MedSpaPositioning() {
  return (
    <section className="py-12 md:py-16 px-6 bg-primary/5 border-y border-primary/10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-2">
          You're Not Losing Leads — <span className="text-primary">You're Losing Them After They Reach Out</span>
        </h2>
        <p className="text-base text-muted-foreground mb-8">
          Every missed lead is money you already paid for — and now lost.
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {["Instagram", "Website Forms", "Phone Calls", "Google Ads", "Facebook", "Referrals"].map((c, i) => (
            <span key={i} className="px-4 py-2 bg-white border border-border rounded-full text-sm font-medium text-foreground/70">
              {c}
            </span>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-8 font-medium">
          You're already getting leads from these sources. <br />
          <span className="text-foreground font-semibold">The problem is what happens after.</span>
        </p>
      </div>
    </section>
  );
}