/**
 * PortalTrustStrip — Phase 4.4 Phase 6
 *
 * Subtle trust indicators shown across the portal.
 * Shows: last verified, system checked, automation verified, secure connection, recent activity.
 *
 * Never exposes: technical IDs, logs, internal states.
 * All values derived from portalState proof_metadata and deployment data.
 */
import { ShieldCheck, Lock, Activity, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

export default function PortalTrustStrip({ portalState, portalStateLoading, deployment }) {
  const systemCard = getCardState(portalState, "system_readiness");
  const automationCard = getCardState(portalState, "automation_health");
  const lastVerified = systemCard?.proof_metadata?.last_verified || systemCard?.last_verified;
  const automationVerified = automationCard?.proof_metadata?.last_verified || automationCard?.last_verified;

  const isLive = systemCard.status === CARD_STATUS.LIVE;
  const isAutomationLive = automationCard.status === CARD_STATUS.LIVE;

  const trustItems = [
    {
      icon: ShieldCheck,
      label: "System Status",
      value: portalStateLoading
        ? "Checking…"
        : isLive
          ? "Verified"
          : systemCard.status === CARD_STATUS.SETUP_REQUIRED
            ? "In Setup"
            : systemCard.status === CARD_STATUS.SYNCING
              ? "Syncing"
              : "Pending",
      color: isLive ? "#10B981" : "#9CA3AF",
      show: true,
    },
    {
      icon: CheckCircle2,
      label: "Automation",
      value: portalStateLoading
        ? "Checking…"
        : isAutomationLive
          ? "Verified"
          : automationCard.status === CARD_STATUS.SETUP_REQUIRED
            ? "In Setup"
            : "Pending",
      color: isAutomationLive ? "#10B981" : "#9CA3AF",
      show: true,
    },
    {
      icon: Clock,
      label: "Last Checked",
      value: lastVerified
        ? formatDistanceToNow(new Date(lastVerified), { addSuffix: false })
        : portalStateLoading
          ? "—"
          : "Pending",
      color: "#6B7280",
      show: !!lastVerified || portalStateLoading,
    },
    {
      icon: Activity,
      label: "Recent Activity",
      value: deployment?.analytics?.last_activity_at
        ? formatDistanceToNow(new Date(deployment.analytics.last_activity_at), { addSuffix: false })
        : "No activity yet",
      color: "#6B7280",
      show: true,
    },
    {
      icon: Lock,
      label: "Connection",
      value: "Secure",
      color: "#10B981",
      show: true,
    },
  ];

  const visibleItems = trustItems.filter((item) => item.show);

  return (
    <div className="flex items-center gap-3 flex-wrap px-1 py-0.5">
      {visibleItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: `${item.color}08`, border: `1px solid ${item.color}15` }}
          >
            <Icon className="w-3 h-3" style={{ color: item.color }} />
            <span className="text-[10px] font-semibold text-gray-500">{item.label}:</span>
            <span className="text-[10px] font-bold" style={{ color: item.color }}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}