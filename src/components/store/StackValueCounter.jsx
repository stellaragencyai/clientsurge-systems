import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cartContext";
import { PACKAGE_OFFERS } from "@/lib/salesCatalog";

function animateValue(from, to, duration, onUpdate) {
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    onUpdate(Math.round(from + (to - from) * ease));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default function StackValueCounter() {
  const { items, totalSetup, totalMonthly } = useCart();
  const [displaySetup, setDisplaySetup] = useState(0);
  const [displayMonthly, setDisplayMonthly] = useState(0);
  const prevSetup = useRef(0);
  const prevMonthly = useRef(0);

  useEffect(() => {
    animateValue(prevSetup.current, totalSetup, 600, setDisplaySetup);
    animateValue(prevMonthly.current, totalMonthly, 600, setDisplayMonthly);
    prevSetup.current = totalSetup;
    prevMonthly.current = totalMonthly;
  }, [totalSetup, totalMonthly]);

  // Find next bundle unlock
  const serviceKeys = new Set(items.map((i) => i.service_key));
  const nextBundle = PACKAGE_OFFERS.find(
    (pkg) => !pkg.included_service_keys.every((k) => serviceKeys.has(k))
  );
  const keysNeeded = nextBundle
    ? nextBundle.included_service_keys.filter((k) => !serviceKeys.has(k)).length
    : 0;

  if (items.length === 0) return null;

  return (
    <div
      style={{
        margin: "0 0 20px",
        borderRadius: "16px",
        padding: "14px 20px",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.22)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 20px rgba(0,59,143,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <div>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,136,204,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            Setup Total
          </p>
          <p style={{ fontSize: "22px", fontWeight: "900", color: "#005f99", margin: 0, lineHeight: 1.1, transition: "color 0.3s" }}>
            ${displaySetup}
          </p>
        </div>
        <div style={{ width: "1px", height: "32px", background: "rgba(0,136,204,0.2)" }} />
        <div>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,136,204,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            Monthly
          </p>
          <p style={{ fontSize: "22px", fontWeight: "900", color: "#005f99", margin: 0, lineHeight: 1.1 }}>
            ${displayMonthly}<span style={{ fontSize: "12px", fontWeight: "600", color: "rgba(0,136,204,0.6)" }}>/mo</span>
          </p>
        </div>
        <div style={{ width: "1px", height: "32px", background: "rgba(0,136,204,0.2)" }} />
        <div>
          <p style={{ fontSize: "10px", fontWeight: "700", color: "rgba(0,136,204,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>
            Services
          </p>
          <p style={{ fontSize: "22px", fontWeight: "900", color: "#005f99", margin: 0, lineHeight: 1.1 }}>
            {items.length}
          </p>
        </div>
      </div>

      {nextBundle && keysNeeded > 0 && (
        <div
          style={{
            fontSize: "11px",
            fontWeight: "600",
            color: "#003B8F",
            background: "rgba(0,136,204,0.1)",
            border: "1px solid rgba(0,136,204,0.22)",
            borderRadius: "9999px",
            padding: "6px 14px",
          }}
        >
          Add {keysNeeded} more → unlock <strong>{nextBundle.name}</strong> savings
        </div>
      )}
    </div>
  );
}