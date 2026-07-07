import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { acquireBodyScrollLock } from '@/lib/bodyScrollLock';

/**
 * CSModal — Premium modal system with glass backdrop, smooth animations,
 * mobile full-screen mode, and keyboard accessibility.
 *
 * Features:
 *   - Glass backdrop with blur
 *   - Smooth entrance/close animation (framer-motion)
 *   - Mobile full-screen mode (below sm breakpoint)
 *   - Keyboard accessibility: ESC to close, focus trap
 *   - Body scroll lock when open
 *   - Portal-based rendering
 *
 * Props:
 *   isOpen       — boolean (controlled)
 *   onClose      — function (called on backdrop click, ESC, or close button)
 *   children     — modal content
 *   title        — string (optional, for aria-labelledby)
 *   maxWidth     — string (CSS, default '480px')
 *   showClose    — boolean (default true)
 *   className    — string
 *   labelledBy   — string (id of title element for aria)
 */
export default function CSModal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = '480px',
  showClose = true,
  className = '',
  labelledBy,
}) {
  const shouldReduceMotion = useReducedMotion();
  const modalRef = useRef(null);
  const previouslyFocused = useRef(null);

  // ── Body scroll lock ──
  useEffect(() => {
    if (!isOpen) return undefined;
    return acquireBodyScrollLock('cs-modal');
  }, [isOpen]);

  // ── Focus management ──
  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocused.current = document.activeElement;

    // Focus the modal container
    const timer = setTimeout(() => {
      modalRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      // Restore focus to previously focused element
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // ── ESC key to close ──
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true });
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    },
    [onClose]
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-label={title}
        >
          {/* Glass backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'rgba(2, 6, 23, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleBackdropClick}
          />

          {/* Modal panel */}
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            className={`relative cs-modal-panel ${className}`}
            style={{
              maxWidth,
              width: '100%',
              maxHeight: '95vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '1rem',
              boxShadow: '0 20px 60px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,174,239,0.06)',
              margin: '1rem',
            }}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close button */}
            {showClose && (
              <button
                onClick={onClose}
                type="button"
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
                aria-label="Close dialog"
                style={{ minHeight: 'unset', minWidth: 'unset', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            )}

            {children}

            {/* Mobile safe area bottom */}
            <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>

          {/* Mobile: full-screen override */}
          <style>{`
            @media (max-width: 640px) {
              .cs-modal-panel {
                border-radius: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                min-height: 100svh !important;
                max-height: 100svh !important;
              }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}