import { Phone, CalendarCheck } from "lucide-react";
import { useMemo, useState } from "react";
import DemoBookingModal from "../forms/DemoBookingModal";
import { trackCTA } from "@/lib/analytics";

const FALLBACK_PHONE = "+16025843227";

function formatPhoneLabel(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return phone;
}

export default function MobileCallBar() {
  const [showModal, setShowModal] = useState(false);
  const phoneNumber = FALLBACK_PHONE;
  const phoneLabel = useMemo(() => formatPhoneLabel(phoneNumber), [phoneNumber]);

  return (
    <>
      <nav
        data-mobile-call-bar
        data-area10-mobile-action-bar="true"
        aria-label="Mobile contact and system actions"
        className="fixed bottom-0 inset-x-0 z-30 border-t border-primary/15 bg-background/90 backdrop-blur-md md:hidden safe-area-bottom-bar cs-mobile-action-bar"
      >
        <div className="mx-auto flex max-w-[390px] gap-2 px-3 py-2" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))" }}>
          <a
            href={`tel:${phoneNumber}`}
            onClick={() => trackCTA?.("mobile_call_bar_call")}
            aria-label={`Call ClientSurge Systems at ${phoneLabel}`}
            className="flex min-w-0 flex-[0.9] items-center justify-center gap-1.5 rounded-full border border-primary/30 px-2.5 py-2 text-[12px] font-semibold text-primary cs-mobile-action"
            style={{ background: "rgba(0,174,239,0.07)" }}
          >
            <Phone className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{phoneLabel}</span>
          </a>
          <button
            type="button"
            onClick={() => {
              trackCTA?.("mobile_call_bar_browse_systems");
              setShowModal(true);
            }}
            aria-label="Browse AI systems and open the planning modal"
            aria-haspopup="dialog"
            aria-expanded={showModal ? "true" : "false"}
            className="flex min-w-0 flex-[1.4] items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold text-white cs-mobile-action"
            style={{
              background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
              boxShadow: "0 4px 14px rgba(0,174,239,0.4)",
            }}
          >
            <CalendarCheck className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Browse AI Systems</span>
          </button>
        </div>
      </nav>
      {showModal && <DemoBookingModal isOpen={showModal} onClose={() => setShowModal(false)} />}
    </>
  );
}
