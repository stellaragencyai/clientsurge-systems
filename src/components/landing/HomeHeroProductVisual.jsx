import { motion, useReducedMotion } from 'framer-motion';
import {
  Zap,
  MessageSquare,
  PhoneMissed,
  CalendarClock,
  CalendarCheck,
  LayoutDashboard,
} from 'lucide-react';

/**
 * HomeHeroProductVisual — right-column product preview for the homepage hero.
 *
 * Renders a layered ClientSurge lead-system interface panel showing the real
 * automation pipeline (capture → response → missed-call recovery → follow-up →
 * booking → dashboard). Uses only interface status labels — no fake revenue,
 * customers, testimonials, or unsupported metrics.
 *
 * Motion is restrained (opacity + small vertical move), staggered, and disabled
 * entirely under prefers-reduced-motion.
 */
const PIPELINE = [
  {
    key: 'capture',
    label: 'New lead captured',
    sub: 'Website form · service request',
    icon: Zap,
    status: 'Live',
  },
  {
    key: 'response',
    label: 'Instant response sent',
    sub: 'Automated reply · seconds',
    icon: MessageSquare,
    status: 'Sent',
  },
  {
    key: 'missedcall',
    label: 'Missed-call recovery',
    sub: 'Text-back queued',
    icon: PhoneMissed,
    status: 'Active',
  },
  {
    key: 'followup',
    label: 'Follow-up scheduled',
    sub: '14-day nurture enrolled',
    icon: CalendarClock,
    status: 'Scheduled',
  },
  {
    key: 'booking',
    label: 'Booking handoff confirmed',
    sub: 'Calendar · upcoming slot',
    icon: CalendarCheck,
    status: 'Confirmed',
  },
];

export default function HomeHeroProductVisual() {
  const reduce = useReducedMotion();

  const container = reduce
    ? {}
    : {
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      };
  const item = reduce
    ? {}
    : {
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
        },
      };

  return (
    <div className="relative w-full" aria-hidden="true">
      {/* Soft ambient backdrop — single restrained radial, no glow overload */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem]"
        style={{
          background:
            'radial-gradient(60% 60% at 70% 20%, rgba(0,212,255,0.10), transparent 70%)',
        }}
      />

      {/* Main app panel */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto w-full max-w-[460px] rounded-2xl border border-[hsl(199,55%,90%)] bg-white shadow-[0_2px_8px_rgba(0,71,171,0.06),0_18px_44px_rgba(15,23,42,0.08)] overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-[hsl(199,55%,92%)] px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#e2e8f0]" />
          <span className="ml-2 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500">
            <LayoutDashboard className="h-3.5 w-3.5" />
            ClientSurge · Lead System
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700 ring-1 ring-green-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            Live
          </span>
        </div>

        {/* Pipeline rows with left connector */}
        <div className="relative px-5 py-5">
          {/* vertical connector */}
          <span
            className="pointer-events-none absolute left-[34px] top-6 bottom-6 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(0,71,171,0.18), rgba(0,212,255,0.10))' }}
          />
          <ul className="space-y-3.5">
            {PIPELINE.map(({ key, label, sub, icon: Icon, status }) => (
              <motion.li key={key} variants={item} className="relative flex items-start gap-3.5">
                <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[hsl(199,55%,88%)] bg-white text-[#0047AB] shadow-[0_1px_2px_rgba(0,71,171,0.08)]">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[13.5px] font-semibold leading-tight text-slate-900">{label}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-slate-500">{sub}</p>
                </div>
                <span className="mt-0.5 shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200">
                  {status}
                </span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Footer status bar */}
        <div className="flex items-center justify-between border-t border-[hsl(199,55%,92%)] bg-slate-50/70 px-5 py-3">
          <span className="text-[11px] font-medium text-slate-500">Dashboard status updated</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            Verified
          </span>
        </div>
      </motion.div>

      {/* Floating accent card (lg+ only) */}
      <motion.div
        variants={reduce ? {} : item}
        initial={reduce ? false : 'hidden'}
        animate={reduce ? undefined : 'show'}
        className="absolute -right-3 -top-4 hidden rounded-xl border border-[hsl(199,55%,88%)] bg-white px-3.5 py-2.5 shadow-[0_6px_20px_rgba(15,23,42,0.08)] lg:block"
        style={{ maxWidth: 200 }}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#0088CC]">Recovery active</p>
        <p className="mt-0.5 text-[12px] font-semibold text-slate-700">Missed-call → text-back</p>
      </motion.div>
    </div>
  );
}