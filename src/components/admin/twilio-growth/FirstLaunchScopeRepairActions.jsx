import { useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Wrench,
  ShieldAlert,
  FileText,
  Activity,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const REPAIR_ACTIONS = [
  {
    id: 1,
    label: "Repair SMS route 405",
    description: "Inbound SMS webhook returns 405 Method Not Allowed. Verify the route URL in Twilio console points to receiveTwilioInboundSms and accepts POST.",
    gate: "twilio_webhook_route_health",
    severity: "critical",
  },
  {
    id: 2,
    label: "Repair missed-call route 404",
    description: "Missed-call webhook returns 404 Not Found. Verify the route URL in Twilio console points to receiveTwilioMissedCallWebhook.",
    gate: "twilio_webhook_route_health",
    severity: "critical",
  },
  {
    id: 3,
    label: "Confirm status callback can update delivery state",
    description: "Verify receiveTwilioSmsStatusCallback returns 200 and updates CommunicationLog delivery_status from queued → delivered.",
    gate: "twilio_webhook_route_health",
    severity: "high",
  },
  {
    id: 4,
    label: "Run clean instant_lead_response proof after routes are healthy",
    description: "After routes return 200, send a real lead, wait for delivery callback, then create AutomationProofLog pass only if delivery_status=delivered.",
    gate: "instant_lead_response",
    severity: "high",
  },
  {
    id: 5,
    label: "Run clean missed_call_text_back proof after routes are healthy",
    description: "After routes return 200, place a real missed call, wait for text-back SMS delivery, then create AutomationProofLog pass only if delivered.",
    gate: "missed_call_text_back",
    severity: "high",
  },
  {
    id: 6,
    label: "Create AutomationProofLog records only from real evidence",
    description: "Never fabricate pass records. Each pass requires: real CommunicationLog, real provider_message_id, delivery_status=delivered, not test/smoke.",
    gate: "automation_delivery_gate",
    severity: "critical",
  },
];

export default function FirstLaunchScopeRepairActions() {
  const [routeHealth, setRouteHealth] = useState(null);
  const [gateStatus, setGateStatus] = useState(null);
  const [proofWorkflow, setProofWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedAction, setExpandedAction] = useState(null);

  const runRouteHealthCheck = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("verifyTwilioWebhookRouteHealth", {});
      setRouteHealth(res?.data || res);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Route health check failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const runGateRecalculation = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("recalculateFirstLaunchGates", {});
      setGateStatus(res?.data || res);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Gate recalculation failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProofWorkflow = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getProofWorkflowScaffolding", {});
      setProofWorkflow(res?.data || res);
    } catch (err) {
      setError(err?.data?.error || err?.message || "Proof workflow load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <h3 className="text-sm font-bold text-gray-900">First-Launch Scope Repair Actions</h3>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-gray-400">Admin Only</span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          These repair actions must be completed in order. No public claims should be made until all
          actions are complete and proof logs exist. Routes must be healthy before proof generation.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={runRouteHealthCheck}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <Activity className="w-3.5 h-3.5" />
          Check Route Health
        </button>
        <button
          onClick={runGateRecalculation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Recalculate Gates
        </button>
        <button
          onClick={loadProofWorkflow}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          <FileText className="w-3.5 h-3.5" />
          Load Proof Workflow
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs text-red-600 font-semibold">{error}</p>
        </div>
      )}

      {/* Route health results */}
      {routeHealth && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-bold text-gray-900 mb-3">Webhook Route Health</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {routeHealth.route_health &&
              Object.entries(routeHealth.route_health).map(([key, health]) => (
                <div
                  key={key}
                  className="rounded-lg border p-3"
                  style={{
                    borderColor: health.healthy ? "rgba(5,150,105,0.2)" : "rgba(220,38,38,0.2)",
                    background: health.healthy ? "rgba(5,150,105,0.03)" : "rgba(220,38,38,0.02)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {health.healthy ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs font-bold text-gray-900">{key}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    HTTP {health.http_status || "N/A"} {health.error ? `— ${health.error}` : ""}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{health.url}</p>
                </div>
              ))}
          </div>
          {!routeHealth.all_healthy && routeHealth.blockers && (
            <div className="mt-3 space-y-1">
              {routeHealth.blockers.map((b, i) => (
                <p key={i} className="text-xs text-red-600 font-medium">⚠ {b}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Gate recalculation results */}
      {gateStatus && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-bold text-gray-900 mb-3">LaunchGate Recalculation</h4>
          <div className="space-y-2">
            {gateStatus.gates &&
              Object.entries(gateStatus.gates).map(([key, gate]) => (
                <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
                    style={{
                      color: gate.status === "blocked" ? "#DC2626" : gate.status === "partial" ? "#D97706" : "#059669",
                      background:
                        gate.status === "blocked"
                          ? "rgba(220,38,38,0.06)"
                          : gate.status === "partial"
                            ? "rgba(217,119,6,0.06)"
                            : "rgba(5,150,105,0.06)",
                    }}
                  >
                    {gate.status}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900">{key}</p>
                    <p className="text-[11px] text-gray-500">{gate.current_blocker || "No blockers"}</p>
                    <p className="text-[10px] text-gray-400">→ {gate.next_action}</p>
                  </div>
                </div>
              ))}
          </div>
          {gateStatus.checklist_warnings && gateStatus.checklist_warnings.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">
                Checklist Truth Warnings
              </p>
              {gateStatus.checklist_warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-amber-700">
                  ⚠ {w.business_name} ({w.service_key}): {w.warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof workflow results */}
      {proofWorkflow && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-bold text-gray-900 mb-3">Proof Workflow Scaffolding</h4>
          <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600 mb-1">
              AutomationProofLog Count: {proofWorkflow.proof_log_count}
            </p>
            <p className="text-[11px] text-blue-700">
              {proofWorkflow.proof_logs_exist
                ? "Proof logs exist — review them below."
                : "No proof logs exist. Create them only from real evidence."}
            </p>
          </div>
          {proofWorkflow.workflows &&
            Object.entries(proofWorkflow.workflows).map(([key, wf]) => (
              <div key={key} className="mb-4 rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-bold text-gray-900">{wf.label}</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold flex-shrink-0"
                    style={{
                      color:
                        wf.evidence?.overall_status === "ready_for_proof"
                          ? "#059669"
                          : wf.evidence?.overall_status === "pending"
                            ? "#D97706"
                            : "#DC2626",
                      background:
                        wf.evidence?.overall_status === "ready_for_proof"
                          ? "rgba(5,150,105,0.06)"
                          : wf.evidence?.overall_status === "pending"
                            ? "rgba(217,119,6,0.06)"
                            : "rgba(220,38,38,0.06)",
                    }}
                  >
                    {wf.evidence?.overall_status || "unknown"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">{wf.warning}</p>
                {wf.steps && (
                  <ol className="space-y-1">
                    {wf.steps.map((step, i) => (
                      <li key={i} className="text-[11px] text-gray-600 flex items-start gap-1.5">
                        <span className="text-gray-300 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Repair action checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-gray-400" />
          <h4 className="text-xs font-bold text-gray-900">Repair Action Checklist</h4>
        </div>
        <div className="space-y-1">
          {REPAIR_ACTIONS.map((action) => (
            <div key={action.id}>
              <button
                onClick={() => setExpandedAction(expandedAction === action.id ? null : action.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                {expandedAction === action.id ? (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
                <AlertTriangle
                  className="w-3.5 h-3.5 flex-shrink-0"
                  style={{ color: action.severity === "critical" ? "#DC2626" : "#D97706" }}
                />
                <span className="text-xs font-semibold text-gray-700">{action.label}</span>
                <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  {action.gate}
                </span>
              </button>
              {expandedAction === action.id && (
                <p className="px-8 pb-2 text-[11px] text-gray-500 leading-relaxed">
                  {action.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}