import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Clock, Phone } from 'lucide-react';
import CSButton from '@/components/design-system/CSButton';

/**
 * CSSuccessModal — Premium success experience with branding, next steps,
 * and expected response time.
 *
 * Used for:
 *   - Lead submitted
 *   - Audit requested
 *   - Booking complete
 *   - Signup complete
 *
 * Props:
 *   isOpen        — boolean
 *   onClose       — function
 *   title         — string (default "Success!")
 *   message       — string (confirmation message)
 *   responseTime  — string (e.g. "within 24 hours", "within 1 business day")
 *   primaryCTA    — { label, onClick, href, to, icon }
 *   secondaryCTA  — { label, onClick, href, to }
 *   nextSteps     — array of strings (optional checklist of what happens next)
 *   showConfetti  — boolean (optional visual celebration)
 *   contactPhone  — string (optional phone number for immediate contact)
 */
export default function CSSuccessModal({
  isOpen,
  onClose,
  title = 'Success!',
  message,
  responseTime = 'within 1 business day',
  primaryCTA,
  secondaryCTA,
  nextSteps = [],
  contactPhone,
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(2, 6, 23, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
          />

          {/* Success card */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full text-center overflow-hidden"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,174,239,0.08)' }}
          >
            {/* Top accent bar */}
            <div
              style={{
                height: '4px',
                background: 'linear-gradient(90deg, #0088CC 0%, #00AEEF 50%, #003B8F 100%)',
                boxShadow: '0 0 12px rgba(0,174,239,0.3)',
              }}
            />

            <div className="p-8 md:p-10">
              {/* Animated check icon */}
              <motion.div
                className="flex justify-center mb-6"
                initial={shouldReduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.15, type: 'spring', stiffness: 200 }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,174,239,0.12), rgba(0,136,204,0.08))',
                    border: '2px solid rgba(0,174,239,0.25)',
                    boxShadow: '0 0 24px rgba(0,174,239,0.2)',
                  }}
                >
                  <CheckCircle2 className="w-10 h-10" style={{ color: '#00AEEF' }} />
                </div>
              </motion.div>

              {/* ClientSurge branding */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0088CC, #003B8F)' }}
                >
                  <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, color: '#ffffff', fontSize: '0.625rem' }}>
                    CS
                  </span>
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  ClientSurge Systems
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: '#000000', fontFamily: "'Montserrat', sans-serif" }}
              >
                {title}
              </h3>

              {/* Message */}
              {message && (
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
                  {message}
                </p>
              )}

              {/* Response time badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{
                  background: 'rgba(0,174,239,0.08)',
                  border: '1px solid rgba(0,174,239,0.2)',
                }}
              >
                <Clock className="w-3.5 h-3.5" style={{ color: '#00AEEF' }} />
                <span className="text-xs font-semibold" style={{ color: '#006BB0' }}>
                  We'll reach out {responseTime}
                </span>
              </div>

              {/* Next steps checklist */}
              {nextSteps.length > 0 && (
                <div className="text-left mb-6 space-y-2">
                  {nextSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Contact phone */}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone.replace(/\D/g, '')}`}
                  className="flex items-center justify-center gap-2 mb-4 text-sm font-semibold transition-colors hover:text-[#00AEEF]"
                  style={{ color: '#475569' }}
                >
                  <Phone className="w-3.5 h-3.5" />
                  {contactPhone}
                </a>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-2">
                {primaryCTA && (
                  <CSButton
                    variant="primary"
                    size="lg"
                    onClick={primaryCTA.onClick}
                    href={primaryCTA.href}
                    to={primaryCTA.to}
                    iconRight={primaryCTA.icon || ArrowRight}
                    className="w-full"
                  >
                    {primaryCTA.label}
                  </CSButton>
                )}
                {secondaryCTA && (
                  <CSButton
                    variant="ghost"
                    size="md"
                    onClick={secondaryCTA.onClick || onClose}
                    href={secondaryCTA.href}
                    to={secondaryCTA.to}
                    className="w-full"
                  >
                    {secondaryCTA.label}
                  </CSButton>
                )}
                {!primaryCTA && !secondaryCTA && (
                  <CSButton variant="primary" size="lg" onClick={onClose} className="w-full">
                    Done
                  </CSButton>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}