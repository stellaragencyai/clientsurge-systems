import { ArrowRight, ShieldCheck } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSProductHero from '@/components/design-system/CSProductHero';
import HeroProductDemo from '@/components/landing/HeroProductDemo';

/**
 * HomeHero — premium B2B automation positioning.
 *
 * Keep the public buyer path clean:
 *   Primary: compare packages -> pricing section
 *   Secondary: see workflow -> solution section
 *
 * Do not present unverifiable performance stats as live proof.
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
  { value: 'Fast', label: 'lead response workflow' },
  { value: '24/7', label: 'automation coverage' },
  { value: '6', label: 'core automation modules' },
  { value: 'Done-for-you', label: 'setup and launch support' },
];

export default function HomeHero() {
  const scrollToPricing = () => {
    trackCTA('hero_compare_packages_click', 'hero');
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToSolution = () => {
    trackCTA('hero_see_how_it_works', 'hero');
    const el = document.getElementById('solution');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <CSProductHero
      eyebrow="AI Growth System for Service Businesses"
      title="Turn your website into an AI-powered sales system."
      subtitle="ClientSurge installs the lead capture, instant response, booking, follow-up, review, and reactivation workflows your website needs to turn more visitors into real opportunities — without forcing a mandatory demo call first."
      automationPills={AUTOMATION_PILLS}
      stats={STATS}
      primaryCTA={{
        label: 'Compare Packages',
        onClick: scrollToPricing,
        icon: ArrowRight,
      }}
      secondaryCTA={{
        label: 'See How It Works',
        onClick: scrollToSolution,
        icon: ShieldCheck,
      }}
      trustBadges={[
        'No mandatory demo call',
        'Secure checkout available',
        'Done-for-you setup included',
      ]}
    >
      <div className="w-full mt-6 mb-2">
        <HeroProductDemo />
      </div>
    </CSProductHero>
  );
}
