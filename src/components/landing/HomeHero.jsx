import { ShoppingCart, ArrowRight } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSProductHero from '@/components/design-system/CSProductHero';
import HeroProductDemo from '@/components/landing/HeroProductDemo';

/**
 * HomeHero — SaaS-transformed homepage hero.
 *
 * Phase 6: Shifted from storefront ("Browse AI Systems. Add to Cart. Check Out.")
 * to SaaS platform positioning ("Turn your website into an AI-powered sales system.")
 * with an animated product demonstration showing the AI conversation flow.
 *
 * Analytics preserved:
 *   - hero_browse_systems_click (primary CTA)
 *   - hero_see_how_it_works (new secondary CTA — replaces hero_visit_store)
 *   - hero_visit_store retained as store link in trust badges area
 */

const AUTOMATION_PILLS = [
  'Lead Capture',
  'Missed-Call Recovery',
  'AI Follow-Up',
  'AI Booking',
  'Reviews',
  'Reactivation',
  'Optional AI Phone Receptionist',
];

const STATS = [
  { value: '< 60 sec', label: 'Avg response time' },
  { value: '24/7', label: 'AI availability' },
  { value: '6', label: 'Automated systems' },
  { value: '0', label: 'Demos required' },
];

export default function HomeHero() {
  const scrollToPricing = () => {
    trackCTA('hero_browse_systems_click', 'hero');
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToSolution = () => {
    trackCTA('hero_see_how_it_works', 'hero');
    const el = document.getElementById('solution');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStoreClick = () => {
    trackCTA('hero_visit_store', 'hero');
  };

  return (
    <CSProductHero
      eyebrow="AI Growth System for Service Businesses"
      title="Turn your website into an AI-powered sales system."
      subtitle="ClientSurge captures every lead, responds instantly, books appointments automatically, and reactivates dormant prospects — no staff required. Browse packaged systems, add to cart, and we install it for you."
      automationPills={AUTOMATION_PILLS}
      stats={STATS}
      primaryCTA={{
        label: 'Browse AI Systems',
        onClick: scrollToPricing,
        icon: ShoppingCart,
      }}
      secondaryCTA={{
        label: 'See How It Works',
        onClick: scrollToSolution,
        icon: ArrowRight,
      }}
      trustBadges={[
        'No demos required',
        'Add to cart and check out',
        'Done-for-you setup included',
      ]}
    >
      {/* Visual product demonstration — animated AI conversation flow */}
      <div className="w-full mt-6 mb-2">
        <HeroProductDemo />
      </div>

      {/* Store link — preserves hero_visit_store analytics */}
      <div className="w-full text-center mt-4">
        <a
          href="/store"
          onClick={handleStoreClick}
          className="inline-flex items-center gap-1.5 text-sm font-bold transition-colors"
          style={{ color: '#006BB0' }}
        >
          Or browse individual automations in the store
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </CSProductHero>
  );
}