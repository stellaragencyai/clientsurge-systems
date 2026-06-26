import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity } from "lucide-react";

const STATUS_CONFIG = {
  healthy: { label: "Healthy", color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 },
  error: { label: "Error", color: "text-red-700", bg: "bg-red-100", icon: XCircle },
  warning: { label: "Warning", color: "text-yellow-700", bg: "bg-yellow-100", icon: AlertTriangle },
  disabled: { label: "Disabled", color: "text-gray-600", bg: "bg-gray-100", icon: Activity },
  unknown: { label: "Unknown", color: "text-gray-600", bg: "bg-gray-100", icon: Activity },
};

export default function IntegrationHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState("");

  const fetchHealth = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getIntegrationHealth", {});
      setData(res?.data || null);
      setLastChecked(new Date());
    } catch (err) {
      setError(err?.message || "Failed to load integration health.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHealth(); }, []);

  const integrations = data?.integrations || [];
  const system = data?.system || {};

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Integration Health</h2>
          <p className="text-sm text-muted-foreground mt-1">Live status of Twilio, Resend, and Stripe connections.</p>
        </div>
        <button onClick={fetchHealth} disabled={loading} className="cs-btn-primary inline-flex items-center gap-2 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {lastChecked && (
        <p className="text-xs text-muted-foreground">Last checked: {lastChecked.toLocaleString()}</p>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* System Overview */}
      {!loading && data && (
        <div className={`rounded-xl border p-5 ${system.uptime?.available ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center gap-3">
            {system.uptime?.available
              ? <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              : <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />}
            <div>
              <p className={`text-lg font-bold ${system.uptime?.available ? "text-green-900" : "text-red-900"}`}>
                {system.uptime?.label || "Status Unknown"}
              </p>
              <p className={`text-sm ${system.uptime?.available ? "text-green-800" : "text-red-800"}`}>
                {system.uptime?.reason || "Unable to determine system status."}
              </p>
            </div>
          </div>
          {system.success_rate_percent !== null && system.success_rate_percent !== undefined && (
            <div className="mt-3 pt-3 border-t border-green-200/50 flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Success Rate: </span>
                <span className="font-bold text-foreground">{system.success_rate_percent}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Successful: </span>
                <span className="font-bold text-green-700">{system.successful_activity_count || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Failed: </span>
                <span className="font-bold text-red-700">{system.failed_activity_count || 0}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Integration Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Checking integrations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {integrations.map((svc, i) => {
            const cfg = STATUS_CONFIG[svc.derived_status] || STATUS_CONFIG.unknown;
            const Icon = cfg.icon;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{svc.name}</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Live Ping</span>
                    <span className={svc.live_ping_ok ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {svc.live_ping_ok ? "✓ Success" : "✗ Failed"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status Label</span>
                    <span className="text-foreground font-medium">{svc.status_label || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Recent Failures</span>
                    <span className={svc.recent_failure_count > 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                      {svc.recent_failure_count || 0}
                    </span>
                  </div>
                  {svc.latest_activity_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Activity</span>
                      <span className="text-foreground">{new Date(svc.latest_activity_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {svc.status_reason && (
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">{svc.status_reason}</p>
                )}

                {svc.missing_configuration?.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-bold text-yellow-700 mb-1">⚠ Missing Configuration:</p>
                    <ul className="text-xs text-muted-foreground list-disc list-inside">
                      {svc.missing_configuration.map((c, idx) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && integrations.length === 0 && !error && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No integration data available.
        </div>
      )}
    </div>
  );
}