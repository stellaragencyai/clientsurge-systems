import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import HorizontalStageTracker from "@/components/dashboard/HorizontalStageTracker";
import DashboardMetricsBar from "@/components/dashboard/DashboardMetricsBar";
import ResponsiveServiceCard from "@/components/dashboard/ResponsiveServiceCard";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChatAssistant from "@/components/dashboard/ChatAssistant";
import { Loader2, ShoppingBag, Mail, Phone, RefreshCw, Zap } from "lucide-react";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import DeploymentProgressBar from "@/components/dashboard/DeploymentProgressBar";
import SetupStatusPanel from "@/components/dashboard/SetupStatusPanel";
import LaunchReadinessPanel from "@/components/dashboard/LaunchReadinessPanel";
import ActiveAutomationsPanel from "@/components/dashboard/ActiveAutomationsPanel";
import ClientActionRequiredPanel from "@/components/dashboard/ClientActionRequiredPanel";
import RecentSystemProofPanel from "@/components/dashboard/RecentSystemProofPanel";
import RecentIssuesPanel from "@/components/dashboard/RecentIssuesPanel";
import AdminPreviewBanner from "@/components/dashboard/AdminPreviewBanner";
import AdminPreviewToggler from "@/components/dashboard/AdminPreviewToggler";
import InternalFilterNotice from "@/components/dashboard/InternalFilterNotice";

export const STAGE_MAP = {
  "Paid": 0,
  "Ready for Install": 1,
  "Configuring": 2,
  "Testing": 3,
  "Live": 4,
  "Error": 2,
};

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,rgba(0,174,239,0.12),rgba(0,59,143,0.06))", border: "1px solid rgba(0,174,239,0.18)" }}>
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
      <p className="text-[15px] font-semibold text-foreground">Loading your dashboard…</p>
      <p className="text-[13px] text-muted-foreground">Fetching your installation status</p>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl p-8 text-center" style={{
      background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(232,246,255,0.7) 100%)",
      border: "1px solid rgba(0,174,239,0.15)",
      boxShadow: "0 4px 24px rgba(0,59,143,0.07)"
    }}>
      <p className="text-base font-bold mb-2" style={{ color: "#003B8F" }}>Unable to Load Dashboard</p>
      <p className="text-sm text-muted-foreground mb-5">{message}</p>
      {onRetry && (
        <button onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-white font-semibold text-sm cursor-pointer transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)", boxShadow: "0 4px 14px rgba(0,174,239,0.3)" }}>
          <RefreshCw className="w-3 h-3" /> Try Again
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl text-center py-16 px-8 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(232,246,255,0.7) 100%)",
        border: "1px solid rgba(0,174,239,0.15)",
        boxShadow: "0 8px 40px rgba(0,59,143,0.08)"
      }}>
      {/* Top gradient bar */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl"
        style={{ background: "linear-gradient(90deg, #003B8F, #00AEEF, #66D9FF)" }} />
      <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
        style={{ background: "linear-gradient(135deg,rgba(0,174,239,0.12),rgba(0,59,143,0.07))", border: "1px solid rgba(0,174,239,0.2)" }}>
        <ShoppingBag className="w-9 h-9 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>No Services Yet</h3>
      <p className="text-sm text-muted-foreground mb-7 max-w-xs mx-auto leading-relaxed">
        You don't have any active orders yet. Browse our AI automation store to get started.
      </p>
      <a href="/store"
        className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-white font-bold text-sm transition-all hover:-translate-y-0.5"
        style={{ background: "linear-gradient(135deg,#0088CC,#003B8F)", boxShadow: "0 6px 20px rgba(0,174,239,0.35)" }}>
        <ShoppingBag className="w-4 h-4" /> Browse the AI Store →
      </a>
    </div>
  );
}

function SupportCard() {
  return (
    <div className="rounded-2xl p-6 md:p-8 flex items-center justify-between flex-wrap gap-5 mt-10"
      style={{
        background: "linear-gradient(135deg, rgba(0,174,239,0.06) 0%, rgba(0,59,143,0.03) 100%)",
        border: "1px solid rgba(0,174,239,0.15)",
        boxShadow: "0 4px 20px rgba(0,59,143,0.06)"
      }}>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-1">Need Help?</p>
        <p className="text-[15px] font-bold text-foreground mb-0.5" style={{ fontFamily: "Montserrat, sans-serif" }}>Our onboarding team is here for you</p>
        <p className="text-[13px] text-muted-foreground">Average response time: under 4 hours</p>
      </div>
      <div className="flex gap-3 flex-wrap">
        {[
          { Icon: Mail, label: "Email Support", href: "mailto:support@clientsurgesystems.com" },
          { Icon: Phone, label: "(602) 584-3227", href: "tel:+16025843227" },
        ].map(({ Icon, label, href }) => (
          <a key={label} href={href}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-primary font-semibold text-[13px] no-underline transition-all hover:shadow-md"
            style={{ border: "1px solid rgba(0,174,239,0.25)" }}>
            <Icon className="w-3.5 h-3.5" />{label}
          </a>
        ))}
      </div>
    </div>
  );
}

function LiveIndicator({ lastUpdated, onRefresh, isRefreshing }) {
  return (
    <div className="flex items-center gap-2 justify-end mb-5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" style={{ boxShadow: "0 0 6px #22c55e" }} />
      <span className="text-[11px] text-muted-foreground/60 font-medium">Live — updates every 30s</span>
      <button onClick={onRefresh} disabled={isRefreshing}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-primary text-[11px] font-semibold transition-opacity disabled:opacity-40 cursor-pointer"
        style={{ background: "rgba(0,174,239,0.07)", border: "1px solid rgba(0,174,239,0.15)" }}>
        <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}

export default function ClientDashboard() {
  useLayoutEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute("content", "noindex,nofollow");
    return () => { if (robots) robots.setAttribute("content", "index,follow"); };
  }, []);

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portalUser, setPortalUser] = useState(null);
  const [isAdminPreview, setIsAdminPreview] = useState(false);
  const [healthEvents, setHealthEvents] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [simulatedState, setSimulatedState] = useState("paid");
  const [simulatedData, setSimulatedData] = useState(null);

  const fetchPortal = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      if (!user) { setError("Please log in to view your dashboard."); return; }
      setUserEmail(user.email);
      setPortalUser(user);
      const res = await base44.functions.invoke("getClientPortalContext", {});
      if (res.data?.success) {
        setPortalData(res.data);
        setIsAdminPreview(res.data.is_admin_preview === true);
        setHealthEvents(res.data.health?.recent_events || []);
        setUserRole(res.data.user_role || null);
        setLastUpdated(new Date());
      } else if (res.data?.code === "portal_project_not_found") {
        setPortalData({ success: true, project: null, order: null });
        setLastUpdated(new Date());
      } else {
        setError(res.data?.error || "Unable to load your portal data.");
      }
    } catch (err) {
      const status = err?.response?.status || err?.status;
      const code = err?.response?.data?.code || err?.data?.code;
      if (status === 404 || code === "portal_project_not_found") {
        setPortalData({ success: true, project: null, order: null });
        setLastUpdated(new Date());
      } else {
        setError("Unable to load dashboard. Please try again.");
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPortal(false); }, [fetchPortal]);

  const fetchSimulated = useCallback(async (state) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getAdminPreviewData", { state });
      if (res.data?.success) {
        setSimulatedData(res.data);
        setLastUpdated(new Date());
      }
    } catch {
      // Silently fail — real data is the fallback
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSimStateChange = useCallback((state) => {
    setSimulatedState(state);
    fetchSimulated(state);
  }, [fetchSimulated]);

  useEffect(() => {
    const interval = setInterval(() => fetchPortal(true), 30000);
    return () => clearInterval(interval);
  }, [fetchPortal]);

  // Admin preview overrides: use simulated data when available
  const effectiveData = (isAdminPreview && simulatedData) ? simulatedData : portalData;
  const services = effectiveData?.order?.services || [];
  const project = effectiveData?.project;
  const order = effectiveData?.order;
  const effectiveHealthEvents = (isAdminPreview && simulatedData) ? (simulatedData?.health?.recent_events || []) : healthEvents;
  const hasSetupInfo = !!(order?.install_configuration?.brand?.business_name || order?.install_configuration?.shared?.twilio_business_phone);

  const activeServices = services.map(svc => ({
    serviceKey: svc.service_key,
    productName: svc.display_name,
    orderId: order?.id || "",
    installStatus: svc.install_status || "Paid",
    stageIndex: STAGE_MAP[svc.install_status] ?? 0,
    orderStatus: order?.order_status || "",
    paymentStatus: order?.payment_status || "",
  }));

  if (!loading && !portalData && !error) {
    return (
      <DemoBookingProvider>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-12">
            <p className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "Montserrat, sans-serif" }}>Something went wrong</p>
            <p className="text-sm text-muted-foreground mb-6">We could not load your dashboard. Please refresh or contact support.</p>
            <a href="mailto:support@clientsurgesystems.com" className="text-primary font-semibold text-sm">support@clientsurgesystems.com</a>
          </div>
        </div>
      </DemoBookingProvider>
    );
  }

  return (
    <DemoBookingProvider>
      <ChatAssistant installStatus={activeServices[0]?.installStatus} services={activeServices} />
      <MobileBottomNav />

      {/* Full page wrapper with same background as landing site */}
      <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>

        {/* ── HEADER — matches landing page Navbar style ── */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/70 backdrop-blur-2xl"
          style={{ height: "72px", padding: "0 clamp(1rem,4vw,2.5rem)" }}>
          {/* Left: Logo */}
          <Link to="/" className="flex items-center no-underline">
            <img
              src="https://media.base44.com/images/public/69dc4a79656fdba136d413d3/9d6ac5d22_989aaaff-cff8-47a2-a832-6ebc5c12db5c.png"
              alt="ClientSurge Systems"
              style={{ height: "48px", width: "auto" }}
            />
          </Link>

          {/* Center: Label */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ boxShadow: "0 0 8px rgba(0,174,239,0.7)" }} />
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-muted-foreground">
              Client Dashboard
            </span>
          </div>

          {/* Right: Help link */}
          <a href="mailto:support@clientsurgesystems.com"
            className="text-[12px] font-semibold text-primary no-underline hover:text-primary/80 transition-colors">
            Need help?
          </a>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main id="main-content" className="flex-1">
          {/* Top electric gradient bar — matches landing page sections */}
          <div className="w-full h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,174,239,0.4), transparent)" }} />

          {/* Subtle radial glow behind content — matches landing hero atmosphere */}
          <div className="relative w-full" aria-hidden="true">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(0,136,204,0.06) 0%, transparent 70%)" }} />
          </div>

          <div className="max-w-[1100px] mx-auto px-[clamp(1.25rem,4vw,2.5rem)] py-[clamp(1.5rem,4vw,3rem)] relative z-10">

            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} onRetry={() => fetchPortal(false)} />
            ) : (
              <>
                <WelcomeBanner
                  user={portalUser || { email: userEmail }}
                  order={order}
                  hasSetupInfo={hasSetupInfo}
                />

                <DashboardHeader
                  activeServices={activeServices}
                  project={project}
                  order={order}
                />

                {lastUpdated && (
                  <LiveIndicator
                    lastUpdated={lastUpdated}
                    onRefresh={() => fetchPortal(true)}
                    isRefreshing={isRefreshing}
                  />
                )}

                {activeServices.length > 0 && (
                  <>
                    <SetupStatusPanel
                      installStatus={activeServices[0]?.installStatus}
                      onRefresh={() => fetchPortal(true)}
                      isRefreshing={isRefreshing}
                    />
                    <DeploymentProgressBar
                      pipelineStatus={order?.pipeline_status}
                      installStatus={activeServices[0]?.installStatus}
                    />
                  </>
                )}

                {/* Admin Preview Toggler — switch between simulated pipeline states */}
                {isAdminPreview && (
                  <AdminPreviewToggler
                    currentState={simulatedData?.simulated_state || simulatedState}
                    onStateChange={handleSimStateChange}
                    userEmail={userEmail}
                  />
                )}

                {/* Internal/QA Filter Notice */}
                <InternalFilterNotice isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"} />

                {/* Launch Readiness Panel */}
                <LaunchReadinessPanel
                  order={order}
                  project={project}
                  events={effectiveHealthEvents}
                />

                {/* Active Automations Panel */}
                <ActiveAutomationsPanel
                  packageKey={order?.package_type || order?.selected_package_type}
                  services={order?.services || []}
                  failedEvents={effectiveHealthEvents.filter(e => e.status === "failed")}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />

                {/* Client Action Required Panel */}
                <ClientActionRequiredPanel
                  order={order}
                  project={project}
                  readiness={{ canGoLive: (order?.pipeline_status === "Live" && !effectiveHealthEvents.some(e => e.status === "failed")) }}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />

                {/* Recent System Proof */}
                <RecentSystemProofPanel
                  events={effectiveHealthEvents}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />

                {/* Recent Issues */}
                <RecentIssuesPanel
                  events={effectiveHealthEvents}
                  isAdmin={isAdminPreview || userRole === "admin" || userRole === "super_admin"}
                />

                {activeServices.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {/* Stage tracker — wrapped in a premium card */}
                    <div className="rounded-2xl overflow-hidden mb-5"
                      style={{
                        background: "linear-gradient(135deg,rgba(255,255,255,0.95) 0%, rgba(232,246,255,0.7) 100%)",
                        border: "1px solid rgba(0,174,239,0.13)",
                        boxShadow: "0 4px 24px rgba(0,59,143,0.07)"
                      }}>
                      <HorizontalStageTracker
                        serviceKey={activeServices[0].serviceKey}
                        currentStage={activeServices[0].stageIndex}
                        productName={activeServices[0].productName}
                        installStatus={activeServices[0].installStatus}
                      />
                    </div>

                    {/* Metrics bar */}
                    <DashboardMetricsBar activeServices={activeServices} project={project} />

                    {/* ── SERVICE CARDS ── */}
                    <div className="mb-4 mt-2">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1" style={{ background: "linear-gradient(to right, transparent, rgba(0,174,239,0.3))" }} />
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Your Active Systems</p>
                        <div className="h-px flex-1" style={{ background: "linear-gradient(to left, transparent, rgba(0,174,239,0.3))" }} />
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                        gap: "20px",
                        marginBottom: "80px",
                      }}>
                        {activeServices.map((service, idx) => (
                          <div key={service.serviceKey || idx}
                            className="rounded-2xl overflow-hidden transition-all duration-350 hover:-translate-y-1"
                            style={{
                              border: "1px solid rgba(0,174,239,0.13)",
                              boxShadow: "0 2px 14px rgba(0,59,143,0.05), 0 0 0 1px rgba(0,174,239,0.04)"
                            }}>
                            <ResponsiveServiceCard service={service} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <SupportCard />
                  </>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="flex items-center justify-between flex-wrap gap-2 border-t border-primary/8 px-[clamp(1rem,4vw,2.5rem)] py-4">
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary/50" />
            <span className="text-[11px] text-muted-foreground/50">© {new Date().getFullYear()} ClientSurge Systems</span>
          </div>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors no-underline">Privacy</Link>
            <Link to="/terms" className="text-[11px] text-muted-foreground/50 hover:text-primary transition-colors no-underline">Terms</Link>
          </div>
        </footer>
      </div>
    </DemoBookingProvider>
  );
}