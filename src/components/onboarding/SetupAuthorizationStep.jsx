import { useState } from "react";
import { Shield, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

const AGREEMENT_VERSION = "2026-06-26-v1";

const SCOPES = [
  { key: "website_form_edits", label: "Edit website forms", desc: "Modify lead capture forms on your website" },
  { key: "dns_records", label: "Create/modify DNS records", desc: "Add SPF, DKIM, DMARC, and tracking records" },
  { key: "email_authentication", label: "Configure email authentication", desc: "Set up email domain verification" },
  { key: "sms_email_automation", label: "Configure SMS/email automations", desc: "Set up automated messaging flows" },
  { key: "tracking_scripts", label: "Install tracking scripts", desc: "Add GA4 and conversion tracking" },
  { key: "twilio_call_forwarding", label: "Configure Twilio/call forwarding", desc: "Set up phone number routing and webhooks" },
  { key: "booking_integration", label: "Connect booking/calendar tools", desc: "Integrate scheduling platforms" },
  { key: "test_leads", label: "Run test leads and test calls", desc: "Submit dummy leads to verify automation" },
  { key: "temp_credentials_fallback", label: "Temporary credential handling (fallback only)", desc: "Only if collaborator/OAuth access is not available" },
  { key: "client_go_live_approval", label: "Client go-live approval", desc: "You approve the system before it goes live" },
];

export default function SetupAuthorizationStep({ order, onAuthorized }) {
  const [accepted, setAccepted] = useState(false);
  const [acceptedScopes, setAcceptedScopes] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allScopesChecked = SCOPES.every((s) => acceptedScopes[s.key]);

  const handleToggleAll = () => {
    if (allScopesChecked) {
      setAcceptedScopes({});
    } else {
      const all = {};
      SCOPES.forEach((s) => (all[s.key] = true));
      setAcceptedScopes(all);
    }
  };

  const handleSubmit = async () => {
    if (!accepted || !allScopesChecked) {
      setError("Please accept all scopes and confirm authorization to continue.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const scopes = Object.keys(acceptedScopes).filter((k) => acceptedScopes[k]);
      await base44.functions.invoke("saveSetupAuthorization", {
        order_id: order.id,
        client_id: order.client_id || "",
        client_project_id: order.client_project_id || "",
        accepted_scopes: scopes,
        client_email: order.customer_email,
        business_name: order.business_name,
      });
      onAuthorized?.();
    } catch {
      setError("Failed to save authorization. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">Setup Authorization Agreement</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Before we begin setting up your AI automation system, we need your authorization to make the changes described below.
              This agreement (v{AGREEMENT_VERSION}) grants ClientSurge Systems permission to configure your integrations on your behalf.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Authorization Scopes</p>
          <button
            type="button"
            onClick={handleToggleAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {allScopesChecked ? "Uncheck all" : "Check all"}
          </button>
        </div>

        {SCOPES.map((scope) => (
          <label
            key={scope.key}
            className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={!!acceptedScopes[scope.key]}
              onChange={(e) => setAcceptedScopes((prev) => ({ ...prev, [scope.key]: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{scope.label}</p>
              <p className="text-xs text-muted-foreground">{scope.desc}</p>
            </div>
          </label>
        ))}
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-border cursor-pointer hover:bg-muted/30 transition-colors">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 w-5 h-5 rounded border-border"
        />
        <div>
          <p className="text-sm font-semibold text-foreground">
            I confirm that I am authorized to grant this access on behalf of {order.business_name || "my business"}.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            By checking this box, I accept the Setup Authorization Agreement (v{AGREEMENT_VERSION}) and grant ClientSurge Systems
            permission to perform the actions described above for the purpose of setting up and testing my automation system.
          </p>
        </div>
      </label>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving || !accepted || !allScopesChecked}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
        style={{ background: "linear-gradient(135deg,#00AEEF,#003B8F)" }}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Saving Authorization...</>
        ) : (
          <><CheckCircle2 className="w-4 h-4" /> Accept & Continue to Setup</>
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        You cannot proceed to business details, access setup, or any later step until this agreement is accepted.
      </p>
    </div>
  );
}