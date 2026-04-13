import { useState } from "react";
import { Sparkles, Heart, Building2, Home, MapPin, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import IndustryModal from "./IndustryModal";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas & Aesthetic Clinics",
    problem: "Missing consultations, no-shows costing revenue.",
    desc: "Capture aesthetic & injectable inquiries instantly. Confirm appointments, send smart reminders, and reduce no-shows. Maximize treatment room utilization and client lifetime value with automated follow-up sequences.",
    cta: "See How It Works for Med Spas",
    href: "/med-spa",
    result: "2.4× more consultations booked • 34% fewer no-shows",
  },
  {
    icon: Heart,
    name: "Wellness Studios",
    problem: "Leads dropping off before membership conversion.",
    desc: "Instantly follow up with trial class inquiries and membership prospects. Reactivate dormant members with targeted campaigns. Convert more paid leads without increasing ad spend or manual outreach effort.",
    cta: "Book a Wellness Studio Demo",
    href: "#book-demo",
    result: "58% higher conversion rates • 3× faster response time",
  },
  {
    icon: Building2,
    name: "Real Estate Agents & Brokers",
    problem: "Slow response time loses showings to competitors.",
    desc: "Respond to property inquiries within minutes, not hours. Automate showing scheduling, follow-ups, and buyer nurturing from first contact to closing. Capture more qualified leads with instant lead qualification.",
    cta: "Book a Real Estate Demo",
    href: "#book-demo",
    result: "5× more showings scheduled • 42% faster lead response",
  },
  {
    icon: Wrench,
    name: "HVAC, Plumbing & Home Services",
    problem: "Can't respond to service calls while on the job.",
    desc: "Field teams stay focused on revenue-generating work while automated systems capture estimate requests, book service appointments, and follow up on pending quotes. Never lose another lead to unresponsive phones.",
    cta: "Book an HVAC / Home Services Demo",
    href: "#book-demo",
    result: "65% more jobs booked • 24/7 lead capture & response",
  },
  {
    icon: Home,
    name: "Contractors, Electricians & Trades",
    problem: "Losing bids to whoever responds first.",
    desc: "Instant quote request responses and automated follow-ups keep you top-of-mind when crews are on-site. Win more contracts by being the fastest responder with intelligent bid tracking and pipeline automation.",
    cta: "Book a Contractor Demo",
    href: "#book-demo",
    result: "3.2× more quotes accepted • Higher win rates on bids",
  },
  {
    icon: MapPin,
    name: "Local Service Businesses",
    problem: "Paying for leads but not converting them.",
    desc: "Whether dental, salon, fitness, or salon — capture leads across all channels. Automated follow-up, appointment reminders, and reactivation campaigns turn paid traffic into confirmed bookings and repeat clients.",
    cta: "Book a Demo for My Business",
    href: "#book-demo",
    result: "2–3× ROAS on marketing spend • 40% more appointments",
  },
];

export default function Industries() {
  const [selectedIndustry, setSelectedIndustry] = useState(null);

  return (
    <section id="industries" className="py-24 md:py-32 px-6 bg-white transition-all duration-700">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Who We Work With</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            <span className="text-primary">Built for Businesses</span> <span className="text-primary">That Run on Bookings</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            Pick your industry below — we'll show you exactly how it works for you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <button
                key={i}
                onClick={() => setSelectedIndustry(ind)}
                className="group relative p-6 rounded-2xl border border-white/30 bg-white/10 backdrop-blur-md hover:border-primary/60 hover:bg-white/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden text-left animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Glass shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 group-hover:bg-primary/30 flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {ind.name}
                  </h3>
                  <p className="text-sm font-medium text-primary/70 mb-3 italic">{ind.problem}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{ind.desc}</p>
                  
                  {/* Arrow hint */}
                  <div className="mt-4 flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all opacity-80 group-hover:opacity-100">
                    <span>Explore</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10">
          Click any industry to see how ApexFlow works for your business.
        </p>
      </div>

      {/* Modal */}
      {selectedIndustry && (
        <IndustryModal industry={selectedIndustry} onClose={() => setSelectedIndustry(null)} />
      )}
    </section>
  );
}