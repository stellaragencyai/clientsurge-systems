import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Copy, RefreshCw, Trash2, CheckCircle, XCircle, Loader2, Webhook } from "lucide-react";
import WebhookRegistrationForm from "./WebhookRegistrationForm";

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

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("manageWebhookRegistration", { action: "list" });
      setRegistrations(res.data.registrations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (reg) => {
    setRegistrations((prev) => {
      const exists = prev.find((r) => r.id === reg.id);
      return exists ? prev.map((r) => r.id === reg.id ? reg : r) : [reg, ...prev];
    });
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this webhook registration?")) return;
    setDeleting(id);
    try {
      await base44.functions.invoke("manageWebhookRegistration", { action: "delete", id });
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const handleRegenerate = async (id) => {
    setRegenerating(id);
    try {
      const res = await base44.functions.invoke("manageWebhookRegistration", { action: "regenerate_secret", id });
      setRegistrations((prev) => prev.map((r) => r.id === id ? res.data.registration : r));
    } finally {
      setRegenerating(null);
    }
  };

  const copySecret = (id, secret) => {
    navigator.clipboard.writeText(secret);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Build the inbound webhook URL for this registration
  const getInboundUrl = (reg) =>
    `${window.location.origin}/api/functions/webhookLeadCapture?source=${encodeURIComponent(reg.source_name)}&key=${reg.secret_key || ""}`;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Webhook Sources
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect external lead sources (Facebook Ads, CRMs, Zapier) and define how their data maps into your pipeline.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> Add Source
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-5 py-4 text-sm text-foreground/80 leading-relaxed">
        <strong className="text-primary">How it works:</strong> Each source gets a unique webhook URL. Paste it into your CRM, Facebook Ads, or Zapier. When a lead arrives, it's automatically mapped to your lead pipeline and the configured automation triggers instantly.
      </div>

      {/* List */}
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
          {registrations.map((reg) => (
            <div key={reg.id} className="rounded-2xl border border-border bg-card p-5 space-y-4">
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{reg.source_name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_BADGE[reg.status] || STATUS_BADGE.inactive}`}>
                      {reg.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Triggers: <span className="font-medium text-foreground">{reg.service_key}</span>
                    {reg.last_triggered_at && ` · Last received: ${new Date(reg.last_triggered_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => { setEditing(reg); setShowForm(true); }}
                    className="text-xs text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:bg-muted/30 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(reg.id)}
                    disabled={deleting === reg.id}
                    className="text-destructive hover:opacity-70 transition"
                  >
                    {deleting === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Webhook URL */}
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Your Inbound Webhook URL</p>
                <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                  <code className="text-xs text-foreground flex-1 truncate">{getInboundUrl(reg)}</code>
                  <button
                    onClick={() => copySecret(reg.id + "_url", getInboundUrl(reg))}
                    className="shrink-0 text-muted-foreground hover:text-primary transition"
                  >
                    {copiedId === reg.id + "_url" ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              {reg.secret_key && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Secret Key</p>
                  <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                    <code className="text-xs text-foreground flex-1 truncate">{reg.secret_key}</code>
                    <button onClick={() => copySecret(reg.id, reg.secret_key)} className="shrink-0 text-muted-foreground hover:text-primary transition">
                      {copiedId === reg.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleRegenerate(reg.id)} disabled={regenerating === reg.id} className="shrink-0 text-muted-foreground hover:text-primary transition">
                      {regenerating === reg.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Field Mappings summary */}
              {reg.field_mappings?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Field Mappings</p>
                  <div className="flex flex-wrap gap-2">
                    {reg.field_mappings.map((m, i) => (
                      <span key={i} className="text-[10px] bg-muted border border-border px-2 py-1 rounded-full font-mono">
                        {m.source_field} → {m.target_field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Failure notice */}
              {reg.status === "failed" && reg.last_error && (
                <div className="flex items-start gap-2 text-xs text-destructive bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{reg.last_error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <WebhookRegistrationForm
          existing={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}