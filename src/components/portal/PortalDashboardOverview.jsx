/**
 * PortalDashboardOverview — the default "Dashboard" tab.
 * Verified/client-scoped status messaging, no fake 0/0 service confidence,
 * Quick Start using both quick_start_completed and onboarding_wizard_completed,
 * blue brand CTAs, direct support CTA, visible client-data scoping notice.
 */
import { lazy, Suspense } from "react";
import {
  Zap, Target, Rocket,
  ArrowRight, ShieldCheck, AlertCircle, Info, Clock,
} from "lucide-react";
import { getCardState, CARD_STATUS } from "@/lib/portalStateEngine";
import { translateCard } from "@/lib/clientStatusLanguage";
import CSCard from "@/components/design-system/CSCard";
import CSButton from "@/components/design-system/CSButton";
import CSSectionHeader from "@/components/design-system/CSSectionHeader";
import PortalMetricCard from "./PortalMetricCard";
import PortalActionCard from "./PortalActionCard";
import ClientActionCenter from "./ClientActionCenter";
import ClientNotificationCenter from "./ClientNotificationCenter";
import PortalTrustStrip from "./PortalTrustStrip";
import PortalStatusTimeline from "./PortalStatusTimeline";
import PremiumCommandCenter from "@/components/dashboard/PremiumCommandCenter";

const PortalLazy = ({ children }) => (
  <Suspense fallback={<div className="h-32 rounded-xl bg-muted/30 animate-pulse" />}>{children}</Suspense>
);

const PortalStatusBadge = lazy(() => import("./PortalStatusBadge"));
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
  navigateTab,
  refreshProject,
  portalState,
  portalStateLoading,
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
}) {
  const services = portalOrder?.services || [];
  const activeCount = services.filter((s) => s.install_status === "Live").length;
  const totalCount = services.length;

  const systemReadinessCard = getCardState(portalState, "system_readiness");
  const automationHealthCard = getCardState(portalState, "automation_health");
  const systemReadinessTranslated = translateCard(systemReadinessCard);
  const readinessStatus = systemReadinessTranslated.friendlyStatus;

  const quickStartDone = project?.quick_start_completed === true && project?.onboarding_wizard_completed === true;
  const servicesValue = portalStateLoading
    ? "Syncing"
    : (totalCount > 0 ? `${activeCount}/${totalCount}` : "Pending");

  const deployment = portalState?.meta?.deployment_id
    ? {
        id: portalState.meta.deployment_id,
        deployment_status: portalState.meta.deployment_status,
        package_tier_key: portalState.meta.deployment_package_tier,
        industry_slug: portalState.meta.deployment_industry,
        analytics: { last_activity_at: portalState.meta.last_activity_at },
      }
    : null;

  const issuesValue = portalStateLoading
    ? "—"
    : (automationHealthCard?.status === CARD_STATUS.LIVE ? "0" : "Review");

  return (
    <div className="space-y-6">
      <ClientActionCenter
        project={project}
        deployment={deployment}
        portalState={portalState}
        portalStateLoading={portalStateLoading}
        subscription={subscription}
        order={portalOrder}
        isAdminPreview={isAdminPreview}
        onNavigate={navigateTab}
      />

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
          onClick={() => navigateTab("performance")}
        >
          View Performance
        </CSButton>
      </div>

      <PortalTrustStrip
        portalState={portalState}
        portalStateLoading={portalStateLoading}
        deployment={deployment}
      />

      <PremiumCommandCenter
        services={services}
        healthData={healthData}
        portalState={portalState}
        navigateTab={navigateTab}
      />

      <PortalStatusTimeline project={project} portalOrder={portalOrder} />

      <PortalLazy>
        <PaymentFailedBanner subscription={subscription} order={portalOrder} />
      </PortalLazy>
      <PortalLazy>
        <OnboardingMissingAssetsBanner project={project} onNavigate={navigateTab} />
      </PortalLazy>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <CSSectionHeader
                eyebrow="Overview"
                title="System Status"
                align="left"
                className="mb-0"
              />
              <div className="flex items-center gap-2">
                {project?.updated_date ? (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Updated {new Date(project.updated_date).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-300">Last updated pending</span>
                )}
                <PortalLazy>
                  <PortalStatusBadge status={systemReadinessCard?.status || "Syncing"} />
                </PortalLazy>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PortalMetricCard
                icon={Rocket}
                label="Services Active"
                value={servicesValue}
                accent="#0088CC"
                onClick={() => navigateTab("performance")}
              />
              <PortalMetricCard
                icon={Zap}
                label="Quick Start"
                value={quickStartDone ? "Done" : "Pending"}
                accent={quickStartDone ? "#10B981" : "#D4AF37"}
                onClick={() => navigateTab("quickstart")}
              />
              <PortalMetricCard
                icon={AlertCircle}
                label="Recent Issues"
                value={issuesValue}
                accent={issuesValue === "0" ? "#10B981" : "#D4AF37"}
                onClick={() => navigateTab("performance")}
              />
            </div>
          </div>

          <PortalLazy>
            <LaunchReadinessPanel
              order={portalOrder}
              project={project}
              events={healthData?.recent_events || []}
            />
          </PortalLazy>

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

        <div className="space-y-6">
          <ClientNotificationCenter
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
          />

          <PortalLazy>
            <GettingStartedBanner project={project} order={portalOrder} />
          </PortalLazy>

          {!quickStartDone && (
            <PortalActionCard
              icon={Zap}
              title="Complete Quick Start"
              description="Configure your SMS, email, and booking settings in under 10 minutes."
              buttonText="Start Setup"
              buttonColor="#0088CC"
              onClick={() => navigateTab("quickstart")}
            />
          )}

          <PortalActionCard
            icon={ShieldCheck}
            title="Manage Your Plan"
            description="View your subscription, update payment methods, or request changes."
            buttonText="View Billing"
            buttonColor="#0088CC"
            onClick={() => navigateTab("billing")}
          />

          <PortalActionCard
            icon={Target}
            title="Need Help?"
            description="Chat with our support team or browse our knowledge base."
            buttonText="Contact Support"
            buttonColor="#0088CC"
            onClick={() => navigateTab("support")}
          />
        </div>
      </div>
    </div>
  );
}
