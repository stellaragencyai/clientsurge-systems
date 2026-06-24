import { ArrowRight } from 'lucide-react';

export default function PricingOfferHero() {
  return (
    <section className="py-12 px-6 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          AI Automation Systems That Turn Missed Leads Into Booked Customers
        </h1>

        {/* Subheadline */}
        <p className="text-xl text-foreground mb-8 leading-relaxed">
          ClientSurge installs AI follow-up, missed-call recovery, booking, nurture, and revenue tracking systems for service businesses and agencies.
        </p>

        {/* Simple Flow Explanation */}
        <div className="rounded-xl p-6 inline-block max-w-2xl border border-primary/20" style={{ background: "rgba(0,174,239,0.04)" }}>
          <p className="text-sm font-semibold text-foreground flex items-center gap-2 justify-center flex-wrap">
            <span>Choose a package</span>
            <ArrowRight className="w-4 h-4" />
            <span>Complete checkout</span>
            <ArrowRight className="w-4 h-4" />
            <span>Submit onboarding</span>
            <ArrowRight className="w-4 h-4" />
            <span>We configure</span>
            <ArrowRight className="w-4 h-4" />
            <span>You go live</span>
          </p>
        </div>
      </div>
    </section>
  );
}