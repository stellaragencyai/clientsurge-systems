import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Plus,
  Copy,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Webhook,
} from "lucide-react";
import WebhookRegistrationForm from "./WebhookRegistrationForm";
import DeleteConfirmModal from "../DeleteConfirmModal";

const STATUS_BADGE = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-muted text-muted-foreground",
  failed: "bg-red-100 text-red-700",
};

export default function WebhookConfigPanel() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [revealedSecrets, setRevealedSecrets] = useState({});

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manageWebhookRegistration", { action: "list" });
      setRegistrations(res.data.registrations || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (registration) => {
    if (registration?.secret_key) {
      setRevealedSecrets((prev) => ({ ...prev, [registration.id]: registration.secret_key }));
    }

    setRegistrations((prev) => {
      const exists = prev.find((item) => item.id === registration.id);
      const nextRegistration = {
        ...registration,
        has_secret: registration.has_secret ?? Boolean(registration.secret_key),
      };

      return exists
        ? prev.map((item) => (item.id === registration.id ? { ...item, ...nextRegistration } : item))
        : [nextRegistration, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await base44.functions.invoke("manageWebhookRegistration", { action: "delete", id });
      setRegistrations((prev) => prev.filter((item) => item.id !== id));
      setRevealedSecrets((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } finally {
      setDeleting(null);
      setDeleteCandidate(null);
    }
  };

  const handleRegenerate = async (id) => {
    setRegenerating(id);
    try {
      const res = await base44.functions.invoke("manageWebhookRegistration", {
        action: "regenerate_secret",
        id,
      });
      const nextRegistration = res.data.registration;
      if (nextRegistration?.secret_key) {
        setRevealedSecrets((prev) => ({ ...prev, [id]: nextRegistration.secret_key }));
      }
      setRegistrations((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...nextRegistration, has_secret: true } : item
        )
      );
    } finally {
      setRegenerating(null);
    }
  };

  const copyValue = (id, value) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const inboundUrl = `${window.location.origin}/api/functions/webhookLeadCapture`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Webhook Sources
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Register signed inbound lead sources per client project. Unsigned or mismatched traffic is rejected before lead creation.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      <div className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm text-foreground/80 leading-relaxed">
        <strong className="text-primary">How it works:</strong> every registration uses the shared endpoint, a registration-specific webhook ID, and an HMAC signing secret. The secret is shown only at creation or rotation time.
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-muted-foreground text-sm">No webhook sources configured yet.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-sm text-primary font-semibold hover:underline"
          >
            Add your first source →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration) => {
            const revealedSecret = revealedSecrets[registration.id];

            return (
              <div key={registration.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{registration.source_name}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_BADGE[registration.status] || STATUS_BADGE.inactive}`}>
                        {registration.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Triggers: <span className="font-medium text-foreground">{registration.service_key}</span>
                      {registration.last_triggered_at && ` · Last received: ${new Date(registration.last_triggered_at).toLocaleDateString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Webhook ID: <code>{registration.id}</code>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Client Project: <code>{registration.client_project_id || "Unassigned"}</code>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditing(registration);
                        setShowForm(true);
                      }}
                      className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted/30 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(registration)}
                      disabled={deleting === registration.id}
                      className="text-destructive hover:opacity-70 transition"
                    >
                      {deleting === registration.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Shared Inbound Endpoint</p>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                    <code className="text-xs text-foreground flex-1 truncate">{inboundUrl}</code>
                    <button
                      onClick={() => copyValue(`${registration.id}_url`, inboundUrl)}
                      className="shrink-0 text-muted-foreground hover:text-primary transition"
                    >
                      {copiedId === `${registration.id}_url` ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Signing Secret</p>
                    <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                      <code className="text-xs text-foreground flex-1 truncate">
                        {revealedSecret || (registration.has_secret ? "Hidden after creation. Regenerate to reveal once." : "No secret available")}
                      </code>
                      {revealedSecret && (
                        <button
                          onClick={() => copyValue(registration.id, revealedSecret)}
                          className="shrink-0 text-muted-foreground hover:text-primary transition"
                        >
                          {copiedId === registration.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        onClick={() => handleRegenerate(registration.id)}
                        disabled={regenerating === registration.id}
                        className="shrink-0 text-muted-foreground hover:text-primary transition"
                      >
                        {regenerating === registration.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Existing secrets are intentionally hidden after creation. Regenerate only when rotating credentials.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Delivery Health</p>
                    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground space-y-1">
                      <p>Status: <strong>{registration.status}</strong></p>
                      <p>Failure Count: <strong>{registration.failure_count || 0}</strong></p>
                      <p>Last Error: <span className="text-muted-foreground">{registration.last_error || "None"}</span></p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-foreground/80 space-y-1.5">
                  <p className="font-semibold text-foreground">Required Request Headers</p>
                  <p><code>x-webhook-id</code>: <code>{registration.id}</code></p>
                  <p><code>x-webhook-timestamp</code>: current Unix timestamp or ISO timestamp inside the verification window</p>
                  <p><code>x-webhook-signature</code>: hex HMAC-SHA256 of <code>{`{timestamp}.{rawBody}`}</code> using the signing secret</p>
                  <p><code>Content-Type</code>: <code>application/json</code></p>
                </div>

                {registration.field_mappings?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Field Mappings</p>
                    <div className="flex flex-wrap gap-2">
                      {registration.field_mappings.map((mapping, index) => (
                        <span key={index} className="text-[10px] bg-muted border border-border px-2 py-1 rounded-full font-mono">
                          {mapping.source_field} → {mapping.target_field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(registration.status === "failed" || registration.last_error) && (
                  <div className="flex items-start gap-2 text-xs text-destructive bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{registration.last_error || "Recent webhook delivery failed. Inspect CommunicationEvent for the rejected request details."}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <WebhookRegistrationForm
          existing={editing}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {deleteCandidate && (
        <DeleteConfirmModal
          title="Delete Webhook Source"
          description={`Delete ${deleteCandidate.source_name || "this webhook source"}? Inbound leads signed with this webhook ID will be rejected immediately.`}
          confirmLabel="Delete Source"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => handleDelete(deleteCandidate.id)}
        />
      )}
    </div>
  );
}
