import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { updateGa4Consent } from '@/lib/ga4';

function safeGetCookieConsent() {
  try {
    return window.localStorage.getItem('cookie-consent');
  } catch {
    return null;
  }
}

function safeSetCookieConsent(value) {
  try {
    window.localStorage.setItem('cookie-consent', value);
  } catch {
    // Ignore storage failures in embedded preview environments.
  }
}

function isBase44EditorPreview() {
  const hostname = window.location.hostname;
  return hostname.startsWith('preview-sandbox--') || hostname.endsWith('.modal.host');
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [offsetForMobileCallBar, setOffsetForMobileCallBar] = useState(false);

  useEffect(() => {
    if (isBase44EditorPreview()) return;

    const consent = safeGetCookieConsent();
    if (!consent) setVisible(true);
  }, []);

  useEffect(() => {
    const updateOffset = () => {
      const hasMobileCallBar = Boolean(document.querySelector('[data-mobile-call-bar]'));
      const isMobile = window.matchMedia?.('(max-width: 767px)').matches ?? false;
      setOffsetForMobileCallBar(hasMobileCallBar && isMobile);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, []);

  const handleAccept = () => {
    safeSetCookieConsent('accepted');
    setVisible(false);
    updateGa4Consent(true);
  };

  const handleDecline = () => {
    safeSetCookieConsent('declined');
    setVisible(false);
    updateGa4Consent(false);
  };

  const handleDismiss = () => {
    safeSetCookieConsent('dismissed');
    setVisible(false);
    updateGa4Consent(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed left-3 right-auto z-50 max-w-[300px] md:left-5 md:max-w-[280px]"
      style={{
        bottom: offsetForMobileCallBar
          ? "max(88px, calc(88px + env(safe-area-inset-bottom, 0px)))"
          : "max(16px, calc(16px + env(safe-area-inset-bottom, 0px)))",
      }}
      aria-live="polite"
      role="dialog"
      aria-label="Cookie preferences"
    >
      <div 
        className="rounded-lg shadow-lg border backdrop-blur-md p-2.5 space-y-2 md:p-3"
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderColor: 'rgba(0,0,0,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
        }}
      >
        {/* Header with close */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-[11px] text-foreground md:text-xs">Cookie Preferences</h3>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-[10px] text-muted-foreground leading-relaxed md:text-[11px]">
          We use cookies to improve the site and measure traffic. By continuing, you agree to our{' '}
          <a 
            href="/privacy-policy"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            privacy policy
          </a>
          .
        </p>
        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={handleDecline}
            className="flex-1 px-3 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors md:text-[11px]"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-3 py-1.5 text-[10px] font-medium text-white rounded-md transition-all md:text-[11px]"
            style={{
              background: 'linear-gradient(135deg,#0088cc 0%,#00aaff 100%)',
              boxShadow: '0 4px 12px rgba(0,170,255,0.25)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,170,255,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,170,255,0.25)';
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
