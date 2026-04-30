/**
 * EmailCampaignPanel — full email campaign management dashboard.
 * Lists campaigns, shows metrics (open rate, CTR, unsubscribes), and lets admin create/send new ones.
 */

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  AlertCircle, CheckCircle2, Loader2, Mail, Plus, RefreshCw, Send,
  Trash2, Eye, TrendingUp, Users, MousePointerClick, UserMinus,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import CampaignStatusBadge from "./email-campaigns/CampaignStatusBadge";
import CampaignMetricsBar from "./email-campaigns/CampaignMetricsBar";
import CreateCampaignModal from "./email-campaigns/CreateCampaignModal";

function SummaryKPI({ icon: Icon, label, value, sub, color = "blue" }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-700 border-blue-100",
    green:  "bg-green-50 text-green-700 border-green-100",
    amber:  "bg-amber-50 text-amber-700 border-amber-100",
    red:    "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</p>
        <Icon className="h-4 w-4 opacity-50" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs opacity-70">{sub}</p>}
    </div>
  );
}

function CampaignCard({ campaign, onDelete, onResend }) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  const loadRecipients = async () => {
    if (recipients.length > 0) {
      setExpanded(e => !e);
      return;
    }
    setLoadingRecipients(true);
    try {
      const data = await base44.entities.EmailCampaignRecipient.filter(
        { campaign_id: campaign.id },
        "-created_date",
        100
      );
      setRecipients(data || []);
      setExpanded(true);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.EmailCampaign.delete(campaign.id);
      onDelete(campaign.id);
    } finally {
      setDeleting(false);
    }
  };

  const sentDate = campaign.sent_at
    ? new Date(campaign.sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : campaign.scheduled_at
    ? `Scheduled: ${new Date(campaign.scheduled_at).toLocaleDateString()}`
    : "Not sent";

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-foreground truncate">{campaign.name}</p>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="text-sm text-muted-foreground truncate">Subject: {campaign.subject}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sentDate} · {campaign.total_recipients || 0} recipients</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {["draft", "scheduled"].includes(campaign.status) && (
              <button
                onClick={() => onResend(campaign)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Send className="w-3 h-3" /> Send
              </button>
            )}
            <button
              onClick={loadRecipients}
              disabled={loadingRecipients}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {loadingRecipients ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
              Recipients
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Metrics */}
        {campaign.status === "sent" && (
          <CampaignMetricsBar campaign={campaign} />
        )}
      </div>

      {/* Recipient drawer */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-5 py-4">
          <p className="text-xs font-semibold text-foreground mb-3">
            Recipients ({recipients.length})
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-muted-foreground">Name / Email</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">Opens</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">Clicks</th>
                  <th className="text-left py-2 font-semibold text-muted-foreground">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recipients.map(r => (
                  <tr key={r.id} className="hover:bg-white transition-colors">
                    <td className="py-2 pr-3">
                      <p className="font-medium text-foreground">{r.lead_name || "—"}</p>
                      <p className="text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        r.status === "opened" ? "bg-blue-100 text-blue-700"
                        : r.status === "clicked" ? "bg-green-100 text-green-700"
                        : r.status === "bounced" ? "bg-red-100 text-red-700"
                        : r.status === "unsubscribed" ? "bg-orange-100 text-orange-700"
                        : r.status === "sent" ? "bg-gray-100 text-gray-600"
                        : "bg-muted text-muted-foreground"
                      }`}>{r.status}</span>
                    </td>
                    <td className="py-2 pr-3">{r.open_count || 0}</td>
                    <td className="py-2 pr-3">{r.click_count || 0}</td>
                    <td className="py-2 text-muted-foreground">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
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

export default function EmailCampaignPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sendingId, setSendingId] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await base44.entities.EmailCampaign.list("-created_date", 200);
      setCampaigns(data || []);
    } catch (err) {
      setError("Failed to load email campaigns.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendDraft = async (campaign) => {
    if (!confirm(`Send "${campaign.name}" now to all matching leads?`)) return;
    setSendingId(campaign.id);
    setSendResult(null);
    try {
      const res = await base44.functions.invoke("sendEmailCampaign", {
        campaign_id: campaign.id,
        preview_only: false,
      });
      setSendResult({ success: true, ...res.data });
      await loadCampaigns();
    } catch (err) {
      setSendResult({ error: err?.response?.data?.error || err?.message || "Send failed" });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = (id) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const filtered = statusFilter === "all" ? campaigns : campaigns.filter(c => c.status === statusFilter);

  const statuses = ["all", "draft", "scheduled", "sending", "sent", "cancelled"];
  const counts = statuses.reduce((acc, s) => {
    acc[s] = s === "all" ? campaigns.length : campaigns.filter(c => c.status === s).length;
    return acc;
  }, {});

  // Aggregate KPIs across all sent campaigns
  const sentCampaigns = campaigns.filter(c => c.status === "sent");
  const totalSent = sentCampaigns.reduce((s, c) => s + (c.total_sent || 0), 0);
  const totalOpened = sentCampaigns.reduce((s, c) => s + (c.total_opened || 0), 0);
  const totalClicked = sentCampaigns.reduce((s, c) => s + (c.total_clicked || 0), 0);
  const totalUnsub = sentCampaigns.reduce((s, c) => s + (c.total_unsubscribed || 0), 0);
  const avgOpenRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const avgCTR = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

  // Chart data: open rate per campaign (last 10 sent)
  const chartData = sentCampaigns.slice(0, 10).reverse().map(c => ({
    name: c.name.length > 14 ? c.name.slice(0, 14) + "…" : c.name,
    "Open Rate": c.total_sent > 0 ? Math.round((c.total_opened / c.total_sent) * 100) : 0,
    "CTR": c.total_sent > 0 ? Math.round((c.total_clicked / c.total_sent) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Email Campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create, segment, send, and track email campaigns linked to your lead pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Send result feedback */}
      {sendResult && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
          sendResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"
        }`}>
          {sendResult.error
            ? <><AlertCircle className="w-4 h-4 flex-shrink-0" />{sendResult.error}</>
            : <><CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Campaign sent! {sendResult.sent} emails sent, {sendResult.failed} failed.</>
          }
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryKPI icon={Mail} label="Total Campaigns" value={campaigns.length} sub={`${sentCampaigns.length} sent`} color="blue" />
        <SummaryKPI icon={Users} label="Total Sent" value={totalSent.toLocaleString()} sub="across all campaigns" color="green" />
        <SummaryKPI icon={TrendingUp} label="Avg Open Rate" value={`${avgOpenRate}%`} sub={`${totalOpened} opens`} color="amber" />
        <SummaryKPI icon={MousePointerClick} label="Avg Click Rate" value={`${avgCTR}%`} sub={`${totalClicked} clicks · ${totalUnsub} unsub`} color="red" />
      </div>

      {/* Chart — only show if there's data */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-semibold text-foreground mb-1">Campaign Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Open rate & CTR per campaign (last {chartData.length})</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit="%" width={32} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="Open Rate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="CTR" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {statuses.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-semibold">No {statusFilter !== "all" ? statusFilter : ""} campaigns yet</p>
          <p className="text-sm mt-1">Create your first campaign to start reaching leads with targeted emails.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onDelete={handleDelete}
              onResend={handleSendDraft}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreate={() => { setShowCreate(false); loadCampaigns(); }}
        />
      )}
    </div>
  );
}