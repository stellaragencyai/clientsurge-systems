import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, Clock, XCircle, Loader2, Shield, Globe,
  Palette, Plug, Beaker, FileCheck, Rocket, AlertCircle, Phone,
} from "lucide-react";

const SERVICE_NAMES = {
  instant_lead_response: "Instant Lead Response",
  missed_call_text_back: "Missed Call Text-Back",
  nurture_sequence_14d: "14-Day Nurture Sequence",
  ai_booking_agent: "AI Booking Agent",
  daily_lead_digest: "Daily Lead Digest",
  inbound_sms_assistant: "Inbound SMS Assistant",
};

const LAUNCH_STAGES = [
  { id: "payment", label: "Payment Received", icon: CheckCircle2 },
  { id: "authorization", label: "Authorization Accepted", icon: Shield },
  { id: "website_scan", label: "Website Scanned", icon: Globe },
  { id: "business_profile", label: "Business Profile Built", icon: Palette },
  { id: "access_submitted", label: "Access Submitted", icon: Plug },
  { id: "access_verified", label: "Access Verified", icon: Plug },
  { id: "blueprint_approved", label: "Blueprint Approved", icon: FileCheck },
  { id: "automations_configured", label: "Six Automations Configured", icon: CheckCircle2 },
  { id: "simulation_completed", label: "Simulation Lab Completed", icon: Beaker },
  { id: "proof_logs_passed", label: "Proof Logs Passed", icon: FileCheck },
  { id: "client_go_live", label: "Client Go-Live Approval", icon: Rocket },
  { id: "system_live", label: "System Live", icon: Rocket },
];

export default function LaunchControlCenter({ orderId }) {
  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderId) loadData();
  }, [orderId]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderResult, readinessResult, checklistsResult, proofsResult] = await Promise.all([
        base44.functions.invoke("getOrderStatus", { order_id: orderId }),
        base44.functions.invoke("evaluateGoLiveReadiness", { order_id: orderId }),
        base44.entities.AutomationChecklist.filter({ order_id: orderId }, "-created_date", 50),
        base44.entities.AutomationProofLog.filter({ order_id: orderId }, "-created_date", 50),
      ]);

      setOrder(orderResult?.order || null);
      setReadiness(readinessResult);
      setChecklists(checklistsResult || []);
      setProofs(proofsResult || []);
    } catch (err) {
      setError("Failed to load launch control data.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveGoLive = async () => {
    if (!readiness?.go_live_ready && !readiness?.admin_override) {
      setError("Go-live is blocked until all six proof gates pass.");
      return;
    }
    try {
      await base44.entities.ClientInstallationOS.update(readiness?.install_os_id, {
        activation_status: "live",
        activation_approved_at: new Date().toISOString(),
        activation_approved_by: order?.customer_email || "client",
        went_live_at: new Date().toISOString(),
      });
      loadData();
    } catch {
      setError("Failed to approve go-live.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedStages = [];
  if (order?.payment_status === "paid") completedStages.push("payment");
  if (readiness?.admin_override || readiness?.all_proofs_passed) completedStages.push("authorization");
  if (checklists.length > 0) completedStages.push("automations_configured");

  const goLiveReady = readiness?.go_live_ready;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Launch Stages Progress */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Launch Progress</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LAUNCH_STAGES.map((stage) => {
            const isDone = completedStages.includes(stage.id);
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isDone ? "border-green-200 bg-green-50" : "border-border bg-muted/20"
                }`}
              >
                <Icon className={`w-5 h-5 ${isDone ? "text-green-600" : "text-muted-foreground"}`} />
                <span className={`text-sm font-medium ${isDone ? "text-green-700" : "text-muted-foreground"}`}>
                  {stage.label}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Automation Cards */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Six Pro Automations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(SERVICE_NAMES).map(([key, name]) => {
            const checklist = checklists.find((c) => c.service_key === key);
            const proof = proofs.find((p) => p.service_key === key);
            const proofStatus = proof?.status || "pending";
            const checklistStatus = checklist?.status || "missing";

            return (
              <div key={key} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  {proofStatus === "pass" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : proofStatus === "fail" ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-muted-foreground">Status: <span className="font-medium text-foreground">{checklistStatus}</span></p>
                  <p className="text-muted-foreground">Proof: <span className={`font-medium ${proofStatus === "pass" ? "text-green-600" : proofStatus === "fail" ? "text-red-600" : "text-muted-foreground"}`}>{proofStatus}</span></p>
                  {proof?.tested_at && (
                    <p className="text-muted-foreground">Last tested: {new Date(proof.tested_at).toLocaleDateString()}</p>
                  )}
                  {proof?.failure_reason && (
                    <p className="text-red-600">Blocker: {proof.failure_reason}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Go-Live Action */}
      <div className="rounded-2xl border-2 border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Go-Live Approval</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {goLiveReady
                ? "✅ All proof gates passed. You can approve go-live."
                : `⛔ ${readiness?.blockers?.length || 0} blockers remaining before go-live.`}
            </p>
            {readiness?.blockers?.length > 0 && (
              <ul className="mt-2 space-y-1">
                {readiness.blockers.slice(0, 5).map((b, i) => (
                  <li key={i} className="text-xs text-red-600">• {b}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={handleApproveGoLive}
            disabled={!goLiveReady}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: goLiveReady ? "linear-gradient(135deg,#059669,#10b981)" : "#9ca3af" }}
          >
            <Rocket className="w-4 h-4" /> Approve Go-Live
          </button>
        </div>
      </div>
    </div>
  );
}