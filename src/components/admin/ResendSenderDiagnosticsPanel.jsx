import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Mail, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ResendSenderDiagnosticsPanel() {
  const [configuredEmail, setConfiguredEmail] = useState(null);
  const [actualSender, setActualSender] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
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

        // Fetch latest CommunicationEvent entries (Resend emails)
        const events = await base44.asServiceRole.entities.CommunicationEvent.filter(
          { provider: "resend", channel: "email" },
          "-created_date",
          30
        );
        setRecentEvents(events || []);

        // Extract actual sender from latest event metadata
        if (events?.length > 0) {
          for (const event of events) {
            try {
              const metadata = event.metadata_json ? JSON.parse(event.metadata_json) : {};
              if (metadata.sender_source && metadata.sender_source !== "fallback") {
                setActualSender(metadata.from_address || null);
                break;
              }
            } catch (_e) {
              // Skip parse errors
            }
          }
        }
      } catch (err) {
        console.error("[ResendSenderDiagnosticsPanel]", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if actual sender differs from configured
  const hasMismatch = actualSender && configuredEmail && actualSender !== configuredEmail;

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
      <div className="pb-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Configured Sender (AdminSettings.resend_from_email)
        </p>
        <div className="flex items-center gap-2">
          {configuredEmail && configuredEmail !== "Not configured" ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <code className="text-sm font-mono text-foreground bg-muted px-3 py-2 rounded">
                {configuredEmail}
              </code>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not configured</p>
          )}
        </div>
      </div>

      {/* Actual Sender from Recent Events */}
      <div className="pb-4 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Latest Actual Sender (from CommunicationEvent)
        </p>
        <div className="flex items-center gap-2">
          {actualSender ? (
            <>
              {hasMismatch ? (
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <code className="text-sm font-mono text-foreground bg-muted px-3 py-2 rounded">
                {actualSender}
              </code>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No recent Resend events found</p>
          )}
        </div>
      </div>

      {/* Mismatch Warning */}
      {hasMismatch && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-900 space-y-1">
            <p className="font-semibold">Sender Mismatch Detected</p>
            <p className="text-xs">
              Configured sender <code className="bg-white/50 px-1.5 py-0.5 rounded text-[0.7rem] font-mono">{configuredEmail}</code> does not match actual sender in recent events <code className="bg-white/50 px-1.5 py-0.5 rounded text-[0.7rem] font-mono">{actualSender}</code>
            </p>
          </div>
        </div>
      )}

      {/* Delivery Status Info */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-900 mb-2">Current Resend Proof Level</p>
        <p className="text-xs text-blue-900 mb-3">
          ✓ Provider accepted/sent only (no full delivery confirmation yet)
        </p>
        <p className="text-[0.75rem] text-blue-800 leading-relaxed">
          Current events show status=<strong>sent</strong>, meaning Resend accepted the message. Full delivery confirmation from recipient inbox is not yet captured.
        </p>
      </div>

      {/* Next Action */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
        <p className="text-xs font-semibold text-purple-900 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Next Action: Verify Sender in Resend
        </p>
        <div className="text-xs text-purple-900 space-y-2">
          <p className="font-medium">Option 1: Update AdminSettings</p>
          <p className="text-[0.8rem] text-purple-800">
            If actual sender <code className="bg-white/30 px-1 rounded text-[0.7rem] font-mono">{actualSender || "noreply@clientsurgesystems.com"}</code> is verified in Resend and working, update <strong>AdminSettings.resend_from_email</strong> to match.
          </p>
          <p className="font-medium mt-2">Option 2: Update Send Path</p>
          <p className="text-[0.8rem] text-purple-800">
            If <code className="bg-white/30 px-1 rounded text-[0.7rem] font-mono">system@clientsurgesystems.com</code> is the correct authorized sender in Resend, verify the domain/sender identity in Resend console, then force all send paths to use it.
          </p>
        </div>
      </div>

      {/* Status Legend */}
      <div className="text-xs text-muted-foreground space-y-1.5 pt-2">
        <p className="font-semibold">Status Legend:</p>
        <ul className="space-y-1 ml-2">
          <li>• <strong>sent</strong> = Resend provider accepted (not fully inbox-delivered)</li>
          <li>• <strong>delivered</strong> = Recipient inbox confirmed</li>
          <li>• <strong>failed</strong> = Provider rejected or bounced</li>
        </ul>
      </div>
    </div>
  );
}