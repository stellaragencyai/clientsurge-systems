import { Activity, LifeBuoy, ListChecks, ShieldCheck } from "lucide-react";
import ProofStatusBadge from "@/components/shared/ProofStatusBadge";

function getProjectStatus(project = {}, order = {}) {
  const rawStatus = String(project.status || order.workflow_stage || order.status || "pending").toLowerCase();
  if (["live", "active", "completed"].includes(rawStatus)) return "trusted";
  if (["blocked", "failed", "payment_failed"].includes(rawStatus)) return "blocked";
  if (["configuring", "in_progress", "installing", "pending"].includes(rawStatus)) return "pending";
  return "unknown";
}

function getNextAction(project = {}, order = {}) {
  if (order.payment_status === "failed") {
    return {
      status: "blocked",
      title: "Payment attention needed",
      detail: "Update billing so setup and automations can continue without interruption.",
      actionTab: "billing",
      actionLabel: "Open Billing",
    };
  }

  if (project.missing_assets || project.credentials_missing || project.onboarding_complete === false) {
    return {
      status: "warning",
      title: "Setup details needed",
      detail: "Finish the remaining onboarding or credential items so activation can continue.",
      actionTab: "files",
      actionLabel: "Open Files & Credentials",
    };
  }

  if (project.status === "Live" || project.status === "live") {
    return {
      status: "trusted",
      title: "System is live",
      detail: "Your active automations and recent proof are available in the Automations section.",
      actionTab: "performance",
      actionLabel: "View Automations",
    };
  }

  return {
    status: "pending",
    title: "Setup is moving forward",
    detail: "Your system is being configured. Review the timeline for the latest stage and next milestone.",
    actionTab: "timeline",
    actionLabel: "View Timeline",
  };
}

function getLatestActivity(healthData = {}) {
  const recent = Array.isArray(healthData?.recent_events) ? healthData.recent_events[0] : null;
  if (!recent) {
    return {
      status: "unknown",
      title: "No recent activity yet",
      detail: "Activity will appear here once system events, messages, or setup milestones are recorded.",
    };
  }
  const status = recent.status === "failed" ? "warning" : recent.status === "sent" || recent.status === "completed" ? "trusted" : "pending";
  return {
    status,
    title: recent.event_type || recent.subject || "Recent system event",
    detail: recent.created_date ? `Latest event recorded ${new Date(recent.created_date).toLocaleString()}` : "Latest event recorded in your system activity.",
  };
}

function SummaryCard({ icon: Icon, label, title, detail, status, actionLabel, onAction }) {
  return (
    <div className="rounded-2xl border border-[#C9E7FB] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF9FF] text-[#0088CC]">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <h3 className="mt-1 text-sm font-black text-foreground">{title}</h3>
          </div>
        </div>
        <ProofStatusBadge status={status} />
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-full border border-[#C9E7FB] px-3 py-2 text-xs font-black text-[#005691] transition-colors hover:bg-[#EEF9FF]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default function PortalConfidenceSummary({ project, order, healthData, onNavigate }) {
  const systemStatus = getProjectStatus(project, order);
  const nextAction = getNextAction(project, order);
  const latestActivity = getLatestActivity(healthData);

  return (
    <section className="mx-auto max-w-4xl px-4 pt-4 md:px-6" aria-label="Client portal confidence summary">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={ShieldCheck}
          label="System Status"
          title={project?.status || order?.workflow_stage || "Setup Pending"}
          detail="Current setup and automation status based on your linked portal record."
          status={systemStatus}
          actionLabel="View Status"
          onAction={() => onNavigate?.("order-status")}
        />
        <SummaryCard
          icon={ListChecks}
          label="Next Action"
          title={nextAction.title}
          detail={nextAction.detail}
          status={nextAction.status}
          actionLabel={nextAction.actionLabel}
          onAction={() => onNavigate?.(nextAction.actionTab)}
        />
        <SummaryCard
          icon={Activity}
          label="Latest Activity"
          title={latestActivity.title}
          detail={latestActivity.detail}
          status={latestActivity.status}
          actionLabel="View Activity"
          onAction={() => onNavigate?.("performance")}
        />
        <SummaryCard
          icon={LifeBuoy}
          label="Support"
          title="Need help?"
          detail="Send a support message from the portal if something looks wrong or you need clarification."
          status="trusted"
          actionLabel="Open Support"
          onAction={() => onNavigate?.("support")}
        />
      </div>
    </section>
  );
}
