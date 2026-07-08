import { useState, useEffect, lazy, Suspense, Component } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Loader2, LogIn, LifeBuoy, AlertTriangle, Home, RefreshCw, WifiOff } from "lucide-react";

// The public /client-portal entry must show the actual client dashboard once a
// user is authenticated. The previous premium portal shell could throw before
// render and trap users behind the "Portal Setup in Progress" screen.
const ClientDashboard = lazy(() =>
  import("@/internal-pages/ClientDashboard").catch((err) => {
    console.error("ClientDashboard chunk load failed:", err);
    throw Object.assign(
      new Error("The client dashboard module failed to load. This is usually a temporary network issue."),
      { isChunkLoadError: true }
    );
  })
);

const LOADING_TIMEOUT_MS = 8000;

class PortalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Client dashboard render error:", error, errorInfo);
  }
  handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };
  render() {
    if (this.state.hasError) {
      const isChunkLoad = this.state.error?.isChunkLoadError ||
        String(this.state.error?.message || "").includes("Failed to fetch dynamically imported module");
      return (
        <PortalLoadError
          isChunkLoad={isChunkLoad}
          onRetry={this.handleRetry}
          retryCount={this.state.retryCount}
        />
      );
    }
    return this.props.children;
  }
}

function PortalLoadError({ isChunkLoad, onRetry, retryCount }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={
            isChunkLoad
              ? { background: "rgba(217,119,6,0.12)" }
              : { background: "linear-gradient(135deg, #003B8F, #00AEEF)" }
          }
        >
          {isChunkLoad ? (
            <WifiOff className="w-8 h-8" style={{ color: "#d97706" }} />
          ) : (
            <LifeBuoy className="w-8 h-8 text-white" />
          )}
        </div>
        <h1
          className="mb-3 text-2xl font-bold text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {isChunkLoad ? "Connection Issue" : "Client Dashboard Temporarily Unavailable"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isChunkLoad
            ? "We couldn't load the dashboard due to a temporary network issue. Please try again."
            : "The client dashboard could not render cleanly. Retry, refresh, or contact support if the issue continues."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onRetry}
            className="cs-btn-primary inline-flex items-center gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> {retryCount > 0 ? "Retry Again" : "Retry"}
          </button>
          <a
            href="/client-portal"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Page
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            <LifeBuoy className="w-4 h-4" /> Support
          </Link>
        </div>
        {retryCount >= 3 && (
          <p className="text-xs text-muted-foreground mt-4">
            Still having trouble? Try hard-refreshing (Ctrl+Shift+R) or clearing your browser cache.
          </p>
        )}
      </div>
    </div>
  );
}

function PortalLoadingTimeout() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}
        >
          <AlertTriangle className="w-8 h-8 text-white" />
        </div>
        <h1
          className="mb-3 text-2xl font-bold text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Taking Longer Than Expected
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          We're having trouble loading your client dashboard. Please try refreshing the page.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/client-portal"
            className="cs-btn-primary inline-flex items-center gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </a>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function UnauthenticatedAccess() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          "linear-gradient(135deg, #f7fbff 0%, #ffffff 45%, #eef8ff 100%)",
      }}
    >
      <div className="max-w-lg text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "linear-gradient(135deg, #003B8F, #00AEEF)",
            boxShadow: "0 8px 32px rgba(0,174,239,0.25)",
          }}
        >
          <LogIn className="w-10 h-10 text-white" />
        </div>
        <h1
          className="mb-3 text-3xl font-black text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Client Portal
        </h1>
        <p className="text-base text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
          Log in to view your onboarding progress, automation status, reports, and
          support messages.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/login"
            className="cs-btn-primary inline-flex items-center gap-2 text-sm"
            style={{ minHeight: "48px" }}
          >
            <LogIn className="w-4 h-4" /> Log In to Client Portal
          </a>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
            style={{ minHeight: "48px" }}
          >
            <LifeBuoy className="w-4 h-4" /> Need help accessing your portal?
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClientPortalAccess() {
  const { user: ctxUser, isAuthenticated, isLoadingAuth, isLoadingPublicSettings } =
    useAuth();
  const [timedOut, setTimedOut] = useState(false);
  const [portalChecking, setPortalChecking] = useState(true);
  const [portalUser, setPortalUser] = useState(null);

  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings) return;
    const timer = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoadingAuth, isLoadingPublicSettings]);

  // /client-portal is a public route, so AuthContext may skip its auth check.
  // Do our own check here so logged-in users go straight to the dashboard.
  useEffect(() => {
    if (isLoadingAuth || isLoadingPublicSettings) return;
    if (isAuthenticated && ctxUser) {
      setPortalChecking(false);
      return;
    }

    let cancelled = false;
    base44.auth.isAuthenticated().then(async (authed) => {
      if (cancelled) return;
      if (!authed) {
        setPortalChecking(false);
        return;
      }
      try {
        const me = await base44.auth.me();
        if (cancelled) return;
        setPortalUser(me);
      } catch {
        if (!cancelled) setPortalUser(null);
      } finally {
        if (!cancelled) setPortalChecking(false);
      }
    }).catch(() => {
      if (!cancelled) setPortalChecking(false);
    });

    return () => { cancelled = true; };
  }, [isLoadingAuth, isLoadingPublicSettings, isAuthenticated, ctxUser]);

  if (timedOut && (isLoadingAuth || isLoadingPublicSettings)) {
    return <PortalLoadingTimeout />;
  }

  if (isLoadingAuth || isLoadingPublicSettings || portalChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const effectiveUser = ctxUser || portalUser;
  const effectiveAuthed = isAuthenticated || Boolean(effectiveUser);

  if (!effectiveAuthed || !effectiveUser) {
    return <UnauthenticatedAccess />;
  }

  return (
    <PortalErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
      >
        <ClientDashboard />
      </Suspense>
    </PortalErrorBoundary>
  );
}
