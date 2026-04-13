import { Sparkles, Heart, Building2, Home, MapPin } from "lucide-react";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas",
    problem: "Consultation requests going cold.",
    desc: "Capture every inquiry instantly, confirm appointments automatically, and cut no-shows with smart reminders. Keep your treatment rooms full.",
  },
  {
    icon: Heart,
    name: "Aesthetic Clinics",
    problem: "Paid leads not converting to procedures.",
    desc: "Follow up with interested patients before they lose momentum. Reactivate past clients. Book more consultations without increasing your ad spend.",
  },
  {
    icon: Building2,
    name: "Real Estate",
    problem: "Property inquiries going unanswered for hours.",
    desc: "Respond to every lead the moment they reach out. Automate showing scheduling and keep buyers engaged from first contact to closing.",
  },
  {
    icon: Home,
    name: "Home Services",
    problem: "Missing quote requests while out on jobs.",
    desc: "While your crew is in the field, your automation is responding to new requests, booking estimates, and following up on pending quotes.",
  },
  {
    icon: MapPin,
    name: "Local Service Businesses",
    problem: "Paying for leads you're not converting.",
    desc: "Whether you run a dental practice, salon, or fitness studio — we help you get more value from the demand you're already generating.",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Who We Work With</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Built for Businesses That Run on Bookings
          </h2>
          <p className="mt-5 text-muted-foreground text-lg">
            We understand your industry. We've built for it.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((ind, i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <ind.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">{ind.name}</h3>
              <p className="text-xs font-medium text-primary/80 mb-3 italic">{ind.problem}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}