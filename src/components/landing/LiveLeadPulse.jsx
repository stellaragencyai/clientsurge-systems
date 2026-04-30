import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";

const DEMO_LOCATIONS = [
  "Phoenix, AZ",
  "San Diego, CA",
  "Denver, CO",
  "Austin, TX",
  "Miami, FL",
  "Seattle, WA",
  "Nashville, TN",
  "Portland, OR",
  "Las Vegas, NV",
  "Chicago, IL",
];

export default function LiveLeadPulse() {
  const [leadCount, setLeadCount] = useState(247);
  const [recentLeads, setRecentLeads] = useState([]);
  const [showFlash, setShowFlash] = useState(false);
  const updateCountRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const reduceMotion = typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

    if (reduceMotion) {
      return undefined;
    }

    const interval = setInterval(() => {
      if (updateCountRef.current >= 3) {
        clearInterval(interval);
        return;
      }

      updateCountRef.current += 1;
      setLeadCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      setShowFlash(true);

      const newLead = {
        id: Date.now(),
        location:
          DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)],
        time: "just now",
      };

      setRecentLeads((prev) => [newLead, ...prev.slice(0, 2)]);

      window.setTimeout(() => setShowFlash(false), 600);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          borderRadius: "12px",
          border: "1px solid rgba(34,197,94,0.3)",
          padding: "12px 18px",
          boxShadow: showFlash
            ? "0 0 20px rgba(34,197,94,0.6), 0 4px 12px rgba(0,0,0,0.1)"
            : "0 2px 10px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: `0 0 12px #22c55e${showFlash ? ", 0 0 24px #22c55e" : ""}`,
            animation: "hPulse 2s infinite",
            transition: "all 0.3s",
          }}
        />
        <span style={{ fontSize: "12px", fontWeight: "700", color: "#1a1209" }}>
          <span style={{ color: "#22c55e" }}>{leadCount}</span> leads captured today
        </span>
      </div>

      {recentLeads.slice(0, 2).map((lead, index) => (
        <div
          key={lead.id}
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(10px)",
            borderRadius: "9999px",
            border: "1px solid rgba(154,92,46,0.14)",
            padding: "7px 12px",
            boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            animation: `fadeIn 0.45s ease ${index * 0.05}s both`,
          }}
        >
          <MapPin className="h-3.5 w-3.5" style={{ color: "#9a5c2e" }} />
          <span style={{ fontSize: "11px", fontWeight: "600", color: "rgba(26,18,9,0.7)" }}>
            {lead.location}
          </span>
        </div>
      ))}

      <style>{`
        @keyframes hPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation: hPulse"],
          [style*="animation: fadeIn"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
