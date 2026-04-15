import { useState } from "react";
import MedSpaDemoModal from "./MedSpaDemoModal";

const testimonials = [
  {
    name: "Jessica M.",
    title: "Owner, Radiance Med Spa",
    location: "Miami, FL",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&q=80",
    before: "2–3 consultations/week from online ads",
    after: "11+ consultations/week",
    result: "4× booking increase",
    quote: "We were running Facebook ads and getting inquiries but barely converting. Now every inquiry gets an instant reply and most end up booking. I honestly don't know how we managed without this.",
    treatment: "Botox & Fillers",
  },
  {
    name: "Dr. Amanda R.",
    title: "Medical Director, Luxe Aesthetics",
    location: "Scottsdale, AZ",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&q=80",
    before: "Front desk overwhelmed, leads slipping through",
    after: "Zero missed inquiries",
    result: "$14k recovered in first month",
    quote: "My front desk was drowning in messages and calls. Now the system handles every new inquiry instantly. My team is focused on the clients in the room. It paid for itself in the first two weeks.",
    treatment: "Laser & Injectables",
  },
  {
    name: "Tiffany L.",
    title: "Founder, The Glow Studio",
    location: "Austin, TX",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=120&q=80",
    before: "34% no-show rate on consultations",
    after: "Down to 8% no-shows",
    result: "26% improvement in show rate",
    quote: "The automated reminders alone changed everything. We used to lose so many consultations to no-shows. Now people show up prepared and ready. The whole system just runs — I don't touch it.",
    treatment: "Facials & Body Treatments",
  },
];

export default function MedSpaTestimonials() {
  const [showModal, setShowModal] = useState(false);

  return (
    <section className="py-24 md:py-32 px-6 bg-[#FAFAF8]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">Real Results</p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground mb-4">
            Med Spas Using This System Right Now
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Specific results. Real names. No generic case studies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="flex flex-col bg-white rounded-2xl border-2 border-black p-7 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              {/* Treatment badge */}
              <span className="inline-block text-xs font-bold text-foreground/50 bg-muted px-3 py-1 rounded-full mb-5 self-start">
                {t.treatment}
              </span>

              {/* Before / After */}
              <div className="space-y-3 pb-5 border-b border-border mb-5">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Before</p>
                  <p className="text-sm text-foreground/65">{t.before}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">After</p>
                  <p className="text-sm font-semibold text-foreground">{t.after}</p>
                </div>
              </div>

              {/* Result pill */}
              <div className="mb-5">
                <span
                  className="inline-block text-sm font-bold text-white px-4 py-1.5 rounded-full"
                  style={{ background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)" }}
                >
                  {t.result}
                </span>
              </div>

              {/* Quote */}
              <p className="text-sm text-foreground/70 leading-relaxed flex-1 mb-6 italic">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow" />
                <div>
                  <p className="text-sm font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-base font-semibold text-foreground mb-6">
            Want results like these for your med spa?
          </p>
          <button
            onClick={() => setShowModal(true)}
            style={{ display: "inline-block", borderRadius: "9999px", padding: "2px", background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)", boxShadow: "0 4px 18px rgba(120,70,20,0.35)", border: "none", cursor: "pointer" }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px", height: "50px", padding: "0 32px", borderRadius: "9999px", background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)", color: "#f5e6d0", fontWeight: "700", fontSize: "1rem", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              Book a Free Demo
            </span>
          </button>
          <p className="text-xs text-muted-foreground mt-3">Free 30-min call · No commitment · Live in 5–7 days</p>
        </div>
      </div>
      {showModal && <MedSpaDemoModal onClose={() => setShowModal(false)} />}
    </section>
  );
}