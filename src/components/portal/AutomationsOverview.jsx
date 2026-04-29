import { useMemo } from "react";
import { CheckCircle2, Clock, ShieldCheck, Wrench } from "lucide-react";

const MODE_STYLES = {
  production_real: {
    label: "Production Real",
    tone: "bg-green-50 text-green-700",
  },
  manual_runner: {
    label: "Manual / Cron Runner",
    tone: "bg-amber-50 text-amber-700",
  },
  manual_triggered: {
    label: "Manual Triggered",
    tone: "bg-blue-50 text-blue-700",
  },
  placeholder: {
    label: "Placeholder / Handoff",
    tone: "bg-slate-100 text-slate-600",
  },
};

function StatusPill({ value }) {
  const tone =
    value === "Live"
      ? "bg-green-50 text-green-700"
      : value === "Testing"
      ? "bg-blue-50 text-blue-700"
      : value === "Configuring"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>
      {value || "Unknown"}
    </span>
  );
}

export default function AutomationsOverview({ services = [] }) {
  const summary = useMemo(() => ({
    live: services.filter((service) => service.install_status === "Live").length,
    productionReal: services.filter((service) => service.execution_profile?.mode === "production_real").length,
    operatorManaged: services.filter((service) => ["manual_runner", "manual_triggered"].includes(service.execution_profile?.mode)).length,
  }), [services]);

  if (!services.length) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No purchased automation services are linked to this portal yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Services</p>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-foreground">{summary.live}</p>
          <p className="mt-1 text-xs text-muted-foreground">currently marked Live in the install workspace</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Production Triggers</p>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{summary.productionReal}</p>
          <p className="mt-1 text-xs text-muted-foreground">services with a real production trigger path</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Operator Managed</p>
            <Wrench className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-foreground">{summary.operatorManaged}</p>
          <p className="mt-1 text-xs text-muted-foreground">services that still require manual runs or approval</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h3 className="font-semibold text-foreground">Purchased Services</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            This portal shows canonical install status and runtime mode only. It does not simulate automation activity.
          </p>
        </div>

        <div className="divide-y divide-border/50">
          {services.map((service) => {
            const mode = MODE_STYLES[service.execution_profile?.mode] || MODE_STYLES.placeholder;
            return (
              <div key={service.service_key} className="p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <StatusPill value={service.install_status} />
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${mode.tone}`}>
                        {mode.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-foreground">{service.display_name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.execution_profile?.trigger_label || "No runtime trigger recorded."}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {service.execution_profile?.trigger_detail || "Production runtime details are not available for this service yet."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Access: {service.service_access_status || "active"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
