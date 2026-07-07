import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';
import CSButton from '@/components/design-system/CSButton';

const TIER_DETAILS = {
  starter: { price: '$497/mo', setup: '$797 setup', automations: '6 Automations' },
  growth: { price: '$997/mo', setup: '$1,297 setup', automations: '11 Automations' },
  pro: { price: '$1,997/mo', setup: '$2,497 setup', automations: '16 Automations' },
};

/**
 * Recommended system section.
 * Shows the recommended package tier for this industry with reasoning.
 *
 * Props:
 *   - recommendedSystem: { tier: string, tierKey: string, reason: string }
 */
export default function RecommendedSystemSection({ recommendedSystem }) {
  const navigate = useNavigate();

  if (!recommendedSystem) return null;

  const { tier, tierKey, reason } = recommendedSystem;
  const details = TIER_DETAILS[tierKey] || TIER_DETAILS.growth;
  const checkoutPath = `/product-signup?package=${tierKey}_system`;

  return (
    <section className="py-14 md:py-20 px-4 md:px-6 bg-gradient-to-b from-white to-blue-50/40">
      <div className="max-w-4xl mx-auto">
        <CSSectionHeader
          eyebrow="Recommended System"
          title="Recommended System for This Industry"
          align="center"
        />
        <div className="mt-8 relative cs-glow-card p-6 md:p-10 overflow-hidden" style={{ border: '2px solid hsla(199, 100%, 47%, 0.3)' }}>
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wide text-white shadow-lg"
              style={{ background: 'linear-gradient(90deg, #0079c1, #005691)' }}
            >
              <Sparkles className="w-3 h-3" /> Recommended
            </span>
          </div>

          <div className="text-center pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{tier}</p>
            <div className="flex items-baseline justify-center gap-1 mb-2">
              <span className="text-3xl md:text-4xl font-titles font-black text-foreground">{details.price}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{details.setup}</p>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-bold text-primary">
              {details.automations}
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-primary/12 bg-primary/4 p-5 md:p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">Why this system</p>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed">{reason}</p>
          </div>

          <div className="mt-6 text-center">
            <CSButton
              onClick={() => navigate(checkoutPath)}
              variant="primary"
              size="md"
              iconRight={ArrowRight}
            >
              Get {tier}
            </CSButton>
          </div>
        </div>
      </div>
    </section>
  );
}