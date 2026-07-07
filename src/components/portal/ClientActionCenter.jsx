/**
 * ClientActionCenter — Phase 4.4 Phase 2
 *
 * Unified action area that shows the client exactly what requires attention.
 *
 * States:
 *   - No Action Needed
 *   - Action Required
 *   - Waiting on Client
 *   - Waiting on System
 *   - Completed
 *
 * Truth sources:
 *   - PortalStateEngine (card states)
 *   - ClientDeployment (module installation status)
 *   - SetupAuthorization (client approval needed)
 *   - SmartAccessRequest (access requests pending)
 *   - ClientProject (onboarding wizard, quick start)
 *   - Subscription (billing issues)
 */
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  CheckCircle2, AlertCircle, Clock, UserCheck, Loader2,
  CreditCard, Calendar, FileText, Zap, ShieldCheck, ArrowRight, Settings,
} from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import CSCard from "@/components/design-system/CSCard";

const ACTION_STATES = {
  NONE: "no_action_needed",
  REQUIRED: "action_required",
  WAITING_CLIENT: "waiting_on_client",
  WAITING_SYSTEM: "waiting_on_system",
  COMPLETED: "completed",
};

const STATE_CONFIG = {
  [ACTION_STATES.NONE]: {
    label: "All Clear",
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    icon: CheckCircle2,
    description: "No action needed from you right now. Your system is running smoothly.",
  },
  [ACTION_STATES.REQUIRED]: {
    label: "Action Required",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    icon: AlertCircle,
    description: "Your attention is needed to keep your system running.",
  },
  [ACTION_STATES.WAITING_CLIENT]: {
    label: "Waiting on You",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    icon: UserCheck,
    description: "We're waiting for your input to proceed.",
  },
  [ACTION_STATES.WAITING_SYSTEM]: {
    label: "In Progress",
    color: "#00AEEF",
    bg: "rgba(0,174,239,0.08)",
    icon: Clock,
    description: "Our team is working on this. You'll be notified when it's ready.",
  },
  [ACTION_STATES.COMPLETED]: {
    label: "Completed",
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    icon: CheckCircle2,
    description: "This task is complete.",
  },
};

export default function ClientActionCenter({
  project,
  deployment,
  portalState,
  portalStateLoading,
  subscription,
  order,
  isAdminPreview = false,
  onNavigate,
}) {
  const [setupAuth, setSetupAuth] = useState(null);
  const [smartAccess, setSmartAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project?.id) {
      setLoading(false);
      return;
    }
    loadActionData();
  }, [project?.id]);

  async function loadActionData() {
    try {
      const [authRes, accessRes] = await Promise.all([
        fetchSetupAuthorization(),
        fetchSmartAccessRequest(),
      ]);
      setSetupAuth(authRes);
      setSmartAccess(accessRes);
    } catch {
      // Silent — actions still derive from portalState
    } finally {
      setLoading(false);
    }
  }

  async function fetchSetupAuthorization() {
    try {
      const results = await base44.entities.SetupAuthorization.filter(
        { client_project_id: project?.id },
        "-created_date",
        5
      );
      return results?.[0] || null;
    } catch {
      return null;
    }
  }

  async function fetchSmartAccessRequest() {
    try {
      const results = await base44.entities.SmartAccessRequest.filter(
        { client_project_id: project?.id },
        "-created_date",
        5
      );
      return results?.[0] || null;
    } catch {
      return null;
    }
  }

  // ── Build action items from real data ──
  const actions = [];

  // 1. Billing payment issue
  const billingCard = getCardState(portalState, "billing");
  if (billingCard.status === CARD_STATUS.BLOCKED) {
    actions.push({
      id: "billing_payment",
      title: "Update Payment Method",
      description: "Your subscription payment needs attention to keep your system active.",
      state: ACTION_STATES.REQUIRED,
      icon: CreditCard,
      actionLabel: "Fix Billing",
      actionTab: "billing",
      priority: 1,
    });
  }

  // 2. Client approval requested
  if (project?.client_approval_status === "Requested") {
    actions.push({
      id: "client_approval",
      title: "Review Your System",
      description: "Your system is ready for your review. Please approve or request changes to proceed.",
      state: ACTION_STATES.WAITING_CLIENT,
      icon: ShieldCheck,
      actionLabel: "Review Now",
      actionTab: "progress",
      priority: 2,
    });
  }

  // 3. Setup authorization pending
  if (setupAuth?.status === "pending") {
    actions.push({
      id: "setup_auth",
      title: "Complete Setup Authorization",
      description: "Please provide access credentials so we can configure your automations.",
      state: ACTION_STATES.WAITING_CLIENT,
      icon: Settings,
      actionLabel: "Provide Access",
      actionTab: "progress",
      priority: 3,
    });
  }

  // 4. Smart access request pending
  if (smartAccess?.status === "requested" && smartAccess?.status !== "completed") {
    actions.push({
      id: "smart_access",
      title: "Connect Your Calendar",
      description: "Connect your booking calendar so the AI booking agent can schedule appointments.",
      state: ACTION_STATES.WAITING_CLIENT,
      icon: Calendar,
      actionLabel: "Connect Calendar",
      actionTab: "quickstart",
      priority: 4,
    });
  }

  // 5. Quick Start incomplete
  const quickStartDone = project?.quick_start_completed === true && project?.onboarding_wizard_completed === true;
  if (!quickStartDone) {
    actions.push({
      id: "quickstart",
      title: "Complete Quick Start Setup",
      description: "Configure your SMS, email, and booking settings in under 10 minutes.",
      state: ACTION_STATES.WAITING_CLIENT,
      icon: Zap,
      actionLabel: "Start Setup",
      actionTab: "quickstart",
      priority: 5,
    });
  }

  // 6. Onboarding wizard not completed
  if (project?.onboarding_wizard_completed !== true) {
    actions.push({
      id: "onboarding_wizard",
      title: "Complete Onboarding Questions",
      description: "Answer a few questions about your business to help us configure your system.",
      state: ACTION_STATES.WAITING_CLIENT,
      icon: FileText,
      actionLabel: "Answer Questions",
      actionTab: "progress",
      priority: 6,
    });
  }

  // 7. Deployment in error/paused state
  if (deployment?.deployment_status === "error") {
    actions.push({
      id: "deployment_error",
      title: "System Issue Detected",
      description: "Our team is aware of an issue and is actively working to resolve it. No action needed from you.",
      state: ACTION_STATES.WAITING_SYSTEM,
      icon: AlertCircle,
      actionLabel: null,
      actionTab: null,
      priority: 7,
    });
  }

  // 8. Deployment paused
  if (deployment?.deployment_status === "paused") {
    actions.push({
      id: "deployment_paused",
      title: "System Temporarily Paused",
      description: "Your system is paused. Contact support if you have questions.",
      state: ACTION_STATES.WAITING_SYSTEM,
      icon: Clock,
      actionLabel: "Contact Support",
      actionTab: "support",
      priority: 8,
    });
  }

  // 9. Setup in progress (modules not yet verified)
  if (
    !portalStateLoading &&
    deployment?.deployment_status &&
    ["onboarding", "configuring"].includes(deployment.deployment_status) &&
    actions.length === 0
  ) {
    actions.push({
      id: "setup_in_progress",
      title: "System Setup In Progress",
      description: "Our team is configuring your automation system. You'll be notified when each step is complete.",
      state: ACTION_STATES.WAITING_SYSTEM,
      icon: Loader2,
      actionLabel: null,
      actionTab: null,
      priority: 9,
    });
  }

  // 10. System live — no action needed
  if (deployment?.deployment_status === "live" && actions.length === 0) {
    actions.push({
      id: "all_clear",
      title: "Everything Looks Good",
      description: "Your system is live and running. No action needed from you right now.",
      state: ACTION_STATES.NONE,
      icon: CheckCircle2,
      actionLabel: "View Performance",
      actionTab: "performance",
      priority: 10,
    });
  }

  // Default: loading or no deployment
  if (actions.length === 0 && portalStateLoading) {
    actions.push({
      id: "loading",
      title: "Loading Your Actions…",
      description: "We're checking your system for any items that need your attention.",
      state: ACTION_STATES.WAITING_SYSTEM,
      icon: Loader2,
      actionLabel: null,
      actionTab: null,
      priority: 99,
    });
  }

  // Sort by priority
  actions.sort((a, b) => a.priority - b.priority);

  // Determine overall state
  const hasRequired = actions.some((a) => a.state === ACTION_STATES.REQUIRED);
  const hasWaitingClient = actions.some((a) => a.state === ACTION_STATES.WAITING_CLIENT);
  const hasWaitingSystem = actions.some((a) => a.state === ACTION_STATES.WAITING_SYSTEM);
  const overallState = hasRequired
    ? ACTION_STATES.REQUIRED
    : hasWaitingClient
      ? ACTION_STATES.WAITING_CLIENT
      : hasWaitingSystem
        ? ACTION_STATES.WAITING_SYSTEM
        : ACTION_STATES.NONE;

  const overallConfig = STATE_CONFIG[overallState];
  const OverallIcon = overallConfig.icon;

  return (
    <CSCard className="!p-5" hover={false}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: overallConfig.bg, border: `1px solid ${overallConfig.color}25` }}
        >
          <OverallIcon
            className={`w-5 h-5 ${overallState === ACTION_STATES.WAITING_SYSTEM && actions[0]?.id === "loading" ? "animate-spin" : ""}`}
            style={{ color: overallConfig.color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Action Center</p>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: overallConfig.bg, color: overallConfig.color }}
            >
              {overallConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{overallConfig.description}</p>
        </div>
      </div>

      {/* Action items */}
      <div className="space-y-2.5">
        {actions.map((action) => {
          const cfg = STATE_CONFIG[action.state];
          const ActionIcon = action.icon;
          return (
            <div
              key={action.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: cfg.bg }}
              >
                <ActionIcon
                  className="w-4 h-4"
                  style={{ color: cfg.color }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{action.title}</span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.description}</p>
                {action.actionLabel && action.actionTab && (
                  <button
                    onClick={() => onNavigate?.(action.actionTab)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold transition-colors"
                    style={{ color: cfg.color }}
                  >
                    {action.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CSCard>
  );
}