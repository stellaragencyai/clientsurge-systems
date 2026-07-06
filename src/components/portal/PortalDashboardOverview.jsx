/**
 * PortalDashboardOverview — the default "Dashboard" tab.
 * Grid layout inspired by the IdentityIQ screenshot: main column (70%)
 * with metric cards, and a side column (30%) with action/upsell cards.
 */
import { lazy, Suspense } from "react";
import {
  Bell, User, TrendingUp, Zap, Target, Rocket,
  ArrowRight, ShieldCheck, AlertCircle, CheckCircle2,
} from "lucide-react";

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
      className="text-left bg-white rounded-xl border border-gray-100 p-5 transition-all hover:shadow-md hover:border-blue-200 cs-interactive-card"
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
        className="w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
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
}) {
  const services = portalOrder?.services || [];
  const activeCount = services.filter((s) => s.install_status === "Live").length;
  const totalCount = services.length;
  const failedEvents = (healthData?.recent_events || []).filter((e) => e.status === "failed");
  const readinessStatus = healthData?.readiness_status || portalOrder?.pipeline_status || "Pending";

  return (
    <div className="space-y-5">
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
              Your system status: <span className="font-semibold text-gray-700">{readinessStatus}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab("performance")}
          className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
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
                value={`${activeCount}/${totalCount || 0}`}
                accent="#0088CC"
                onClick={() => setActiveTab("performance")}
              />
              <MetricCard
                icon={Zap}
                label="Quick Start"
                value={project?.quick_start_completed ? "Done" : "Pending"}
                accent="#D4AF37"
                onClick={() => setActiveTab("quickstart")}
              />
              <MetricCard
                icon={AlertCircle}
                label="Recent Issues"
                value={failedEvents.length}
                accent={failedEvents.length > 0 ? "#EF4444" : "#10B981"}
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
              failedEvents={failedEvents}
              isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
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
          {!project?.quick_start_completed && (
            <ActionCard
              icon={Zap}
              title="Complete Quick Start"
              description="Configure your SMS, email, and booking settings in under 10 minutes to activate your lead system."
              buttonText="Start Setup"
              buttonColor="#6f42c1"
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

          {/* Support */}
          <ActionCard
            icon={Target}
            title="Need Help?"
            description="Chat with our support team or browse our knowledge base for quick answers."
            buttonText="Contact Support"
            buttonColor="#10B981"
            onClick={() => setActiveTab("support")}
          />
        </div>
      </div>
    </div>
  );
}