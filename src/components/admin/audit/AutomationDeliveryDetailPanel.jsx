import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const STATUS_COLORS = {
  Trusted: "#16a34a",
  "Needs Proof": "#d97706",
  Blocked: "#dc2626",
};

const DELIVERY_COLORS = {
  delivered: "#16a34a",
  sent: "#0ea5e9",
  queued: "#d97706",
  failed: "#dc2626",
  unknown: "#6b7280",
  not_tested: "#6b7280",
};

function AutomationRow({ auto }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[auto.status_label] || "#6b7280";
  const deliveryColor = DELIVERY_COLORS[auto.service_status] || "#6b7280";

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${statusColor}15` }}
        >
          {auto.status_label === "Trusted" ? (
            <CheckCircle2 className="w-4 h-4" style={{ color: statusColor }} />
          ) : auto.status_label === "Blocked" ? (
            <XCircle className="w-4 h-4" style={{ color: statusColor }} />
          ) : (
            <AlertCircle className="w-4 h-4" style={{ color: statusColor }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground">{auto.label}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>
              {auto.status_label}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{auto.proof_requirement}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {auto.blocker_count > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{auto.blocker_count}B</span>
          )}
          {auto.warning_count > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">{auto.warning_count}W</span>
          )}
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${deliveryColor}15`, color: deliveryColor }}>
            {auto.service_status}
          </span>
          {expanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-3 space-y-2 bg-muted/10">
          {/* Proof details */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-muted-foreground">Last Tested:</span>{" "}
              <span className="font-semibold text-foreground">
                {auto.last_tested_date ? new Date(auto.last_tested_date).toLocaleString() : "Never"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Provider ID:</span>{" "}
              <span className="font-semibold" style={{ color: auto.has_provider_message_id ? "#16a34a" : "#d97706" }}>
                {auto.has_provider_message_id ? "Yes" : "Missing"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Delivery:</span>{" "}
              <span className="font-semibold" style={{ color: deliveryColor }}>{auto.delivery_status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Gates:</span>{" "}
              <span className="font-semibold text-foreground">{auto.gates.length > 0 ? auto.gates.join(", ") : "none"}</span>
            </div>
          </div>

          {/* Proof log */}
          {auto.latest_proof_log && (
            <div className="rounded-lg border border-border p-2 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Latest AutomationProofLog</p>
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold" style={{ color: auto.latest_proof_log.status === "pass" ? "#16a34a" : "#dc2626" }}>
                    {auto.latest_proof_log.status}
                  </span>
                </div>
                {auto.latest_proof_log.evidence_summary && (
                  <p className="text-muted-foreground">{auto.latest_proof_log.evidence_summary}</p>
                )}
                {auto.latest_proof_log.failure_reason && (
                  <p className="text-red-600">Failure: {auto.latest_proof_log.failure_reason}</p>
                )}
                {auto.latest_proof_log.repair_action && (
                  <p className="text-amber-600">Repair: {auto.latest_proof_log.repair_action}</p>
                )}
              </div>
            </div>
          )}

          {/* Comm log */}
          {auto.latest_comm_log && (
            <div className="rounded-lg border border-border p-2 bg-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Latest CommunicationLog</p>
              <div className="text-[11px] space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-semibold text-foreground">{auto.latest_comm_log.channel} ({auto.latest_comm_log.provider})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trigger:</span>
                  <span className="font-semibold text-foreground">{auto.latest_comm_log.trigger_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider Msg ID:</span>
                  <span className="font-mono text-foreground">{auto.latest_comm_log.provider_message_id || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-semibold" style={{ color: DELIVERY_COLORS[auto.latest_comm_log.delivery_status] || "#6b7280" }}>
                    {auto.latest_comm_log.delivery_status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Next required proof */}
          <div className="rounded-lg p-2" style={{ background: "rgba(0,174,239,0.06)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-0.5">Next Required Proof</p>
            <p className="text-[11px] text-foreground">{auto.next_required_proof}</p>
          </div>

          {/* Blockers & Warnings */}
          {auto.blockers.map((b, i) => (
            <div key={`b${i}`} className="rounded-lg p-2" style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)" }}>
              <p className="text-[11px] font-bold text-red-700">{b.code}</p>
              <p className="text-[10px] text-muted-foreground">{b.message}</p>
              <p className="text-[10px] font-semibold text-foreground mt-1">Fix: {b.fix_action}</p>
            </div>
          ))}
          {auto.warnings.map((w, i) => (
            <div key={`w${i}`} className="rounded-lg p-2" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
              <p className="text-[11px] font-bold text-amber-700">{w.code}</p>
              <p className="text-[10px] text-muted-foreground">{w.message}</p>
              <p className="text-[10px] font-semibold text-foreground mt-1">Fix: {w.fix_action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutomationDeliveryDetailPanel({ detail }) {
  if (!detail) return null;
  const automations = detail.automations || [];
  const trustedCount = automations.filter(a => a.status_label === "Trusted").length;
  const blockedCount = automations.filter(a => a.status_label === "Blocked").length;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "Montserrat, sans-serif" }}>
          Automation Delivery Proof
        </h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {trustedCount}/{automations.length} trusted · {blockedCount} blocked
        </span>
      </div>

      {/* Smoke test notice */}
      <div className="rounded-lg p-2.5 mb-3" style={{ background: "rgba(217,119,6,0.06)", border: "1px solid rgba(217,119,6,0.2)" }}>
        <p className="text-[11px] font-semibold text-amber-700">
          ⚠ Safe Testing: Any proof generated via admin test tools is labeled as smoke/test and excluded from production dashboards.
        </p>
      </div>

      <div className="space-y-2">
        {automations.map((auto) => (
          <AutomationRow key={auto.key} auto={auto} />
        ))}
      </div>
    </div>
  );
}