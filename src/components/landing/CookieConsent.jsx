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

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = safeGetCookieConsent();
    if (!consent) setVisible(true);
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
    <div className="fixed left-6 z-50 max-w-sm" style={{ bottom: "max(80px, calc(80px + env(safe-area-inset-bottom, 0px)))" }} aria-live="polite" role="dialog" aria-label="Cookie preferences">
      <div 
        className="rounded-2xl shadow-lg border backdrop-blur-md p-5 space-y-4"
        style={{
          background: 'rgba(255,255,255,0.95)',
          borderColor: 'rgba(0,0,0,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)'
        }}
      >
        {/* Header with close */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-sm text-foreground">Cookie Preferences</h3>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          We use cookies to enhance your experience and analyze site traffic. By continuing to use this site, you agree to our{' '}
          <a 
            href="/privacy-policy"
            className="font-medium text-primary hover:text-primary/80 transition-colors"
          >
            privacy policy
          </a>
          .
        </p>
        <div className="rounded-xl bg-background/70 border border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground mb-2">Cookie categories</p>
          <div className="space-y-1 text-[11px] text-muted-foreground">
            <p><span className="font-semibold text-foreground">Essential:</span> keeps forms and navigation working properly.</p>
            <p><span className="font-semibold text-foreground">Analytics:</span> helps us understand which pages and CTAs are performing.</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-4 py-2 text-xs font-medium text-white rounded-lg transition-all"
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
