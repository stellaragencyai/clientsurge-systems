import { motion, useReducedMotion } from 'framer-motion';
import {
  ShieldCheck,
  ClipboardCheck,
  Network,
  Eye,
  Lock,
  ServerCog,
  FileCheck,
  Workflow,
} from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';
import CSButton from '@/components/design-system/CSButton';

/**
 * TrustSection — Security, verification, architecture, and process transparency.
 *
 * No fake metrics or testimonials. Uses verifiable system properties:
 *   - Security: SSL encryption, secure Stripe checkout
 *   - Verification: Proof logs before launch, QA tested
 *   - Architecture: Integration stack (Twilio, Stripe, Resend)
 *   - Transparency: Month-to-month, no hidden fees, done-for-you
 */

const TRUST_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Security First',
    description: 'SSL-encrypted checkout via Stripe. Phone numbers and lead data protected through Twilio security infrastructure. No data stored in plain text.',
    points: [
      'SSL encrypted checkout',
      'Stripe-secured payments',
      'Twilio-protected SMS channels',
    ],
    accent: '#00AEEF',
  },
  {
    icon: ClipboardCheck,
    title: 'Automation Verification',
    description: 'No system goes live until the lead path, response flow, and booking handoff are tested and verified. Proof logs recorded before launch.',
    points: [
      'Lead path tested',
      'Response flow verified',
      'Proof logs recorded',
    ],
    accent: '#0079c1',
  },
  {
    icon: Network,
    title: 'System Architecture',
    description: 'Built on enterprise-grade infrastructure: Twilio for SMS and voice, Stripe for billing, Resend for email, and Base44 for automation orchestration.',
    points: [
      'Twilio voice & SMS',
      'Stripe billing',
      'Resend email delivery',
    ],
    accent: '#003B8F',
  },
  {
    icon: Eye,
    title: 'Process Transparency',
    description: 'Month-to-month billing with no long-term contracts. No hidden fees. Done-for-you setup included in every package. Cancel anytime.',
    points: [
      'Month-to-month billing',
      'No hidden fees',
      'Done-for-you setup included',
    ],
    accent: '#7c3aed',
  },
];

const ARCHITECTURE_BADGES = [
  { icon: Lock, label: 'SSL Encrypted' },
  { icon: ServerCog, label: 'Enterprise Infrastructure' },
  { icon: FileCheck, label: 'Proof Verified' },
  { icon: Workflow, label: 'Automated Workflows' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function TrustSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="trust"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: '#ffffff' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,174,239,0.03) 0%, transparent 60%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-14 md:mb-16"
        >
          <CSSectionHeader
            eyebrow="Trust & Verification"
            title="Built on Security. Verified Before Launch."
            subtitle="No fake metrics. No hidden fees. Just enterprise-grade infrastructure, tested automation, and a process you can verify."
            align="center"
          />
        </motion.div>

        {/* Trust pillars — four equal cards on one desktop row */}
        <motion.div
          variants={shouldReduceMotion ? {} : containerVariants}
          initial={shouldReduceMotion ? {} : 'hidden'}
          whileInView={shouldReduceMotion ? {} : 'visible'}
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch gap-5 xl:gap-4"
        >
          {TRUST_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                variants={shouldReduceMotion ? {} : itemVariants}
                className="cs-glow-card h-full min-h-[340px] xl:min-h-[370px] p-6 xl:p-5 relative overflow-hidden"
              >
                {/* Accent corner glow */}
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
                  style={{
                    background: `${pillar.accent}08`,
                    filter: 'blur(32px)',
                  }}
                  aria-hidden="true"
                />

                <div className="relative flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                    style={{
                      background: `${pillar.accent}12`,
                      border: `1px solid ${pillar.accent}30`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: pillar.accent }} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-titles font-black text-black mb-2"
                      style={{ fontSize: '1.05rem', letterSpacing: '-0.015em' }}
                    >
                      {pillar.title}
                    </h3>
                    <p
                      className="text-sm leading-relaxed mb-4"
                      style={{ color: '#3a3d47', fontSize: '0.85rem' }}
                    >
                      {pillar.description}
                    </p>
                    <ul className="space-y-1.5">
                      {pillar.points.map((point, pidx) => (
                        <li key={pidx} className="flex items-center gap-2">
                          <span
                            className="flex items-center justify-center w-4 h-4 rounded-full flex-shrink-0"
                            style={{ background: `${pillar.accent}15` }}
                          >
                            <svg
                              width="8"
                              height="8"
                              viewBox="0 0 8 8"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M1 4l2 2 4-4"
                                stroke={pillar.accent}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span
                            style={{
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: '#1e293b',
                            }}
                          >
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Architecture badges — inline strip */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 md:mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {ARCHITECTURE_BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl"
              style={{
                background: 'rgba(0,174,239,0.06)',
                border: '1px solid rgba(0,174,239,0.18)',
              }}
            >
              <Icon className="w-4 h-4" style={{ color: '#006BB0' }} aria-hidden="true" />
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#006BB0',
                }}
              >
                {label}
              </span>
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <CSButton
            to="/pricing"
            variant="primary"
            size="md"
            onClick={() => trackCTA('trust_view_pricing', 'trust_section')}
          >
            View Packages
          </CSButton>
        </motion.div>
      </div>
    </section>
  );
}
