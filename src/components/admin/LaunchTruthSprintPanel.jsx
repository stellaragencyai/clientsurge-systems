import { useState, useEffect, useCallback } from "react";
import { Loader2, RefreshCw, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, Clock, XCircle, ExternalLink, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SingleNextAction from "./launch-truth/SingleNextAction";
import ProductionTrustFilterExplainer from "./launch-truth/ProductionTrustFilterExplainer";
import StripeProofCard from "./launch-truth/StripeProofCard";
import GA4ProofCard from "./launch-truth/GA4ProofCard";
import CTAProofCard from "./launch-truth/CTAProofCard";
import LeadCaptureProofCard from "./launch-truth/LeadCaptureProofCard";
import BookingProofCard from "./launch-truth/BookingProofCard";

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

const GATE_FILTERS = [
  { id: "all", label: "All" },
  { id: "blocked", label: "Blocked" },
  { id: "ready_for_proof", label: "Ready for Proof" },
  { id: "approved", label: "Approved" },
  { id: "needs_manual_action", label: "Needs Manual Action" },
];

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

function SummaryCard({ label, value, color, icon: Icon }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {Icon && <Icon className={`w-4 h-4 ${color}`} />}
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
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
  const [gateFilter, setGateFilter] = useState("all");

  const runSprint = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("runLaunchTruthSprint", {});
      setReport(res.data);
    } catch (err) {
      setError(err?.message || "Failed to run Launch Truth Sprint.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { runSprint(); }, [runSprint]);

  // Sort priority: blocked first, then needs action, then approved
  const GATE_SORT_PRIORITY = {
    blocked: 0,
    proof_failed: 1,
    partial: 2,
    ready_for_proof: 3,
    proof_running: 4,
    locked: 5,
    waived: 6,
    proof_passed: 7,
    approved: 8,
  };

  const filteredGates = (report?.gates || [])
    .filter(g => {
      if (gateFilter === "all") return true;
      if (gateFilter === "blocked") return g.status === "blocked";
      if (gateFilter === "ready_for_proof") return g.status === "ready_for_proof";
      if (gateFilter === "approved") return g.status === "approved" || g.status === "proof_passed";
      if (gateFilter === "needs_manual_action") return g.status === "ready_for_proof" || g.status === "partial";
      return true;
    })
    .sort((a, b) => {
      const pa = GATE_SORT_PRIORITY[a.status] ?? 9;
      const pb = GATE_SORT_PRIORITY[b.status] ?? 9;
      return pa - pb;
    });

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
  const sp = s.stripe_payment || {};
  const po = s.payment_onboarding || {};
  const aj = s.automation_job_audit || {};
  const ga = s.ga4 || {};
  const ps = s.public_site || {};
  const bp = s.booking_proof || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Launch Truth Sprint</h2>
          <p className="text-sm text-muted-foreground mt-1">Real evidence for the lead-to-payment-to-onboarding path. No fake passes.</p>
        </div>
        <button onClick={runSprint} disabled={loading} className="cs-btn-primary inline-flex items-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Running..." : "Re-run Sprint"}
        </button>
      </div>

      {/* Safe to Launch Banner */}
      <div className={`rounded-xl border p-5 flex items-center gap-4 ${report.safe_to_launch ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
        {report.safe_to_launch ? <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" /> : <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />}
        <div className="flex-1">
          <p className={`text-lg font-bold ${report.safe_to_launch ? "text-green-900" : "text-red-900"}`}>
            {report.safe_to_launch ? "Safe to Launch" : "NOT Safe to Launch"}
          </p>
          <p className={`text-sm ${report.safe_to_launch ? "text-green-800" : "text-red-800"}`}>
            {report.safe_to_launch ? "All gates passed or ready for proof with no production blockers." : `${report.production_blocker_count} production blocker(s) and ${report.internal_cleanup_count} internal/test cleanup item(s).`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Run at</p>
          <p className="text-sm font-semibold text-foreground">{new Date(report.run_at).toLocaleString()}</p>
        </div>
      </div>

      {/* Single Next Action */}
      <SingleNextAction report={report} onRerun={runSprint} />

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryCard label="Total Gates" value={report.total_gates} color="text-gray-700" icon={ShieldCheck} />
        <SummaryCard label="Blocked" value={report.gates_blocked} color="text-red-600" icon={AlertCircle} />
        <SummaryCard label="Ready for Proof" value={report.gates_ready_for_proof} color="text-blue-600" icon={Clock} />
        <SummaryCard label="Passed/Approved" value={report.gates_proof_passed + report.gates_approved} color="text-green-600" icon={CheckCircle2} />
        <SummaryCard label="Prod Blockers" value={report.production_blocker_count} color="text-red-600" icon={AlertTriangle} />
        <SummaryCard label="Internal Cleanup" value={report.internal_cleanup_count} color="text-yellow-600" icon={AlertCircle} />
      </div>

      {/* Production Trust Filter Explainer */}
      <ProductionTrustFilterExplainer />

      {/* ═══ Production Proof Assistant ═══ */}
      <div className="pt-2">
        <h2 className="text-lg font-bold text-foreground mb-1">Production Proof Assistant</h2>
        <p className="text-sm text-muted-foreground mb-4">Guided workflow for completing manual/external proof steps. No gate is marked as passed without real evidence.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <StripeProofCard stripeData={s.stripe_payment} onboardingData={s.payment_onboarding} onRerun={runSprint} loading={loading} />
        <GA4ProofCard ga4Data={s.ga4} loading={loading} />
        <CTAProofCard publicSiteData={s.public_site} onRerun={runSprint} loading={loading} />
        <LeadCaptureProofCard leadCaptureData={s.lead_capture} />
        <BookingProofCard bookingData={s.booking_proof} onRerun={runSprint} loading={loading} />
      </div>

      {/* A. Public Site Cleanliness */}
      <SectionCard title="A. Public Site Cleanliness">
        <div className="space-y-2">
          <EvidenceRow label="Public Routes Verified" value={ps.public_routes_verified ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Internal Routes Hidden" value={ps.internal_routes_hidden ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Sitemap Status" value={ps.sitemap_status} />
          <EvidenceRow label="Robots Status" value={ps.robots_status} />
          <EvidenceRow label="CTA Status" value={ps.cta_status} />
          {ps.cta_checks && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-1">CTA Proof Checklist (desktop + mobile)</p>
              {ps.cta_checks.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-muted/20 rounded px-2 py-1.5">
                  <span className="text-foreground font-medium">{c.route}: {c.cta}</span>
                  <span className="flex gap-1">
                    <span className={c.desktop_proof ? "text-green-600" : "text-gray-400"}>Desktop {c.desktop_proof ? "✓" : "○"}</span>
                    <span className={c.mobile_proof ? "text-green-600" : "text-gray-400"}>Mobile {c.mobile_proof ? "✓" : "○"}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
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
          ) : <p className="text-sm text-red-600">⚠ No production-trusted WebsiteLead records found</p>}
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
          ) : <p className="text-sm text-yellow-700">⚠ Consent fields not captured on latest lead</p>}
          {lc.linked_comm_logs?.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Linked Communication Logs</p>
              {lc.linked_comm_logs.map((log, i) => (
                <div key={i} className="text-xs bg-muted/20 rounded px-2 py-1.5 mb-1 flex items-center justify-between">
                  <span className="text-foreground">{log.channel} — {log.trigger_name}</span>
                  <span className={log.delivery_status === "delivered" ? "text-green-600 font-semibold" : "text-yellow-700"}>{log.delivery_status}</span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-2 border-t border-border">
            <EvidenceRow label="Production Trusted Leads" value={lc.production_trusted_leads} />
            <EvidenceRow label="Test/Internal Excluded" value={lc.test_internal_excluded} />
          </div>
          <p className="text-sm text-primary font-semibold mt-2">Next: {lc.next_action}</p>
        </div>
      </SectionCard>

      {/* C. Messaging Proof */}
      <SectionCard title="C. Messaging Proof (SMS + Email)" status={msg.sms_status === "blocked" || msg.email_status === "blocked" ? "blocked" : "ready_for_proof"}>
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
            ) : <p className="text-sm text-red-600">No SMS records</p>}
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
            ) : <p className="text-sm text-red-600">No email records</p>}
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

      {/* D. Stripe Payment Proof */}
      <SectionCard title="D. Stripe Payment Proof" status={sp.status}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-green-50 border border-green-200">
            <p className="text-xs text-muted-foreground">Prod Trusted Paid</p>
            <p className="text-xl font-bold text-green-700">{sp.production_trusted_paid_count}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-50 border border-yellow-200">
            <p className="text-xs text-muted-foreground">Paid but Excluded</p>
            <p className="text-xl font-bold text-yellow-700">{sp.paid_but_excluded_count}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-bold text-blue-700">{sp.pending_payment_count}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-xl font-bold text-red-700">{sp.failed_payment_count}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-xs text-muted-foreground">Internal/Test Excluded</p>
            <p className="text-xl font-bold text-gray-600">{sp.internal_test_excluded_count}</p>
          </div>
        </div>
        <div className="space-y-2">
          {sp.latest_paid_order ? (
            <>
              <EvidenceRow label="Latest Paid Order" value={`${sp.latest_paid_order.business_name} — ${sp.latest_paid_order.customer_email}`} />
              <EvidenceRow label="Order ID" value={sp.latest_paid_order.id} />
              <EvidenceRow label="Package" value={sp.latest_paid_order.selected_package_type} />
              <EvidenceRow label="Payment Status" value={sp.latest_paid_order.payment_status} />
              <EvidenceRow label="Has Stripe IDs" value={sp.latest_paid_order.has_stripe_ids ? "✓ Yes" : "✗ No"} />
            </>
          ) : <p className="text-sm text-red-600">⚠ No production-trusted paid Order records found</p>}
        </div>
        {sp.paid_but_excluded?.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-bold uppercase text-yellow-700 mb-1">Paid but Excluded (not production proof)</p>
            {sp.paid_but_excluded.map((o, i) => (
              <div key={i} className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5 mb-1">
                <span className="font-semibold text-foreground">{o.business_name}</span>
                <span className="text-yellow-700"> — {o.exclusion_reason}</span>
              </div>
            ))}
          </div>
        )}
        {sp.internal_test_excluded?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Internal/Test Excluded</p>
            {sp.internal_test_excluded.slice(0, 3).map((o, i) => (
              <div key={i} className="text-xs bg-muted/20 rounded px-2 py-1.5 mb-1">
                <span className="font-semibold text-foreground">{o.business_name}</span>
                <span className="text-muted-foreground"> — {o.exclusion_reason}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-primary font-semibold mt-2">Next: {sp.next_action}</p>
      </SectionCard>

      {/* D2. Payment + Onboarding Proof */}
      <SectionCard title="D2. Payment + Onboarding Proof" status={po.status}>
        <div className="space-y-2">
          {po.latest_paid_order ? (
            <>
              <EvidenceRow label="Latest Paid Order" value={`${po.latest_paid_order.business_name} — ${po.latest_paid_order.customer_email}`} />
              <EvidenceRow label="Order ID" value={po.latest_paid_order.id} />
              <EvidenceRow label="Package" value={po.latest_paid_order.selected_package_type} />
            </>
          ) : <p className="text-sm text-red-600">⚠ No production-trusted paid Order records found</p>}
          {po.latest_client_project && <EvidenceRow label="Client Project" value={`${po.latest_client_project.business_name} — ${po.latest_client_project.status}`} />}
          {po.latest_install_os ? (
            <>
              <EvidenceRow label="Install OS" value={`${po.latest_install_os.business_name} — ${po.latest_install_os.workflow_stage}`} />
              <EvidenceRow label="Activation Status" value={po.latest_install_os.activation_status} />
              <EvidenceRow label="Checklist %" value={`${po.latest_install_os.checklist_completion_percent}%`} />
            </>
          ) : <p className="text-sm text-yellow-700">⚠ No ClientInstallationOS record linked to latest order</p>}
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

      {/* E. Automation Job Truth Audit */}
      <SectionCard title="E. Automation Job Truth Audit" status={dt.safe_to_launch ? "proof_passed" : "blocked"}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Queued</p>
            <p className="text-xl font-bold text-gray-700">{aj.total_by_status?.queued || 0}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Processing</p>
            <p className="text-xl font-bold text-blue-600">{aj.total_by_status?.processing || 0}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-xl font-bold text-green-600">{aj.total_by_status?.completed || 0}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-xl font-bold text-red-600">{aj.total_by_status?.failed || 0}</p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-3">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-red-700">Production-Trusted</p>
            <EvidenceRow label="Failed" value={aj.production_trusted?.failed || 0} />
            <EvidenceRow label="Stuck" value={aj.production_trusted?.stuck || 0} />
            <EvidenceRow label="Dead Letters" value={aj.production_trusted?.dead_letters || 0} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-yellow-700">Internal/Test (Cleanup)</p>
            <EvidenceRow label="Failed" value={aj.internal_test?.failed || 0} />
            <EvidenceRow label="Stuck" value={aj.internal_test?.stuck || 0} />
            <EvidenceRow label="Dead Letters" value={aj.internal_test?.dead_letters || 0} />
          </div>
        </div>
        {aj.top_production_failed?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-bold uppercase text-red-700 mb-1">Top Production Failed Jobs (max 10)</p>
            {aj.top_production_failed.map((j, i) => (
              <div key={i} className="text-xs bg-red-50 border border-red-200 rounded px-2 py-1.5 mb-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{j.job_type}</span>
                  <span className="text-red-600">{new Date(j.created_date).toLocaleDateString()}</span>
                </div>
                <p className="text-red-700 mt-0.5 text-[11px]">Error: {j.last_error}</p>
                <p className="text-muted-foreground mt-0.5 text-[11px]">Lead ID: {j.lead_id} — {j.next_action}</p>
              </div>
            ))}
          </div>
        )}
        {aj.top_internal_failed?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-bold uppercase text-yellow-700 mb-1">Top Internal/Test Failed (cleanup, not blockers)</p>
            {aj.top_internal_failed.map((j, i) => (
              <div key={i} className="text-xs bg-yellow-50 border border-yellow-200 rounded px-2 py-1.5 mb-1">
                <span className="font-semibold text-foreground">{j.job_type}</span>
                <span className="text-yellow-700"> — {j.exclusion_reason}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground italic mt-2">{aj.note}</p>
      </SectionCard>

      {/* E2. Dashboard Truth Summary */}
      <SectionCard title="E2. Dashboard Truth" status={dt.safe_to_launch ? "proof_passed" : "blocked"}>
        <div className="space-y-2">
          <EvidenceRow label="Safe to Show Client" value={dt.safe_to_show_client ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Safe to Show Admin" value={dt.safe_to_show_admin ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Safe to Launch" value={dt.safe_to_launch ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Test Pollution Detected" value={dt.test_pollution_detected ? "Yes (excluded)" : "No"} />
          <EvidenceRow label="Production Orders" value={dt.production_orders} />
          <EvidenceRow label="Test Orders Excluded" value={dt.test_orders_excluded} />
          <EvidenceRow label="Production Leads" value={dt.production_leads} />
          <EvidenceRow label="Test Leads Excluded" value={dt.test_leads_excluded} />
          <EvidenceRow label="Failed Jobs (Total)" value={dt.failed_jobs_total} />
          <EvidenceRow label="Failed Jobs (Production)" value={dt.failed_jobs_production} />
          <EvidenceRow label="Failed Jobs (Internal)" value={dt.failed_jobs_internal} />
          <EvidenceRow label="Event Queue Backlog" value={dt.event_queue_backlog} />
        </div>
        <p className="text-xs text-muted-foreground italic mt-2">{dt.note}</p>
      </SectionCard>

      {/* F. GA4 / Analytics */}
      <SectionCard title="F. GA4 / Conversion Tracking" status={ga.status}>
        <div className="space-y-2">
          <EvidenceRow label="GA4 Record Exists" value={ga.record_exists ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Measurement ID" value={ga.measurement_id || "Not configured"} />
          <EvidenceRow label="ID Format Valid" value={ga.measurement_id_valid ? "✓ Yes" : "✗ No (expected G-XXXXXXX)"} />
          <EvidenceRow label="Tracking Enabled" value={ga.tracking_enabled ? "✓ Yes" : "✗ No"} />
          <EvidenceRow label="Setup Status" value={ga.setup_status} />
          <EvidenceRow label="Has Tracking Proof" value={ga.has_tracking_proof ? "✓ Yes" : "✗ No"} />
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Expected Events</p>
          <div className="flex flex-wrap gap-1.5">
            {ga.expected_events?.map(ev => (
              <span key={ev} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ga.tracked_events?.includes(ev) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {ga.tracked_events?.includes(ev) ? "✓" : "✗"} {ev}
              </span>
            ))}
          </div>
          {ga.missing_events?.length > 0 && (
            <p className="text-xs text-red-600 mt-1">Missing: {ga.missing_events.join(", ")}</p>
          )}
        </div>
        <p className="text-sm text-primary font-semibold mt-2">Next: {ga.next_action}</p>
      </SectionCard>

      {/* G. Launch Gates Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">G. Launch Gates — Truth Status</h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {GATE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setGateFilter(f.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${gateFilter === f.id ? "bg-gray-900 text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">Gate</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs whitespace-nowrap">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground text-xs min-w-[200px]">Blocker / Next Action</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground text-xs whitespace-nowrap">Completion</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground text-xs whitespace-nowrap">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredGates.length === 0 ? (
                <tr><td colSpan="5" className="px-3 py-6 text-center text-muted-foreground text-sm">No gates match this filter</td></tr>
              ) : filteredGates.map(gate => (
                <tr key={gate.gate_key} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-medium text-foreground text-xs">{gate.gate_name}</p>
                    <p className="text-[10px] text-muted-foreground">{gate.section_label}</p>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={gate.status} /></td>
                  <td className="px-3 py-2 text-xs">
                    {gate.current_blocker && <p className="text-red-700 mb-0.5"><strong>Blocker:</strong> {gate.current_blocker}</p>}
                    <p className="text-foreground"><strong>Next:</strong> {gate.next_action}</p>
                  </td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-foreground whitespace-nowrap">{gate.completion_percent}%</td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-foreground whitespace-nowrap">{gate.proof_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Launch Blockers */}
      {report.production_blockers?.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Production Launch Blockers
          </h3>
          <div className="space-y-2">
            {report.production_blockers.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div><span className="font-semibold">{b.gate}:</span> {b.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal/Test Cleanup Items */}
      {report.internal_cleanup_items?.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h3 className="text-sm font-bold text-yellow-900 uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Internal/Test Cleanup Items (not launch blockers)
          </h3>
          <div className="space-y-2">
            {report.internal_cleanup_items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div><span className="font-semibold">{item.gate}:</span> {item.message}</div>
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