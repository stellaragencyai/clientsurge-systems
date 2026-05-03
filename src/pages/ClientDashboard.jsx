import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HorizontalStageTracker from "@/components/dashboard/HorizontalStageTracker";
import DashboardMetricsBar from "@/components/dashboard/DashboardMetricsBar";
import ResponsiveServiceCard from "@/components/dashboard/ResponsiveServiceCard";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChatAssistant from "@/components/dashboard/ChatAssistant";
import { Loader2, ShoppingBag, Mail, Phone, RefreshCw } from "lucide-react";
import { DemoBookingProvider } from "@/components/landing/DemoBookingContext";

// Map real install_status → numeric stage index (0–4)
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
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{
        width: "64px", height: "64px", borderRadius: "16px",
        background: "linear-gradient(135deg,rgba(154,92,46,0.1),rgba(200,150,92,0.05))",
        border: "1px solid rgba(154,92,46,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        <Loader2 style={{ width: "28px", height: "28px", color: "#9a5c2e", animation: "spin 1s linear infinite" }} />
      </div>
      <p style={{ fontSize: "15px", fontWeight: "600", color: "#1b140d", margin: "0 0 4px" }}>Loading your dashboard…</p>
      <p style={{ fontSize: "13px", color: "rgba(27,20,13,0.5)", margin: 0 }}>Fetching your installation status</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div style={{
      background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: "16px", padding: "32px", textAlign: "center",
    }}>
      <p style={{ fontSize: "16px", fontWeight: "700", color: "#dc2626", margin: "0 0 8px" }}>⚠ Unable to Load Dashboard</p>
      <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.6)", margin: "0 0 16px" }}>{message}</p>
      {onRetry && (
        <button onClick={onRetry} style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "8px 18px", borderRadius: "9999px",
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          color: "#dc2626", fontWeight: "600", fontSize: "13px", cursor: "pointer",
        }}>
          <RefreshCw style={{ width: "13px", height: "13px" }} /> Try Again
        </button>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{
      borderRadius: "20px", textAlign: "center", padding: "60px 32px",
      background: "rgba(255,255,255,0.85)", border: "1px solid rgba(154,92,46,0.1)",
      boxShadow: "0 4px 24px rgba(15,23,42,0.06)",
    }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "20px", margin: "0 auto 20px",
        background: "linear-gradient(135deg,rgba(154,92,46,0.1),rgba(200,150,92,0.06))",
        border: "1px solid rgba(154,92,46,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <ShoppingBag style={{ width: "32px", height: "32px", color: "#9a5c2e" }} />
      </div>
      <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1b140d", margin: "0 0 8px" }}>No Services Yet</h3>
      <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.55)", margin: "0 0 24px", maxWidth: "360px", display: "inline-block", lineHeight: 1.6 }}>
        You don't have any active orders yet. Browse our AI automation store to get started.
      </p>
      <a href="/store" style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "12px 28px", borderRadius: "9999px",
        background: "linear-gradient(135deg,#6b3f1f,#9a5c2e)",
        color: "#f5e6d0", fontWeight: "700", fontSize: "14px",
        textDecoration: "none", boxShadow: "0 4px 18px rgba(120,70,20,0.28)",
      }}>
        Browse the AI Store →
      </a>
    </div>
  );
}

function SupportCard() {
  return (
    <div style={{
      borderRadius: "16px",
      background: "linear-gradient(135deg, rgba(154,92,46,0.07) 0%, rgba(200,150,92,0.04) 100%)",
      border: "1px solid rgba(154,92,46,0.14)",
      padding: "24px 28px", marginTop: "32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexWrap: "wrap", gap: "16px",
    }}>
      <div>
        <p style={{ fontSize: "13px", fontWeight: "800", color: "#9a5c2e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 4px" }}>Need Help?</p>
        <p style={{ fontSize: "15px", fontWeight: "700", color: "#1b140d", margin: "0 0 2px" }}>Our onboarding team is here for you</p>
        <p style={{ fontSize: "13px", color: "rgba(27,20,13,0.55)", margin: 0 }}>Average response time: under 4 hours</p>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { Icon: Mail, label: "Email Support", href: "mailto:support@clientsurgesystems.com" },
          { Icon: Phone, label: "(602) 584-3227", href: "tel:+16025843227" },
        ].map(({ Icon, label, href }) => (
          <a key={label} href={href} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "9px 16px", borderRadius: "9999px",
            background: "rgba(255,255,255,0.85)", border: "1px solid rgba(154,92,46,0.18)",
            color: "#9a5c2e", fontWeight: "600", fontSize: "13px", textDecoration: "none",
          }}>
            <Icon style={{ width: "14px", height: "14px" }} />
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

// Live polling indicator
function LiveIndicator({ lastUpdated, onRefresh, isRefreshing }) {
  const [age, setAge] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setAge(a => a + 1), 30000);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "8px",
      marginBottom: "20px", justifyContent: "flex-end",
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", flexShrink: 0 }} />
      <span style={{ fontSize: "11px", color: "rgba(27,20,13,0.45)", fontWeight: "500" }}>
        Live — updates every 30s
      </span>
      <button onClick={onRefresh} disabled={isRefreshing} style={{
        display: "inline-flex", alignItems: "center", gap: "4px",
        padding: "4px 10px", borderRadius: "9999px",
        background: "rgba(154,92,46,0.07)", border: "1px solid rgba(154,92,46,0.15)",
        color: "#9a5c2e", fontSize: "11px", fontWeight: "600", cursor: "pointer",
        opacity: isRefreshing ? 0.5 : 1,
      }}>
        <RefreshCw style={{ width: "10px", height: "10px", animation: isRefreshing ? "spin 1s linear infinite" : "none" }} />
        Refresh
      </button>
    </div>
  );
}

export default function ClientDashboard() {
  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPortal = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);
    try {
      const user = await base44.auth.me();
      if (!user) { setError("Please log in to view your dashboard."); return; }
      setUserEmail(user.email);
      const res = await base44.functions.invoke("getClientPortalContext", {});
      if (res.data?.success) {
        setPortalData(res.data);
        setLastUpdated(new Date());
      } else if (res.data?.code === "portal_project_not_found") {
        // No project linked yet — show empty state, not an error
        setPortalData({ success: true, project: null, order: null });
        setLastUpdated(new Date());
      } else {
        setError(res.data?.error || "Unable to load your portal data.");
      }
    } catch (err) {
      console.error("Portal fetch error:", err);
      // Check if it's a 404 (no project linked yet)
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

  // Initial load
  useEffect(() => { fetchPortal(false); }, [fetchPortal]);

  // Auto-poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchPortal(true), 30000);
    return () => clearInterval(interval);
  }, [fetchPortal]);

  // Derive services from portal context
  const services = portalData?.order?.services || [];
  const project = portalData?.project;
  const order = portalData?.order;

  // Build activeServices in the shape the sub-components expect
  const activeServices = services.map(svc => ({
    serviceKey: svc.service_key,
    productName: svc.display_name,
    orderId: order?.id || "",
    installStatus: svc.install_status || "Paid",
    stageIndex: STAGE_MAP[svc.install_status] ?? 0,
    orderStatus: order?.order_status || "",
    paymentStatus: order?.payment_status || "",
  }));

  // Safety: if portalData fetch threw an unhandled error, show support card
  if (!loading && !portalData && !error) {
    return (
      <DemoBookingProvider>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdfbf8" }}>
          <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <p style={{ fontSize: "20px", fontWeight: "700", color: "#1b140d", marginBottom: "8px" }}>Something went wrong</p>
            <p style={{ fontSize: "14px", color: "rgba(27,20,13,0.55)", marginBottom: "24px" }}>We could not load your dashboard. Please refresh or contact support.</p>
            <a href="mailto:support@clientsurgesystems.com" style={{ color: "#9a5c2e", fontWeight: "600", fontSize: "14px" }}>support@clientsurgesystems.com</a>
          </div>
        </div>
      </DemoBookingProvider>
    );
  }

  return (
    <DemoBookingProvider>
      <ChatAssistant installStatus={activeServices[0]?.installStatus} services={activeServices} />
      <MobileBottomNav />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg, #fdfbf8 0%, #f8f3eb 50%, #fdfbf8 100%)" }}>
        <Navbar />

        <main style={{ flex: 1, paddingTop: "72px" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "clamp(24px,4vw,48px) clamp(16px,4vw,32px)" }}>

            {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={() => fetchPortal(false)} /> : (
              <>
                <DashboardHeader
                  userEmail={userEmail}
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

                {activeServices.length === 0 ? <EmptyState /> : (
                  <>
                    {/* Primary stage tracker — uses first service's real install_status */}
                    <HorizontalStageTracker
                      serviceKey={activeServices[0].serviceKey}
                      currentStage={activeServices[0].stageIndex}
                      productName={activeServices[0].productName}
                      installStatus={activeServices[0].installStatus}
                    />

                    {/* Metrics Bar — Key Overview */}
                    <DashboardMetricsBar activeServices={activeServices} project={project} />

                    {/* All service cards — Responsive layout */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
                      gap: "16px",
                      marginBottom: "80px",
                    }}>
                      {activeServices.map((service, idx) => (
                        <ResponsiveServiceCard key={idx} service={service} />
                      ))}
                    </div>

                    <SupportCard />
                  </>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </DemoBookingProvider>
  );
}