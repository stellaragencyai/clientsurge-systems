import { useState } from "react";
import { Sparkles, Heart, Building2, Home, MapPin, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    problem: "Consultation requests going cold.",
    desc: "Capture every inquiry instantly, confirm appointments automatically, and cut no-shows with smart reminders. Keep your treatment rooms full.",
    cta: "See How It Works for Med Spas",
    href: "/med-spa",
    result: "Avg. 2.4× more consultations in 30 days",
  },
  {
    icon: Heart,
    name: "Wellness Studios",
    problem: "Paid leads not converting to memberships.",
    desc: "Follow up with interested clients before they lose momentum. Reactivate lapsed members. Book more intro sessions without increasing your ad spend.",
    cta: "Book a Wellness Studio Demo",
    href: "#book-demo",
    result: "More membership conversions, fewer cold leads",
  },
  {
    icon: Building2,
    name: "Real Estate",
    problem: "Property inquiries going unanswered for hours.",
    desc: "Respond to every lead the moment they reach out. Automate showing scheduling and keep buyers engaged from first contact to closing.",
    cta: "Book a Real Estate Demo",
    href: "#book-demo",
    result: "Faster response = more showings booked",
  },
  {
    icon: Wrench,
    name: "HVAC & Home Services",
    problem: "Missing quote requests while out on jobs.",
    desc: "While your crew is in the field, your automation is responding to new requests, booking estimates, and following up on pending quotes.",
    cta: "Book an HVAC / Home Services Demo",
    href: "#book-demo",
    result: "More jobs booked without lifting a finger",
  },
  {
    icon: Home,
    name: "Contractors & Trades",
    problem: "Losing jobs to whoever responds first.",
    desc: "Automated instant replies and quote follow-ups keep you top-of-mind — even when you're on site and can't answer the phone.",
    cta: "Book a Contractor Demo",
    href: "#book-demo",
    result: "Win more bids with faster responses",
  },
  {
    icon: MapPin,
    name: "Local Service Businesses",
    problem: "Paying for leads you're not converting.",
    desc: "Whether you run a dental practice, salon, or fitness studio — we help you get more value from the demand you're already generating.",
    cta: "Book a Demo for My Business",
    href: "#book-demo",
    result: "Works for any appointment-based business",
  },
];

export default function Industries() {
  const [active, setActive] = useState(null);

  return (
    <section id="industries" className="py-24 md:py-32 px-6 bg-gradient-to-b from-card via-background to-card">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Who We Work With</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Built for Businesses That Run on Bookings
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Pick your industry below — we'll show you exactly how it works for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind, i) => {
            const isOpen = active === i;
            return (
              <div
                key={i}
                onClick={() => setActive(isOpen ? null : i)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  isOpen
                    ? "border-primary/50 shadow-md bg-card"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <ind.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">{ind.name}</h3>
                <p className="text-xs font-medium text-primary/80 mb-3 italic">{ind.problem}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{ind.desc}</p>

                {/* Expanded CTA */}
                {isOpen && (
                  <div className="mt-5 pt-5 border-t border-border space-y-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                      {ind.result}
                    </p>
                    <a href={ind.href}>
                      <Button size="sm" className="rounded-full w-full text-xs font-semibold gap-1.5 h-9">
                        {ind.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Click your industry to see results and book a tailored demo.
        </p>
      </div>
    </section>
  );
}