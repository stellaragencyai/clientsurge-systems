import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cartContext";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";

export default function BundleSavingsToast() {
  const { items } = useCart();
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const prevCount = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const count = items.length;
    const added = count > prevCount.current;
    prevCount.current = count;

    if (!added || count === 0) return;

    // Only show once per session
    try {
      if (sessionStorage.getItem("cs:bundle-toast-shown")) return;
    } catch (_) {}

    const serviceKeys = new Set(items.map((i) => i.service_key));

    // Find a bundle that's close to being unlocked (1-2 services away)
    const candidate = PACKAGE_OFFERS.find((pkg) => {
      const missing = pkg.included_service_keys.filter((k) => !serviceKeys.has(k));
      return missing.length === 1;
    });

    if (!candidate) return;

    const missing = candidate.included_service_keys.filter((k) => !serviceKeys.has(k)).length;
    const savings = (candidate.compare_at_setup - candidate.setup_total) + (candidate.compare_at_monthly - candidate.monthly_total);

    setToast({
      message: `Add 1 more service → unlock`,
      bundle: candidate.name,
      savings,
    });

    try { sessionStorage.setItem("cs:bundle-toast-shown", "1"); } catch (_) {}
    setVisible(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 5000);

    return () => clearTimeout(timerRef.current);
  }, [items]);

  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "28px",
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "80px"})`,
        opacity: visible ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        zIndex: 9999,
        pointerEvents: visible ? "auto" : "none",
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 32px rgba(111,67,31,0.18)",
        borderRadius: "999px",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "16px" }}>🎯</span>
      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1b140d" }}>
        {toast.message}{" "}
        <strong style={{ color: "#9a5c2e" }}>{toast.bundle}</strong>
        {toast.savings > 0 && (
          <span style={{ color: "#16a34a", marginLeft: "6px" }}>
            — save ${toast.savings}
          </span>
        )}
      </span>
      <button
        onClick={() => setVisible(false)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(27,20,13,0.4)", fontSize: "14px", padding: "0 0 0 4px" }}
      >
        ✕
      </button>
    </div>
  );
}