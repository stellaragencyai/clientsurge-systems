import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

const DEMO_LOCATIONS = [
  "Phoenix, AZ", "San Diego, CA", "Denver, CO", "Austin, TX", "Miami, FL",
  "Seattle, WA", "Nashville, TN", "Portland, OR", "Las Vegas, NV", "Chicago, IL"
];

export default function LiveLeadPulse() {
  const [leadCount, setLeadCount] = useState(247);
  const [recentLeads, setRecentLeads] = useState([]);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeadCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
      setShowFlash(true);
      
      const newLead = {
        id: Date.now(),
        location: DEMO_LOCATIONS[Math.floor(Math.random() * DEMO_LOCATIONS.length)],
        time: "now",
      };
      
      setRecentLeads((prev) => [newLead, ...prev.slice(0, 2)]);
      
      setTimeout(() => setShowFlash(false), 600);
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
      {/* Main pulse card */}
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

      {/* Location dots */}
      {recentLeads.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            animation: "fadeIn 0.4s ease",
          }}
        >
          {recentLeads.map((lead) => (
            <div
              key={lead.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                borderRadius: "20px",
                padding: "4px 8px",
                fontSize: "10px",
                color: "#22c55e",
                fontWeight: "600",
              }}
            >
              <MapPin style={{ width: "10px", height: "10px" }} />
              {lead.location}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes hPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}