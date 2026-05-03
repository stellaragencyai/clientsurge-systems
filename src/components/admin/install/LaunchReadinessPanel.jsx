import { AlertTriangle, CheckCircle2, Radar, ShieldAlert } from "lucide-react";

const STATUS_STYLES = {
  ready: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  blocked: "border-red-200 bg-red-50 text-red-800",
};

function StatusPill({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.warning}`}>
      {status || "unknown"}
    </span>
  );
}

function InfoTile({ label, value, helper = null }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function SectionCard({ section }) {
  const noteLabel = section.status === "blocked" ? "Operational notes" : "Notes";

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{section.label}</p>
          <p className="text-xs text-muted-foreground">{section.summary}</p>
          <p className="text-xs text-muted-foreground">{section.detail}</p>
        </div>
        <StatusPill status={section.status} />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        {(section.metrics || []).map((item) => (
          <InfoTile
            key={`${section.key}:${item.label}`}
            label={item.label}
            value={item.value}
            helper={item.helper}
          />
        ))}
      </div>

      {(section.blockers || []).length > 0 ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-700" />
            <p className="text-sm font-semibold text-red-900">Launch blockers</p>
          </div>
          <div className="mt-3 space-y-2">
            {section.blockers.map((item) => (
              <div key={item} className="rounded-lg border border-red-200 bg-white px-3 py-3 text-xs text-red-900">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {(section.notes || []).length > 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-sm font-semibold text-foreground">{noteLabel}</p>
          <div className="mt-3 space-y-2">
            {section.notes.map((item) => (
              <div key={item} className="rounded-lg border border-border bg-white px-3 py-3 text-xs text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LaunchReadinessPanel({ audit }) {
  if (!audit) {
    return null;
  }

  const totalBlockers = audit.launch_blockers?.length || 0;

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-primary" />
            <h4 className="text-lg font-semibold text-foreground">Launch Readiness Audit</h4>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This backend-derived audit condenses the highest-value launch checks for lead capture, external service proof, billing, automation security, lead ownership, and monitoring.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Ready" value={String(audit.counts?.ready || 0)} />
          <InfoTile label="Warnings" value={String(audit.counts?.warning || 0)} />
          <InfoTile label="Blocked" value={String(audit.counts?.blocked || 0)} />
          <InfoTile label="Launch Blockers" value={String(totalBlockers)} />
        </div>
      </div>

      {totalBlockers > 0 ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-700" />
            <p className="text-sm font-semibold text-red-900">Immediate launch blockers</p>
          </div>
          <div className="mt-3 space-y-2">
            {(audit.launch_blockers || []).map((item) => (
              <div key={`${item.section_key}:${item.message}`} className="rounded-lg border border-red-200 bg-white px-3 py-3 text-xs text-red-900">
                <span className="font-semibold">{item.section_label}:</span> {item.message}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-700" />
            <p className="text-sm font-semibold text-green-900">No current launch blockers</p>
          </div>
          <p className="mt-2 text-xs text-green-800">
            The tracked launch-readiness sections are currently clear for this order.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {(audit.sections || []).map((section) => (
          <SectionCard key={section.key} section={section} />
        ))}
      </div>
    </div>
  );
}
