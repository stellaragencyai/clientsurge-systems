import { useState, useEffect, lazy, Suspense, Component } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Loader2, LogIn, LifeBuoy, AlertTriangle, Home, RefreshCw, WifiOff } from "lucide-react";

// Lazy import with built-in retry for transient chunk-load failures
const ClientPortal = lazy(() =>
  import("@/internal-pages/ClientPortal").catch((err) => {
    // Chunk-load failures are often transient (504, network blip).
    // Tag the error so the boundary can show a retry option.
    console.error("ClientPortal chunk load failed:", err);
    throw Object.assign(
      new Error("The portal module failed to load. This is usually a temporary network issue."),
      { isChunkLoadError: true }
    );
  })
);

const LOADING_TIMEOUT_MS = 8000;

// ── Error boundary: catches render exceptions AND chunk-load failures ──
class PortalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ClientPortal render error:", error, errorInfo);
  }
  handleRetry = () => {
    // Clear the error and force a remount by changing the key
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
          {isChunkLoad ? "Connection Issue" : "Portal Setup in Progress"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {isChunkLoad
            ? "We couldn't load the portal due to a temporary network issue. Please try again — this usually resolves on retry."
            : "Your client portal is being prepared. If you just completed checkout, your portal will be ready shortly."}
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

function PortalSetupInProgress({ onRetry }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}
        >
          <LifeBuoy className="w-8 h-8 text-white" />
        </div>
        <h1
          className="mb-3 text-2xl font-bold text-foreground"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          Portal Setup in Progress
        </h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Your client portal is being prepared. If you just completed checkout, your
          portal will be ready shortly. If you continue to see this message, our team
          is ready to help.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={onRetry}
            className="cs-btn-primary inline-flex items-center gap-2 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            <LifeBuoy className="w-4 h-4" /> Contact Support
          </Link>
        </div>
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
          We're having trouble loading your client portal. Please try refreshing the
          page.
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

  // Loading timeout guard — show visible fallback instead of remaining blank
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings) return;
    const timer = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoadingAuth, isLoadingPublicSettings]);

  // /client-portal is a public route, so AuthContext skips its auth check.
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

  // Unauthenticated → show clean public access screen (never a 403 or blank)
  if (!effectiveAuthed || !effectiveUser) {
    return <UnauthenticatedAccess />;
  }

  // Authenticated → render real ClientPortal with ErrorBoundary + Suspense
  return (
    <PortalErrorBoundary>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        }
      >
        <ClientPortal />
      </Suspense>
    </PortalErrorBoundary>
  );
}