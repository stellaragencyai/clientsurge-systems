import { ArrowRight } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';

/**
 * HomeHero — centered, screenshot-matched layout.
 * Small dark pill CTA above a large bold headline (one gradient word),
 * grey sub-heading, on a white background with a faint grid pattern.
 * No device mockup. Uses ClientSurge content + electric blue (#00AEEF).
 */
export default function HomeHero() {
  const scrollToPricing = (event) => {
    trackCTA('hero_compare_packages_click', 'hero');
    event.preventDefault();
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', '/#pricing');
      return;
    }
    window.location.href = '/pricing';
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-white"
      style={{ minHeight: 'calc(100svh - var(--cs-nav-height, 76px))' }}
      aria-label="ClientSurge Systems AI growth system hero"
    >
      {/* Faint grid pattern — radial-masked so it fades at the edges */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 42%, #000 35%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 42%, #000 35%, transparent 78%)',
        }}
      />

      <div
        className="relative z-10 mx-auto flex max-w-[860px] flex-col items-center px-5 text-center sm:px-8"
        style={{
          paddingTop: 'calc(var(--cs-nav-height, 76px) + 5rem)',
          paddingBottom: '5.5rem',
        }}
      >
        {/* Small dark CTA pill */}
        <a
          href="/#pricing"
          onClick={scrollToPricing}
          className="inline-flex items-center gap-2 rounded-full text-white transition-transform duration-300 hover:-translate-y-0.5"
          style={{
            background: '#1a1a1a',
            padding: '0.5rem 1.1rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            boxShadow: '0 6px 18px rgba(15,23,42,0.12)',
          }}
        >
          Compare Packages Free
          <ArrowRight className="h-3.5 w-3.5" style={{ color: '#00AEEF' }} aria-hidden="true" />
        </a>

        {/* Main heading — one gradient word */}
        <h1
          className="mt-8 font-display"
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 3.75rem)',
            lineHeight: 1.06,
            letterSpacing: '-0.03em',
            fontWeight: 800,
            color: '#000000',
            margin: 0,
            textWrap: 'balance',
          }}
        >
          Most <span
            style={{
              background: 'linear-gradient(90deg, #0079c1 0%, #00AEEF 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >Trusted</span> AI Lead System
        </h1>

        {/* Sub-heading — grey, regular weight */}
        <p
          className="mt-6"
          style={{
            fontSize: 'clamp(1rem, 1.3vw, 1.15rem)',
            lineHeight: 1.7,
            fontWeight: 400,
            color: '#666666',
            maxWidth: '620px',
            margin: '1.5rem auto 0',
            textWrap: 'pretty',
          }}
        >
          ClientSurge installs the lead capture, instant response, booking, follow-up, review, and reactivation workflows your website needs to turn more visitors into real opportunities — without forcing a mandatory demo call first.
        </p>
      </div>
    </section>
  );
}