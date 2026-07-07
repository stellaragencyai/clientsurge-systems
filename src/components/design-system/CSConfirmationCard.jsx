import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

/**
 * CSConfirmationCard — Inline success confirmation card.
 *
 * Used within form containers or page sections to show a success state
 * without a modal overlay. Includes ClientSurge branding, message,
 * and optional next steps.
 *
 * Props:
 *   title       — string (default "We'll Be In Touch")
 *   message     — string (confirmation message)
 *   responseTime — string (e.g. "within 1 business day")
 *   nextSteps   — array of strings
 *   className   — string
 */
export default function CSConfirmationCard({
  title = "We'll Be In Touch",
  message,
  responseTime = 'within 1 business day',
  nextSteps = [],
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`text-center py-10 px-6 ${className}`}>
      {/* Animated check icon */}
      <motion.div
        className="flex justify-center mb-6"
        initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(0,174,239,0.12), rgba(0,136,204,0.08))',
            border: '2px solid rgba(0,174,239,0.25)',
            boxShadow: '0 0 24px rgba(0,174,239,0.15)',
          }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: '#00AEEF' }} />
        </div>
      </motion.div>

      {/* ClientSurge branding */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0088CC, #003B8F)' }}
        >
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, color: '#ffffff', fontSize: '0.5rem' }}>
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
        <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm mx-auto">
          {message}
        </p>
      )}

      {/* Response time badge */}
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
        style={{
          background: 'rgba(0,174,239,0.08)',
          border: '1px solid rgba(0,174,239,0.2)',
        }}
      >
        <span className="text-xs font-semibold" style={{ color: '#006BB0' }}>
          Response expected {responseTime}
        </span>
      </div>

      {/* Next steps */}
      {nextSteps.length > 0 && (
        <div className="text-left max-w-xs mx-auto space-y-2">
          {nextSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}