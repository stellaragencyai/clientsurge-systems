import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, MousePointerClick, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';

const DEMO_MODES = {
  speed: {
    label: 'Speed to Lead',
    stats: [['Leads', '24'], ['Booked', '18']],
    steps: ['New lead', 'AI reply', 'Appointment booked'],
    panelTitle: 'Lead conversion',
    panelSub: 'Live workflow snapshot',
  },
  recovery: {
    label: 'Revenue Recovered',
    stats: [['Recovered', '12'], ['Reactivated', '7']],
    steps: ['Old lead', 'AI re-engage', 'Follow-up sent'],
    panelTitle: 'Lead recovery',
    panelSub: 'Reactivation snapshot',
  },
};

const FLOATING_METRICS = [
  { icon: Zap, label: 'Response time', value: '47s', tone: 'electric', position: 'top-left' },
  { icon: TrendingUp, label: 'Booking rate', value: '38%', tone: 'green', position: 'top-right' },
  { icon: Sparkles, label: 'Leads recovered', value: '1,240', tone: 'gold', position: 'bottom-left' },
];

/**
 * HomeHero — centered, cinematic, premium layout.
 * Token-driven: all colors, shadows, and radii derive from src/index.css.
 */
export default function HomeHero() {
  const [demoMode, setDemoMode] = useState('speed');
  const shouldReduceMotion = useReducedMotion();

  const mode = DEMO_MODES[demoMode];
  const fadeUp = shouldReduceMotion
    ? {}
    : { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };
  const stagger = shouldReduceMotion ? {} : { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };

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
      className="relative isolate overflow-hidden bg-background"
      style={{ minHeight: 'auto', containerType: 'inline-size' }}
      aria-label="ClientSurge Systems AI growth system hero"
    >
      {/* ── ENHANCEMENT 1: Animated ambient gradient orbs ── */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <motion.div
          className="absolute"
          style={{
            top: '-8%',
            left: '12%',
            width: '38rem',
            height: '38rem',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, hsla(199, 100%, 47%, 0.22), transparent 68%)',
            filter: 'blur(8px)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.12, 1],
            opacity: [0.7, 0.95, 0.7],
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute"
          style={{
            top: '20%',
            right: '8%',
            width: '32rem',
            height: '32rem',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, hsla(217, 90%, 45%, 0.18), transparent 68%)',
            filter: 'blur(10px)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.18, 1],
            opacity: [0.6, 0.9, 0.6],
            x: [0, -25, 0],
            y: [0, 15, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute"
          style={{
            bottom: '-10%',
            left: '40%',
            width: '34rem',
            height: '34rem',
            borderRadius: '9999px',
            background: 'radial-gradient(circle, hsla(199, 100%, 60%, 0.14), transparent 68%)',
            filter: 'blur(12px)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
            x: [0, 20, 0],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </motion.div>

      {/* ── Grid + mask overlay ── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(to right, hsla(215, 25%, 27%, 0.045) 1px, transparent 1px), linear-gradient(to bottom, hsla(215, 25%, 27%, 0.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 78% 72% at 50% 38%, #000 48%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 78% 72% at 50% 38%, #000 48%, transparent 90%)',
        }}
      />

      {/* ── ENHANCEMENT 2: Premium film-grain texture overlay ── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />

      <motion.div
        className="relative z-10 mx-auto flex max-w-[1080px] flex-col items-center px-5 text-center sm:px-8"
        style={{
          paddingTop: 'calc(var(--cs-nav-height, 76px) + clamp(14px, 4vh, 64px))',
          paddingBottom: 'clamp(80px, 10vh, 130px)',
        }}
      >
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full flex flex-col items-center">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full animate-fade-in-up"
            variants={fadeUp}
            style={{
              background: 'hsla(0, 0%, 100%, 0.9)',
              border: '1px solid hsl(var(--border))',
              padding: '0.55rem 1.1rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'hsl(var(--muted-foreground))',
              boxShadow: 'var(--cs-glow-sm)',
              animationDelay: '0.05s',
              backdropFilter: 'blur(8px)',
            }}
          >
            <motion.span
              aria-hidden="true"
              animate={shouldReduceMotion ? {} : { scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: '0.55rem',
                height: '0.55rem',
                borderRadius: '999px',
                background: 'var(--cs-gradient)',
                boxShadow: '0 0 0 6px hsla(199, 100%, 47%, 0.14)',
              }}
            />
            Most Trusted AI Lead System
          </motion.div>

          {/* ── Premium enterprise headline — Manrope ExtraBold, two balanced lines ── */}
          <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <motion.h1 variants={fadeUp} className="cs-hero-headline">
              AI Lead Systems That Turn
              <span className="cs-hero-break" />
              <span className="cs-hero-accent">More Calls</span>{' '}
              Into Revenue
            </motion.h1>
          </div>

          <motion.p
            className="animate-fade-in-up"
            variants={fadeUp}
            style={{
              fontSize: 'clamp(18px, 1.4vw, 23px)',
              animationDelay: '0.25s',
              lineHeight: 1.35,
              fontWeight: 400,
              color: '#606060',
              maxWidth: '760px',
              margin: '36px auto 0',
              textAlign: 'center',
              textWrap: 'pretty',
            }}
          >
            ClientSurge installs the lead capture, instant response, booking, follow-up, review, and reactivation workflows your website needs to turn more visitors into real opportunities.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {['Website + CRM handoff', 'Six AI workflows', 'Built for local service teams'].map((item) => (
              <span
                key={item}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '999px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsla(0, 0%, 100%, 0.82)',
                  backdropFilter: 'blur(10px)',
                  color: 'hsl(var(--muted-foreground))',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  boxShadow: 'var(--cs-glow-sm)',
                }}
              >
                {item}
              </span>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/#pricing"
              onClick={scrollToPricing}
              className="cs-btn-primary cs-cta-glow inline-flex items-center gap-2"
              style={{
                padding: '0.95rem 1.5rem',
                fontSize: '0.98rem',
              }}
            >
              Compare Packages Free
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <a
              href="/automations"
              className="cs-btn-outline inline-flex items-center gap-2"
              style={{
                padding: '0.95rem 1.5rem',
                fontSize: '0.98rem',
              }}
            >
              See Automations
            </a>
          </motion.div>

          {/* ── ENHANCEMENT 4: Glassmorphic floating metric chips with parallax ── */}
          <motion.div
            variants={fadeUp}
            className="mt-12 grid w-full max-w-[640px] grid-cols-3 gap-3 sm:gap-4"
            aria-hidden="false"
          >
            {FLOATING_METRICS.map((metric, index) => {
              const Icon = metric.icon;
              const toneStyles = {
                electric: { color: '#00AEEF', bg: 'hsla(199, 100%, 47%, 0.1)', border: 'hsla(199, 100%, 47%, 0.25)' },
                green: { color: '#059669', bg: 'hsla(160, 84%, 39%, 0.1)', border: 'hsla(160, 84%, 39%, 0.25)' },
                gold: { color: '#D4AF37', bg: 'hsla(43, 60%, 46%, 0.1)', border: 'hsla(43, 60%, 46%, 0.25)' },
              }[metric.tone];
              return (
                <motion.div
                  key={metric.label}
                  initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: [0, -6, 0] }}
                  transition={{
                    opacity: { duration: 0.6, delay: 0.4 + index * 0.12 },
                    y: { duration: 4 + index, repeat: Infinity, ease: 'easeInOut', delay: index * 0.5 },
                  }}
                  className="flex flex-col items-center gap-1 rounded-2xl px-3 py-3 text-center"
                  style={{
                    background: 'hsla(0, 0%, 100%, 0.72)',
                    backdropFilter: 'blur(16px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(16px) saturate(1.5)',
                    border: '1px solid hsla(199, 100%, 47%, 0.12)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full"
                    style={{ background: toneStyles.bg, color: toneStyles.color, border: `1px solid ${toneStyles.border}` }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-display text-xl font-black tracking-[-0.03em] text-slate-900 sm:text-2xl">
                    {metric.value}
                  </span>
                  <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                    {metric.label}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Preview card */}
          <motion.div
            variants={fadeUp}
            className="mt-10 w-full max-w-[900px] overflow-hidden"
            style={{
              borderRadius: 'var(--radius)',
              background: 'linear-gradient(150deg, #0d1f3c 0%, #0a2a5e 24%, #071535 58%, #061028 100%)',
              border: '1px solid hsla(0, 0%, 100%, 0.08)',
              boxShadow: 'var(--cs-glow-lg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.15rem',
                background: 'rgba(0,0,0,0.25)',
                color: 'rgba(255,255,255,0.78)',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              <span className="flex items-center gap-2">
                <motion.span
                  aria-hidden="true"
                  animate={shouldReduceMotion ? {} : { opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                  style={{ width: 8, height: 8, borderRadius: 999, background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}
                />
                ClientSurge System Preview
              </span>
              <div className="flex items-center gap-1.5">
                {Object.entries(DEMO_MODES).map(([key, m]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDemoMode(key)}
                    style={{
                      padding: '0.3rem 0.7rem',
                      borderRadius: '999px',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: demoMode === key ? 'rgba(125,211,252,0.6)' : 'rgba(255,255,255,0.16)',
                      background: demoMode === key ? 'hsla(199, 100%, 47%, 0.22)' : 'transparent',
                      color: demoMode === key ? '#7dd3fc' : 'rgba(255,255,255,0.6)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.4fr_0.8fr] md:px-7 md:py-7">
              <div className="text-left">
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: '999px',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: '#7dd3fc',
                    background: 'hsla(199, 100%, 47%, 0.16)',
                    border: '1px solid hsla(199, 100%, 47%, 0.3)',
                    textTransform: 'uppercase',
                  }}
                >
                  {mode.label}
                </div>
                <h2
                  className="font-display"
                  style={{
                    margin: '1rem 0 0',
                    color: '#ffffff',
                    fontSize: 'clamp(1.9rem, 3vw, 3rem)',
                    lineHeight: 1.02,
                    letterSpacing: '-0.04em',
                    fontWeight: 800,
                  }}
                >
                  Follow-up visible from first contact to booked appointment.
                </h2>
                <p
                  style={{
                    margin: '1rem 0 0',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.98rem',
                    lineHeight: 1.7,
                    maxWidth: '32rem',
                  }}
                >
                  Recovery, nurture, booking, and reactivation working together inside one system instead of scattered tools.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Lead captured', 'SMS sent', 'Booking link shared'].map((item) => (
                    <span
                      key={item}
                      style={{
                        borderRadius: '999px',
                        padding: '0.5rem 0.8rem',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.82)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 'var(--radius)',
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#ffffff',
                  textAlign: 'left',
                  boxShadow: 'var(--cs-glow-md)',
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {mode.panelTitle}
                    </p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)' }}>{mode.panelSub}</p>
                  </div>
                  <span style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 800 }}>LIVE</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {mode.stats.map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        borderRadius: 'var(--radius)',
                        background: 'rgba(255,255,255,0.08)',
                        padding: '0.9rem',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.62)', fontWeight: 700 }}>{label}</p>
                      <p style={{ margin: '0.4rem 0 0', fontSize: '2rem', lineHeight: 1, fontWeight: 800 }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {mode.steps.map((label, index) => (
                    <motion.div
                      key={label}
                      className="flex items-center gap-3"
                      animate={shouldReduceMotion ? {} : { opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.4, ease: 'easeInOut' }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: '0.75rem',
                          height: '0.75rem',
                          borderRadius: '999px',
                          background: index < 2 ? 'hsl(var(--primary))' : '#4ade80',
                          boxShadow: index < 2 ? '0 0 8px hsla(199, 100%, 47%, 0.5)' : '0 0 8px rgba(74, 222, 128, 0.5)',
                        }}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)' }}>{label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── ENHANCEMENT 5: Premium animated scroll indicator ── */}
        <motion.div
          aria-hidden="true"
          initial={shouldReduceMotion ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-14 flex flex-col items-center gap-2"
        >
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-slate-400">
            Explore the system
          </span>
          <motion.div
            className="flex h-9 w-5 justify-center rounded-full border border-slate-300 pt-1.5"
            style={{ background: 'hsla(0, 0%, 100%, 0.5)', backdropFilter: 'blur(8px)' }}
          >
            <motion.span
              animate={shouldReduceMotion ? {} : { y: [0, 10, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 3, height: 8, borderRadius: 999, background: 'hsl(var(--primary))' }}
            />
          </motion.div>
          <MousePointerClick className="h-3 w-3 text-slate-400" aria-hidden="true" />
        </motion.div>
      </motion.div>


    </section>
  );
}