import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 600;
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : window.innerHeight;
      const nearFooter = window.scrollY + window.innerHeight > footerTop - 100;

      setVisible(scrolled && !nearFooter);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <p className="text-foreground font-semibold text-sm md:text-base">
          Ready to stop losing leads?
        </p>
        <button
          onClick={() => window.location.href = '/book-demo'}
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
              gap: '8px',
              height: '44px',
              padding: '0 28px',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)',
              color: '#f5e6d0',
              fontWeight: '700',
              fontSize: '0.875rem',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            }}
          >
            Book Free Demo
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </div>
    </div>
  );
}