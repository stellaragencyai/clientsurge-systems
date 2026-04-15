import { useEffect, useState } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t border-white/10 px-6 py-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <p className="text-sm text-white/90">
          We use cookies to enhance your experience. By using this site, you agree to our{' '}
          <a href="/privacy-policy" className="text-amber-400 hover:text-amber-300 transition-colors underline">
            privacy policy
          </a>
          .
        </p>
        <button
          onClick={handleAccept}
          style={{
            display: 'inline-block',
            borderRadius: '9999px',
            padding: '2px',
            background: 'linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '40px',
              padding: '0 24px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)',
              color: '#f5e6d0',
              fontWeight: '700',
              fontSize: '0.875rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Got it
          </span>
        </button>
      </div>
    </div>
  );
}