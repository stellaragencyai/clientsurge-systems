import { ClipboardList, Check } from "lucide-react";
import { isAdminUser } from "@/lib/dashboardHelpers";

export default function ClientActionRequiredPanel({ order, project, readiness, isAdmin = false }) {
  const actions = [];

  // Build actionable items based on current state
  if (!order?.payment_status || order.payment_status !== "paid") {
    actions.push({ id: "payment", label: "Complete payment", priority: "high" });
  }
  if (project && !project.onboarding_completed && !project.quick_start_completed) {
    actions.push({ id: "onboarding", label: "Complete onboarding", priority: "high" });
  }
  if (project && !project.booking_link) {
    // Check if AI Booking Agent is part of package
    const services = order?.services || [];
    const hasBooking = services.some((s) => (s.service_key || "").toLowerCase().includes("booking"));
    if (hasBooking) {
      actions.push({ id: "booking_link", label: "Add booking link", priority: "medium" });
    }
  }
  if (project && (!project.business_hours || !project.business_hours_confirmed)) {
    actions.push({ id: "business_hours", label: "Confirm business hours", priority: "medium" });
  }
  if (project && project.templates_approved !== true) {
    actions.push({ id: "templates", label: "Approve message templates", priority: "medium" });
  }

  // Check for failed installs
  const services = order?.services || [];
  const failedSvc = services.find((s) => s.install_status === "Error");
  if (failedSvc) {
    actions.push({ id: "failed_setup", label: `Review failed setup: ${failedSvc.display_name || failedSvc.service_key || "service"}`, priority: "high" });
  }

  // Admin view extras
  if (isAdmin && readiness && !readiness.canGoLive && readiness.status !== "Needs Attention") {
    actions.push({ id: "admin_review", label: "Admin: Review readiness status", priority: "low" });
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <ClipboardList className="w-4 h-4 text-primary" />
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Action Required</p>
        </div>
        <p className="text-[13px] text-muted-foreground pl-6.5">No client action required at this time.</p>
      </div>
    );
  }

  const highPriority = actions.filter((a) => a.priority === "high");
  const rest = actions.filter((a) => a.priority !== "high");

  return (
    <div className="rounded-2xl p-5 mb-5" style={{ border: "1px solid rgba(0,174,239,0.13)", background: "rgba(255,255,255,0.6)" }}>
      <div className="flex items-center gap-2.5 mb-3">
        <ClipboardList className="w-4 h-4 text-primary" />
        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-primary">Action Required</p>
      </div>

      <div className="space-y-2">
        {[...highPriority, ...rest].map((action) => (
          <div
            key={action.id}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold"
            style={{
              background: action.priority === "high" ? "rgba(239,68,68,0.06)" : "rgba(0,0,0,0.02)",
              color: action.priority === "high" ? "#dc2626" : "#4b5563",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: action.priority === "high" ? "#ef4444" : "#9ca3af" }}
            />
            {action.label}
            {action.priority === "high" && (
              <span className="text-[9px] font-extrabold uppercase ml-auto flex-shrink-0" style={{ color: "#dc2626" }}>Required</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}