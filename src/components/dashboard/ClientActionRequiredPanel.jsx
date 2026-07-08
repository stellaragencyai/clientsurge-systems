import { ClipboardList } from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import PortalAdminDiagnostics from "@/components/portal/PortalAdminDiagnostics";

const SUPPORT_EMAIL = "support@clientsurgesystems.com";

function setupUrl(order) {
  return order?.id ? `/setup/credentials?order_id=${encodeURIComponent(order.id)}` : `mailto:${SUPPORT_EMAIL}?subject=ClientSurge%20Setup%20Help`;
}

function actionHref(action, order) {
  switch (action.id) {
    case "payment":
      return "/pricing";
    case "onboarding":
    case "booking_link":
    case "business_hours":
    case "templates":
      return setupUrl(order);
    default:
      return `mailto:${SUPPORT_EMAIL}?subject=ClientSurge%20Dashboard%20Support`;
  }
}

export default function ClientActionRequiredPanel({ order, project, readiness, isAdmin = false, portalState }) {
  const actions = [];

  if (order && order.payment_status && order.payment_status !== "paid") {
    actions.push({ id: "payment", label: "Payment needs attention", priority: "high", cta: "Review packages" });
  }

  if (project && !project.onboarding_completed && !project.quick_start_completed) {
    actions.push({ id: "onboarding", label: "Complete onboarding details", priority: "high", cta: "Open setup" });
  }

  if (project && !project.booking_link) {
    const services = order?.services || [];
    const hasBooking = services.some((s) => (s.service_key || "").toLowerCase().includes("booking"));
    if (hasBooking) {
      actions.push({ id: "booking_link", label: "Add or confirm booking link", priority: "medium", cta: "Open setup" });
    }
  }

  if (project && (!project.business_hours || !project.business_hours_confirmed)) {
    actions.push({ id: "business_hours", label: "Confirm business hours", priority: "medium", cta: "Open setup" });
  }

  if (project && project.templates_approved === false) {
    actions.push({ id: "templates", label: "Approve message templates", priority: "medium", cta: "Open setup" });
  }

  const services = order?.services || [];
  const failedSvc = services.find((s) => s.install_status === "Error");
  if (failedSvc) {
    actions.push({
      id: "failed_setup",
      label: `Setup needs review: ${failedSvc.display_name || failedSvc.service_key || "service"}`,
      priority: "high",
      cta: "Contact support",
    });
  }

  const readinessCard = getCardState(portalState, "system_readiness");
  const isProofLive = readinessCard.status === CARD_STATUS.LIVE;
  const safeCanGoLive = isProofLive;

  if (isAdmin && !safeCanGoLive && readiness?.status !== "Needs Attention") {
    actions.push({ id: "admin_review", label: "Admin: Review readiness proof", priority: "low", cta: "Review" });
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <ClipboardList className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Action Required</p>
        </div>
        <p className="text-[13px] text-muted-foreground pl-6.5">
          {isProofLive
            ? "No client action required at this time."
            : "Your system is being set up — no action is needed from you right now."}
        </p>
        <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
      </div>
    );
  }

  const sortedActions = [
    ...actions.filter((a) => a.priority === "high"),
    ...actions.filter((a) => a.priority !== "high"),
  ];

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <ClipboardList className="w-4 h-4 text-primary" aria-hidden="true" />
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Action Required</p>
      </div>

      <div className="space-y-2" role="list">
        {sortedActions.map((action) => (
          <a
            key={action.id}
            role="listitem"
            href={actionHref(action, order)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold no-underline"
            style={{
              background: action.priority === "high" ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.02)",
              color: action.priority === "high" ? "#dc2626" : "#4b5563",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: action.priority === "high" ? "#ef4444" : "#9ca3af" }}
            />
            <span>{action.label}</span>
            <span className="text-[9px] font-extrabold uppercase ml-auto flex-shrink-0" style={{ color: action.priority === "high" ? "#dc2626" : "#6b7280" }}>
              {action.cta || (action.priority === "high" ? "Required" : "Review")}
            </span>
          </a>
        ))}
      </div>
      <PortalAdminDiagnostics card={readinessCard} isAdmin={isAdmin} />
    </div>
  );
}
