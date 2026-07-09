import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  PhoneCall,
  Settings,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { trackCTA } from '@/lib/analytics';

/**
 * HomeHero — lighter split-layout hero based on the visual donor app.
 *
 * Production rules:
 *   - Keep the existing buyer-path CTA targets and tracking names.
 *   - Keep ClientSurge's production homepage wording.
 *   - Device metrics are presented as a demo UI, not live proof.
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

const TRUST_BADGES = [
  'Clear packages',
  'Secure checkout path',
  'Setup handled for you',
];

const MINI_FEATURES = ['No demo gate', 'Package-first buyer path', 'Done-for-you setup'];

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

function AutomationPill({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/90 bg-sky-50/95 px-3 py-1.5 text-[11px] font-extrabold text-[#006BB0] shadow-[0_1px_0_rgba(255,255,255,0.9)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#00AEEF]" aria-hidden="true" />
      {label}
    </span>
  );
}

function TrustBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/70 bg-white/65 px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-[0_8px_24px_rgba(0,107,176,0.06)] backdrop-blur-sm">
      <CheckCircle2 className="h-3.5 w-3.5 text-[#00AEEF]" aria-hidden="true" />
      {label}
    </span>
  );
}

function AppIcon({ icon: Icon, label, className = '' }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-[8px] font-bold text-white/80">
      <div className={`flex h-8 w-8 items-center justify-center rounded-xl shadow-lg ${className}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <span className="max-w-[52px] truncate">{label}</span>
    </div>
  );
}

function HeroDeviceMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:max-w-[560px]" aria-label="ClientSurge automation dashboard preview">
      <div
        className="absolute -inset-10 rounded-[4rem] opacity-70 blur-3xl"
        style={{
          background:
            'radial-gradient(circle at 55% 18%, rgba(0,174,239,0.20), transparent 34%), radial-gradient(circle at 65% 75%, rgba(3,105,161,0.20), transparent 42%)',
        }}
        aria-hidden="true"
      />

      <div
        className="relative aspect-[7/8] rounded-[2.35rem] bg-[#1c2532] p-3 shadow-2xl"
        style={{
          boxShadow:
            '0 34px 70px rgba(2, 8, 23, 0.34), 0 14px 28px rgba(2, 8, 23, 0.22), inset 0 0 0 1px rgba(255,255,255,0.12)',
        }}
      >
        <div className="absolute -left-1 top-[76px] h-9 w-1 rounded-l-md bg-[#111827]" aria-hidden="true" />
        <div className="absolute -left-1 top-[128px] h-9 w-1 rounded-l-md bg-[#111827]" aria-hidden="true" />
        <div className="absolute -right-1 top-[98px] h-16 w-1 rounded-r-md bg-[#111827]" aria-hidden="true" />

        <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-[#071632]">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 74% 14%, rgba(0,174,239,0.20), transparent 23%), radial-gradient(circle at 8% 20%, rgba(0,119,193,0.38), transparent 30%), linear-gradient(180deg, #08204b 0%, #071836 48%, #041029 100%)',
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1px)', backgroundSize: '52px 52px' }} aria-hidden="true" />

          <div className="relative z-10 flex h-9 items-center justify-between px-5 text-[11px] font-bold text-white/90">
            <span>4:12 AM</span>
            <div className="absolute left-1/2 top-1.5 h-6 w-[92px] -translate-x-1/2 rounded-full bg-black/80 shadow-inner">
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900 ring-1 ring-slate-700" />
            </div>
            <span className="tracking-tight">71%</span>
          </div>

          <div className="relative z-10 flex h-[calc(100%-36px)] flex-col px-5 pb-5 pt-3">
            <div className="relative flex-1 rounded-b-[1.4rem] border-b border-white/10 pb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#00AEEF] shadow-[0_0_24px_rgba(0,174,239,0.22)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00AEEF]" aria-hidden="true" />
                ClientSurge
              </div>

              <div className="mt-4 max-w-[270px]">
                <h2 className="text-[clamp(1.45rem,3vw,2.25rem)] font-black leading-[0.98] tracking-[-0.06em] text-white">
                  AI-Powered Sales System
                </h2>
                <p className="mt-4 max-w-[255px] text-[11px] leading-5 text-slate-300">
                  Lead capture, instant response, booking, follow-up, reviews, and reactivation in one workflow.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5 text-[9px] font-bold text-white/80">
                <span className="rounded-full bg-white/9 px-2 py-1">Lead Capture</span>
                <span className="rounded-full bg-white/9 px-2 py-1">AI Follow-Up</span>
                <span className="rounded-full bg-white/9 px-2 py-1">Booking</span>
              </div>

              <a
                href="/#pricing"
                onClick={(event) => scrollToSection(event, 'pricing', '/pricing', 'hero_device_compare_packages_click')}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#00AEEF] px-5 text-[12px] font-black text-white shadow-[0_14px_34px_rgba(0,174,239,0.34)] transition-transform hover:-translate-y-0.5"
              >
                Compare Packages
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>

              <div className="absolute right-0 top-4 w-[250px] max-w-[50%] rounded-2xl border border-white/10 bg-[#202637]/95 p-4 shadow-[0_18px_44px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AEEF] text-white shadow-lg">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/45">ClientSurge · Demo</p>
                    <p className="mt-0.5 text-sm font-black leading-tight text-white">Lead response ready.</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 right-1 w-[190px] rounded-2xl border border-white/10 bg-[#253a5d]/90 p-4 shadow-[0_22px_54px_rgba(0,0,0,0.30)] backdrop-blur-md">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black text-white">Speed-to-Lead</p>
                    <p className="mt-1 text-[9px] font-semibold text-white/45">Demo workflow</p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[8px] font-black uppercase text-emerald-300">Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/10 p-2">
                    <p className="text-[8px] font-black uppercase text-white/45">Modules</p>
                    <p className="mt-1 text-xl font-black text-white">6</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-2">
                    <p className="text-[8px] font-black uppercase text-white/45">Coverage</p>
                    <p className="mt-1 text-xl font-black text-white">24/7</p>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-[9px] font-bold text-white">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00AEEF]" />Lead captured</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-[#00AEEF]" />Instant response queued</div>
                  <div className="flex items-center gap-2 text-white/45"><CheckCircle2 className="h-3 w-3 text-white/25" />Booking workflow ready</div>
                </div>
              </div>
            </div>

            <div className="relative flex h-[88px] items-end justify-center">
              <div className="absolute top-4 flex gap-4">
                {[0, 1, 2, 3].map((dot) => (
                  <span key={dot} className={`h-10 w-10 rounded-full ${dot === 2 ? 'bg-white' : 'bg-white/28'}`} aria-hidden="true" />
                ))}
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
                <AppIcon icon={MessageSquare} label="Messages" className="bg-emerald-400 text-white" />
                <AppIcon icon={CalendarDays} label="Calendar" className="bg-white text-red-500" />
                <AppIcon icon={Zap} label="ClientSurge" className="bg-[#00AEEF] text-white" />
                <AppIcon icon={Settings} label="Settings" className="bg-white/30 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
    <section
      className="relative isolate overflow-hidden"
      style={{ minHeight: 'calc(100svh - var(--cs-nav-height, 76px))' }}
      aria-label="ClientSurge Systems AI growth system hero"
    >
      <div
        className="absolute inset-0 -z-20"
        style={{
          backgroundColor: '#f8fdff',
          backgroundImage:
            'linear-gradient(rgba(0,174,239,0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(0,174,239,0.075) 1px, transparent 1px), radial-gradient(circle at 88% -8%, rgba(0,174,239,0.24), transparent 28%), radial-gradient(circle at 52% 42%, rgba(255,255,255,0.98), rgba(248,253,255,0.86) 58%, rgba(239,248,253,0.72) 100%)',
          backgroundSize: '40px 40px, 40px 40px, auto, auto',
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-44 bg-gradient-to-b from-transparent to-white" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-5 pb-16 pt-[calc(var(--cs-nav-height,76px)+3.25rem)] sm:px-8 lg:min-h-[calc(100svh-var(--cs-nav-height,76px))] lg:grid-cols-[minmax(0,0.92fr)_minmax(470px,1fr)] lg:gap-16 lg:px-10 lg:pb-20 lg:pt-[calc(var(--cs-nav-height,76px)+2.5rem)]">
        <div className="mx-auto max-w-[650px] text-center lg:mx-0 lg:text-left">
          <p className="sr-only">AI Growth System for Service Businesses</p>

          <h1 className="font-black leading-[0.98] tracking-[-0.065em] text-[#06122b]" style={{ fontSize: 'clamp(3.05rem, 5vw, 5.15rem)' }}>
            Turn your website into an{' '}
            <span className="text-[#00AEEF]">AI-powered sales system.</span>
          </h1>

          <p className="mt-7 max-w-[610px] text-[1rem] font-medium leading-8 text-slate-500 sm:text-lg lg:mx-0 lg:max-w-[590px]">
            ClientSurge installs the lead capture, instant response, booking, follow-up, review, and reactivation workflows your website needs to turn more visitors into real opportunities — without forcing a mandatory demo call first.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start">
            {AUTOMATION_PILLS.map((pill) => (
              <AutomationPill key={pill} label={pill} />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="/#pricing"
              onClick={scrollToPricing}
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-[#0095d9] px-7 text-base font-black text-white shadow-[0_16px_34px_rgba(0,149,217,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0087c6] hover:shadow-[0_20px_42px_rgba(0,149,217,0.34)] sm:w-auto"
              style={{ minWidth: 228 }}
            >
              Compare Packages
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>

            <a
              href="/how-it-works"
              onClick={scrollToSolution}
              className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-full border border-[#00AEEF]/55 bg-white/65 px-7 text-base font-black text-[#006BB0] shadow-[0_12px_30px_rgba(0,107,176,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-50 sm:w-auto"
              style={{ minWidth: 228 }}
            >
              See How It Works
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start">
            {TRUST_BADGES.map((badge) => (
              <TrustBadge key={badge} label={badge} />
            ))}
          </div>

          <div className="mt-8 hidden items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-slate-400 lg:flex">
            <span className="h-7 w-px bg-[#00AEEF]/45" aria-hidden="true" />
            Scroll
          </div>
        </div>

        <div className="relative lg:pl-2">
          <HeroDeviceMockup />

          <div className="pointer-events-none absolute -bottom-4 left-1/2 hidden -translate-x-1/2 flex-wrap justify-center gap-2 lg:flex">
            {MINI_FEATURES.map((feature) => (
              <span key={feature} className="rounded-full bg-slate-950/80 px-3 py-1 text-[9px] font-bold text-white/70 shadow-lg backdrop-blur-sm">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
