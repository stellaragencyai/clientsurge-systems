/**
 * DripCampaignPanel — admin UI to monitor and manage active drip campaigns.
 */

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Send,
  XCircle,
  Zap,
} from "lucide-react";

const STATUS_CONFIG = {
  active:    { label: "Active",    color: "bg-green-100 text-green-700",  icon: Activity },
  paused:    { label: "Paused",    color: "bg-blue-100 text-blue-700",  icon: Pause },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700",    icon: CheckCircle },
  stopped:   { label: "Stopped",   color: "bg-gray-100 text-gray-600",    icon: XCircle },
};

const STEP_STATUS_COLOR = {
  pending: "bg-muted text-muted-foreground",
  sent:    "bg-green-100 text-green-700",
  failed:  "bg-red-100 text-red-700",
  skipped: "bg-gray-100 text-gray-500",
};

function StepBadge({ label, status }) {
  const colorClass = STEP_STATUS_COLOR[status] || STEP_STATUS_COLOR.pending;
  return (
    <div className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-center ${colorClass}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold capitalize">{status || "pending"}</span>
    </div>
  );
}

function CampaignRow({ campaign, onPause, onResume, pausing }) {
  const cfg = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.active;
  const Icon = cfg.icon;
  const isActive = campaign.status === "active";
  const isPaused = campaign.status === "paused";

  const enrolledAt = campaign.enrolled_at ? new Date(campaign.enrolled_at) : null;
  const hoursElapsed = enrolledAt ? Math.floor((Date.now() - enrolledAt.getTime()) / 3600000) : null;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${isActive ? "border-primary/20 bg-primary/3" : "border-border bg-white"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-foreground">{campaign.lead_name || "Unknown Lead"}</p>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.color}`}>
              <Icon className="w-2.5 h-2.5" />{cfg.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {campaign.lead_email || "—"} · {campaign.lead_phone || "—"}
          </p>
          {enrolledAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Enrolled {enrolledAt.toLocaleDateString()} · {hoursElapsed}h elapsed
            </p>
          )}
          {campaign.stop_reason && (
            <p className="text-xs text-blue-700 mt-0.5 font-medium">
              Stopped: {campaign.stop_reason.replace(/_/g, " ")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          {isActive && (
            <button
              onClick={() => onPause(campaign.id)}
              disabled={pausing === campaign.id}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {pausing === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pause className="w-3 h-3" />}
              Pause
            </button>
          )}
          {isPaused && (
            <button
              onClick={() => onResume(campaign.id)}
              disabled={pausing === campaign.id}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {pausing === campaign.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Resume
            </button>
          )}
        </div>
      </div>

      {/* Step tracker */}
      <div className="grid grid-cols-3 gap-2">
        <StepBadge label="Day 1" status={campaign.day1_status} />
        <StepBadge label="Day 3" status={campaign.day3_status} />
        <StepBadge label="Day 7" status={campaign.day7_status} />
      </div>

      {campaign.last_step_run_at && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Last checked: {new Date(campaign.last_step_run_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function DripCampaignPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pausing, setPausing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await base44.entities.DripCampaign.list("-enrolled_at", 200);
      setCampaigns(data || []);
    } catch (err) {
      setError("Failed to load drip campaigns.");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
    setPausing(id);
    try {
      await base44.entities.DripCampaign.update(id, { status: "paused", stop_reason: "manual_pause" });
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "paused", stop_reason: "manual_pause" } : c));
    } finally {
      setPausing(null);
    }
  };

  const handleResume = async (id) => {
    setPausing(id);
    try {
      await base44.entities.DripCampaign.update(id, { status: "active", stop_reason: null });
      setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: "active", stop_reason: null } : c));
    } finally {
      setPausing(null);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await base44.functions.invoke("processDripCampaigns", {});
      setRunResult(res.data);
      await loadCampaigns();
    } catch (err) {
      setRunResult({ error: err?.response?.data?.error || "Run failed" });
    } finally {
      setRunning(false);
    }
  };

  const filtered = statusFilter === "all" ? campaigns : campaigns.filter((c) => c.status === statusFilter);

  const counts = {
    all:       campaigns.length,
    active:    campaigns.filter((c) => c.status === "active").length,
    paused:    campaigns.filter((c) => c.status === "paused").length,
    completed: campaigns.filter((c) => c.status === "completed").length,
    stopped:   campaigns.filter((c) => c.status === "stopped").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Drip Campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Automated Day 1 / Day 3 / Day 7 follow-up sequences. Auto-stops when a lead reaches Qualified or beyond.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRunNow}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Now
          </button>
          <button
            onClick={loadCampaigns}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Run result */}
      {runResult && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${runResult.error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"}`}>
          {runResult.error
            ? <><AlertCircle className="w-4 h-4 flex-shrink-0" />{runResult.error}</>
            : <><CheckCircle className="w-4 h-4 flex-shrink-0" />
              Checked {runResult.campaigns_checked} campaigns · {runResult.fired} steps fired · {runResult.stopped} stopped · {runResult.errors} errors</>
          }
        </div>
      )}

      {/* How it works */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-1">
        <div className="flex items-center gap-2 font-semibold text-foreground mb-2">
          <Send className="w-4 h-4 text-primary" />
          How drip campaigns work
        </div>
        <ul className="list-disc list-inside text-xs text-foreground/75 space-y-0.5">
          <li>When a lead's status changes to <strong>Contacted</strong>, they're auto-enrolled</li>
          <li><strong>Day 1</strong> (24h), <strong>Day 3</strong> (72h), <strong>Day 7</strong> (168h) follow-ups fire via SMS or email</li>
          <li>Campaign <strong>auto-stops</strong> if the lead reaches Qualified, Booking Prompt Sent, Booked, or Closed</li>
          <li>SMS uses your Twilio templates from Settings · Email falls back via Resend if no phone</li>
          <li>The hourly scheduler runs automatically — use <strong>Run Now</strong> to trigger manually</li>
        </ul>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)} ({count})
          </button>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No {statusFilter === "all" ? "" : statusFilter} drip campaigns yet.
          <p className="mt-1 text-xs">Campaigns are auto-created when a lead's status is set to Contacted.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => (
            <CampaignRow
              key={campaign.id}
              campaign={campaign}
              onPause={handlePause}
              onResume={handleResume}
              pausing={pausing}
            />
          ))}
        </div>
      )}
    </div>
  );
}