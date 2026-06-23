import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Mail, MessageSquare, Activity, CheckCircle, XCircle, Clock, RefreshCw, Send, Loader2, ExternalLink, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

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

export default function AutomationHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Test panel state
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testSmsRecipient, setTestSmsRecipient] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [emailResult, setEmailResult] = useState(null);
  const [smsResult, setSmsResult] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);

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
        recipient_email: testEmailRecipient,
        message: testMessage || undefined,
      });
      setEmailResult(res.data);
    } catch (err) {
      setEmailResult({ success: false, error: err.response?.data?.error || err.message });
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
        message: testMessage || undefined,
      });
      setSmsResult(res.data);
    } catch (err) {
      setSmsResult({ success: false, error: err.response?.data?.error || err.message });
    } finally {
      setSendingSms(false);
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
            Prove Twilio SMS and Resend emails are working end-to-end.
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
                    <td className="p-3 text-xs text-foreground/50 font-mono">{log.provider_message_id ? log.provider_message_id.slice(0, 18) + "…" : "—"}</td>
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
      <h2 className="text-lg font-bold text-foreground mb-3">Stuck Leads</h2>
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
                  <th className="text-left p-3 font-semibold text-foreground/70">Source</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Consent</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">SMS Perm</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Paused</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Created</th>
                  <th className="text-left p-3 font-semibold text-foreground/70">Reason Stuck</th>
                </tr>
              </thead>
              <tbody>
                {stuck.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-xs font-medium text-foreground">{lead.full_name || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60">{lead.email || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60">{lead.phone_number || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60">{lead.business_name || "—"}</td>
                    <td className="p-3 text-xs text-foreground/60">{lead.source || "—"}</td>
                    <td className="p-3 text-xs">
                      {lead.consent_given ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </td>
                    <td className="p-3 text-xs">
                      {lead.sms_permission ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                    </td>
                    <td className="p-3 text-xs">
                      {lead.cadence_paused ? <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-300" />}
                    </td>
                    <td className="p-3 text-xs text-foreground/60 whitespace-nowrap">{formatDate(lead.created_date)}</td>
                    <td className="p-3 text-xs text-amber-700">{lead.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Test Panel */}
      <h2 className="text-lg font-bold text-foreground mb-3">Test Panel</h2>
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
            placeholder="admin@example.com"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background"
          />
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Message (optional)</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Custom test message…"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background"
          />
          <button
            onClick={sendTestEmail}
            disabled={sendingEmail || !testEmailRecipient}
            className="cs-btn-primary w-full"
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="ml-1">{sendingEmail ? "Sending…" : "Send Test Email"}</span>
          </button>
          {emailResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${emailResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {emailResult.success ? (
                <><CheckCircle className="w-4 h-4 inline mr-1" /> Email sent to {emailResult.sent_to} (ID: {emailResult.message_id || "—"})</>
              ) : (
                <><XCircle className="w-4 h-4 inline mr-1" /> Failed: {emailResult.error}</>
              )}
            </div>
          )}
        </div>

        {/* Test SMS */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">Test SMS (Twilio)</h3>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Recipient Phone</label>
          <input
            type="tel"
            value={testSmsRecipient}
            onChange={(e) => setTestSmsRecipient(e.target.value)}
            placeholder="+1XXXXXXXXXX"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background"
          />
          <label className="block text-xs font-semibold uppercase tracking-wide text-foreground/60 mb-1">Message (optional)</label>
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Custom test message…"
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3 bg-background"
          />
          <button
            onClick={sendTestSms}
            disabled={sendingSms || !testSmsRecipient}
            className="cs-btn-primary w-full"
          >
            {sendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="ml-1">{sendingSms ? "Sending…" : "Send Test SMS"}</span>
          </button>
          {smsResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${smsResult.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {smsResult.success ? (
                <><CheckCircle className="w-4 h-4 inline mr-1" /> SMS sent to {smsResult.sent_to} (SID: {smsResult.message_sid || "—"})</>
              ) : (
                <><XCircle className="w-4 h-4 inline mr-1" /> Failed: {smsResult.error}</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Provider Readiness Checklist */}
      <h2 className="text-lg font-bold text-foreground mb-3">Provider Readiness Checklist</h2>
      <div className="rounded-xl border border-border bg-card p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { label: "Twilio Account Configured", value: readiness.twilio_account_configured },
            { label: "Twilio From Number Configured", value: readiness.twilio_from_number_configured },
            { label: "Resend API Configured", value: readiness.resend_api_configured },
            { label: "Resend From Email Configured", value: readiness.resend_from_email_configured },
            { label: "App Base URL Configured", value: readiness.app_base_url_configured },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.value === "yes" ? (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : item.value === "no" ? (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-amber-500 flex-shrink-0" />
              )}
              <span className="text-sm font-medium text-foreground">{item.label}</span>
              <span className={`text-xs font-bold ml-auto ${item.value === "yes" ? "text-green-600" : item.value === "no" ? "text-red-600" : "text-amber-600"}`}>
                {item.value || "unknown"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-foreground/40 text-center mb-4">
        Snapshot taken at {formatDate(data?.snapshot_at)}. Data is real-time — refresh to get latest.
      </p>
    </div>
  );
}