import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';

/**
 * HomeHero — text-first, left-aligned, restrained white-workspace hero.
 * Approved copy + layout. Opacity-only entrance. One faint grid + page gradient.
 */
export default function HomeHero() {
  const shouldReduceMotion = useReducedMotion();

  const fade = shouldReduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
      };
  const stagger = shouldReduceMotion
    ? { hidden: {}, show: {} }
    : { hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } };

  const primaryClick = () => {
    trackCTA('hero_get_my_lead_system', 'hero');
    window.location.href = '/store';
  };
  const secondaryClick = () => {
    trackCTA('hero_see_how_it_works', 'hero');
    window.location.href = '/how-it-works';
  };

  return (
    <section
      className="relative isolate overflow-hidden bg-transparent"
      aria-label="ClientSurge Systems AI lead systems hero"
    >
      {/* Exactly one faint static grid — fades before the bottom of the hero */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsla(215, 25%, 27%, 0.04) 1px, transparent 1px), linear-gradient(to bottom, hsla(215, 25%, 27%, 0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'linear-gradient(to bottom, #000 0%, transparent 70%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative z-10 mx-auto w-full"
        style={{
          maxWidth: '1200px',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
          paddingTop: 'calc(var(--cs-nav-height) + 32px)',
          paddingBottom: 'clamp(64px, 8vh, 96px)',
        }}
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <div style={{ maxWidth: '640px', textAlign: 'left' }}>
          {/* Badge */}
          <motion.div variants={fade}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(0, 71, 171, 0.08)',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                color: '#0047AB',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              AI Lead Systems for Local Service Businesses
            </span>
          </motion.div>

          {/* Headline — no forced break, natural wrap */}
          <motion.h1
            variants={fade}
            style={{
              marginTop: '16px',
              fontFamily: "'Manrope', 'Plus Jakarta Sans', 'Inter', sans-serif",
              fontSize: 'clamp(34px, 4vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              fontWeight: 800,
              color: '#050505',
              maxWidth: '640px',
              marginInline: 0,
            }}
          >
            Stop Losing Local Service Leads to Slow Follow-Up.
          </motion.h1>

          {/* Supporting paragraph */}
          <motion.p
            variants={fade}
            style={{
              marginTop: '20px',
              fontSize: 'clamp(16px, 1.2vw, 18px)',
              lineHeight: 1.6,
              color: '#3a3d47',
              maxWidth: '560px',
              fontWeight: 400,
            }}
          >
            ClientSurge installs the lead capture, instant response, and follow-up workflows your
            website needs to turn more visitors into booked appointments.
          </motion.p>

          {/* CTA row */}
          <motion.div
            variants={fade}
            className="flex flex-wrap items-center gap-3"
            style={{ marginTop: '28px' }}
          >
            <button
              type="button"
              onClick={primaryClick}
              className="cs-btn-primary cs-cta-glow inline-flex items-center gap-2"
              style={{ height: '48px', padding: '0 1.5rem', fontSize: '0.95rem' }}
            >
              Get My Lead System
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={secondaryClick}
              className="cs-btn-ghost inline-flex items-center gap-1.5"
              style={{ height: '48px', padding: '0 1.25rem', fontSize: '0.95rem' }}
            >
              See How It Works
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}