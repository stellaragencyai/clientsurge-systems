import { motion, useReducedMotion } from 'framer-motion';
import { Zap, MessageSquare, Calendar, RefreshCw, TrendingUp, ArrowRight } from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';
import CSButton from '@/components/design-system/CSButton';

const STEPS = [
  {
    icon: Zap,
    step: '01',
    title: 'Capture',
    description: 'Every form submission, phone call, ad click, and website inquiry flows into one trackable pipeline — so no lead slips through the cracks.',
    metric: 'All sources',
    metricLabel: 'unified',
  },
  {
    icon: MessageSquare,
    step: '02',
    title: 'Respond',
    description: 'AI replies via SMS in under 60 seconds, 24/7. Missed calls trigger instant text-back. Your leads never wait for a human to be available.',
    metric: '< 60 sec',
    metricLabel: 'response',
  },
  {
    icon: Calendar,
    step: '03',
    title: 'Book',
    description: 'Interested prospects receive a booking link and confirm their appointment automatically — no manual back-and-forth, no phone tag.',
    metric: '24/7',
    metricLabel: 'booking',
  },
  {
    icon: RefreshCw,
    step: '04',
    title: 'Follow Up',
    description: 'A 14-day nurture sequence keeps unresponsive leads warm with automated SMS and email touchpoints until they reply, book, or opt out.',
    metric: '14-day',
    metricLabel: 'nurture',
  },
  {
    icon: TrendingUp,
    step: '05',
    title: 'Optimize',
    description: 'Reactivation engines bring dormant leads back. Review requests go out at the right moment. The system compounds revenue over time.',
    metric: '30-90 days',
    metricLabel: 'reactivation',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function SolutionSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="solution" className="relative py-20 md:py-28 overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Subtle gradient backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,174,239,0.04) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-14 md:mb-16"
        >
          <CSSectionHeader
            eyebrow="The ClientSurge AI Growth System"
            title="One System. Five Steps. Every Lead Protected."
            subtitle="ClientSurge turns your website into an automated sales engine — capturing leads, responding instantly, booking appointments, following up automatically, and reactivating dormant prospects."
            align="center"
          />
        </motion.div>

        {/* Horizontal step flow (desktop) / vertical (mobile) */}
        <motion.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : 'hidden'}
          whileInView={shouldReduceMotion ? {} : 'visible'}
          viewport={{ once: true, margin: '-80px' }}
          className="relative"
        >
          {/* Connecting line — desktop only */}
          <div
            className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,174,239,0.25), rgba(0,174,239,0.25), transparent)',
            }}
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-4">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.step} variants={shouldReduceMotion ? {} : itemVariants} className="relative">
                  {/* Step number badge */}
                  <div className="flex items-center justify-center mb-4 relative">
                    <div
                      className="flex items-center justify-center w-16 h-16 rounded-2xl relative z-10"
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid rgba(0,174,239,0.2)',
                        boxShadow: '0 4px 16px rgba(0,174,239,0.08)',
                      }}
                    >
                      <Icon className="w-6 h-6" style={{ color: '#00AEEF' }} aria-hidden="true" />
                    </div>
                    {/* Step number overlay */}
                    <span
                      className="absolute -top-1 -right-1 z-20 flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black"
                      style={{
                        background: 'linear-gradient(135deg, #0079c1, #00AEEF)',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0,174,239,0.3)',
                      }}
                    >
                      {step.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="text-center">
                    <h3
                      className="font-titles font-black text-black mb-2"
                      style={{ fontSize: '1.1rem', letterSpacing: '-0.015em' }}
                    >
                      {step.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-3"
                      style={{ color: '#3a3d47', fontSize: '0.85rem' }}
                    >
                      {step.description}
                    </p>
                    {/* Metric */}
                    <div className="inline-flex flex-col items-center">
                      <span
                        className="font-titles font-black"
                        style={{ fontSize: '1.1rem', color: '#006BB0', lineHeight: 1 }}
                      >
                        {step.metric}
                      </span>
                      <span
                        className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                        style={{ color: '#9ca3af' }}
                      >
                        {step.metricLabel}
                      </span>
                    </div>
                  </div>

                  {/* Arrow connector — mobile only (between items) */}
                  {idx < STEPS.length - 1 && (
                    <div className="flex justify-center mt-5 lg:hidden">
                      <ArrowRight
                        className="w-4 h-4 rotate-90"
                        style={{ color: 'rgba(0,174,239,0.3)' }}
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12"
        >
          <CSButton
            to="/store"
            variant="primary"
            size="md"
            iconRight={ArrowRight}
            onClick={() => trackCTA('solution_browse_systems', 'solution_section')}
          >
            Browse AI Systems
          </CSButton>
        </motion.div>
      </div>
    </section>
  );
}