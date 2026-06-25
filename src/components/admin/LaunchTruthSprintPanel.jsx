import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Clock, XCircle, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_CONFIG = {
  locked: { label: "Locked", color: "bg-gray-100 text-gray-700", icon: XCircle },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-700", icon: AlertCircle },
  partial: { label: "Partial", color: "bg-yellow-100 text-yellow-700", icon: AlertTriangle },
  ready_for_proof: { label: "Ready for Proof", color: "bg-blue-100 text-blue-700", icon: Clock },
  proof_running: { label: "Proof Running", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  proof_failed: { label: "Proof Failed", color: "bg-red-100 text-red-700", icon: AlertCircle },
  proof_passed: { label: "Proof Passed", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700", icon: ShieldCheck },
  waived: { label: "Waived", color: "bg-gray-100 text-gray-700", icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.locked;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function SectionCard({ title, children, status }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h3>
        {status && <StatusBadge status={status} />}
      </div>
      {children}
    </div>
  );
}

function EvidenceRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground font-medium flex-shrink-0">{label}</span>
      <span className="text-foreground text-right break-all">{String(value)}</span>
    </div>
  );
}

export default function LaunchTruthSprintPanel() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSprint = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("runLaunchTruthSprint", {});
      setReport(res.data);
    } catch (err) {
      setError(err?.message || "Failed to run Launch Truth Sprint. Check function logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSprint();
  }, [runSprint]);

  if (loading && !report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Running Launch Truth Sprint proof checks...</p>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Sprint Failed</h3>
        <p className="text-sm text-red-700 mb-4 max-w-md mx-auto">{error}</p>
        <button onClick={runSprint} className="cs-btn-primary inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!report) return null;

  const s = report.sections || {};
  const dt = s.dashboard_truth || {};
  const lc = s.lead_capture || {};
  const msg = s.messaging || {};
  const po = s.payment_onboarding || {};
  const ga = s.ga4 || {};
  const ps = s.public_site || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Launch Truth Sprint</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real evidence for the lead-to-payment-to-onboarding path. No fake passes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runSprint}
            disabled={loading}
            className="cs-btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? "Running..." : "Re-run Sprint"}
          </button>
        </div>
      </div>

      {/* Safe to Launch Banner */}
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${report.safe_to_launch ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        {report.safe_to_launch ? (
          <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className={`text-lg font-bold ${report.safe_to_launch ? "text-green-900" : "text-red-900"}`}>
            {report.safe_to_launch ? "Safe to Launch" : "NOT Safe to Launch"}
          </p>
          <p className={`text-sm ${report.safe_to_launch ? "text-green-800" : "text-red-800"}`}>
            {report.safe_to_launch
              ? "All gates passed or are ready for proof with no blockers."
              : `${report.blocker_count} blocker(s) and ${report.warning_count} warning(s) must be resolved.`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Run at</p>
          <p className="text-sm font-semibold text-foreground">{new Date(report.run_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Gate Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Blocked", value: report.gates_blocked, color: "text-red-600" },
          { label: "Ready for Proof", value: report.gates_ready_for_proof, color: "text-blue-600" },
          { label: "Proof Passed", value: report.gates_proof_passed, color: "text-green-600" },
          { label: "Approved", value: report.gates_approved, color: "text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* A. Public Site Cleanliness */}
      <SectionCard title="A. Public Site Cleanliness">
        <div className="space-y-2">
          <EvidenceRow label="Public Routes Verified" value={ps.public_routes_verified ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Internal Routes Hidden" value={ps.internal_routes_hidden ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Sitemap Status" value={ps.sitemap_status} />
          <EvidenceRow label="Robots Status" value={ps.robots_status} />
          <EvidenceRow label="CTA Status" value={ps.cta_status} />
          {ps.notes && <p className="text-xs text-muted-foreground italic mt-2">{ps.notes}</p>}
        </div>
      </SectionCard>

      {/* B. Lead Capture Proof */}
      <SectionCard title="B. Lead Capture Proof" status={lc.status}>
        <div className="space-y-2">
          {lc.latest_website_lead ? (
            <>
              <EvidenceRow label="Latest WebsiteLead" value={`${lc.latest_website_lead.name} — ${lc.latest_website_lead.email}`} />
              <EvidenceRow label="Lead ID" value={lc.latest_website_lead.id} />
              <EvidenceRow label="Source" value={lc.latest_website_lead.source} />
            </>
          ) : (
            <p className="text-sm text-red-600">⚠ No production-trusted WebsiteLead records found</p>
          )}
          {lc.latest_canonical_lead && (
            <>
              <EvidenceRow label="Canonical Lead" value={`${lc.latest_canonical_lead.name} — ${lc.latest_canonical_lead.lead_state}`} />
              <EvidenceRow label="Quality Status" value={lc.latest_canonical_lead.quality_review_status} />
            </>
          )}
          {lc.consent_proof ? (
            <>
              <EvidenceRow label="Consent Given" value={lc.consent_proof.consent_given ? "✓ Yes" : "✗ No"} />
              <EvidenceRow label="Consent At" value={lc.consent_proof.consent_given_at ? new Date(lc.consent_proof.consent_given_at).toLocaleString() : "—"} />
            </>
          ) : (
            <p className="text-sm text-yellow-700">⚠ Consent fields not captured on latest lead</p>
          )}
          <div className="pt-2 border-t border-border">
            <EvidenceRow label="Production Trusted Leads" value={lc.production_trusted_leads} />
            <EvidenceRow label="Test/Internal Excluded" value={lc.test_internal_excluded} />
          </div>
          <p className="text-sm text-primary font-semibold mt-2">Next: {lc.next_action}</p>
        </div>
      </SectionCard>

      {/* C. Messaging Proof */}
      <SectionCard title="C. Messaging Proof (SMS + Email)" status={msg.status}>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">SMS</p>
            {msg.latest_sms ? (
              <>
                <EvidenceRow label="To" value={msg.latest_sms.to_address} />
                <EvidenceRow label="Status" value={msg.latest_sms.delivery_status} />
                <EvidenceRow label="Provider ID" value={msg.latest_sms.provider_message_id} />
                <EvidenceRow label="Trigger" value={msg.latest_sms.trigger_name} />
              </>
            ) : (
              <p className="text-sm text-red-600">No SMS records</p>
            )}
            <div className="pt-1">
              <EvidenceRow label="Delivered" value={msg.sms_delivered_count} />
              <EvidenceRow label="Sent" value={msg.sms_sent_count} />
              <EvidenceRow label="Failed" value={msg.sms_failed_count} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Email</p>
            {msg.latest_email ? (
              <>
                <EvidenceRow label="To" value={msg.latest_email.to_address} />
                <EvidenceRow label="Status" value={msg.latest_email.delivery_status} />
                <EvidenceRow label="Provider ID" value={msg.latest_email.provider_message_id} />
                <EvidenceRow label="Subject" value={msg.latest_email.subject} />
              </>
            ) : (
              <p className="text-sm text-red-600">No email records</p>
            )}
            <div className="pt-1">
              <EvidenceRow label="Sent" value={msg.email_sent_count} />
              <EvidenceRow label="Failed" value={msg.email_failed_count} />
            </div>
          </div>
        </div>
        <div className="pt-2 border-t border-border">
          <EvidenceRow label="Skipped Internal/Test" value={msg.skipped_internal_test_count} />
        </div>
        <p className="text-sm text-primary font-semibold mt-2">Next: {msg.next_action}</p>
      </SectionCard>

      {/* D. Payment + Onboarding Proof */}
      <SectionCard title="D. Payment + Onboarding Proof" status={po.status}>
        <div className="space-y-2">
          {po.latest_paid_order ? (
            <>
              <EvidenceRow label="Latest Paid Order" value={`${po.latest_paid_order.business_name} — ${po.latest_paid_order.customer_email}`} />
              <EvidenceRow label="Order ID" value={po.latest_paid_order.id} />
              <EvidenceRow label="Package" value={po.latest_paid_order.selected_package_type} />
              <EvidenceRow label="Payment Status" value={po.latest_paid_order.payment_status} />
            </>
          ) : (
            <p className="text-sm text-red-600">⚠ No production-trusted paid Order records found</p>
          )}
          {po.latest_client_project && (
            <EvidenceRow label="Client Project" value={`${po.latest_client_project.business_name} — ${po.latest_client_project.status}`} />
          )}
          {po.latest_install_os ? (
            <>
              <EvidenceRow label="Install OS" value={`${po.latest_install_os.business_name} — ${po.latest_install_os.workflow_stage}`} />
              <EvidenceRow label="Activation Status" value={po.latest_install_os.activation_status} />
              <EvidenceRow label="Checklist %" value={`${po.latest_install_os.checklist_completion_percent}%`} />
            </>
          ) : (
            <p className="text-sm text-yellow-700">⚠ No ClientInstallationOS record linked to latest order</p>
          )}
          {po.latest_automation_checklist && (
            <>
              <EvidenceRow label="Automation Checklist" value={`${po.latest_automation_checklist.business_name} — ${po.latest_automation_checklist.service_key}`} />
              <EvidenceRow label="Twilio Configured" value={po.latest_automation_checklist.twilio_configured ? "✓ Yes" : "✗ No"} />
              <EvidenceRow label="Resend Configured" value={po.latest_automation_checklist.resend_configured ? "✓ Yes" : "✗ No"} />
            </>
          )}
        </div>
        <p className="text-sm text-primary font-semibold mt-2">Next: {po.next_action}</p>
      </SectionCard>

      {/* E. Dashboard Truth */}
      <SectionCard title="E. Dashboard Truth" status={dt.safe_to_launch ? "proof_passed" : "blocked"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Failed Jobs</p>
            <p className={`text-xl font-bold ${dt.failed_jobs > 0 ? "text-red-600" : "text-green-600"}`}>{dt.failed_jobs}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Stuck Jobs</p>
            <p className={`text-xl font-bold ${dt.stuck_jobs > 0 ? "text-red-600" : "text-green-600"}`}>{dt.stuck_jobs}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Queue Backlog</p>
            <p className={`text-xl font-bold ${dt.event_queue_backlog > 10 ? "text-red-600" : "text-green-600"}`}>{dt.event_queue_backlog}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Dead Letters</p>
            <p className={`text-xl font-bold ${dt.dead_letter_count > 0 ? "text-red-600" : "text-green-600"}`}>{dt.dead_letter_count}</p>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-border">
          <EvidenceRow label="Safe to Show Client" value={dt.safe_to_show_client ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Safe to Show Admin" value={dt.safe_to_show_admin ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Safe to Launch" value={dt.safe_to_launch ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Test Pollution Detected" value={dt.test_pollution_detected ? "Yes (excluded)" : "No"} />
          <EvidenceRow label="Production Orders" value={dt.production_orders} />
          <EvidenceRow label="Test Orders Excluded" value={dt.test_orders_excluded} />
        </div>
        <p className="text-xs text-muted-foreground italic mt-2">{dt.note}</p>
      </SectionCard>

      {/* F. GA4 / Analytics */}
      <SectionCard title="F. GA4 / Conversion Tracking" status={ga.status}>
        <div className="space-y-2">
          <EvidenceRow label="Configured" value={ga.configured ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Measurement ID" value={ga.measurement_id || "Not configured"} />
          <EvidenceRow label="Setup Status" value={ga.setup_status} />
          <EvidenceRow label="Enabled" value={ga.enabled ? "✓ Yes" : "✗ No"} />
          {ga.tracked_events?.length > 0 && (
            <EvidenceRow label="Tracked Events" value={ga.tracked_events.join(", ")} />
          )}
        </div>
        <p className="text-sm text-primary font-semibold mt-2">Next: {ga.next_action}</p>
      </SectionCard>

      {/* G. Launch Gates Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">G. Launch Gates — Truth Status</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Gate</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Blocker</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs">Next Action</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground text-xs">Completion</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground text-xs">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.gates?.map((gate) => (
                <tr key={gate.gate_key} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground text-xs">{gate.gate_name}</p>
                    <p className="text-[10px] text-muted-foreground">{gate.section_label}</p>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={gate.status} /></td>
                  <td className="px-3 py-2 text-xs text-red-700">{gate.current_blocker || "—"}</td>
                  <td className="px-3 py-2 text-xs text-foreground">{gate.next_action}</td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-foreground">{gate.completion_percent}%</td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-foreground">{gate.proof_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blockers Summary */}
      {report.blockers?.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide mb-3">Blockers Requiring Action</h3>
          <div className="space-y-2">
            {report.blockers.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">{b.gate}:</span> {b.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Action */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-1">Next Action for Admin</h3>
            <p className="text-sm text-foreground">{report.next_action}</p>
          </div>
        </div>
      </div>
    </div>
  );
}