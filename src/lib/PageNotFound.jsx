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
              background: "linear-gradient(135deg, #7a3f1a 0%, #c8965c 52%, #9a5c2e 100%)",
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
          But your next booked appointment could. Head back home or book a free 15-minute demo to see how ClientSurge works.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border"
            style={{
              borderColor: "rgba(154,92,46,0.3)",
              color: "#9a5c2e",
              background: "rgba(154,92,46,0.06)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white"
            style={{
              background: "linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%)",
              boxShadow: "0 4px 14px rgba(120,70,20,0.3)",
            }}
          >
            <CalendarCheck className="w-4 h-4" />
            Book Free Demo
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
