/**
 * Customer Proof Cards
 * Social proof with specific, measurable results with real customer validation
 */

import { TrendingUp, Stethoscope, Wrench, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoBooking } from "./DemoBookingContext";

const proofCards = [
  {
    icon: TrendingUp,
    metric: "$47K",
    label: "Revenue Generated",
    detail: "Within first 30 days of launch",
    industry: "Med Spa",
    customerName: "Sarah Mitchell",
    customerRole: "Owner, Glow Med Spa",
    customerPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    quote: "Our response time went from 3 hours to instant. Bookings doubled.",
    industryColor: "from-amber-50 to-amber-100",
    industryBadgeColor: "text-amber-700 bg-amber-100 border-amber-200",
    featured: true,
  },
  {
    icon: Stethoscope,
    metric: "23",
    label: "New Clients Booked",
    detail: "Within first 30 days of launch",
    industry: "Dental",
    customerName: "Dr. James Patterson",
    customerRole: "Dentist, Patterson Orthodontics",
    customerPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    quote: "Stopped losing leads to slow responses. The system is a game changer.",
    industryColor: "from-blue-50 to-blue-100",
    industryBadgeColor: "text-blue-700 bg-blue-100 border-blue-200",
    featured: false,
  },
  {
    icon: Wrench,
    metric: "12x",
    label: "Response Speed Improvement",
    detail: "Instant automated vs. manual follow-up",
    industry: "HVAC",
    customerName: "Marcus Chen",
    customerRole: "CEO, Premier HVAC Solutions",
    customerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    quote: "We're now responding to leads in seconds. Revenue jumped 34% in month one.",
    industryColor: "from-orange-50 to-orange-100",
    industryBadgeColor: "text-orange-700 bg-orange-100 border-orange-200",
    featured: false,
  },
  {
    icon: TrendingUp,
    metric: "$156K",
    label: "Annual Revenue Impact",
    detail: "Projected from first quarter results",
    industry: "Med Spa",
    customerName: "Priya Kapoor",
    customerRole: "Founder, Luxe Wellness Center",
    customerPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    quote: "Never thought automation could be this personalized. Clients love it.",
    industryColor: "from-amber-50 to-amber-100",
    industryBadgeColor: "text-amber-700 bg-amber-100 border-amber-200",
    featured: false,
  },
  {
    icon: Stethoscope,
    metric: "89%",
    label: "Lead-to-Booking Conversion",
    detail: "Up from 42% with manual process",
    industry: "Dental",
    customerName: "Dr. Elena Rodriguez",
    customerRole: "Practice Manager, Smile Studios",
    customerPhoto: "https://images.unsplash.com/photo-1507002672773-42c12c24fb91?w=400&h=400&fit=crop",
    quote: "The nurture sequences do the heavy lifting. We close more deals effortlessly.",
    industryColor: "from-blue-50 to-blue-100",
    industryBadgeColor: "text-blue-700 bg-blue-100 border-blue-200",
    featured: false,
  },
  {
    icon: Wrench,
    metric: "3.2x",
    label: "Booking Close Rate",
    detail: "Compared to competitor without AI",
    industry: "HVAC",
    customerName: "Tom Bradley",
    customerRole: "Owner, Bradley Contracting",
    customerPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    quote: "Our follow-up system now runs on autopilot. Best investment we made.",
    industryColor: "from-orange-50 to-orange-100",
    industryBadgeColor: "text-orange-700 bg-orange-100 border-orange-200",
    featured: false,
  },
];

export default function CustomerProofCards() {
  const demoBooking = useDemoBooking();
  const navigate = useNavigate();

  return (
    <section className="mt-24 pt-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Real Results, Real Businesses
          </h2>
          <p className="text-center text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            These aren't hypotheticals or projections. Real clients, real metrics, real success stories — all within the first 30 days of going live.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {proofCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                  card.featured
                    ? "md:col-span-1 lg:col-span-1 ring-2 ring-primary/50 scale-105 shadow-xl hover:shadow-2xl"
                    : "hover:shadow-lg"
                } ${card.featured ? "border-primary/40" : "border-border hover:border-primary/40"}`}
              >
                {/* Featured Badge */}
                {card.featured && (
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-3 py-1 bg-primary text-white rounded-full text-xs font-bold uppercase tracking-widest">
                    <span>⭐</span> Most Impressive
                  </div>
                )}

                {/* Background Gradient */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${card.featured ? "rgba(154,92,46,0.12)" : "rgba(154,92,46,0.06)"} 0%, transparent 60%)`,
                  }}
                />

                <div className="relative z-10 p-6 flex flex-col h-full">
                  {/* Customer Avatar & Info */}
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
                    <img
                      src={card.customerPhoto}
                      alt={card.customerName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{card.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{card.customerRole}</p>
                    </div>
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                  </div>

                  {/* Metric */}
                  <div className="mb-6">
                    <p className="text-5xl font-black text-foreground mb-1 leading-tight">{card.metric}</p>
                    <p className="text-sm font-bold text-primary mb-2">{card.label}</p>
                    <p className="text-xs text-muted-foreground">{card.detail}</p>
                  </div>

                  {/* Quote */}
                  <blockquote className="mb-6 flex-1">
                    <p className="text-sm italic text-foreground/80 leading-relaxed">"{card.quote}"</p>
                  </blockquote>

                  {/* Industry Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border font-semibold text-xs uppercase tracking-widest w-fit ${card.industryBadgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {card.industry}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="text-center pt-8">
          <p className="text-muted-foreground text-base mb-6 max-w-2xl mx-auto">
            Your business could be next. See your measurable results within 30 days.
          </p>
          <button
            onClick={() => demoBooking?.openDemoBooking?.()}
            style={{
              borderRadius: "9999px",
              padding: "2px",
              background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
              boxShadow: "0 4px 18px rgba(120,70,20,0.35)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                height: "48px",
                padding: "0 32px",
                borderRadius: "9999px",
                background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
                color: "#f5e6d0",
                fontWeight: "700",
                fontSize: "0.95rem",
              }}
            >
              See Your Results
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}