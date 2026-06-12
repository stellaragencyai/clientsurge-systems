/**
 * LaunchCountdownTimer Component
 * Elegant countdown timer for the campaign end date
 * Displays in the navbar with soft styling
 */

import { useEffect, useState } from "react";
import { CAMPAIGN_CONFIG, isCampaignActive, getHoursRemaining } from "@/lib/campaignConfig";

export default function LaunchCountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!isCampaignActive()) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = CAMPAIGN_CONFIG.endDate - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

      setTimeLeft({ days, hours });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!isCampaignActive() || !timeLeft) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 14px",
        borderRadius: "999px",
        background: "linear-gradient(135deg, rgba(0,174,239,0.12), rgba(255,255,255,0.08))",
        border: "1px solid rgba(0,174,239,0.25)",
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "#00AEEF",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "999px", background: "#00AEEF", animation: "pulse 2s infinite" }} />
      <span>
        {timeLeft.days > 0 ? `${timeLeft.days}d ${timeLeft.hours}h left` : `${timeLeft.hours}h left`}
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}