import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const messages = [
  { from: "system", text: "New lead from Google Ad — 'Botox near me'" },
  { from: "bot", text: "Hi! Thanks for reaching out to Glow Aesthetic Studio 👋 I'd love to help. Are you interested in a free consultation?", time: "0s" },
  { from: "lead", text: "Yes! How much does Botox cost?", time: "1m 12s" },
  { from: "bot", text: "Great question! Our Botox consultations are complimentary, and treatment starts at $12/unit. Most clients need 20–40 units. Would you like to book a free consult this week?", time: "1m 12s" },
  { from: "lead", text: "That works — do you have Thursday afternoon?", time: "3m 44s" },
  { from: "bot", text: "We do! I have Thursday at 2:00 PM or 4:30 PM available. Which works better?", time: "3m 44s" },
  { from: "lead", text: "2pm works!", time: "4m 02s" },
  { from: "system", text: "✓ Appointment confirmed — Thursday 2:00 PM · Botox Consultation · No staff involved" },
];

export default function ConversationModal({ onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.target === overlayRef.current) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
    >
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-semibold text-gray-900">Real Example: Lead → Booked</p>
            <p className="text-xs text-gray-400 mt-0.5">Glow Aesthetic Studio · 4 minutes start to finish</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat */}
        <div className="p-5 space-y-3 max-h-[420px] overflow-y-auto">
          {messages.map((m, i) => {
            if (m.from === "system") {
              return (
                <div key={i} className="flex justify-center">
                  <span className="text-[11px] bg-primary/10 text-primary px-3 py-1 rounded-full font-medium text-center">
                    {m.text}
                  </span>
                </div>
              );
            }
            const isBot = m.from === "bot";
            return (
              <div key={i} className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}>
                <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isBot
                    ? "bg-secondary text-foreground rounded-bl-md"
                    : "bg-foreground text-white rounded-br-md"
                }`}>
                  {m.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">{isBot ? "System" : "Lead"} · {m.time}</span>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">This entire exchange was handled automatically. Zero staff involvement.</p>
        </div>
      </div>
    </div>
  );
}