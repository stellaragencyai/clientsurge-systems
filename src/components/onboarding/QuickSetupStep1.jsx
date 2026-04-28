import { ChevronRight } from "lucide-react";

const INDUSTRIES = [
  { id: "med-spa", name: "Med Spa & Aesthetics", icon: "✨" },
  { id: "dental", name: "Dental", icon: "🦷" },
  { id: "chiropractic", name: "Chiropractic & PT", icon: "💪" },
  { id: "hvac", name: "HVAC & Home Services", icon: "🔧" },
  { id: "roofing", name: "Roofing & Restoration", icon: "🏠" },
  { id: "contractors", name: "Contractors & Trades", icon: "👷" },
];

export default function QuickSetupStep1({ value, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          What's your industry?
        </h2>
        <p className="text-muted-foreground">We'll tailor your setup to your business type.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INDUSTRIES.map((industry) => (
          <button
            key={industry.id}
            onClick={() => onChange(industry.id)}
            className={`p-5 rounded-xl border-2 transition-all text-left hover:shadow-md ${
              value === industry.id
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{industry.icon}</span>
                <p className="font-semibold text-foreground">{industry.name}</p>
              </div>
              {value === industry.id && <ChevronRight className="w-5 h-5 text-primary" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}