import { useNavigate } from "react-router-dom";
import { Zap, Home, Building2, ArrowRight } from "lucide-react";
import { trackCTA } from "@/lib/analytics";

const INDUSTRY_CARDS = [
  {
    id: "med-spa",
    label: "Med Spa",
    slug: "med-spa",
    description: "Lead capture, booking automation, and review requests for aesthetic practices.",
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "real-estate",
    label: "Real Estate",
    slug: "real-estate",
    description: "Lead qualification, instant follow-up, and appointment scheduling for agents.",
    icon: Building2,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "home-services",
    label: "Home Services",
    slug: "contractors",
    description: "Missed-call recovery, instant SMS responses, and lead reactivation.",
    icon: Home,
    gradient: "from-orange-500 to-red-500",
  },
];

export default function IndustryGallerySection() {
  const navigate = useNavigate();

  const handleCardClick = (slug) => {
    trackCTA(`industry_gallery_${slug}`, "industry_gallery_section");
    navigate(`/${slug}`);
  };

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-[#00AEEF] mb-3">
            INDUSTRY SOLUTIONS
          </p>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 text-wrap balance">
            AI Automation Built for Your Industry
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Explore how ClientSurge transforms lead management and automation for different service businesses.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {INDUSTRY_CARDS.map(({ id, label, slug, description, icon: Icon, gradient }) => (
            <button
              key={id}
              onClick={() => handleCardClick(slug)}
              className="group relative overflow-hidden rounded-xl border border-[#00AEEF]/25 bg-white hover:border-[#00AEEF]/60 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
              style={{ minHeight: "280px" }}
              type="button"
            >
              {/* Gradient background on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Content */}
              <div className="relative p-6 md:p-8 h-full flex flex-col justify-between">
                {/* Icon circle */}
                <div
                  className={`inline-flex w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-lg bg-gradient-to-br ${gradient} text-white mb-4`}
                >
                  <Icon className="w-6 h-6 md:w-7 md:h-7" />
                </div>

                {/* Text content */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-black mb-2">
                    {label}
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Footer with arrow */}
                <div className="flex items-center gap-2 text-[#00AEEF] font-semibold text-sm mt-6 group-hover:gap-3 transition-all duration-300">
                  <span>View Solution</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* Cyan glow on hover */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 20px rgba(0, 174, 239, 0.1), 0 0 20px rgba(0, 174, 239, 0.15)",
                }}
              />
            </button>
          ))}
        </div>

        {/* CTA Footer */}
        <div className="mt-12 md:mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Don't see your industry? We support over 12 verticals.
          </p>
          <button
            onClick={() => {
              trackCTA("view_all_industries", "industry_gallery_section");
              navigate("/industries");
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#00AEEF]/40 text-[#00AEEF] font-semibold hover:border-[#00AEEF] hover:bg-[#00AEEF]/5 transition-all"
            type="button"
          >
            View All Industries
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}