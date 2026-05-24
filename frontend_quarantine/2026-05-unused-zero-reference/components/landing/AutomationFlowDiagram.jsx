/**
 * AutomationFlowDiagram — renders a visual step-by-step flow for each automation.
 * Used inside AutomationShowcase to replace the placeholder "Upload image" boxes.
 */

const FLOWS = {
  "instant-lead-response": {
    steps: [
      { icon: "📥", label: "Lead submits form", sub: "Web, Facebook, or referral" },
      { icon: "🧠", label: "AI scores & classifies", sub: "<2 sec routing" },
      { icon: "⚡", label: "Personalized SMS fires", sub: "Within 4 seconds" },
      { icon: "📧", label: "Confirmation email sent", sub: "With booking link" },
      { icon: "✅", label: "Lead engaged", sub: "Before any competitor" },
    ],
    color: "#00AEEF",
  },
  "missed-call-textback": {
    steps: [
      { icon: "📵", label: "Call goes unanswered", sub: "Any time, any day" },
      { icon: "🔔", label: "Twilio detects missed call", sub: "Webhook fires instantly" },
      { icon: "💬", label: "Text-back sent in 60s", sub: "\"We missed you! Book here\"" },
      { icon: "🔁", label: "Follow-up sequence starts", sub: "2 min → 1 hr → 24 hr" },
      { icon: "📅", label: "Lead books appointment", sub: "Recovered revenue" },
    ],
    color: "#8b5cf6",
  },
  "nurture-sequence": {
    steps: [
      { icon: "🆕", label: "New lead enters sequence", sub: "Day 0 — instant welcome" },
      { icon: "📱", label: "Day 1 SMS touchpoint", sub: "Personalized to industry" },
      { icon: "📧", label: "Day 3 email follow-up", sub: "Case study or testimonial" },
      { icon: "🔄", label: "Days 5–14 — 6 more steps", sub: "SMS + email alternating" },
      { icon: "📅", label: "Lead books or opts out", sub: "Sequence auto-stops on reply" },
    ],
    color: "#10b981",
  },
  "ai-booking-agent": {
    steps: [
      { icon: "💬", label: "Lead signals booking intent", sub: "\"I want to book\" or similar" },
      { icon: "🤖", label: "AI detects intent", sub: "classifyLeadIntent fires" },
      { icon: "🔗", label: "Booking link sent via SMS", sub: "Personalized CTA message" },
      { icon: "⏰", label: "Reminder if no click in 2h", sub: "Automatic nudge" },
      { icon: "✅", label: "Appointment confirmed", sub: "Confirmation + calendar invite" },
    ],
    color: "#f97316",
  },
  "review-request": {
    steps: [
      { icon: "🏁", label: "Appointment marked complete", sub: "Trigger event fires" },
      { icon: "⏱️", label: "Wait 30–60 minutes", sub: "Configurable delay" },
      { icon: "⭐", label: "Review request SMS sent", sub: "Google or platform link" },
      { icon: "📧", label: "Email follow-up at 24h", sub: "If SMS not clicked" },
      { icon: "🏆", label: "5-star review received", sub: "Reputation grows passively" },
    ],
    color: "#eab308",
  },
  "lead-reactivation": {
    steps: [
      { icon: "😴", label: "Lead dormant 14–60 days", sub: "Daily scan detects it" },
      { icon: "🎯", label: "Reactivation tier assigned", sub: "14d / 30d / 60d offer" },
      { icon: "💌", label: "Special offer SMS sent", sub: "\"20% off — limited time\"" },
      { icon: "📧", label: "Email follow-up at 24h", sub: "If SMS unanswered" },
      { icon: "💰", label: "Dormant revenue recovered", sub: "Up to 90 days back" },
    ],
    color: "#ef4444",
  },
};

export default function AutomationFlowDiagram({ automationId }) {
  const flow = FLOWS[automationId];
  if (!flow) return null;

  return (
    <div
      className="rounded-2xl border border-border p-5 flex flex-col gap-3"
      style={{ background: `${flow.color}08` }}
    >
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: flow.color }}>
        How It Works
      </p>

      <div className="flex flex-col gap-0">
        {flow.steps.map((step, i) => (
          <div key={i} className="flex items-stretch gap-3">
            {/* Left column: icon + connector line */}
            <div className="flex flex-col items-center" style={{ width: 36 }}>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm"
                style={{ background: `${flow.color}18`, border: `1.5px solid ${flow.color}30` }}
              >
                {step.icon}
              </div>
              {i < flow.steps.length - 1 && (
                <div
                  className="w-px flex-1 my-1"
                  style={{ background: `${flow.color}30`, minHeight: 16 }}
                />
              )}
            </div>

            {/* Right column: text */}
            <div className="pb-3 pt-1">
              <p className="text-sm font-semibold text-foreground leading-tight">{step.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}