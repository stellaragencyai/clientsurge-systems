import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

/**
 * FloatingConfirmation — a smooth, high-end toast that slides in from the
 * bottom-right after a form submission succeeds. Auto-dismisses after 6s.
 *
 * Usage:  <FloatingConfirmation show={submitted} message="We'll be in touch within one business day." />
 */
export default function FloatingConfirmation({
  show = false,
  title = 'Request Received',
  message = "We've received your submission and will respond within one business day.",
  duration = 6000,
  onDismiss,
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Tiny delay so the enter transition fires after mount
      const t = setTimeout(() => setVisible(true), 50);
      const auto = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onDismiss?.(), 400);
      }, duration);
      return () => { clearTimeout(t); clearTimeout(auto); };
    }
    setVisible(false);
  }, [show, duration, onDismiss]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9998] transition-all duration-400 ease-out"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(120%)',
        opacity: visible ? 1 : 0,
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-start gap-4 rounded-2xl border border-emerald-200/60 bg-white/95 px-5 py-4 shadow-[0_12px_48px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,174,239,0.04)] backdrop-blur-xl"
        style={{ maxWidth: '380px' }}
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="font-titles text-sm font-bold text-slate-950 tracking-tight">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => { setVisible(false); setTimeout(() => onDismiss?.(), 400); }}
          className="flex-shrink-0 text-slate-300 transition-colors hover:text-slate-500"
          aria-label="Dismiss"
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-slate-100" style={{ maxWidth: '380px' }}>
        <div
          className="h-full bg-emerald-400"
          style={{
            animation: visible ? `fcShrink ${duration}ms linear forwards` : 'none',
          }}
        />
      </div>
      <style>{`
        @keyframes fcShrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}