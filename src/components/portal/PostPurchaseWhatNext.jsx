const TIMELINE_STEPS = [
  {
    time: "Right now",
    icon: "📋",
    title: "Complete Secure Setup",
    detail:
      "Submit your business details, hours, booking link, notification email, and integration preferences. You can save and finish later from the client portal.",
    highlight: true,
  },
  {
    time: "After submission",
    icon: "🔎",
    title: "Installation Review",
    detail:
      "Our implementation team reviews the information for missing fields, access issues, or configuration conflicts before any automation is activated.",
  },
  {
    time: "During configuration",
    icon: "⚙️",
    title: "Systems Are Configured",
    detail:
      "Your purchased services are configured using the approved business information, routing rules, messaging preferences, and connected tools.",
  },
  {
    time: "Before launch",
    icon: "🧪",
    title: "Verification Tests Run",
    detail:
      "We test the required workflows and supporting evidence. The client dashboard will continue to show verification in progress until those checks pass.",
  },
  {
    time: "After verification",
    icon: "🚀",
    title: "Live Status Is Confirmed",
    detail:
      "Once launch checks pass, your client portal will show the system as live and verified. You will also receive a launch confirmation update.",
  },
];

export default function PostPurchaseWhatNext() {
  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
      <div
        className="px-6 py-5"
        style={{ background: "linear-gradient(135deg,#003B8F 0%,#006BB0 60%,#00AEEF 100%)" }}
      >
        <p className="text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1">Your setup roadmap</p>
        <h3 className="text-xl font-bold text-white">What Happens Next</h3>
        <p className="text-blue-100/80 text-sm mt-1">
          Setup information comes first. Configuration and launch verification follow after submission.
        </p>
      </div>

      <div className="p-6 space-y-0">
        {TIMELINE_STEPS.map((step, index) => {
          const isLast = index === TIMELINE_STEPS.length - 1;
          return (
            <div key={step.title} className="flex items-start gap-4 relative">
              {!isLast && (
                <div
                  className="absolute left-5 top-10 bottom-0 w-0.5"
                  style={{ background: "rgba(0,174,239,0.15)" }}
                />
              )}

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 z-10"
                style={{
                  background: step.highlight ? "rgba(0,174,239,0.1)" : "rgba(0,0,0,0.04)",
                  border: step.highlight ? "1.5px solid rgba(0,174,239,0.3)" : "1.5px solid rgba(0,0,0,0.08)",
                }}
              >
                {step.icon}
              </div>

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
