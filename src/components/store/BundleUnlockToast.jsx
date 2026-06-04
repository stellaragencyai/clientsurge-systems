import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cartContext";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";

export default function BundleUnlockToast() {
  const { items } = useCart();
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const prevCountRef = useRef(items.length);
  const timerRef = useRef(null);

  useEffect(() => {
    const prevCount = prevCountRef.current;
    const currentCount = items.length;
    prevCountRef.current = currentCount;

    // Only trigger when adding items
    if (currentCount <= prevCount || currentCount === 0) return;

    const selectedServiceKeys = new Set(items.map((i) => i.service_key).filter(Boolean));

    // Find best upcoming bundle
    let bestNudge = null;
    for (const pkg of PACKAGE_OFFERS) {
      const missing = pkg.included_service_keys.filter((k) => !selectedServiceKeys.has(k));
      // Already unlocked
      if (missing.length === 0) {
        bestNudge = { type: "unlocked", pkg };
        break;
      }
      if (missing.length === 1) {
        const monthlySavings = pkg.compare_at_monthly - pkg.monthly_total;
        bestNudge = { type: "nudge", pkg, missing: missing.length, monthlySavings };
        break;
      }
    }

    if (!bestNudge) return;

    clearTimeout(timerRef.current);
    setToast(bestNudge);
    setVisible(true);
    timerRef.current = setTimeout(() => setVisible(false), 5000);
  }, [items.length]);

  if (!toast || !visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "max(92px, calc(92px + env(safe-area-inset-bottom, 0px)))",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        animation: "toastSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        pointerEvents: "none",
      }}
    >
      <style>{`
        @keyframes toastSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <div
        style={{
          borderRadius: "18px",
          padding: "12px 22px",
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(0,136,204,0.18)",
          boxShadow: "0 12px 34px rgba(0,59,143,0.14), inset 0 1px 0 rgba(255,255,255,0.7)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          whiteSpace: "nowrap",
        }}
      >
        {toast.type === "unlocked" ? (
          <>
            <span style={{ fontSize: "18px" }}>🎉</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>
              <span style={{ color: "#005f99" }}>{toast.pkg.name}</span> unlocked — bundle pricing applied!
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: "18px" }}>✦</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "#0A1628" }}>
              Add just <span style={{ color: "#005f99" }}>1 more service</span> → unlock{" "}
              <span style={{ color: "#005f99" }}>{toast.pkg.name}</span> &amp; save{" "}
              <span style={{ color: "#16a34a" }}>${toast.monthlySavings}/mo</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}
