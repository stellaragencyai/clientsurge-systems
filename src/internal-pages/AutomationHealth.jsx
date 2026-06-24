import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Mail, MessageSquare, Activity, CheckCircle, XCircle, Clock, RefreshCw, Send, Loader2, ExternalLink, ShieldCheck, Server, Wrench, FlaskConical, Zap, ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import PostPatchVerificationCard from "@/components/admin/PostPatchVerificationCard";

function StatusCard({ icon: Icon, label, value, accent }) {
  const colorMap = {
    green: "text-green-600 bg-green-50 border-green-200",
    red: "text-red-600 bg-red-50 border-red-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    gray: "text-gray-600 bg-gray-50 border-gray-200",
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colorMap[accent] || colorMap.gray}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs font-semibold mt-1 opacity-80">{label}</p>
      </div>
    </div>
  );
}

function statusBadge(status) {
  const map = {
    sent: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
    queued: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
    skipped: "bg-amber-100 text-amber-700",
    unknown: "bg-gray-100 text-gray-700",
  };
  return map[status] || map.unknown;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function TestResultBanner({ result, provider }) {
  if (!result) return null;
  const passed = result.passed === true || result.success === true;
  return (
    <div className={`mt-3 p-3 rounded-lg text-sm border ${passed ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
      <div className="flex items-center gap-2 mb-1">
        {passed ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        <span className="font-bold">{passed ? "PASSED" : "FAILED"}</span>
        <span className="opacity-70">· {provider}</span>
      </div>
      <div className="space-y-0.5 text-xs">
        <div><span className="font-semibold">Provider Message ID:</span> <code className="font-mono bg-black/5 px-1 rounded">{result.provider_message_id || result.message_sid || result.message_id || "—"}</code></div>
        {!passed && result.error && (
          <div className="text-red-800"><span className="font-semibold">Error:</span> {result.error}</div>
        )}
        {result.sent_to && (
          <div><span className="font-semibold">Sent to:</span> {result.sent_to}</div>
        )}
        {result.communication_log_id && (
          <div className="flex items-center gap-1">
            <span className="font-semibold">CommunicationLog:</span>
            <code className="font-mono text-[10px] bg-black/5 px-1 rounded">{result.communication_log_id.slice(0, 12)}…</code>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderReadinessCard({ provider, data }) {
  const configOk = data?.config_present === "yes";
  const testPassed = data?.last_test_passed === "yes";
  const testFailed = data?.last_test_passed === "no";
  const testNever = data?.last_test_passed === "never";

  const statusColor = configOk && testPassed ? "green" : configOk && testNever ? "amber" : "red";
  const Icon = provider === "twilio" ? MessageSquare : Mail;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground capitalize">{provider === "twilio" ? "Twilio (SMS)" : "Resend (Email)"}</h3>
        <span className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
          statusColor === "green" ? "bg-green-100 text-green-700" : statusColor === "amber" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
        }`}>
          {statusColor === "green" ? <CheckCircle className="w-3 h-3" /> : statusColor === "amber" ? <Clock className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {statusColor === "green" ? "Ready" : statusColor === "amber" ? "Untested" : "Not Ready"}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">Config present:</span>
          <span className={`font-bold ${configOk ? "text-green-600" : "text-red-600"}`}>{data?.config_present || "unknown"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">Last test passed:</span>
          <span className={`font-bold ${testPassed ? "text-green-600" : testFailed ? "text-red-600" : "text-amber-600"}`}>{data?.last_test_passed || "unknown"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">Last test time:</span>
          <span className="text-xs text-foreground/80">{formatDate(data?.last_test_time)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">Last provider ID:</span>
          <code className="font-mono text-[10px] text-foreground/80 max-w-[140px] truncate" title={data?.last_provider_message_id || ""}>
            {data?.last_provider_message_id ? data.last_provider_message_id.slice(0, 20) : "—"}
          </code>
        </div>
        {data?.last_error && (
          <div className="pt-2 border-t border-border/50">
            <span className="text-foreground/60 text-xs font-semibold">Last error:</span>
            <p className="text-xs text-red-600 mt-1 break-words">{data.last_error.slice(0, 200)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AutomationHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test panel state
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testSmsRecipient, setTestSmsRecipient] = useState("");
  const [emailResult, setEmailResult] = useState(null);
  const [smsResult, setSmsResult] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

  // Repair + test lead state
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);
  const [testLeadName, setTestLeadName] = useState("");
  const [testLeadEmail, setTestLeadEmail] = useState("");
  const [testLeadPhone, setTestLeadPhone] = useState("");
  const [creatingTestLead, setCreatingTestLead] = useState(false);
  const [testLeadResult, setTestLeadResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getAutomationHealth", {});
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load health data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sendTestEmail = async () => {
    setSendingEmail(true);
    setEmailResult(null);
    try {
      const res = await base44.functions.invoke("sendTestCommunication", {
        action: "email",
        recipient_email: testEmailRecipient || undefined,
      });
      setEmailResult(res.data);
      // Refresh health data to pick up the new log + snapshot
      setTimeout(() => fetchData(), 500);
    } catch (err) {
      setEmailResult({ success: false, passed: false, provider: "resend", error: err.response?.data?.error || err.message });
    } finally {
      setSendingEmail(false);
    }
  };

  const sendTestSms = async () => {
    setSendingSms(true);
    setSmsResult(null);
    try {
      const res = await base44.functions.invoke("sendTestCommunication", {
        action: "sms",
        recipient_phone: testSmsRecipient,
      });
      setSmsResult(res.data);
      setTimeout(() => fetchData(), 500);
    } catch (err) {
      setSmsResult({ success: false, passed: false, provider: "twilio", error: err.response?.data?.error || err.message });
    } finally {
      setSendingSms(false);
    }
  };

  const repairStuckLeads = async (mode) => {
    setRepairing(true);
    setRepairResult(null);
    try {
      const payload = { action: "repair_stuck" };
      if (mode === "dry_run") payload.dry_run = true;
      if (mode === "confirm") payload.confirm = true;
      const res = await base44.functions.invoke("processWebsiteLeadInitialResponse", payload);
      setRepairResult(res.data);
      setTimeout(() => fetchData(), 1000);
    } catch (err) {
      setRepairResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setRepairing(false);
    }
  };

  const createTestLead = async () => {
    setCreatingTestLead(true);
    setTestLeadResult(null);
    try {
      const res = await base44.functions.invoke("processWebsiteLeadInitialResponse", {
        action: "create_test_lead",
        test_name: testLeadName || undefined,
        test_email: testLeadEmail || undefined,
        test_phone: testLeadPhone || undefined,
      });
      setTestLeadResult(res.data);
      setTimeout(() => fetchData(), 1000);
    } catch (err) {
      setTestLeadResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setCreatingTestLead(false);
    }
  };

  const runVerification = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await base44.functions.invoke("processWebsiteLeadInitialResponse", {
        action: "run_post_patch_verification",
      });
      setVerificationResult(res.data);
      setTimeout(() => fetchData(), 1500);
    } catch (err) {
      setVerificationResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setVerifying(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold mb-2 text-foreground">Failed to Load</h1>
          <p className="text-sm text-foreground/60 mb-4">{error}</p>
          <button onClick={fetchData} className="cs-btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  const s = data?.status_cards || {};
  const logs = data?.recent_logs || [];
  const stuck = data?.stuck_leads || [];
  const readiness = data?.provider_readiness || {};
  const warning = data?.launch_blocker_warning;
  const testSmsWarning = data?.test_lead_sms_warning;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Automation Health
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Prove Twilio SMS and Resend emails are working with real provider calls.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Warning Banner */}
      {warning && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Launch Blocker Detected</p>
            <p className="text-sm text-red-700 mt-1">{warning}</p>
          </div>
        </div>
      )}

      {/* Test Lead SMS Warning */}
      {testSmsWarning && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Test Lead Messages Detected</p>
            <p className="text-sm text-amber-700 mt-1">{testSmsWarning}</p>
            <p className="text-xs text-amber-600 mt-1">These are audit-evidence records only — no data has been deleted. The exclusion guard now prevents future sends.</p>
          </div>
        </div>
      )}

      {/* Post-Patch Verification */}
      <PostPatchVerificationCard
        verification={verificationResult || data?.latest_verification}
        verifying={verifying}
        onRun={runVerification}
      />

      {/* Section 1: Status Cards */}
      <h2 className="text-lg font-bold text-foreground mb-3">Status Cards (Last 24h)</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatusCard icon={MessageSquare} label="SMS Sent" value={s.sms_sent_24h ?? 0} accent="green" />
        <StatusCard icon={MessageSquare} label="SMS Failed" value={s.sms_failed_24h ?? 0} accent="red" />
        <StatusCard icon={Mail} label="Emails Sent" value={s.email_sent_24h ?? 0} accent="green" />
        <StatusCard icon={Mail} label="Emails Failed" value={s.email_failed_24h ?? 0} accent="red" />
        <StatusCard icon={Clock} label="Latest SMS" value={formatDate(s.latest_sms_at)} accent="blue" />
        <StatusCard icon={Clock} label="Latest Email" value={formatDate(s.latest_email_at)} accent="blue" />
        <StatusCard icon={AlertTriangle} label="Waiting Initial Response" value={s.leads_waiting_initial_response ?? 0} accent="amber" />
        <StatusCard icon={AlertTriangle} label="Stuck (Auto On, No Response)" value={s.leads_stuck_with_automation ?? 0} accent="red" />
        <StatusCard
          icon={Zap}
          label="Initial Response Working"
          value={data?.initial_response_working || s.initial_response_working || "unknown"}
          accent={(data?.initial_response_working || s.initial_response_working) === "pass" ? "green" : (data?.initial_response_working || s.initial_response_working) === "fail" ? "red" : "amber"}
        />
        <StatusCard icon={AlertTriangle} label="Real Leads Waiting" value={s.real_leads_waiting_initial_response ?? 0} accent="amber" />
        <StatusCard icon={ShieldCheck} label="Test/Internal Leads" value={data?.test_internal_leads ?? s.test_internal_leads ?? 0} accent="gray" />
        <StatusCard
          icon={ShieldAlert}
          label="Test Lead SMS Warnings (24h)"
          value={s.test_lead_sms_warnings_24h ?? 0}
          accent={s.test_lead_sms_warnings_24h > 0 ? "amber" : "gray"}
        />
      </div>

      {/* Section 2: Recent Communication Logs */}
      <h2 className="text-lg font-bold text-foreground mb-3">Recent Communication Logs</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-foreground/50">No communication logs in the last 24h.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-semibold text-foreground/70">Time</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Channel</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Status</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Trigger</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Lead</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">To</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Provider ID</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Error</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-xs text-foreground/60 whitespace-nowrap">{formatDate(log.sent_at || log.failed_at || log.created_date)}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {log.channel === "sms" ? <MessageSquare className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {log.channel}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(log.delivery_status)}`}>
                        {log.delivery_status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-foreground/70">{log.trigger_name}</td>
                    <td className="p-3 text-xs">
                      {log.lead_name || "—"}
                      {log.related_entity_type === "WebsiteLead" && log.related_entity_id && (
                        <Link to={`/admin/leads/${log.related_entity_id}`} className="ml-1 text-primary hover:underline inline-flex items-center gap-0.5">
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                    <td className="p-3 text-xs text-foreground/60">{log.to_address || "—"}</td>
                    <td className="p-3 text-xs text-foreground/50 font-mono">
                      {log.provider_message_id ? (
                        <span title={log.provider_message_id}>{log.provider_message_id.slice(0, 18)}…</span>
                      ) : (
                        <span className="text-red-400">no provider ID</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-red-600 max-w-[200px] truncate" title={log.error_message || ""}>
                      {log.error_message ? log.error_message.slice(0, 50) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Stuck Leads */}
      <h2 className="text-lg font-bold text-foreground mb-3">Stuck Leads (Auto On, No Response, &gt; 5 min)</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
        {stuck.length === 0 ? (
          <div className="p-8 text-center text-sm text-foreground/50">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            No stuck leads. All automated leads have received an initial response.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-3 font-semibold text-foreground/70">Name</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Email</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Phone</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Business</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Created</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Reason Stuck</th>
                </tr>
              </thead>
              <tbody>
                {stuck.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-xs font-medium text-foreground">
                      {lead.full_name || "—"}
                      {lead.is_test && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">TEST</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-foreground/60">{lead.email || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60">{lead.phone_number || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60">{lead.business_name || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60 whitespace-nowrap">{formatDate(lead.created_date)}</td>
                    <td className="p-3 text-xs text-amber-700">{lead.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3b: Repair Stuck Leads + Create Test Lead */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Repair Stuck Leads */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Repair Stuck Leads</h3>
          </div>
          <p className="text-xs text-foreground/50 mb-4">
            Finds all WebsiteLead records with automation on, no response, older than 5 min. Dry-run first to see a safe preview, then confirm to send real SMS/email only to eligible non-test leads.
          </p>
          <div className="flex gap-2">
            <button onClick={() => repairStuckLeads("dry_run")} disabled={repairing} className="cs-btn-primary flex-1">
              {repairing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
              <span className="ml-1">{repairing ? "Running…" : "Dry-Run Preview"}</span>
            </button>
            {repairResult?.mode === "dry_run" && repairResult.real_eligible_leads > 0 && (
              <button onClick={() => repairStuckLeads("confirm")} disabled={repairing} className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                <Send className="w-4 h-4" />
                Confirm & Send
              </button>
            )}
          </div>
          {repairResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm border ${repairResult.success !== false ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {repairResult.success !== false ? (
                <>
                  <p className="font-bold mb-2">
                    {repairResult.mode === "dry_run" ? "Dry-Run Preview" : repairResult.mode === "requires_confirmation" ? "Confirmation Required" : "Repair Complete"}
                  </p>
                  {repairResult.preview && (
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>Would Send SMS: <strong className="text-green-600">{repairResult.preview.would_send_sms}</strong></div>
                      <div>Would Send Email: <strong className="text-green-600">{repairResult.preview.would_send_email}</strong></div>
                      <div>Skip (Test/QA/Backfill): <strong className="text-gray-600">{repairResult.preview.would_skip_internal_test}</strong></div>
                      <div>Skip (No Consent): <strong className="text-amber-600">{repairResult.preview.would_skip_no_consent}</strong></div>
                      <div>Skip (Invalid Phone): <strong className="text-amber-600">{repairResult.preview.would_skip_invalid_phone}</strong></div>
                      <div>Skip (Invalid Email): <strong className="text-amber-600">{repairResult.preview.would_skip_invalid_email}</strong></div>
                    </div>
                  )}
                  {repairResult.mode === "confirmed" && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Total Processed: <strong>{repairResult.total_processed}</strong></div>
                      <div>SMS Sent: <strong className="text-green-600">{repairResult.sent_sms}</strong></div>
                      <div>Email Sent: <strong className="text-green-600">{repairResult.sent_email}</strong></div>
                      <div>Skipped: <strong className="text-amber-600">{repairResult.skipped}</strong></div>
                      <div>Failed: <strong className="text-red-600">{repairResult.failed}</strong></div>
                    </div>
                  )}
                  {repairResult.details && repairResult.details.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs font-semibold cursor-pointer">View {repairResult.details.length} details</summary>
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                        {repairResult.details.map((d, i) => (
                          <div key={i} className="text-xs text-foreground/70 border-l-2 border-border pl-2">
                            <span className="font-medium">{d.name || d.lead_id?.slice(0, 8)}</span>
                            {" — "}
                            {d.initial_response_sent ? (
                              <span className="text-green-600">✓ Sent</span>
                            ) : (
                              <span className="text-amber-600">
                                Skipped: {[d.sms_skip_reason, d.email_skip_reason].filter(Boolean).join(", ") || "no reason"}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              ) : (
                <p className="text-red-700">Error: {repairResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Create Safe Test Lead */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Create Safe Test Lead</h3>
          </div>
          <p className="text-xs text-foreground/50 mb-3">
            Creates a clearly marked test WebsiteLead (source=admin_test_lead), immediately runs initial response, and logs real provider results. Uses your real entered contact info.
          </p>
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Name (optional)</label>
          <input type="text" value={testLeadName} onChange={(e) => setTestLeadName(e.target.value)} placeholder="Test Lead Name" className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-2 bg-background" />
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Email</label>
          <input type="email" value={testLeadEmail} onChange={(e) => setTestLeadEmail(e.target.value)} placeholder="real-email@example.com" className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-2 bg-background" />
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Phone</label>
          <input type="tel" value={testLeadPhone} onChange={(e) => setTestLeadPhone(e.target.value)} placeholder="+1XXXXXXXXXX" className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background" />
          <button onClick={createTestLead} disabled={creatingTestLead || (!testLeadEmail && !testLeadPhone)} className="cs-btn-primary w-full">
            {creatingTestLead ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            <span className="ml-1">{creatingTestLead ? "Creating…" : "Create Test Lead & Run Response"}</span>
          </button>
          {testLeadResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm border ${testLeadResult.success !== false ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {testLeadResult.success !== false ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-bold">Test Lead Created & Processed</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>Lead ID: <code className="font-mono bg-black/5 px-1 rounded">{testLeadResult.lead_id?.slice(0, 12)}…</code></div>
                    {testLeadResult.processing_result?.sms && (
                      <div>SMS: {testLeadResult.processing_result.sms.sent ? (
                        <span className="text-green-600 font-medium">✓ Sent — {testLeadResult.processing_result.sms.provider_message_id?.slice(0, 20)}…</span>
                      ) : (
                        <span className="text-amber-600">Skipped: {testLeadResult.processing_result.sms.skip_reason}</span>
                      )}</div>
                    )}
                    {testLeadResult.processing_result?.email && (
                      <div>Email: {testLeadResult.processing_result.email.sent ? (
                        <span className="text-green-600 font-medium">✓ Sent — {testLeadResult.processing_result.email.provider_message_id?.slice(0, 20)}…</span>
                      ) : (
                        <span className="text-amber-600">Skipped: {testLeadResult.processing_result.email.skip_reason}</span>
                      )}</div>
                    )}
                    <div>Initial Response Sent: <strong>{testLeadResult.processing_result?.initial_response_sent ? "Yes" : "No"}</strong></div>
                  </div>
                </>
              ) : (
                <p className="text-red-700">Error: {testLeadResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 4: Test Panel */}
      <h2 className="text-lg font-bold text-foreground mb-3">Test Panel — Real Provider Calls</h2>
      <p className="text-xs text-foreground/50 mb-4">These buttons send real Twilio SMS and Resend email messages. The actual provider response ID is captured and logged — no synthetic IDs.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Test Email */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Test Email (Resend)</h3>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Recipient Email</label>
          <input
            type="email"
            value={testEmailRecipient}
            onChange={(e) => setTestEmailRecipient(e.target.value)}
            placeholder="admin@example.com (defaults to your email)"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background"
          />
          <p className="text-xs text-foreground/50 mb-3">Subject: "ClientSurge Resend Test — Automation Health"</p>
          <button
            onClick={sendTestEmail}
            disabled={sendingEmail}
            className="cs-btn-primary w-full"
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="ml-1">{sendingEmail ? "Sending…" : "Send Real Test Email"}</span>
          </button>
          <TestResultBanner result={emailResult} provider="Resend" />
        </div>

        {/* Test SMS */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Test SMS (Twilio)</h3>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Recipient Phone (required)</label>
          <input
            type="tel"
            value={testSmsRecipient}
            onChange={(e) => setTestSmsRecipient(e.target.value)}
            placeholder="+1XXXXXXXXXX"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background"
          />
          <p className="text-xs text-foreground/50 mb-3">Body: "ClientSurge Twilio test: automation health check."</p>
          <button
            onClick={sendTestSms}
            disabled={sendingSms || !testSmsRecipient}
            className="cs-btn-primary w-full"
          >
            {sendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="ml-1">{sendingSms ? "Sending…" : "Send Real Test SMS"}</span>
          </button>
          <TestResultBanner result={smsResult} provider="Twilio" />
        </div>
      </div>

      {/* Section 5: Provider Readiness */}
      <h2 className="text-lg font-bold text-foreground mb-3">Provider Readiness</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <ProviderReadinessCard provider="twilio" data={readiness.twilio} />
        <ProviderReadinessCard provider="resend" data={readiness.resend} />
      </div>

      <p className="text-xs text-foreground/40 text-center mb-4">
        Snapshot taken at {formatDate(data?.snapshot_at)}. Environment: {data?.environment || "production"}. An AutomationHealthSnapshot row is persisted on each page load.
      </p>
    </div>
  );
}