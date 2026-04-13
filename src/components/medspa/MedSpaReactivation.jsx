import { RotateCw } from "lucide-react";

export default function MedSpaReactivation() {
  return (
    <section className="py-20 md:py-28 px-6 bg-secondary/30">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-6">
          <RotateCw className="w-8 h-8 text-primary" />
        </div>

        <h2 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 text-center">
          Turn Old Leads Into New Revenue
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-8 leading-relaxed">
          You already have a database of past inquiries. Don't let that sit idle.
        </p>

        <div className="bg-white border border-border rounded-lg p-8">
          <p className="text-base text-foreground mb-4">
            Our system can automatically re-engage past leads with smart, personalized messages. Many of them are still interested. You just haven't followed up.
          </p>
          <p className="text-base text-foreground font-semibold text-primary">
            Easy extra bookings. Zero extra work.
          </p>
        </div>
      </div>
    </section>
  );
}