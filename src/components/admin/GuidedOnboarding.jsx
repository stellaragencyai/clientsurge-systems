import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, CreditCard, Loader2, MessageSquare, RefreshCw, Rocket, Settings, ShieldCheck, Users, Zap } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STEPS = [
  [1, "Stripe Payment Connected", "Verify Stripe live payment proof.", CreditCard, "stripe"],
  [2, "Lead Capture Live", "Confirm the website lead form is capturing production leads.", Users, "leads"],
  [3, "Messaging Providers Active", "Twilio SMS and Resend Email are responding to live checks.", MessageSquare, "messaging"],
  [4, "Automation Configured", "Instant response and follow-up sequences are wired.", Zap, "automation"],
  [5, "Booking Flow Ready", "Booking link is set and the appointment booking path is functional.", Calendar, "booking"],
  [6, "Launch Truth Sprint Passed", "Run the Launch Truth Sprint and clear blockers.", ShieldCheck, "launch_truth"],
  [7, "Go Live", "All checks passed. System is safe to launch.", Rocket, "go_live"],
].map(([id, title, description, icon, checkKey]) => ({ id, title, description, icon, checkKey }));

function isValidUrl(value) {
  try {
    const url = new URL(value || "");
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function GuidedOnboarding({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [sprintData, setSprintData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [sprintRes, healthRes] = await Promise.all([
        base44.functions.invoke("runLaunchTruthSprint", {}).catch(() => null),
        base44.functions.invoke("getIntegrationHealth", {}).catch(() => null),
      ]);
      setSprintData(sprintRes?.data || null);
      setHealthData(healthRes?.data || null);
    } catch (err) {
      setError(err?.message || "Failed to load launch status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const gate = (key) => (sprintData?.gates || []).find((item) => item.gate_key === key) || null;

  const statusFor = (step) => {
    if (!sprintData) return "pending";
    if (step.checkKey === "stripe") return "waived";
    if (step.checkKey === "leads") return (sprintData.sections?.lead_capture?.production_trusted_leads || 0) > 0 ? "done" : "pending";
    if (step.checkKey === "messaging") {
      const integrations = healthData?.integrations || [];
      return integrations.find((item) => item.id === "twilio")?.live_ping_ok && integrations.find((item) => item.id === "resend")?.live_ping_ok ? "done" : "pending";
    }
    if (step.checkKey === "automation") {
      return (sprintData.sections?.automation_job_audit?.production_trusted?.failed || 0) === 0 && (sprintData.sections?.lead_capture?.production_trusted_leads || 0) > 0 ? "done" : "pending";
    }
    if (step.checkKey === "booking") {
      const proof = sprintData.sections?.booking_proof || {};
      const gateStatus = gate("booking_flow_gate")?.status;
      return isValidUrl(proof.booking_link_default) || (proof.link_present && proof.link_looks_valid) || ["ready_for_proof", "proof_passed", "approved"].includes(gateStatus) ? "done" : "pending";
    }
    if (step.checkKey === "launch_truth" || step.checkKey === "go_live") return sprintData.safe_to_launch ? "done" : "pending";
    return "pending";
  };

  const statuses = STEPS.map((step) => ({ step, status: statusFor(step) }));
  const completeCount = statuses.filter((item) => item.status === "done").length;
  const waivedCount = statuses.filter((item) => item.status === "waived").length;
  const progressedCount = statuses.filter((item) => item.status === "done" || item.status === "waived").length;
  const currentStep = statuses.find((item) => item.status !== "done" && item.status !== "waived")?.step;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div><h2 className="text-2xl font-bold text-foreground">Launch Guide</h2><p className="text-sm text-muted-foreground mt-1">Follow these steps in order to get your system live.</p></div>
        <button onClick={fetchAll} disabled={loading} className="cs-btn-primary inline-flex items-center gap-2 disabled:opacity-60">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}{loading ? "Checking..." : "Re-check Status"}</button>
      </div>
      <div className="rounded-xl border border-border bg-card p-5"><div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Launch Progress</h3><span className="text-sm font-bold text-primary">{completeCount} complete{waivedCount ? ` + ${waivedCount} waived` : ""} / {STEPS.length}</span></div><div className="w-full h-3 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round((progressedCount / STEPS.length) * 100)}%`, background: "linear-gradient(90deg, #0088CC, #00AEEF)" }} /></div><p className="text-xs text-muted-foreground mt-2">Next step: {currentStep?.title || "All done"}</p></div>
      {error && <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800"><AlertCircle className="w-4 h-4" />{error}</div>}
      <div className="space-y-3">{STEPS.map((step, index) => { const Icon = step.icon; const status = statusFor(step); const done = status === "done"; const waived = status === "waived"; const current = !done && !waived && STEPS.slice(0, index).every((prev) => ["done", "waived"].includes(statusFor(prev))); return <div key={step.id} className={`rounded-xl border p-5 transition-all ${done ? "border-green-200 bg-green-50/50" : waived ? "border-amber-200 bg-amber-50/60" : current ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card opacity-60"}`}><div className="flex items-start gap-4"><div className="flex-shrink-0 mt-0.5">{done ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : waived ? <AlertCircle className="w-6 h-6 text-amber-600" /> : <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${current ? "border-primary" : "border-gray-300"}`}><span className={`text-xs font-bold ${current ? "text-primary" : "text-gray-400"}`}>{step.id}</span></div>}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><Icon className={`w-4 h-4 ${done ? "text-green-600" : waived ? "text-amber-600" : current ? "text-primary" : "text-muted-foreground"}`} /><h3 className={`text-sm font-bold ${done ? "text-green-900" : waived ? "text-amber-900" : current ? "text-foreground" : "text-muted-foreground"}`}>{step.title}</h3>{done && <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Complete</span>}{waived && <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">Waived Temporarily</span>}{current && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">In Progress</span>}</div><p className="text-sm text-muted-foreground">{step.description}</p>{done && step.checkKey === "booking" && <p className="mt-2 text-xs font-medium text-green-800">Booking link configured. Launch Truth proof still requires booking click or confirmation evidence.</p>}{current && step.checkKey === "launch_truth" && <button onClick={() => onNavigate("launch-truth-sprint")} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80">Run Launch Truth Sprint <ArrowRight className="w-3 h-3" /></button>}</div></div></div>; })}</div>
      <div className="rounded-xl border border-border bg-muted/30 p-5"><h3 className="text-sm font-bold text-foreground mb-3">Quick Actions</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-2"><button onClick={() => onNavigate("launch-truth-sprint")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left"><ShieldCheck className="w-4 h-4 text-primary mb-1" />Launch Truth Sprint</button><button onClick={() => onNavigate("health")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left"><MessageSquare className="w-4 h-4 text-primary mb-1" />Integration Health</button><button onClick={() => onNavigate("leads")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left"><Users className="w-4 h-4 text-primary mb-1" />View Leads</button><button onClick={() => onNavigate("settings")} className="rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground hover:border-primary/30 transition-colors text-left"><Settings className="w-4 h-4 text-primary mb-1" />Admin Settings</button></div></div>
    </div>
  );
}
