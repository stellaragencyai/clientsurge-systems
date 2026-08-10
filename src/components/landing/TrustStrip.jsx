import { motion, useReducedMotion } from 'framer-motion';
import { Lock, ShieldCheck, FileCheck, Database } from 'lucide-react';

const INTEGRATIONS = [
  'Stripe',
  'Twilio',
  'Resend',
  'OpenAI',
  'Google Analytics',
];

const SECURITY = [
  { icon: Lock, label: 'SSL Encrypted' },
  { icon: ShieldCheck, label: 'TCPA Compliant' },
  { icon: FileCheck, label: 'GDPR Ready' },
  { icon: Database, label: 'SOC 2 Aligned' },
];

export default function TrustStrip() {
  const reduce = useReducedMotion();
  const item = reduce
    ? {}
    : {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
      };

  return (
    <section
      aria-label="Integrations and security standards"
      className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6"
      style={{ marginTop: 'clamp(28px, 4vw, 44px)' }}
    >
      <motion.div
        variants={reduce ? {} : { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        initial={reduce ? false : 'hidden'}
        whileInView={reduce ? undefined : 'show'}
        viewport={{ once: true, amount: 0.4 }}
        className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:flex-row sm:justify-between"
      >
        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Integrations
          </span>
          {INTEGRATIONS.map((name) => (
            <span
              key={name}
              className="text-sm font-bold text-slate-500 transition-all duration-300 hover:text-slate-700"
              style={{ letterSpacing: '-0.01em' }}
            >
              {name}
            </span>
          ))}
        </motion.div>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {SECURITY.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />
              {label}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}