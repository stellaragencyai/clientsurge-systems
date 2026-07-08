import { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { PhoneIncoming, MessageSquare, CalendarCheck, CheckCircle2 } from 'lucide-react';

/**
 * HeroProductDemo — simulated SaaS product demonstration for the homepage hero.
 *
 * Shows an example AI conversation flow:
 *   1. Lead submits a form / missed call notification
 *   2. AI response workflow starts
 *   3. Booking link is sent
 *   4. Appointment is confirmed
 *
 * This is intentionally labeled as a simulation. Do not present it as a live
 * dashboard or verified performance proof unless it is wired to production data.
 */

const STEPS = [
  {
    icon: PhoneIncoming,
    label: 'New Lead',
    text: 'Website form submitted — "Need AC repair this week"',
    time: 'Step 1',
    accent: '#00AEEF',
  },
  {
    icon: MessageSquare,
    label: 'AI Response',
    text: 'Hi! Thanks for reaching out. We have openings Tuesday and Thursday. Which works better for you?',
    time: 'Step 2',
    accent: '#0079c1',
  },
  {
    icon: CalendarCheck,
    label: 'Booking Sent',
    text: 'Great — here is the booking link for the next available appointment window.',
    time: 'Step 3',
    accent: '#003B8F',
  },
  {
    icon: CheckCircle2,
    label: 'Appointment Confirmed',
    text: 'Appointment confirmed for Tuesday at 2:00 PM. The customer receives an automated reminder before the visit.',
    time: 'Step 4',
    accent: '#059669',
  },
];

export default function HeroProductDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const stepsToShow = shouldReduceMotion ? STEPS : STEPS.slice(0, activeStep + 1);

  return (
    <div className="w-full max-w-2xl mx-auto" aria-label="Simulated AI system demonstration">
      <style>{`
        .cs-hero-demo-shell {
          position: relative;
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(20px) saturate(1.4);
          -webkit-backdrop-filter: blur(20px) saturate(1.4);
          border: 1px solid rgba(0, 174, 239, 0.18);
          box-shadow: 0 8px 40px rgba(0, 59, 143, 0.10), 0 0 0 1px rgba(255, 255, 255, 0.4);
          overflow: hidden;
        }
        .cs-hero-demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(0, 174, 239, 0.10);
          background: linear-gradient(90deg, rgba(0, 174, 239, 0.04), rgba(0, 59, 143, 0.02));
        }
        .cs-hero-demo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #059669;
          box-shadow: 0 0 8px rgba(5, 150, 105, 0.4);
          animation: csDemoPulse 2s ease-in-out infinite;
        }
        @keyframes csDemoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cs-hero-demo-dot { animation: none; }
        }
      `}</style>

      <div className="cs-hero-demo-shell">
        <div className="cs-hero-demo-header">
          <div className="flex items-center gap-2">
            <span className="cs-hero-demo-dot" aria-hidden="true" />
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#006BB0',
                letterSpacing: '0.02em',
              }}
            >
              ClientSurge AI Workflow Preview
            </span>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(0,174,239,0.2)' }} />
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(0,174,239,0.2)' }} />
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'rgba(0,174,239,0.2)' }} />
          </div>
        </div>

        <div className="p-4 md:p-5 space-y-3" style={{ minHeight: '260px' }} aria-live="polite">
          <AnimatePresence mode="popLayout">
            {stepsToShow.map((step, idx) => {
              const Icon = step.icon;
              const isLast = idx === stepsToShow.length - 1;
              return (
                <motion.div
                  key={idx}
                  layout={!shouldReduceMotion}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -16, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={shouldReduceMotion ? {} : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '0.625rem',
                      background: `${step.accent}12`,
                      border: `1px solid ${step.accent}30`,
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: step.accent }} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: step.accent,
                        }}
                      >
                        {step.label}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: '#9ca3af', fontWeight: 600 }}>
                        {step.time}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.8rem',
                        lineHeight: 1.5,
                        color: '#1e293b',
                        background: 'rgba(248, 250, 252, 0.8)',
                        borderRadius: '0 0.625rem 0.625rem 0.625rem',
                        padding: '8px 12px',
                        border: '1px solid rgba(0,174,239,0.06)',
                      }}
                    >
                      {step.text}
                    </p>
                  </div>
                  {isLast && !shouldReduceMotion && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      className="flex-shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: '#059669' }} aria-hidden="true" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!shouldReduceMotion && (
            <div className="flex items-center gap-1.5 pt-2" aria-hidden="true">
              {STEPS.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: 2,
                    borderRadius: 99,
                    background: idx <= activeStep ? '#00AEEF' : 'rgba(0,174,239,0.12)',
                    transition: 'background 0.4s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="px-4 md:px-5 py-3 flex items-center justify-between"
          style={{
            borderTop: '1px solid rgba(0,174,239,0.10)',
            background: 'linear-gradient(90deg, rgba(0,174,239,0.03), transparent)',
          }}
        >
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>
            Example automation sequence
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              color: '#075985',
              background: 'rgba(0,174,239,0.08)',
              padding: '3px 8px',
              borderRadius: 99,
            }}
          >
            SIMULATED FLOW
          </span>
        </div>
      </div>
    </div>
  );
}