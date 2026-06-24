import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ResendSenderDiagnosticsPanel() {
  const [configuredEmail, setConfiguredEmail] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch AdminSettings
        const settings = await base44.asServiceRole.entities.AdminSettings.list();
        if (settings?.length > 0) {
          setConfiguredEmail(settings[0].resend_from_email || "Not configured");
        }

        // Fetch latest Resend CommunicationLog entries
        const recentLogs = await base44.asServiceRole.entities.CommunicationLog.filter(
          { provider: "resend" },
          "-created_date",
          20
        );
        setLogs(recentLogs || []);
      } catch (err) {
        console.error("[ResendSenderDiagnosticsPanel]", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Extract unique from_address values from logs
  const uniqueFromAddresses = Array.from(new Set(logs.map((log) => log.from_address).filter(Boolean)));

  // Check if any from_address differs from configured
  const hasMismatch = uniqueFromAddresses.some((addr) => addr !== configuredEmail && configuredEmail);

  if (loading) {
    return (
      <div className="p-6 bg-card border border-border rounded-xl">
        <p className="text-sm text-muted-foreground">Loading Resend diagnostics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border rounded-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Resend Sender Diagnostics</h3>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-destructive">
          Error loading diagnostics: {error}
        </div>
      )}

      {/* Configured Sender */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Configured From Address (AdminSettings)
        </p>
        <div className="flex items-center gap-2">
          {configuredEmail && configuredEmail !== "Not configured" ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <code className="text-sm font-mono text-foreground bg-muted px-3 py-1.5 rounded">
                {configuredEmail}
              </code>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not configured</p>
          )}
        </div>
      </div>

      {/* Mismatch Warning */}
      {hasMismatch && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900">
            <p className="font-semibold mb-1">Sender Mismatch Detected</p>
            <p className="text-xs">Recent logs show from_address values that differ from AdminSettings. Verify sender configuration before approving automations.</p>
          </div>
        </div>
      )}

      {/* Recent From Addresses */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Recent From Addresses (Last 20 Logs)
        </p>
        {uniqueFromAddresses.length > 0 ? (
          <div className="space-y-1.5">
            {uniqueFromAddresses.map((addr) => (
              <div key={addr} className="flex items-center gap-2 text-sm">
                {addr === configuredEmail ? (
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                )}
                <code className="font-mono text-foreground">{addr}</code>
                {addr !== configuredEmail && configuredEmail && (
                  <span className="text-xs text-muted-foreground ml-auto">(mismatch)</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No Resend logs found</p>
        )}
      </div>

      {/* Recent Provider Message IDs */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Recent Provider Message IDs (Last 10)
        </p>
        {logs.filter((l) => l.provider_message_id).length > 0 ? (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {logs
              .filter((l) => l.provider_message_id)
              .slice(0, 10)
              .map((log, idx) => (
                <div key={idx} className="text-xs">
                  <p className="font-mono text-foreground break-all">{log.provider_message_id}</p>
                  <p className="text-muted-foreground text-[0.7rem]">
                    {log.delivery_status} · {new Date(log.created_date).toLocaleString()}
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No provider IDs found</p>
        )}
      </div>

      {/* Info Note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
        <p className="font-semibold mb-1">Status Meanings</p>
        <ul className="space-y-0.5 text-[0.8rem]">
          <li>• <strong>sent</strong> = Resend provider accepted (not fully delivered to recipient inbox)</li>
          <li>• <strong>delivered</strong> = Final delivery confirmed by carrier</li>
          <li>• <strong>failed</strong> = Provider rejected or carrier returned</li>
          <li>• <strong>queued</strong> = Pending provider pickup</li>
        </ul>
      </div>
    </div>
  );
}