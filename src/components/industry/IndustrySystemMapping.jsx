import { CheckCircle, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function IndustrySystemMapping({ systemMapping }) {
  const tiers = Object.entries(systemMapping);

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {tiers.map(([key, tier], idx) => {
        const isGrowth = idx === 1; // Growth is middle card (highlight)

        return (
          <div
            key={key}
            className={`relative p-8 rounded-xl border-2 transition-all ${
              isGrowth
                ? 'border-primary bg-primary/5 shadow-xl scale-105'
                : 'border-border bg-background hover:border-primary/30'
            }`}
          >
            {/* Popular badge */}
            {isGrowth && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            {/* Tier name */}
            <h3 className="text-2xl font-bold mb-2">{tier.label}</h3>
            <div className="text-3xl font-bold text-primary mb-6">{tier.price}</div>

            {/* Features list */}
            <ul className="space-y-4 mb-8">
              {tier.features.map((feature, featureIdx) => (
                <li key={featureIdx} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link
              to="/book"
              className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all ${
                isGrowth
                  ? 'bg-primary text-white hover:shadow-lg'
                  : 'border-2 border-border text-foreground hover:border-primary hover:bg-primary/5'
              }`}
            >
              Get Free Automation Audit
            </Link>

            {/* Setup indicator */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>Setup in under 30 minutes</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
