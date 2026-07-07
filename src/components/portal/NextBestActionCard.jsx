/**
 * NextBestActionCard — priority guidance card for the portal dashboard.
 * Routes users to the most important next step based on real data:
 *   1. Billing failure        → billing
 *   2. Failed events          → performance
 *   3. Quick Start incomplete → quickstart
 *   4. Services not live      → progress
 *   5. Client approval needed → progress
 *   6. System live            → reports
 *   7. Default                → quickstart
 *
 * Never fabricates metrics — uses real project/order/subscription/health data.
 */
import { ArrowRight, CreditCard, AlertCircle, Zap, Rocket, ClipboardCheck, FileText } from "lucide-react";
import CSCard from "@/components/design-system/CSCard";

export default function NextBestActionCard({
  project,
  portalOrder,
  subscription,
  healthData,
  portalState,
  portalStateLoading,
  setActiveTab,
}) {
  let action = null;

  // 1. Billing failure — highest priority
  if (
    subscription?.status === "past_due" ||
    subscription?.status === "unpaid" ||
    subscription?.status === "canceled"
  ) {
    action = {
      icon: CreditCard,
      title: "Update Payment Method",
      description: "Your subscription payment needs attention to keep your system running.",
      buttonText: "Fix Billing",
      tab: "billing",
      color: "#DC2626",
    };
  }
  // 2. Failed automation events
  else if (
    !portalStateLoading &&
    (healthData?.recent_events || []).some((e) => e.status === "failed")
  ) {
    action = {
      icon: AlertCircle,
      title: "Review Failed Events",
      description: "Some automation events need your attention. Check performance to review details.",
      buttonText: "Review Now",
      tab: "performance",
      color: "#D4AF37",
    };
  }
  // 3. Quick Start not complete
  else if (
    !(project?.quick_start_completed === true && project?.onboarding_wizard_completed === true)
  ) {
    action = {
      icon: Zap,
      title: "Complete Quick Start",
      description: "Finish setting up your SMS, email, and booking settings to activate your lead system.",
      buttonText: "Start Setup",
      tab: "quickstart",
      color: "#0088CC",
    };
  }
  // 4. Services configured but not all live
  else if (!portalStateLoading) {
    const services = portalOrder?.services || [];
    const liveCount = services.filter((s) => s.install_status === "Live").length;
    if (services.length > 0 && liveCount < services.length) {
      action = {
        icon: Rocket,
        title: "Check Setup Progress",
        description: "Some services are still being configured. Track your setup progress to see what's remaining.",
        buttonText: "View Progress",
        tab: "progress",
        color: "#0088CC",
      };
    }
  }

  // 5. Client approval requested
  if (!action && project?.client_approval_status === "Requested") {
    action = {
      icon: ClipboardCheck,
      title: "Review Your System",
      description: "Your system is ready for your review. Please approve or request changes to proceed to launch.",
      buttonText: "Review Now",
      tab: "progress",
      color: "#0088CC",
    };
  }

  // 6. System is live → weekly report
  if (!action && !portalStateLoading && project?.client_project_status === "Live") {
    action = {
      icon: FileText,
      title: "View Your Weekly Report",
      description: "Your system is live. Check your weekly performance report to see how your automations are performing.",
      buttonText: "View Report",
      tab: "reports",
      color: "#10B981",
    };
  }

  // 7. Default fallback
  if (!action) {
    action = {
      icon: Zap,
      title: "Complete Quick Start",
      description: "Configure your system settings to activate your lead automation.",
      buttonText: "Start Setup",
      tab: "quickstart",
      color: "#0088CC",
    };
  }

  const { icon: Icon, title, description, buttonText, tab, color } = action;

  return (
    <CSCard className="!p-5" hover={false}>
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}14`, border: `1px solid ${color}25` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
            Recommended Next Step
          </p>
          <h3 className="text-base font-bold text-gray-900 mb-1 font-display">{title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">{description}</p>
          <button
            onClick={() => setActiveTab(tab)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
            style={{ background: color }}
          >
            {buttonText}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </CSCard>
  );
}