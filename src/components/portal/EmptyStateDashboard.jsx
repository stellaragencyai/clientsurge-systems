/**
 * EmptyStateDashboard — polished, context-aware empty state for portal panels.
 * Replaces blank grids/zeroed charts with encouraging placeholders.
 */
export default function EmptyStateDashboard({
  icon = "🚀",
  title = "Your Dashboard Is Initializing",
  description,
  ctaLabel,
  onCta,
  variant = "default", // "default" | "leads" | "billing" | "automations"
}) {
  const defaults = {
    leads: {
      icon: "📡",
      title: "Your Lead Pipeline Is Warming Up",
      description:
        "Once your missed-call text-back and lead capture systems go live, every incoming lead will appear here in real time — with AI scoring, follow-up status, and conversation history.",
    },
    billing: {
      icon: "💳",
      title: "No Invoices Yet",
      description:
        "Invoices will appear here once your subscription billing begins — 30 days after your system goes live.",
    },
    automations: {
      icon: "⚡",
      title: "Automations Are Being Configured",
      description:
        "Your automation checklist is being built by our team. Each service will update here as it moves through configuration, testing, and go-live.",
    },
  };

  const cfg = defaults[variant] || {};
  const displayIcon = icon || cfg.icon || "🚀";
  const displayTitle = title || cfg.title;
  const displayDesc = description || cfg.description || "Data will appear here once your system is active.";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-border bg-muted/20">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: "rgba(0,174,239,0.08)", border: "1.5px solid rgba(0,174,239,0.15)" }}
      >
        {displayIcon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{displayTitle}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{displayDesc}</p>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}