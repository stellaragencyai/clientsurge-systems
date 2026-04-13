import { Sparkles, Heart, Home, Building2, MapPin } from "lucide-react";

const industries = [
  {
    icon: Sparkles,
    name: "Med Spas",
    desc: "Capture consultation requests instantly. Automate appointment reminders and follow-up to reduce no-shows and fill your schedule.",
  },
  {
    icon: Heart,
    name: "Aesthetic Clinics",
    desc: "Convert inquiries about treatments into booked procedures. Recover missed consultations and reactivate past patients.",
  },
  {
    icon: Building2,
    name: "Real Estate",
    desc: "Respond to property inquiries in seconds. Automate showing scheduling and keep leads warm until they're ready to buy.",
  },
  {
    icon: Home,
    name: "Home Services",
    desc: "Never miss a service request again. Auto-respond to quote requests and book jobs while your team is in the field.",
  },
  {
    icon: MapPin,
    name: "Local Businesses",
    desc: "Whether you run a dental practice, fitness studio, or salon — capture and convert more of the leads you're already paying for.",
  },
];

export default function Industries() {
  return (
    <section id="industries" className="py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">
            Who We Serve
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Built for Industries That Depend on Bookings
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((ind, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                <ind.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{ind.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{ind.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}