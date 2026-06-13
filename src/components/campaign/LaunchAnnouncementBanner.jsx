/**
 * LaunchAnnouncementBanner Component
 * High-converting top banner announcing limited-time founder pricing
 */

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { isCampaignActive, getDaysRemaining } from "@/lib/campaignConfig";
import { trackCTA } from "@/lib/analytics";

export default function LaunchAnnouncementBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    // Check localStorage for dismissed state
    const wasDismissed = localStorage.getItem("launch-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
    setDaysLeft(getDaysRemaining());
  }, []);

  if (!isCampaignActive() || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("launch-banner-dismissed", "true");
    setDismissed(true);
  };

  const handleLearnMore = () => {
    trackCTA("banner_learn_more", "announcement");
    // Scroll to campaign section
    const element = document.querySelector('[data-campaign-section]');
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "var(--cs-nav-height, 76px)",
        left: 0,
        right: 0,
        zIndex: 40,
        background: "linear-gradient(90deg, #00AEEF 0%, #009DFF 50%, #00AEEF 100%)",
        backgroundSize: "200% 100%",
        animation: "bannerGradient 6s ease-in-out infinite",
        borderBottom: "1px solid rgba(0,174,239,0.5)",
        boxShadow: "0 4px 20px rgba(0,174,239,0.5), 0 1px 0 rgba(255,255,255,0.15) inset",
        padding: "12px 24px",
        paddingLeft: "max(24px, env(safe-area-inset-left))",
        paddingRight: "max(24px, env(safe-area-inset-right))",
      }}
    >
      <style>{`
        @keyframes bannerGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.4,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "16px" }}>⏰</span>
            <span>
              <strong>Founder's Tier Ends in {daysLeft} Days:</strong> Lock in 50% off monthly + waived setup fees on Starter plans.
            </span>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <button
            onClick={handleLearnMore}
            style={{
              padding: "6px 16px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.95)",
              color: "#003B8F",
              border: "none",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#ffffff";
              e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255,255,255,0.95)";
              e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
          >
            Learn More
          </button>

          <button
            onClick={handleDismiss}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "44px",
              minHeight: "44px",
            }}
            aria-label="Dismiss banner"
          >
            <X style={{ width: "18px", height: "18px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}