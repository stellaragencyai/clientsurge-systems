// Enhancement 2: "While We Set Up" — things the client can do right now
const tasks = [
  { emoji: "📞", title: "Keep your phone on", detail: "Our team may call to confirm a detail during setup." },
  { emoji: "📧", title: "Check your email", detail: "We'll send setup confirmations and go-live notifications here." },
  { emoji: "🔗", title: "Have your booking link ready", detail: "If you use Calendly, Acuity, or similar — we'll need that URL." },
  { emoji: "⭐", title: "Locate your Google review link", detail: "Needed for the review request automation (if included)." },
];

export default function WhileWeSetUpCard({ installStatus }) {
  if (installStatus === "Live") return null;

  return (
    <div style={{
      borderRadius: "16px",
      background: "rgba(255,255,255,0.9)",
      border: "1px solid rgba(154,92,46,0.1)",
      padding: "20px 22px",
      marginTop: "24px",
      boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
    }}>
      <p style={{ fontSize: "11px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 4px" }}>
        While We Set Up
      </p>
      <p style={{ fontSize: "13px", color: "rgba(27,20,13,0.55)", margin: "0 0 14px", lineHeight: 1.5 }}>
        A few things you can do right now to prepare:
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {tasks.map((t, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: "12px",
            padding: "10px 12px", borderRadius: "10px",
            background: "rgba(154,92,46,0.04)",
            border: "1px solid rgba(154,92,46,0.08)",
          }}>
            <span style={{ fontSize: "18px", flexShrink: 0, lineHeight: 1.2 }}>{t.emoji}</span>
            <div>
              <p style={{ fontSize: "13px", fontWeight: "700", color: "#1b140d", margin: "0 0 2px" }}>{t.title}</p>
              <p style={{ fontSize: "11px", color: "rgba(27,20,13,0.5)", margin: 0, lineHeight: 1.4 }}>{t.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}