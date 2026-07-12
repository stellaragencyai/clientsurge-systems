import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  AlertCircle, AlertTriangle, CheckCircle2, Loader2, Mail, Plus, RefreshCw,
  Send, Trash2, Eye, TrendingUp, Users, MousePointerClick, X,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CampaignStatusBadge from "./email-campaigns/CampaignStatusBadge";
import CampaignMetricsBar from "./email-campaigns/CampaignMetricsBar";
import CreateCampaignModal from "./email-campaigns/CreateCampaignModal";

function SummaryKPI({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-green-50 text-green-700 border-green-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
        <Icon className="h-4 w-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

function CampaignCard({ campaign, onDelete, onReview, reviewing }) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const loadRecipients = async () => {
    if (recipients.length > 0) {
      setExpanded((value) => !value);
      return;
    }
    setLoadingRecipients(true);
    try {
      const data = await base44.entities.EmailCampaignRecipient.filter(
        { campaign_id: campaign.id },
        "-created_date",
        100,
      );
      setRecipients(data || []);
      setExpanded(true);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.EmailCampaign.delete(campaign.id);
      onDelete(campaign.id);
    } finally {
      setDeleting(false);
    }
  };

  const sentDate = campaign.sent_at
    ? new Date(campaign.sent_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : campaign.scheduled_at
      ? `Scheduled: ${new Date(campaign.scheduled_at).toLocaleDateString()}`
      : "Not sent";

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-foreground">{campaign.name}</p>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="truncate text-sm text-muted-foreground">Subject: {campaign.subject}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {sentDate} · {campaign.total_recipients || 0} recipients
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {["draft", "scheduled"].includes(campaign.status) && (
              <button
                type="button"
                onClick={() => onReview(campaign)}
                disabled={reviewing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
              >
                {reviewing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Review Send
              </button>
            )}
            <button
              type="button"
              onClick={loadRecipients}
              disabled={loadingRecipients}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {loadingRecipients ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
              Recipients
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label={`Delete ${campaign.name}`}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {campaign.status === "sent" && <CampaignMetricsBar campaign={campaign} />}
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          <p className="mb-3 text-xs font-semibold text-foreground">Recipients ({recipients.length})</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 text-left font-semibold text-muted-foreground">Name / Email</th>
                  <th className="py-2 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="py-2 text-left font-semibold text-muted-foreground">Opens</th>
                  <th className="py-2 text-left font-semibold text-muted-foreground">Clicks</th>
                  <th className="py-2 text-left font-semibold text-muted-foreground">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recipients.map((recipient) => (
                  <tr key={recipient.id} className="transition-colors hover:bg-white">
                    <td className="py-2 pr-3">
                      <p className="font-medium text-foreground">{recipient.lead_name || "—"}</p>
                      <p className="text-muted-foreground">{recipient.email}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        recipient.status === "opened" ? "bg-blue-100 text-blue-700"
                          : recipient.status === "clicked" ? "bg-green-100 text-green-700"
                          : recipient.status === "bounced" ? "bg-red-100 text-red-700"
                          : recipient.status === "unsubscribed" ? "bg-orange-100 text-orange-700"
                          : recipient.status === "sent" ? "bg-gray-100 text-gray-600"
                          : "bg-muted text-muted-foreground"
                      }`}>{recipient.status}</span>
                    </td>
                    <td className="py-2 pr-3">{recipient.open_count || 0}</td>
                    <td className="py-2 pr-3">{recipient.click_count || 0}</td>
                    <td className="py-2 text-muted-foreground">
                      {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {recipients.length === 0 && (
                  <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No recipients found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ExistingDraftReviewModal({ review, confirmation, setConfirmation, sending, error, onClose, onSend }) {
  if (!review) return null;
  const expected = `SEND ${review.preview.recipient_count}`;
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-700">Final Send Review</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">{review.campaign.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{review.campaign.subject}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100" aria-label="Close send review">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-2xl font-black">{review.preview.recipient_count}</p><p className="text-xs text-slate-500">Eligible</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className="text-2xl font-black">{review.preview.suppressed_count}</p><p className="text-xs text-slate-500">Suppressed</p></div>
          <div className="rounded-xl border border-slate-200 p-4"><p className={`text-lg font-black ${review.preview.sending_ready ? "text-emerald-700" : "text-red-700"}`}>{review.preview.sending_ready ? "Ready" : "Blocked"}</p><p className="text-xs text-slate-500">Send gate</p></div>
        </div>

        {review.preview.readiness_failures?.length > 0 && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <div className="flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4" /> Readiness failures</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {review.preview.readiness_failures.map((failure) => <li key={failure}>{failure}</li>)}
            </ul>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-900">Sample recipients</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(review.preview.sample_recipients || []).map((recipient) => (
              <div key={recipient.id} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700">
                <p className="font-bold text-slate-950">{recipient.name}</p>
                <p>{recipient.email}</p>
                <p className="text-slate-500">{recipient.industry}</p>
              </div>
            ))}
          </div>
        </div>

        {review.preview.recipient_count > 0 && (
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <label className="block text-sm font-black text-sky-950">Type {expected} exactly</label>
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={expected}
              className="mt-2 w-full rounded-xl border border-sky-200 bg-white px-3 py-2.5 text-sm font-bold"
            />
          </div>
        )}

        {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button
            type="button"
            onClick={onSend}
            disabled={sending || !review.preview.sending_ready || confirmation.trim() !== expected}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Reviewed Batch
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmailCampaignPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewingId, setReviewingId] = useState(null);
  const [draftReview, setDraftReview] = useState(null);
  const [draftConfirmation, setDraftConfirmation] = useState("");
  const [draftSendError, setDraftSendError] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await base44.entities.EmailCampaign.list("-created_date", 200);
      setCampaigns(data || []);
    } catch {
      setError("Failed to load email campaigns.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewDraft = async (campaign) => {
    setReviewingId(campaign.id);
    setSendResult(null);
    setDraftSendError("");
    setDraftConfirmation("");
    try {
      const response = await base44.functions.invoke("sendEmailCampaign", {
        campaign_id: campaign.id,
        preview_only: true,
      });
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || "Recipient preview failed.");
      }
      setDraftReview({ campaign, preview: response.data });
    } catch (reviewError) {
      setSendResult({
        error: reviewError?.response?.data?.error || reviewError?.message || "Recipient preview failed.",
      });
    } finally {
      setReviewingId(null);
    }
  };

  const handleSendReviewedDraft = async () => {
    if (!draftReview) return;
    const expected = `SEND ${draftReview.preview.recipient_count}`;
    if (draftConfirmation.trim() !== expected) {
      setDraftSendError(`Type ${expected} exactly to send.`);
      return;
    }
    setSendingId(draftReview.campaign.id);
    setDraftSendError("");
    try {
      const response = await base44.functions.invoke("sendEmailCampaign", {
        campaign_id: draftReview.campaign.id,
        preview_only: false,
      });
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || "Campaign send failed.");
      }
      setSendResult({ success: true, ...response.data });
      setDraftReview(null);
      setDraftConfirmation("");
      await loadCampaigns();
    } catch (sendError) {
      setDraftSendError(
        sendError?.response?.data?.error || sendError?.message || "Campaign send failed.",
      );
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = (id) => {
    setCampaigns((current) => current.filter((campaign) => campaign.id !== id));
  };

  const filtered = statusFilter === "all"
    ? campaigns
    : campaigns.filter((campaign) => campaign.status === statusFilter);
  const statuses = ["all", "draft", "scheduled", "sending", "sent", "cancelled"];
  const counts = statuses.reduce((accumulator, status) => {
    accumulator[status] = status === "all"
      ? campaigns.length
      : campaigns.filter((campaign) => campaign.status === status).length;
    return accumulator;
  }, {});

  const sentCampaigns = campaigns.filter((campaign) => campaign.status === "sent");
  const totalSent = sentCampaigns.reduce((sum, campaign) => sum + (campaign.total_sent || 0), 0);
  const totalOpened = sentCampaigns.reduce((sum, campaign) => sum + (campaign.total_opened || 0), 0);
  const totalClicked = sentCampaigns.reduce((sum, campaign) => sum + (campaign.total_clicked || 0), 0);
  const totalUnsubscribed = sentCampaigns.reduce((sum, campaign) => sum + (campaign.total_unsubscribed || 0), 0);
  const averageOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const averageClickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
  const chartData = sentCampaigns.slice(0, 10).reverse().map((campaign) => ({
    name: campaign.name.length > 14 ? `${campaign.name.slice(0, 14)}…` : campaign.name,
    "Open Rate": campaign.total_sent > 0 ? Math.round((campaign.total_opened / campaign.total_sent) * 100) : 0,
    CTR: campaign.total_sent > 0 ? Math.round((campaign.total_clicked / campaign.total_sent) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Email Campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview verified recipients, review suppression gates, and send controlled industry batches.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={loadCampaigns} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> New Campaign
          </button>
        </div>
      </div>

      {sendResult && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          sendResult.error
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-800"
        }`}>
          {sendResult.error
            ? <><AlertCircle className="h-4 w-4 flex-shrink-0" />{sendResult.error}</>
            : <><CheckCircle2 className="h-4 w-4 flex-shrink-0" />Campaign sent: {sendResult.sent} sent, {sendResult.failed} failed, {sendResult.suppressed} suppressed.</>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryKPI icon={Mail} label="Total Campaigns" value={campaigns.length} sub={`${sentCampaigns.length} sent`} color="blue" />
        <SummaryKPI icon={Users} label="Total Sent" value={totalSent.toLocaleString()} sub="across all campaigns" color="green" />
        <SummaryKPI icon={TrendingUp} label="Avg Open Rate" value={`${averageOpenRate}%`} sub={`${totalOpened} opens`} color="amber" />
        <SummaryKPI icon={MousePointerClick} label="Avg Click Rate" value={`${averageClickRate}%`} sub={`${totalClicked} clicks · ${totalUnsubscribed} unsub`} color="red" />
      </div>

      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-1 font-semibold text-foreground">Campaign Performance</h3>
          <p className="mb-4 text-xs text-muted-foreground">Open and click rates for the last {chartData.length} sent campaigns.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" width={32} />
              <Tooltip formatter={(value) => `${value}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="Open Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CTR" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status]})
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Mail className="mx-auto mb-3 h-10 w-10 opacity-20" />
          <p className="font-semibold">No {statusFilter !== "all" ? statusFilter : ""} campaigns yet</p>
          <p className="mt-1 text-sm">Create a reviewed first-touch campaign to generate a safe recipient preview.</p>
          <button type="button" onClick={() => setShowCreate(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onDelete={handleDelete}
              onReview={handleReviewDraft}
              reviewing={reviewingId === campaign.id}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onSent={(result) => {
            setShowCreate(false);
            setSendResult({ success: true, ...result });
            loadCampaigns();
          }}
        />
      )}

      <ExistingDraftReviewModal
        review={draftReview}
        confirmation={draftConfirmation}
        setConfirmation={(value) => {
          setDraftConfirmation(value);
          setDraftSendError("");
        }}
        sending={Boolean(sendingId)}
        error={draftSendError}
        onClose={() => {
          if (sendingId) return;
          setDraftReview(null);
          setDraftConfirmation("");
          setDraftSendError("");
        }}
        onSend={handleSendReviewedDraft}
      />
    </div>
  );
}
