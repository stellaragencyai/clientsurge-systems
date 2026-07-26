import { ArrowRight } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';

/**
 * HomeHero — centered, screenshot-matched layout.
 * Token-driven: all colors, shadows, and radii derive from src/index.css.
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
      className="relative isolate overflow-hidden bg-background"
      style={{ minHeight: 'auto' }}
      aria-label="ClientSurge Systems AI growth system hero"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 50% 10%, hsla(199, 100%, 47%, 0.12), transparent 28%), linear-gradient(to right, hsla(215, 25%, 27%, 0.045) 1px, transparent 1px), linear-gradient(to bottom, hsla(215, 25%, 27%, 0.045) 1px, transparent 1px)',
          backgroundSize: 'auto, 48px 48px, 48px 48px',
          maskImage: 'radial-gradient(ellipse 78% 72% at 50% 38%, #000 48%, transparent 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 78% 72% at 50% 38%, #000 48%, transparent 90%)',
        }}
      />

      <div
        className="relative z-10 mx-auto flex max-w-[1080px] flex-col items-center px-5 text-center sm:px-8"
        style={{
          paddingTop: 'calc(var(--cs-nav-height, 76px) + 3.75rem)',
          paddingBottom: '4rem',
        }}
      >
        <div
          className="inline-flex items-center gap-2 rounded-full"
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
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: '0.55rem',
              height: '0.55rem',
              borderRadius: '999px',
              background: 'var(--cs-gradient)',
              boxShadow: '0 0 0 6px hsla(199, 100%, 47%, 0.14)',
            }}
          />
          Most Trusted AI Lead System
        </div>

        <h1
          className="mt-8 font-display"
          style={{
            fontSize: 'clamp(3.2rem, 7vw, 6.1rem)',
            lineHeight: 0.93,
            letterSpacing: '-0.05em',
            fontWeight: 800,
            color: 'hsl(var(--foreground))',
            margin: 0,
            textWrap: 'balance',
            maxWidth: '980px',
          }}
        >
          AI Lead Systems That Turn{' '}
          <span
            style={{
              background: 'var(--cs-gradient)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
            }}
          >
            More Calls
          </span>{' '}
          Into Revenue
        </h1>

        <p
          className="mt-6"
          style={{
            fontSize: 'clamp(1rem, 1.45vw, 1.18rem)',
            lineHeight: 1.72,
            fontWeight: 400,
            color: 'hsl(var(--muted-foreground))',
            maxWidth: '760px',
            margin: '1.5rem auto 0',
            textWrap: 'pretty',
          }}
        >
          ClientSurge installs the lead capture, instant response, booking, follow-up, review, and reactivation workflows your website needs to turn more visitors into real opportunities.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {['Website + CRM handoff', 'Six AI workflows', 'Built for local service teams'].map((item) => (
            <span
              key={item}
              style={{
                padding: '0.65rem 1rem',
                borderRadius: '999px',
                border: '1px solid hsl(var(--border))',
                background: 'hsla(0, 0%, 100%, 0.82)',
                color: 'hsl(var(--muted-foreground))',
                fontSize: '0.88rem',
                fontWeight: 600,
                boxShadow: 'var(--cs-glow-sm)',
              }}
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/#pricing"
            onClick={scrollToPricing}
            className="cs-btn-primary inline-flex items-center gap-2"
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
        </div>

        <div
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
            <span>ClientSurge System Preview</span>
            <span>Lead response in motion</span>
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
                Speed to lead
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
                    Lead conversion
                  </p>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)' }}>Live workflow snapshot</p>
                </div>
                <span style={{ color: '#4ade80', fontSize: '0.72rem', fontWeight: 800 }}>LIVE</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[['Leads', '24'], ['Booked', '18']].map(([label, value]) => (
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
                {['New lead', 'AI reply', 'Appointment booked'].map((label, index) => (
                  <div key={label} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      style={{
                        width: '0.75rem',
                        height: '0.75rem',
                        borderRadius: '999px',
                        background: index < 2 ? 'hsl(var(--primary))' : '#4ade80',
                      }}
                    />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}