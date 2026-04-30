// Enhancement 3: Plain-English "What Happens Next" stage explanation
const stageExplanations = {
  "Paid": {
    title: "Your order is confirmed",
    body: "Our install team reviews new orders within 1 business day. You'll receive an email once your installer has been assigned and setup begins.",
    icon: "🎉",
  },
  "Ready for Install": {
    title: "Your installer has been assigned",
    body: "A dedicated team member is about to begin building your system. Expect an onboarding check-in email or call within 24 hours.",
    icon: "👷",
  },
  "Configuring": {
    title: "We're building your system",
    body: "Your automation flows, message templates, and integrations are being configured right now. This typically takes 2–3 business days.",
    icon: "⚙️",
  },
  "Testing": {
    title: "Your system is in final testing",
    body: "We're sending test leads through your automation and verifying every message fires correctly. You'll be notified once testing passes.",
    icon: "🧪",
  },
  "Live": {
    title: "Your system is live!",
    body: "Every new lead, missed call, or inquiry will now be automatically captured and followed up on. Sit back — your system is working 24/7.",
    icon: "✅",
  },
  "Error": {
    title: "We've hit a snag",
    body: "Something needs attention during setup. Our team has been automatically alerted and is investigating. We'll reach out shortly with an update.",
    icon: "🔧",
  },
};

export default function WhatHappensNext({ installStatus }) {
  const info = stageExplanations[installStatus] || stageExplanations["Paid"];

  return (
    <div style={{
      borderRadius: "14px",
      background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(253,251,248,0.9) 100%)",
      border: "1px solid rgba(154,92,46,0.1)",
      padding: "18px 20px",
      marginTop: "20px",
      display: "flex", gap: "14px", alignItems: "flex-start",
    }}>
      <div style={{
        width: "42px", height: "42px", borderRadius: "12px", flexShrink: 0,
        background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.12)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
      }}>
        {info.icon}
      </div>
      <div>
        <p style={{ fontSize: "13px", fontWeight: "800", color: "#1b140d", margin: "0 0 5px" }}>
          {info.title}
        </p>
        <p style={{ fontSize: "12px", color: "rgba(27,20,13,0.6)", margin: 0, lineHeight: 1.6 }}>
          {info.body}
        </p>
      </div>
    </div>
  );
}