import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import DemoBookingModal from '../forms/DemoBookingModal';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 600;
      const footer = document.querySelector('footer');
      const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : window.innerHeight;
      const nearFooter = window.scrollY + window.innerHeight > footerTop - 100;
      setVisible(scrolled && !nearFooter);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fade-in flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "inline-block",
            borderRadius: "9999px",
            padding: "2px",
            background: "linear-gradient(135deg,#a0714f 0%,#c8965c 30%,#f5d9a8 50%,#c8965c 70%,#7a4f2e 100%)",
            boxShadow: "0 8px 32px rgba(120,70,20,0.45)",
            border: "none",
            cursor: "pointer",
          }}
        >
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "48px",
            padding: "0 28px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg,#6b3f1f 0%,#9a5c2e 40%,#7a4825 100%)",
            color: "#f5e6d0",
            fontWeight: "700",
            fontSize: "0.9rem",
            textShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}>
            Book Your Free Demo
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{ display:"flex",alignItems:"center",justifyContent:"center",width:"28px",height:"28px",borderRadius:"50%",background:"rgba(0,0,0,0.25)",border:"none",cursor:"pointer",color:"#fff",flexShrink:0 }}
        >
          ✕
        </button>
      </div>
      {showModal && <DemoBookingModal onClose={() => setShowModal(false)} />}
    </>
  );
}
