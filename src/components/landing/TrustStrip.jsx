import { motion, useReducedMotion } from 'framer-motion';
import { Wrench, CalendarDays, Plug, ShieldCheck } from 'lucide-react';

/**
 * TrustStrip — compact horizontal trust band placed directly below the hero.
 * Four truthful ClientSurge points. Desktop = one row; mobile = clean 2x2.
 */
const POINTS = [
  { icon: Wrench, label: 'Done-for-you setup' },
  { icon: CalendarDays, label: 'Month-to-month' },
  { icon: Plug, label: 'Works with existing systems' },
  { icon: ShieldCheck, label: 'Tested before launch' },
];

export default function TrustStrip() {
  const reduce = useReducedMotion();
  const item = reduce
    ? {}
    : {
        hidden: { opacity: 0, y: 10 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
      };

  return (
    <section
      aria-label="Why ClientSurge"
      className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6"
      style={{ marginTop: 'clamp(28px, 4vw, 44px)' }}
    >
      <motion.div
        variants={reduce ? {} : { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        initial={reduce ? false : 'hidden'}
        whileInView={reduce ? undefined : 'show'}
        viewport={{ once: true, amount: 0.4 }}
        className="grid grid-cols-2 gap-3 rounded-2xl border border-[hsl(199,55%,90%)] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,71,171,0.05)] sm:grid-cols-4 sm:gap-4 sm:px-6"
      >
        {POINTS.map(({ icon: Icon, label }) => (
          <motion.div
            key={label}
            variants={item}
            className="flex items-center gap-2.5 justify-center sm:justify-start"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,71,171,0.06)] text-[#0047AB]">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="text-[13px] font-semibold leading-tight text-slate-700">{label}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}