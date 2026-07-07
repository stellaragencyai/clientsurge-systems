/**
 * PortalDashboardOverview — the default "Dashboard" tab.
 * Verified/client-scoped status messaging, no fake 0/0 service confidence,
 * Quick Start using both quick_start_completed and onboarding_wizard_completed,
 * blue brand CTAs, direct support CTA, visible client-data scoping notice.
 */
import { lazy, Suspense } from "react";
import {
  Bell, TrendingUp, Zap, Target, Rocket,
  ArrowRight, ShieldCheck, AlertCircle, CheckCircle2, Info,
} from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";

const PortalLazy = ({ children }) => (
  <Suspense fallback={<div className="h-32 rounded-xl bg-muted/30 animate-pulse" />}>{children}</Suspense>
);

const SystemStatusBadge = lazy(() => import("./SystemStatusBadge"));
const GettingStartedBanner = lazy(() => import("./GettingStartedBanner"));
const OnboardingMissingAssetsBanner = lazy(() => import("./OnboardingMissingAssetsBanner"));
const LaunchReadinessPanel = lazy(() => import("../dashboard/LaunchReadinessPanel"));
const ActiveAutomationsPanel = lazy(() => import("../dashboard/ActiveAutomationsPanel"));
const PaymentFailedBanner = lazy(() => import("./PaymentFailedBanner"));

function MetricCard({ icon: Icon, label, value, accent, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-gray-100 p-5 transition-all hover:shadow-md hover:border-blue-200 cs-interactive-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}12` }}
        >
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-300" />
      </div>
      <p className="text-2xl font-bold text-gray-900 font-display">{value}</p>
      <p className="text-xs text-gray-400 font-medium mt-1">{label}</p>
    </button>
  );
}

function ActionCard({ icon: Icon, title, description, buttonText, buttonColor, onClick }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${buttonColor}10`, border: `1px solid ${buttonColor}30` }}
        >
          <Icon className="w-5 h-5" style={{ color: buttonColor }} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        </div>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
      <button
        onClick={onClick}
        className="w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
        style={{ background: buttonColor }}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default function PortalDashboardOverview({
  project,
  portalOrder,
  subscription,
  healthData,
  user,
  userEmail,
  isAdminPreview,
  userRole,
  setActiveTab,
  refreshProject,
  portalState,
  portalStateLoading,
}) {
  const services = portalOrder?.services || [];
  const activeCount = services.filter((s) => s.install_status === "Live").length;
  const totalCount = services.length;

  // Phase A.1: Use normalized portal state for truth-validated display values
  const systemReadinessCard = getCardState(portalState, "system_readiness");
  const automationHealthCard = getCardState(portalState, "automation_health");
  const leadCaptureCard = getCardState(portalState, "lead_capture");
  const billingCard = getCardState(portalState, "billing");

  // Use engine-provided readiness status instead of raw health data
  const readinessStatus = systemReadinessCard?.display_text || "Pending";

  // Quick Start is complete only when BOTH flags are true
  const quickStartDone = project?.quick_start_completed === true && project?.onboarding_wizard_completed === true;

  // Services value from normalized state — never fake 0/0
  const servicesValue = portalStateLoading
    ? "Syncing"
    : (totalCount > 0 ? `${activeCount}/${totalCount}` : "Pending");

  // Issues count comes from normalized state, not raw events
  const issuesValue = portalStateLoading
    ? "—"
    : (automationHealthCard?.status === CARD_STATUS.LIVE ? "0" : "Pending");

  return (
    <div className="space-y-5">
      {/* Client-data scoping notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex items-center gap-2.5">
        <Info className="w-4 h-4 text-[#0088CC] flex-shrink-0" />
        <p className="text-xs text-gray-600">
          You are viewing <span className="font-semibold text-gray-800">{project?.business_name || "your client account"}</span> data.
          All metrics are scoped to your project only.
          {isAdminPreview && <span className="ml-1 font-semibold text-amber-700">Admin preview mode active.</span>}
        </p>
      </div>

      {/* Top banner */}
      <div
        className="rounded-xl p-5 flex items-center justify-between flex-wrap gap-4"
        style={{ background: "linear-gradient(135deg, rgba(0,174,239,0.06), rgba(0,59,143,0.03))", border: "1px solid rgba(0,174,239,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
          >
            {project?.plan || "Active Plan"}
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Welcome back, {project?.business_name || user?.full_name || "Client"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
               Your system status:{" "}
               <span className="font-semibold text-gray-700">
                 {portalStateLoading ? "Syncing" : (systemReadinessCard?.display_text || readinessStatus)}
               </span>
             </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("performance")}
          className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00AEEF]"
          style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
        >
          View Performance
        </button>
      </div>

      {/* Payment failed / missing assets banners */}
      <PortalLazy>
        <PaymentFailedBanner subscription={subscription} order={portalOrder} />
      </PortalLazy>
      <PortalLazy>
        <OnboardingMissingAssetsBanner project={project} onNavigate={setActiveTab} />
      </PortalLazy>

      {/* Main grid: 70/30 split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column (2/3) */}
        <div className="lg:col-span-2 space-y-5">
          {/* System Status section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">System Status</h3>
              <PortalLazy>
                <SystemStatusBadge project={project} />
              </PortalLazy>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <MetricCard
                 icon={Rocket}
                 label="Services Active"
                 value={servicesValue}
                 accent="#0088CC"
                 onClick={() => setActiveTab("performance")}
               />
               <MetricCard
                 icon={Zap}
                 label="Quick Start"
                 value={quickStartDone ? "Done" : "Pending"}
                 accent={quickStartDone ? "#10B981" : "#D4AF37"}
                 onClick={() => setActiveTab("quickstart")}
               />
               <MetricCard
                 icon={AlertCircle}
                 label="Recent Issues"
                 value={issuesValue}
                 accent={issuesValue === "0" ? "#10B981" : "#D4AF37"}
                 onClick={() => setActiveTab("performance")}
               />
             </div>
          </div>

          {/* Launch Readiness / Score Tracker equivalent */}
          <PortalLazy>
            <LaunchReadinessPanel
              order={portalOrder}
              project={project}
              events={healthData?.recent_events || []}
            />
          </PortalLazy>

          {/* Active Automations */}
          <PortalLazy>
            <ActiveAutomationsPanel
              packageKey={portalOrder?.package_type || portalOrder?.selected_package_type}
              services={services}
              failedEvents={(healthData?.recent_events || []).filter((e) => e.status === "failed")}
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
              portalState={portalState}
            />
          </PortalLazy>
        </div>

        {/* Side column (1/3) */}
        <div className="space-y-5">
          {/* Getting Started / Action Required */}
          <PortalLazy>
            <GettingStartedBanner project={project} order={portalOrder} />
          </PortalLazy>

          {/* Quick Start upsell */}
          {!quickStartDone && (
            <ActionCard
              icon={Zap}
              title="Complete Quick Start"
              description="Configure your SMS, email, and booking settings in under 10 minutes to activate your lead system."
              buttonText="Start Setup"
              buttonColor="#0088CC"
              onClick={() => setActiveTab("quickstart")}
            />
          )}

          {/* Billing upsell */}
          <ActionCard
            icon={ShieldCheck}
            title="Manage Your Plan"
            description="View your subscription, update payment methods, or request plan changes."
            buttonText="View Billing"
            buttonColor="#0088CC"
            onClick={() => setActiveTab("billing")}
          />

          {/* Support — direct CTA */}
          <ActionCard
            icon={Target}
            title="Need Help?"
            description="Chat with our support team or browse our knowledge base for quick answers."
            buttonText="Contact Support"
            buttonColor="#0088CC"
            onClick={() => setActiveTab("support")}
          />
        </div>
      </div>
    </div>
  );
}