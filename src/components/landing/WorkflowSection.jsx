import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import {
  User,
  Bot,
  ClipboardCheck,
  CalendarCheck,
  PartyPopper,
  ArrowRight,
} from 'lucide-react';
import { trackCTA } from '@/lib/analytics';
import CSSectionHeader from '@/components/design-system/CSSectionHeader';
import CSButton from '@/components/design-system/CSButton';

/**
 * WorkflowSection — Interactive SaaS product demonstration.
 *
 * Shows the lead journey: Visitor → AI Response → Qualification → Booking → Customer
 * Steps activate sequentially as the user scrolls, creating a "product demo" feel.
 */

const FLOW_STEPS = [
  {
    icon: User,
    label: 'Visitor',
    title: 'A prospect lands on your website',
    description: 'They browse your services, have a question, or need to book — but it is after hours or your team is busy.',
    detail: 'Form submitted: "Need a quote for AC repair"',
    accent: '#00AEEF',
  },
  {
    icon: Bot,
    label: 'AI Response',
    title: 'ClientSurge responds in under 60 seconds',
    description: 'The AI instantly texts the lead back, acknowledging their inquiry and starting a conversation — 24/7, no human needed.',
    detail: 'SMS sent: "Hi! Thanks for reaching out. We have openings this week."',
    accent: '#0079c1',
  },
  {
    icon: ClipboardCheck,
    label: 'Qualification',
    title: 'AI qualifies the lead automatically',
    description: 'The system identifies the service type, urgency, and preferred timing — then routes the lead to the right next step.',
    detail: 'Qualified: HVAC repair · Urgent · Prefers Tuesday',
    accent: '#003B8F',
  },
  {
    icon: CalendarCheck,
    label: 'Booking',
    title: 'Appointment confirmed automatically',
    description: 'The lead receives a booking link, picks a time, and gets a confirmation — all without phone tag or manual scheduling.',
    detail: 'Booked: Tuesday 2:00 PM · Confirmation sent',
    accent: '#7c3aed',
  },
  {
    icon: PartyPopper,
    label: 'Customer',
    title: 'Lead becomes a paying customer',
    description: 'The prospect arrives for their appointment. The system sends a reminder, collects a review post-service, and adds them to your reactivation list.',
    detail: 'Customer acquired · Review requested · Nurture enrolled',
    accent: '#059669',
  },
];

export default function WorkflowSection() {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [activeStep, setActiveStep] = useState(0);

  // Auto-advance steps when in view
  useEffect(() => {
    if (!inView || shouldReduceMotion) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FLOW_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [inView, shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      id="workflow"
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 50%, #f8fbff 100%)' }}
    >
      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,59,143,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,59,143,1) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
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
            eyebrow="How It Works"
            title="From Visitor to Customer — Automatically"
            subtitle="Watch how ClientSurge transforms a website visitor into a booked, paying customer — with zero manual intervention."
            align="center"
          />
        </motion.div>

        {/* Desktop: horizontal flow with active step highlight */}
        {/* Mobile: vertical stack with active expansion */}
        <div className="relative">
          {/* Desktop flow bar */}
          <div className="hidden lg:block relative mb-8">
            <div
              className="absolute top-8 left-[8%] right-[8%] h-0.5 rounded-full"
              style={{ background: 'rgba(0,174,239,0.12)' }}
              aria-hidden="true"
            />
            <motion.div
              className="absolute top-8 left-[8%] h-0.5 rounded-full"
              style={{ background: 'linear-gradient(90deg, #00AEEF, #0079c1)' }}
              animate={{
                width: shouldReduceMotion
                  ? '84%'
                  : `${8 + (activeStep / (FLOW_STEPS.length - 1)) * 84}%`,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            />
            <div className="relative grid grid-cols-5 gap-2">
              {FLOW_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === activeStep;
                const isPast = idx < activeStep;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className="flex flex-col items-center group"
                    aria-label={`Step ${idx + 1}: ${step.label}`}
                  >
                    <motion.div
                      className="flex items-center justify-center w-16 h-16 rounded-2xl relative z-10 transition-all"
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        opacity: isActive || isPast ? 1 : 0.5,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{
                        background: isActive ? step.accent : '#ffffff',
                        border: `2px solid ${isActive ? step.accent : isPast ? step.accent + '60' : 'rgba(0,174,239,0.15)'}`,
                        boxShadow: isActive
                          ? `0 8px 28px ${step.accent}40`
                          : '0 2px 12px rgba(0,0,0,0.04)',
                      }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: isActive ? '#ffffff' : step.accent }}
                        aria-hidden="true"
                      />
                    </motion.div>
                    <span
                      className="mt-3 text-xs font-bold uppercase tracking-wider transition-colors"
                      style={{
                        color: isActive ? step.accent : '#9ca3af',
                      }}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active step detail card */}
          <motion.div
            key={activeStep}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-w-3xl mx-auto"
          >
            <div
              className="cs-glow-card p-6 md:p-8 relative overflow-hidden"
              style={{
                borderColor: `${FLOW_STEPS[activeStep].accent}30`,
              }}
            >
              {/* Accent glow */}
              <div
                className="absolute -top-20 -right-20 w-40 h-40 rounded-full pointer-events-none"
                style={{
                  background: `${FLOW_STEPS[activeStep].accent}10`,
                  filter: 'blur(40px)',
                }}
                aria-hidden="true"
              />

              <div className="relative flex items-start gap-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                  style={{
                    background: `${FLOW_STEPS[activeStep].accent}12`,
                    border: `1px solid ${FLOW_STEPS[activeStep].accent}30`,
                  }}
                >
                  {(() => {
                    const Icon = FLOW_STEPS[activeStep].icon;
                    return <Icon className="w-5 h-5" style={{ color: FLOW_STEPS[activeStep].accent }} aria-hidden="true" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                        color: FLOW_STEPS[activeStep].accent,
                      }}
                    >
                      Step {activeStep + 1} of {FLOW_STEPS.length}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#9ca3af',
                      }}
                    >
                      · {FLOW_STEPS[activeStep].label}
                    </span>
                  </div>
                  <h3
                    className="font-titles font-black text-black mb-2"
                    style={{ fontSize: 'clamp(1.05rem, 2vw, 1.3rem)', lineHeight: 1.25, letterSpacing: '-0.02em' }}
                  >
                    {FLOW_STEPS[activeStep].title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed mb-3"
                    style={{ color: '#3a3d47', fontSize: '0.9rem' }}
                  >
                    {FLOW_STEPS[activeStep].description}
                  </p>
                  {/* Detail badge — simulates system output */}
                  <div
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{
                      background: `${FLOW_STEPS[activeStep].accent}08`,
                      border: `1px solid ${FLOW_STEPS[activeStep].accent}18`,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 99,
                        background: FLOW_STEPS[activeStep].accent,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#1e293b',
                      }}
                    >
                      {FLOW_STEPS[activeStep].detail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile step selector */}
              <div className="flex lg:hidden items-center gap-1.5 mt-5 pt-4" style={{ borderTop: '1px solid rgba(0,174,239,0.08)' }}>
                {FLOW_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={{
                      background: idx === activeStep
                        ? FLOW_STEPS[activeStep].accent
                        : idx < activeStep
                          ? FLOW_STEPS[idx].accent + '40'
                          : 'rgba(0,174,239,0.12)',
                    }}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA below flow */}
          <div className="text-center mt-10">
            <CSButton
              to="/pricing"
              variant="primary"
              size="md"
              iconRight={ArrowRight}
              onClick={() => trackCTA('workflow_browse_systems', 'workflow_section')}
            >
              Get This System for Your Business
            </CSButton>
          </div>
        </div>
      </div>
    </section>
  );
}