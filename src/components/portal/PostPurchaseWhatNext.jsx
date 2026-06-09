/**
 * PostPurchaseWhatNext — detailed, empathetic roadmap shown after payment.
 * Covers the critical 72-hour window where buyer anxiety is highest.
 */
const TIMELINE_STEPS = [
  {
    time: "Within 10 minutes",
    icon: "📧",
    title: "Check Your Inbox",
    detail:
      "You'll receive an order confirmation email with your receipt and a secure link to your Client Portal. Check your spam folder if it doesn't appear.",
    highlight: true,
  },
  {
    time: "Within 2 hours",
    icon: "💬",
    title: "Welcome SMS from Our Team",
    detail:
      "We'll send a personal SMS to the number you provided with your portal link and a direct line to your onboarding specialist.",
  },
  {
    time: "Within 24 hours",
    icon: "📋",
    title: "Onboarding Form Sent",
    detail:
      "Our team will send you a short intake form collecting your business hours, booking link, review page, and any existing phone numbers. This takes about 5 minutes.",
  },
  {
    time: "Within 48 hours",
    icon: "⚙️",
    title: "Configuration Begins",
    detail:
      "Our implementation team begins building and testing your custom automation sequences — SMS templates, lead routing, missed-call text-back, and AI follow-up.",
  },
  {
    time: "Within 5–7 business days",
    icon: "🚀",
    title: "Your System Goes Live",
    detail:
      "Once testing passes, we flip the switch and your automations go fully live. You'll get a 'System Active' email with a live dashboard link.",
  },
];

export default function PostPurchaseWhatNext() {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <div
        className="px-6 py-5"
        style={{ background: "linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)" }}
      >
        <p className="text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1">Your Launch Roadmap</p>
        <h3 className="text-xl font-bold text-white">What Happens After Payment</h3>
        <p className="text-blue-100/70 text-sm mt-1">
          Here's exactly what our team does next — and when you can expect each milestone.
        </p>
      </div>

      <div className="p-6 space-y-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const isLast = idx === TIMELINE_STEPS.length - 1;
          return (
            <div key={idx} className="flex items-start gap-4 relative">
              {/* Connector */}
              {!isLast && (
                <div
                  className="absolute left-5 top-10 bottom-0 w-0.5"
                  style={{ background: "rgba(0,174,239,0.15)" }}
                />
              )}

              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 z-10"
                style={{
                  background: step.highlight ? "rgba(0,174,239,0.1)" : "rgba(0,0,0,0.04)",
                  border: step.highlight ? "1.5px solid rgba(0,174,239,0.3)" : "1.5px solid rgba(0,0,0,0.08)",
                }}
              >
                {step.icon}
              </div>

              {/* Content */}
              <div className={`flex-1 ${!isLast ? "pb-6" : ""}`}>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: "rgba(0,136,204,0.8)" }}
                >
                  {step.time}
                </p>
                <p className="text-sm font-bold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}