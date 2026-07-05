import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AdminShell from "@/components/admin/AdminShell";
import { ShieldCheck, RefreshCw, Loader2 } from "lucide-react";
import SummaryCards from "@/components/admin/ops-verification/SummaryCards";
import Sprint1Panel from "@/components/admin/ops-verification/Sprint1Panel";
import Sprint1ApprovalPanel from "@/components/admin/ops-verification/Sprint1ApprovalPanel";
import Sprint1ApprovalSummary from "@/components/admin/ops-verification/Sprint1ApprovalSummary";
import RouteHealthPanel from "@/components/admin/ops-verification/RouteHealthPanel";
import ProofLogEvidencePanel from "@/components/admin/ops-verification/ProofLogEvidencePanel";
import ChecklistReconciliationPanel from "@/components/admin/ops-verification/ChecklistReconciliationPanel";
import FullPlatformGatesPanel from "@/components/admin/ops-verification/FullPlatformGatesPanel";
import HistoricalRecordsPanel from "@/components/admin/ops-verification/HistoricalRecordsPanel";
import InboundFollowupReadinessPanel from "@/components/admin/ops-verification/InboundFollowupReadinessPanel";
import Sprint2Panel from "@/components/admin/ops-verification/Sprint2Panel";
import Sprint2ScaffoldingPanel from "@/components/admin/ops-verification/Sprint2ScaffoldingPanel";
import Phase4OnboardingPanel from "@/components/admin/ops-verification/Phase4OnboardingPanel";
import Phase5ClientPortalPanel from "@/components/admin/ops-verification/Phase5ClientPortalPanel";
import Phase4And5SummaryCard from "@/components/admin/ops-verification/Phase4And5SummaryCard";

export default function OperationsVerificationCenter() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        gates,
        proofLogs,
        truthChecks,
        readinessStates,
        checklists,
        settingsRecords,
      ] = await Promise.all([
        base44.entities.LaunchGate.list("", 50).catch(() => []),
        base44.entities.AutomationProofLog.list("-created_date", 20).catch(() => []),
        base44.entities.DashboardTruthCheck.list("-created_date", 10).catch(() => []),
        base44.entities.LaunchReadinessState.list("-created_date", 10).catch(() => []),
        base44.entities.AutomationChecklist.filter(
          { service_key: { $in: ["instant_lead_response", "missed_call_text_back", "inbound_sms_assistant", "nurture_sequence_14d", "ai_booking_agent"] } },
          "-created_date",
          20
        ).catch(() => []),
        base44.entities.AdminSettings.list("-created_date", 1).catch(() => []),
      ]);

      setData({
        gates: gates || [],
        proofLogs: proofLogs || [],
        truthChecks: truthChecks || [],
        readinessStates: readinessStates || [],
        checklists: checklists || [],
        adminSettings: (settingsRecords || [])[0] || null,
      });
    } catch (err) {
      setError(err.message || "Failed to load verification data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <AdminShell title="Operations Verification Center" activeId="ops-verification">
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Operations Verification Center</h1>
              <p className="text-xs text-gray-400">Read-only verification of proven, QA-only, approved, blocked, and next-action status</p>
            </div>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm font-bold text-red-700">Error loading data</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}

        {loading && !data.gates ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Summary Cards */}
            <SummaryCards
              gates={data.gates}
              proofLogs={data.proofLogs}
              dashTruth={data.truthChecks?.[0]}
              readinessState={data.readinessStates?.[0]}
              checklists={data.checklists}
            />

            {/* 2. Sprint 1 Panel */}
            <Sprint1Panel gates={data.gates} />

            {/* 2a. Priority 1 — Inbound Follow-Up Readiness (non-sending) */}
            <InboundFollowupReadinessPanel />

            {/* 2b. Sprint 1 Approval Summary */}
            <Sprint1ApprovalSummary
              gates={data.gates}
              readinessState={data.readinessStates?.[0]}
            />

            {/* 2c. Sprint 1 Approval Layer */}
            <Sprint1ApprovalPanel
              gates={data.gates}
              proofLogs={data.proofLogs}
              checklists={data.checklists}
              onDecisionMade={fetchAll}
            />

            {/* 2d. Sprint 2 — Inbound SMS + Nurture */}
            <Sprint2Panel gates={data.gates} proofLogs={data.proofLogs} checklists={data.checklists} />

            {/* 2e. Sprint 2 Scaffolding — Proof Workflows, Cadence & Rules */}
            <Sprint2ScaffoldingPanel />

            {/* ── Phase 4 + 5 Combined Readiness Summary ── */}
            <Phase4And5SummaryCard />

            {/* Phase 4 — Client Onboarding + Installation OS */}
            <Phase4OnboardingPanel />

            {/* Phase 5 — Client Portal + Status Updates */}
            <Phase5ClientPortalPanel />

            {/* 3. Route Health */}
            <RouteHealthPanel adminSettings={data.adminSettings} routeGate={data.gates?.find((g) => g.gate_key === "twilio_webhook_route_health")} />

            {/* 4. Proof Log Evidence */}
            <ProofLogEvidencePanel proofLogs={data.proofLogs} />

            {/* 5. Checklist Reconciliation */}
            <ChecklistReconciliationPanel
              gates={data.gates}
              proofLogs={data.proofLogs}
              checklists={data.checklists}
              onApproved={fetchAll}
            />

            {/* 6. Full Platform Gates */}
            <FullPlatformGatesPanel gates={data.gates} />

            {/* 7. Historical Records */}
            <HistoricalRecordsPanel
              truthChecks={data.truthChecks}
              readinessStates={data.readinessStates}
            />
          </div>
        )}

        {/* Footer note */}
        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-[11px] text-gray-400">
            Operations Verification Center v2 — Sprint 1 approval layer is admin-writable. All other panels remain read-only.
            Internal launch approval preserves evidence_quality as internal_test and does NOT imply public/client launch readiness.
            Evidence quality is classified by email/business name patterns. QA proof does not equal production live.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}