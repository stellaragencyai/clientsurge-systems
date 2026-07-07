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
import { translateCard, getClientStatusConfig } from "@/lib/clientStatusLanguage";
import CSCard from "@/components/design-system/CSCard";
import CSButton from "@/components/design-system/CSButton";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import PortalMetricCard from "./PortalMetricCard";
import PortalActionCard from "./PortalActionCard";
import NextBestActionCard from "./NextBestActionCard";

const PortalLazy = ({ children }) => (
  <Suspense fallback={<div className="h-32 rounded-xl bg-muted/30 animate-pulse" />}>{children}</Suspense>
);

const SystemStatusBadge = lazy(() => import("./SystemStatusBadge"));
const GettingStartedBanner = lazy(() => import("./GettingStartedBanner"));
const OnboardingMissingAssetsBanner = lazy(() => import("./OnboardingMissingAssetsBanner"));
const LaunchReadinessPanel = lazy(() => import("../dashboard/LaunchReadinessPanel"));
const ActiveAutomationsPanel = lazy(() => import("../dashboard/ActiveAutomationsPanel"));
const PaymentFailedBanner = lazy(() => import("./PaymentFailedBanner"));

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

  // Phase 4.1: Use centralized client status language for all status labels
  const systemReadinessTranslated = translateCard(systemReadinessCard);
  const readinessStatus = systemReadinessTranslated.friendlyStatus;
  const automationHealthTranslated = translateCard(automationHealthCard);

  // Quick Start is complete only when BOTH flags are true
  const quickStartDone = project?.quick_start_completed === true && project?.onboarding_wizard_completed === true;

  // Services value from normalized state — never fake 0/0
  const servicesValue = portalStateLoading
    ? "Syncing"
    : (totalCount > 0 ? `${activeCount}/${totalCount}` : "Pending");

  // Issues count comes from normalized state, not raw events
  const issuesValue = portalStateLoading
    ? "—"
    : (automationHealthCard?.status === CARD_STATUS.LIVE ? "0" : "Review");

  return (
    <div className="space-y-6">
      {/* Next best action — priority guidance */}
      <NextBestActionCard
        project={project}
        portalOrder={portalOrder}
        subscription={subscription}
        healthData={healthData}
        portalState={portalState}
        portalStateLoading={portalStateLoading}
        isAdminPreview={isAdminPreview}
        setActiveTab={setActiveTab}
      />

      {/* Client-data scoping notice */}
      <CSCard className="!p-3 !bg-blue-50/50" hover={false}>
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-[#0088CC] flex-shrink-0" />
          <p className="text-xs text-gray-600">
            You are viewing <span className="font-semibold text-gray-800">{project?.business_name || "your client account"}</span> data.
            All metrics are scoped to your project only.
            {isAdminPreview && <span className="ml-1 font-semibold text-amber-700">Admin preview mode active.</span>}
          </p>
        </div>
      </CSCard>

      {/* Welcome header — premium gradient banner */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4"
        style={{
          background: "linear-gradient(135deg, rgba(0,174,239,0.08), rgba(0,59,143,0.04))",
          border: "1px solid rgba(0,174,239,0.15)",
          boxShadow: "0 4px 24px rgba(0,174,239,0.08)",
        }}
      >
        <div className="flex items-center gap-4">
          <span
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)" }}
          >
            {project?.plan || "Active Plan"}
          </span>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-display">
              Welcome back, {project?.business_name || user?.full_name || "Client"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
                Your system status:{" "}
                <span className="font-semibold text-gray-700">
                  {portalStateLoading ? "Syncing Data" : readinessStatus}
                </span>
              </p>
          </div>
        </div>
        <CSButton
          variant="primary"
          size="md"
          iconRight={ArrowRight}
          onClick={() => setActiveTab("performance")}
        >
          View Performance
        </CSButton>
      </div>

      {/* Payment failed / missing assets banners */}
      <PortalLazy>
        <PaymentFailedBanner subscription={subscription} order={portalOrder} />
      </PortalLazy>
      <PortalLazy>
        <OnboardingMissingAssetsBanner project={project} onNavigate={setActiveTab} />
      </PortalLazy>

      {/* Main grid: 70/30 split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* System Status section */}
          <div>
            <CSSectionHeader
              eyebrow="Overview"
              title="System Status"
              align="left"
              className="mb-4"
            />
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Real-time system health</span>
              <PortalLazy>
                <SystemStatusBadge project={project} />
              </PortalLazy>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <PortalMetricCard
                 icon={Rocket}
                 label="Services Active"
                 value={servicesValue}
                 accent="#0088CC"
                 onClick={() => setActiveTab("performance")}
               />
               <PortalMetricCard
                 icon={Zap}
                 label="Quick Start"
                 value={quickStartDone ? "Done" : "Pending"}
                 accent={quickStartDone ? "#10B981" : "#D4AF37"}
                 onClick={() => setActiveTab("quickstart")}
               />
               <PortalMetricCard
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
        <div className="space-y-6">
          {/* Getting Started / Action Required */}
          <PortalLazy>
            <GettingStartedBanner project={project} order={portalOrder} />
          </PortalLazy>

          {/* Quick Start upsell */}
          {!quickStartDone && (
            <PortalActionCard
              icon={Zap}
              title="Complete Quick Start"
              description="Configure your SMS, email, and booking settings in under 10 minutes to activate your lead system."
              buttonText="Start Setup"
              buttonColor="#0088CC"
              onClick={() => setActiveTab("quickstart")}
            />
          )}

          {/* Billing upsell */}
          <PortalActionCard
            icon={ShieldCheck}
            title="Manage Your Plan"
            description="View your subscription, update payment methods, or request plan changes."
            buttonText="View Billing"
            buttonColor="#0088CC"
            onClick={() => setActiveTab("billing")}
          />

          {/* Support — direct CTA */}
          <PortalActionCard
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