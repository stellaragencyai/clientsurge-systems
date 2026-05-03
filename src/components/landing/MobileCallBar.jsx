import { Phone, CalendarCheck } from "lucide-react";
import { useState } from "react";
import DemoBookingModal from "../forms/DemoBookingModal";
import { trackCTA } from "@/lib/analytics";

export default function MobileCallBar() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur-sm md:hidden safe-area-inset-bottom">
        <div className="px-3 py-2.5 flex gap-2">
          <a
            href="tel:+16025843227"
            onClick={() => trackCTA?.("mobile_call_bar_call")}
            className="flex-1 flex items-center justify-center gap-2 rounded-full border border-primary/30 px-3 py-2.5 text-sm font-semibold text-primary"
            style={{ background: "rgba(154,92,46,0.07)" }}
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>Call Now</span>
          </a>
          <button
            onClick={() => {
              trackCTA?.("mobile_call_bar_book_demo");
              setShowModal(true);
            }}
            className="flex-2 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #6b3f1f 0%, #9a5c2e 40%, #7a4825 100%)",
              boxShadow: "0 4px 14px rgba(120,70,20,0.35)",
              flex: 2,
            }}
          >
            <CalendarCheck className="w-4 h-4 flex-shrink-0" />
            <span>Book Free Demo</span>
          </button>
        </div>
      </div>
      {showModal && (
        <DemoBookingModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
