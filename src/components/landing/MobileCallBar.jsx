import { Phone, CalendarCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import DemoBookingModal from "../forms/DemoBookingModal";
import { trackCTA } from "@/lib/analytics";
import { fetchAdminSettings } from "@/lib/adminSettingsApi";

const FALLBACK_PHONE = "+16025843227";

function formatPhoneLabel(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export default function MobileCallBar() {
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(FALLBACK_PHONE);

  useEffect(() => {
    let cancelled = false;

    fetchAdminSettings()
      .then((settings) => {
        if (cancelled) {
          return;
        }
        if (settings?.twilio_from_number) {
          setPhoneNumber(settings.twilio_from_number);
        }
      })
      .catch(() => {
        // Keep the known-good fallback when public settings are unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const phoneLabel = useMemo(() => formatPhoneLabel(phoneNumber), [phoneNumber]);

  return (
    <>
      <div data-mobile-call-bar className="fixed bottom-0 inset-x-0 z-40 border-t border-primary/20 bg-background/95 backdrop-blur-sm md:hidden safe-area-bottom-bar">
        <div className="px-3 py-2.5 flex gap-2" style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom, 10px))" }}>
          <a
            href={`tel:${phoneNumber}`}
            onClick={() => trackCTA?.("mobile_call_bar_call")}
            className="flex-1 flex items-center justify-center gap-2 rounded-full border border-primary/30 px-3 py-2.5 text-sm font-semibold text-primary"
            style={{ background: "rgba(0,174,239,0.07)" }}
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{phoneLabel}</span>
          </a>
          <button
            onClick={() => {
              trackCTA?.("mobile_call_bar_book_demo");
              setShowModal(true);
            }}
            className="flex-2 flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #0088CC 0%, #006BB0 40%, #003B8F 100%)",
              boxShadow: "0 4px 14px rgba(0,174,239,0.4)",
              flex: 2,
            }}
          >
            <CalendarCheck className="w-4 h-4 flex-shrink-0" />
            <span>Book Free Demo</span>
          </button>
        </div>
      </div>
      {showModal && (
        <DemoBookingModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
