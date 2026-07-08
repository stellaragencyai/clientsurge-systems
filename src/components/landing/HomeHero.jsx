import { ArrowRight, ShieldCheck } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSProductHero from '@/components/design-system/CSProductHero';
import HeroProductDemo from '@/components/landing/HeroProductDemo';

/**
 * HomeHero — premium B2B automation positioning.
 *
 * Rules for the public buyer path:
 *   Primary: compare packages -> pricing
 *   Secondary: how it works -> explanation page / solution section
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
  { value: '6', label: 'core automation modules' },
  { value: '24/7', label: 'coverage after launch' },
  { value: 'Done-for-you', label: 'setup support' },
  { value: 'No demo gate', label: 'package-first buyer path' },
];

function scrollToSection(event, sectionId, fallbackPath, analyticsName) {
  trackCTA(analyticsName, 'hero');

  if (event?.preventDefault) {
    event.preventDefault();
  }

  const el = document.getElementById(sectionId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `/#${sectionId}`);
    return;
  }

  window.location.href = fallbackPath;
}

export default function HomeHero() {
  const scrollToPricing = (event) => scrollToSection(
    event,
    'pricing',
    '/pricing',
    'hero_compare_packages_click'
  );

  const scrollToSolution = (event) => scrollToSection(
    event,
    'solution',
    '/how-it-works',
    'hero_see_how_it_works'
  );

  return (
    <CSProductHero
      eyebrow="AI Growth System for Service Businesses"
      title="Turn your website into an AI-powered sales system."
      subtitle="ClientSurge installs the lead capture, instant response, booking, follow-up, review, and reactivation workflows your website needs to turn more visitors into real opportunities — without forcing a mandatory demo call first."
      automationPills={AUTOMATION_PILLS}
      stats={STATS}
      primaryCTA={{
        label: 'Compare Packages',
        href: '/#pricing',
        onClick: scrollToPricing,
        icon: ArrowRight,
      }}
      secondaryCTA={{
        label: 'See How It Works',
        href: '/how-it-works',
        onClick: scrollToSolution,
        icon: ShieldCheck,
      }}
      trustBadges={[
        'Clear packages',
        'Secure checkout path',
        'Setup handled for you',
      ]}
    >
      <div className="w-full mt-6 mb-2">
        <HeroProductDemo />
      </div>
    </CSProductHero>
  );
}