import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function IntegrationHealth() {
  const [integrations, setIntegrations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [system, setSystem] = useState({
    uptime: { available: false, label: "Unavailable", reason: "" },
    messages_tracked: 0,
    successful_activity_count: 0,
    failed_activity_count: 0,
    success_rate_percent: null,
  });
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadIntegrationHealth = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await base44.functions.invoke("getIntegrationHealth", {});
      const payload = response?.data || {};

      setIntegrations(payload.integrations || []);
      setLogs(payload.recent_activity || []);
      setSystem(payload.system || {
        uptime: { available: false, label: "Unavailable", reason: "" },
        messages_tracked: 0,
        successful_activity_count: 0,
        failed_activity_count: 0,
        success_rate_percent: null,
      });
      setGeneratedAt(payload.generated_at || null);
    } catch (err) {
      console.error("Failed to check status:", err);
      setError(err?.data?.error || err?.message || "Unable to load integration health right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "healthy" || status === "configured") return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === "error") return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: "bg-green-50 border-green-200",
      configured: "bg-blue-50 border-blue-200",
      disabled: "bg-yellow-50 border-yellow-200",
      error: "bg-red-50 border-red-200",
      unavailable: "bg-slate-50 border-slate-200",
    };
    return colors[status] || "bg-gray-50 border-gray-200";
  };

  const successRateLabel =
    system.success_rate_percent === null ? "Unavailable" : `${system.success_rate_percent}%`;

  useEffect(() => {
    loadIntegrationHealth();
    const interval = setInterval(loadIntegrationHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Integration Health</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor external integrations through canonical backend-derived health summaries.
          </p>
          {generatedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Snapshot generated: {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={loadIntegrationHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking..." : "Check Now"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div key={integration.id} className={`rounded-xl border p-6 ${getStatusColor(integration.derived_status)}`}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-foreground">{integration.name}</h3>
              {getStatusIcon(integration.derived_status)}
            </div>
            <p className="text-sm font-medium mb-2">{integration.status_label}</p>
            <p className="text-xs text-muted-foreground">{integration.status_reason}</p>
            <p className="text-xs text-muted-foreground">
              {integration.latest_activity_at
                ? `Latest activity: ${new Date(integration.latest_activity_at).toLocaleTimeString()}`
                : "No recent tracked activity"}
            </p>
            {integration.recent_failure_count > 0 && (
              <p className="text-xs text-red-600 mt-2">{integration.recent_failure_count} recent failures</p>
            )}
            {integration.missing_configuration?.length > 0 && (
              <p className="text-xs text-amber-700 mt-2">
                Missing: {integration.missing_configuration.join(", ")}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent activity</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-sm">
                <div className="flex-shrink-0 mt-0.5">
                  {log.status === "delivered" || log.status === "sent" || log.status === "processed" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : log.status === "failed" ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground capitalize">
                    {log.event_type?.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {log.provider} - {new Date(log.created_date).toLocaleString()}
                  </p>
                  {log.subject && (
                    <p className="text-xs text-foreground/80 mt-1">{log.subject}</p>
                  )}
                  {log.error_message && (
                    <p className="text-xs text-red-600 mt-1">{log.error_message}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    log.status === "delivered" || log.status === "sent" || log.status === "processed"
                      ? "bg-green-100 text-green-700"
                      : log.status === "failed"
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">System Health</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Overall Uptime</p>
            <p className="text-2xl font-bold text-muted-foreground">{system.uptime?.label || "Unavailable"}</p>
            {system.uptime?.reason && (
              <p className="text-xs text-muted-foreground mt-1">{system.uptime.reason}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Messages Tracked</p>
            <p className="text-2xl font-bold text-foreground">{system.messages_tracked}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">{successRateLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
