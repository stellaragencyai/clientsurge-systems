import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildResponsiveImageProps } from "@/lib/imageOptimization";

const industryImages = {
  "Med Spas & Aesthetic Clinics": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=800&q=80",
  "Dental & Orthodontics": "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80",
  "Chiropractic & Physical Therapy": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  "HVAC, Plumbing & Home Services": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80",
  "Roofing & Restoration": "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
  "Contractors & Trades": "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&q=80",
};

export default function IndustryModal({ industry, onClose }) {
  const Icon = industry.icon;
  const imageUrl = industryImages[industry.name] || industryImages["Med Spas & Aesthetic Clinics"];
  const imageProps = buildResponsiveImageProps(imageUrl, {
    widths: [480, 800, 1000],
    sizes: "(max-width: 768px) 100vw, 672px",
    quality: 80,
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white border border-border flex items-center justify-center transition-all"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Image section */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
          <img
            {...imageProps}
            alt={industry.name}
            width="800"
            height="450"
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Content section */}
        <div className="p-8 md:p-10">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground">
                {industry.name}
              </h2>
              <p className="text-primary font-semibold text-sm mt-1">{industry.result}</p>
            </div>
          </div>

          {/* Problem + Description */}
          <div className="space-y-4 mb-8">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">The Challenge</p>
              <p className="text-lg font-semibold text-foreground">{industry.problem}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Our Solution</p>
              <p className="text-base text-muted-foreground leading-relaxed">{industry.desc}</p>
            </div>
          </div>

          {/* CTA Button */}
          <a href={industry.href} className="block">
            <Button className="w-full rounded-full h-12 text-base font-semibold gap-2">
              {industry.cta}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>

          {/* Trust signal */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            Launch timeline confirmed after onboarding • No long-term contracts • Money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
}
