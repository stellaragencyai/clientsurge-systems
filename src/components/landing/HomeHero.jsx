import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import HomeHeroProductVisual from './HomeHeroProductVisual.jsx';

/**
 * HomeHero — premium two-column hero.
 * Left: eyebrow, headline, supporting copy, two CTAs, microcopy.
 * Right: layered ClientSurge lead-system product preview.
 * Opacity/vertical-move motion only; respects reduced-motion.
 */
export default function HomeHero() {
  const reduce = useReducedMotion();

  const fade = reduce
    ? {}
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
      };
  const stagger = reduce
    ? {}
    : { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

  const primaryClick = () => {
    trackCTA('hero_get_my_lead_system', 'hero');
    window.location.href = '/pricing';
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
      {/* Single faint static grid — fades before the hero bottom */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsla(215, 25%, 27%, 0.035) 1px, transparent 1px), linear-gradient(to bottom, hsla(215, 25%, 27%, 0.035) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'linear-gradient(to bottom, #000 0%, transparent 72%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, transparent 72%)',
        }}
      />

      <div
        className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6"
        style={{ paddingTop: 'calc(var(--cs-nav-height) + 36px)', paddingBottom: 'clamp(40px, 6vh, 64px)' }}
      >
        <motion.div
          className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12"
          initial={reduce ? false : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
        >
          {/* LEFT — content */}
          <div className="max-w-[600px] text-left">
            <motion.span
              variants={fade}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(0,212,255,0.28)] bg-[rgba(0,71,171,0.06)] px-3.5 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#0047AB]"
              style={{ lineHeight: 1 }}
            >
              AI Lead Systems for Local Service Businesses
            </motion.span>

            <motion.h1
              variants={fade}
              className="mt-5 font-bold text-[#050505]"
              style={{
                fontFamily: "'Manrope', 'Plus Jakarta Sans', 'Inter', sans-serif",
                fontSize: 'clamp(34px, 4vw, 54px)',
                lineHeight: 1.06,
                letterSpacing: '-0.04em',
                maxWidth: '560px',
              }}
            >
              Stop Losing Local Service Leads to Slow Follow-Up.
            </motion.h1>

            <motion.p
              variants={fade}
              className="mt-5 text-[#3a3d47]"
              style={{
                fontSize: 'clamp(16px, 1.15vw, 18px)',
                lineHeight: 1.62,
                maxWidth: '520px',
                fontWeight: 400,
              }}
            >
              ClientSurge installs the lead capture, instant response, and follow-up
              workflows your website needs to turn more visitors into booked appointments.
            </motion.p>

            <motion.div
              variants={fade}
              className="mt-7 flex flex-wrap items-center gap-3"
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

            <motion.p
              variants={fade}
              className="mt-4 text-[12.5px] font-medium text-slate-400"
            >
              Done-for-you installation · Month-to-month · Tested before launch
            </motion.p>
          </div>

          {/* RIGHT — product preview */}
          <motion.div variants={fade} className="relative">
            <HomeHeroProductVisual />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
