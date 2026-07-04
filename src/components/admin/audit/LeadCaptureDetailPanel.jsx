import {
  Users,
  ShieldCheck,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

const STATUS_STYLES = {
  Trusted: { color: "#16a34a", bg: "rgba(22,163,74,0.1)", Icon: CheckCircle2 },
  "Needs Proof": { color: "#d97706", bg: "rgba(217,119,6,0.1)", Icon: AlertCircle },
  Blocked: { color: "#dc2626", bg: "rgba(220,38,38,0.1)", Icon: XCircle },
};

const ENV_LABELS = {
  production: { label: "Production Trusted", color: "#16a34a" },
  internal: { label: "Internal/Test Excluded", color: "#6b7280" },
  smoke: { label: "Smoke/Proof Excluded", color: "#6b7280" },
  demo: { label: "Demo Excluded", color: "#6b7280" },
  unknown: { label: "Unknown — Needs Review", color: "#d97706" },
};

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-lg border border-border p-2.5 text-center">
      <p className="text-lg font-bold" style={{ color: color || "#000", fontFamily: "Montserrat, sans-serif" }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function MissingFieldRow({ icon: Icon, label, count }) {
  const hasIssue = count > 0;
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/30">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-bold" style={{ color: hasIssue ? "#dc2626" : "#16a34a" }}>{count}</span>
    </div>
  );
}

export default function LeadCaptureDetailPanel({ detail }) {
  if (!detail) return null;
  const counts = detail.lead_counts || {};
  const latest = detail.latest_production_lead;
  const missing = detail.missing_fields || {};

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Lead Capture Detail
        </h3>
      </div>

      {/* Lead count pills */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        <StatPill label="Total" value={counts.total || 0} />
        <StatPill label="Production" value={counts.production || 0} color="#16a34a" />
        <StatPill label="Internal" value={counts.internal || 0} color="#6b7280" />
        <StatPill label="Smoke" value={counts.smoke || 0} color="#6b7280" />
        <StatPill label="Demo" value={counts.demo || 0} color="#6b7280" />
        <StatPill label="Unknown" value={counts.unknown || 0} color="#d97706" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Latest production lead */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Latest Production Lead</p>
          {latest ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Name</span>
                <span className="text-xs font-semibold text-foreground">{latest.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Email</span>
                <span className="text-xs font-semibold text-foreground truncate ml-2">{latest.email || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Phone</span>
                <span className="text-xs font-semibold text-foreground">{latest.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Business</span>
                <span className="text-xs font-semibold text-foreground truncate ml-2">{latest.business_name || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Consent</span>
                <span className="text-xs font-bold" style={{ color: latest.consent_given ? "#16a34a" : "#dc2626" }}>
                  {latest.consent_given ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Source Page</span>
                <span className="text-xs font-semibold text-foreground truncate ml-2">{latest.source_page || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Channels</span>
                <span className="text-xs font-semibold text-foreground">
                  {latest.requested_channels?.length > 0 ? latest.requested_channels.join(", ") : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created</span>
                <span className="text-xs font-semibold text-foreground">
                  {latest.created_date ? new Date(latest.created_date).toLocaleString() : "—"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No production-trusted lead found.</p>
          )}
        </div>

        {/* Missing fields */}
        <div className="rounded-xl border border-border p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Missing Fields (Production Leads)</p>
          <div className="space-y-0.5">
            <MissingFieldRow icon={Mail} label="Missing Email" count={missing.missing_email || 0} />
            <MissingFieldRow icon={Phone} label="Missing Phone" count={missing.missing_phone || 0} />
            <MissingFieldRow icon={ShieldCheck} label="Missing Consent" count={missing.missing_consent || 0} />
            <MissingFieldRow icon={FileText} label="Missing Source Page" count={missing.missing_source_page || 0} />
            <MissingFieldRow icon={MessageSquare} label="Missing Requested Channels" count={missing.missing_requested_channels || 0} />
            <MissingFieldRow icon={XCircle} label="Automation Disabled" count={missing.automation_disabled || 0} />
          </div>
          <div className="mt-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Linked Comm Proof</span>
              <span className="text-xs font-bold text-foreground">{detail.linked_comm_proof_count || 0}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">Form Submit Events</span>
              <span className="text-xs font-bold text-foreground">{detail.form_submit_events || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Environment labels legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(ENV_LABELS).map(([env, info]) => (
          <span key={env} className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,0,0,0.04)", color: info.color }}>
            {info.label}
          </span>
        ))}
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
          Missing Consent — Blocked
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626" }}>
          Missing Contact — Blocked
        </span>
      </div>
    </div>
  );
}