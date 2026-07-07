import { ShoppingCart, Zap } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSProductHero from '@/components/design-system/CSProductHero';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * HomeHero — Homepage hero built on CSProductHero.
 *
 * Replaces CinematicHero with the Phase 5.3 design system component,
 * preserving all content, CTAs, automation pills, stats, and the
 * integration logo marquee.
 *
 * Preserved from CinematicHero:
 *   - Eyebrow, title, subtitle
 *   - Automation pills
 *   - Primary CTA (Browse AI Systems → scroll to #pricing)
 *   - Secondary CTA (Visit the Store → /store)
 *   - Stats bar (4 metrics)
 *   - Trust text
 *   - Logo marquee
 *   - trackCTA analytics calls
 */

const AUTOMATION_PILLS = [
  'Lead Capture',
  'Missed-Call Recovery',
  'Follow-Up',
  'AI Booking',
  'Reviews',
  'Reactivation',
  'Optional AI Phone Receptionist',
];

const HOST = 'https://www.vectorlogo.zone/logos/';
const TRUST_LOGOS = [
  { name: 'Twilio', src: `${HOST}twilio/twilio-ar21.svg` },
  { name: 'Stripe', src: `${HOST}stripe/stripe-ar21.svg` },
  { name: 'Cloudflare', src: `${HOST}cloudflare/cloudflare-ar21.svg` },
  { name: 'Asana', src: `${HOST}asana/asana-ar21.svg` },
];

const STATS = [
  { value: '< 60 sec', label: 'Avg response time' },
  { value: '78%', label: 'Lead recovery rate' },
  { value: '6', label: 'Automated systems' },
  { value: '0', label: 'Demos required' },
];

function LogoMarquee() {
  const shouldReduceMotion = useReducedMotion();
  const logoTrack = [...TRUST_LOGOS, ...TRUST_LOGOS, ...TRUST_LOGOS];

  return (
    <div className="w-full mt-auto" aria-label="ClientSurge integration logos">
      <style>{`
        .cs-hero-logo-shell {
          position: relative;
          width: min(1180px, calc(100vw - 32px));
          margin: 0 auto;
          overflow: hidden;
          padding: 16px 0 14px;
          border-top: 1px solid rgba(0,107,176,.15);
          background: linear-gradient(90deg, rgba(0,174,239,.03), rgba(255,255,255,.5), rgba(0,174,239,.03));
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 10%, #000 90%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 10%, #000 90%, transparent 100%);
        }
        .cs-hero-logo-track {
          display: flex;
          align-items: center;
          width: max-content;
          gap: 64px;
          animation: cs-logo-marquee 32s linear infinite;
          will-change: transform;
        }
        .cs-hero-logo-item {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          height: 48px;
          width: 150px;
          opacity: .85;
          transition: opacity .2s ease;
        }
        .cs-hero-logo-item:hover { opacity: 1; }
        .cs-real-logo {
          filter: drop-shadow(0 0 10px rgba(53,189,241,.10));
          width: 150px;
          height: 40px;
          object-fit: contain;
          display: block;
        }
        @keyframes cs-logo-marquee {
          0% { transform: translate3d(0,0,0); }
          100% { transform: translate3d(-33.333%,0,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-hero-logo-track {
            animation: none;
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }
          .cs-logo-repeat { display: none; }
        }
        @media (max-width: 720px) {
          .cs-hero-logo-shell { width: calc(100vw - 24px); padding: 12px 0 10px; }
          .cs-hero-logo-track { gap: 48px; animation-duration: 22s; }
          .cs-hero-logo-item { height: 40px; width: 120px; }
          .cs-real-logo { width: 120px !important; height: 32px !important; }
        }
      `}</style>

      <p
        className="text-center mb-2.5"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.68rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.22em',
          color: '#006BB0',
        }}
      >
        Built to connect with the tools your system runs on
      </p>
      <div className="cs-hero-logo-shell">
        <div className="cs-hero-logo-track">
          {logoTrack.map((logo, index) => (
            <div
              className={index >= TRUST_LOGOS.length ? 'cs-hero-logo-item cs-logo-repeat' : 'cs-hero-logo-item'}
              data-logo={logo.name}
              key={`${logo.name}-${index}`}
              aria-hidden={index >= TRUST_LOGOS.length ? 'true' : undefined}
            >
              <img
                src={logo.src}
                alt={`${logo.name} logo`}
                width="120"
                height="32"
                loading="eager"
                decoding="async"
                className="cs-real-logo"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomeHero() {
  const scrollToPricing = () => {
    trackCTA('hero_browse_systems_click', 'hero');
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleStoreClick = () => {
    trackCTA('hero_visit_store', 'hero');
  };

  return (
    <CSProductHero
      eyebrow="The Amazon of AI Services for Business"
      title="Browse AI Systems. Add to Cart. Check Out."
      subtitle="Pick a packaged AI system for missed calls, slow follow-up, booking friction, reviews, and lead reactivation. No demos, no sales calls — just add your system to the cart and check out. We configure, test, and install it for you."
      automationPills={AUTOMATION_PILLS}
      stats={STATS}
      primaryCTA={{
        label: 'Browse AI Systems',
        onClick: scrollToPricing,
        icon: ShoppingCart,
      }}
      secondaryCTA={{
        label: 'Visit the Store',
        to: '/store',
        onClick: handleStoreClick,
        icon: Zap,
      }}
      trustBadges={[
        'No demos required',
        'Add to cart and check out',
        'Done-for-you setup included',
      ]}
    >
      <LogoMarquee />
    </CSProductHero>
  );
}