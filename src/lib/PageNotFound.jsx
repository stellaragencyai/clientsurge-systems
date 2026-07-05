import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import DemoBookingModal from '@/components/forms/DemoBookingModal';

export default function PageNotFound() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: "linear-gradient(135deg, #fdf9f5 0%, #faf6f0 100%)" }}
      >
        {/* Big number */}
        <div style={{ marginBottom: "8px" }}>
          <span
            className="font-display font-black"
            style={{
              fontSize: "clamp(6rem, 20vw, 12rem)",
              lineHeight: 1,
              background: "linear-gradient(135deg, #003B8F 0%, #006BB0 52%, #00AEEF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.35,
            }}
          >
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="font-display font-bold text-foreground mb-3" style={{ fontSize: "clamp(1.5rem, 4vw, 2.5rem)" }}>
          This page doesn't exist.
        </h1>
        <p className="text-muted-foreground text-base max-w-md mb-10 leading-relaxed">
          The page you're looking for doesn't exist. Try searching or head to one of these popular pages.
        </p>

        {/* Fix #71: Search bar and suggested pages */}
        <div className="w-full max-w-md mb-8">
          <input
            type="text"
            placeholder="Search for a page..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground"
            onChange={(e) => {
              const query = e.target.value.toLowerCase();
              const links = document.querySelectorAll('[data-suggestion-link]');
              links.forEach((link) => {
                const text = link.textContent.toLowerCase();
                link.style.display = text.includes(query) ? '' : 'none';
              });
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border border-border text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border border-border text-foreground hover:bg-muted transition-colors"
            data-suggestion-link
          >
            Browse Pricing
          </button>
          <button
            onClick={() => navigate('/store')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border border-border text-foreground hover:bg-muted transition-colors"
            data-suggestion-link
          >
            Automation Store
          </button>
          <button
            onClick={() => navigate('/contact')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border border-border text-foreground hover:bg-muted transition-colors"
            data-suggestion-link
          >
            Contact Support
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white"
            style={{
              background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
              boxShadow: "0 4px 14px rgba(0,174,239,0.35)",
            }}
          >
            <CalendarCheck className="w-4 h-4" />
            Free Automation Audit
          </button>
        </div>

        {/* Brand */}
        <p className="mt-16 text-xs text-muted-foreground/60 tracking-widest uppercase font-medium">
          ClientSurge Systems
        </p>
      </div>

      {showModal && (
        <DemoBookingModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}