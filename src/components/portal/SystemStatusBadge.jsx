import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, AlertCircle, Clock, Mail } from "lucide-react";

/**
 * Simple client-facing system status indicator.
 * Shows green/yellow/red based on recent CommunicationEvent activity.
 * No internals (credentials, config) are exposed.
 */
export default function SystemStatusBadge({ project }) {
  const [status, setStatus] = useState(null); // "active" | "slow" | "issue" | null
  const [lastActivity, setLastActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project?.id) { setLoading(false); return; }
    loadStatus();
  }, [project?.id]);

  const loadStatus = async () => {
    try {
      const response = await base44.functions.invoke("getClientPortalProjectActivity", {
        section: "status",
        limit: 10,
      });
      const systemStatus = response?.system_status;

      if (!systemStatus?.status) {
        setStatus(null);
        setLastActivity(null);
        return;
      }

      setStatus(systemStatus.status);
      setLastActivity(systemStatus.last_activity || null);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === null) return null;

  const configs = {
    active: {
      dot: "bg-green-400",
      pulse: "bg-green-400",
      text: "Automations Active",
      textColor: "text-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    slow: {
      dot: "bg-yellow-400",
      pulse: "bg-yellow-400",
      text: "Awaiting Activity",
      textColor: "text-yellow-200",
      icon: <Clock className="w-3 h-3" />,
    },
    issue: {
      dot: "bg-red-400",
      pulse: "bg-red-400",
      text: "Issues Detected — Contact Support",
      textColor: "text-red-200",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const cfg = configs[status];

  return (
    <div className="flex items-center gap-4 mt-3 flex-wrap">
      {/* Status pill */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          {status === "active" && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.pulse} opacity-60`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dot}`} />
        </span>
        <span className={`text-xs font-semibold flex items-center gap-1 ${cfg.textColor}`}>
          {cfg.icon}
          {cfg.text}
        </span>
      </div>

      {/* Last activity */}
      {lastActivity && (
        <span className="text-xs text-blue-200/60">
          Last activity: {formatRelative(lastActivity)}
        </span>
      )}

      {/* Contact support link if issue */}
      {status === "issue" && (
        <a
          href="mailto:support@clientsurgesystems.com"
          className="flex items-center gap-1 text-xs text-red-300 hover:text-red-100 underline transition-colors"
        >
          <Mail className="w-3 h-3" />
          Contact us
        </a>
      )}
    </div>
  );
}

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
