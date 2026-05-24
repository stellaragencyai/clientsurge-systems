/**
 * StripeTestModeBanner — #310
 * Shows red "TEST MODE ACTIVE" banner in admin when Stripe key is a test key.
 * Drop into AdminLayout or AdminDashboard.
 */
import { useEffect, useState } from "react";

export default function StripeTestModeBanner() {
  const [isTest, setIsTest] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/functions/getStripeMode", { method: "POST",
          headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        const data = await res.json();
        setIsTest(data?.mode === "test" || data?.livemode === false);
      } catch { setIsTest(false); }
    })();
  }, []);

  if (!isTest) return null;

  return (
    <div style={{
      background: "#EF4444", color: "#fff", textAlign: "center",
      padding: "8px 20px", fontWeight: 800, fontSize: 13, letterSpacing: "0.08em",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      position: "sticky", top: 0, zIndex: 9999,
    }}>
      <span style={{ fontSize: 16 }}>⚠️</span>
      TEST MODE ACTIVE — Stripe payments are not live. Switch to live keys before launch.
      <span style={{ fontSize: 16 }}>⚠️</span>
    </div>
  );
}
