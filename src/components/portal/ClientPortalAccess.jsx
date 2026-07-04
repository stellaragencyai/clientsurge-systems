import { useState, useEffect, lazy, Suspense, Component } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, LogIn, LifeBuoy, AlertTriangle, Home, RefreshCw } from "lucide-react";

const ClientPortal = lazy(() => import("@/internal-pages/ClientPortal"));

const LOADING_TIMEOUT_MS = 8000;

// ── Error boundary: catches any render exception from ClientPortal ──
class PortalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ClientPortal render error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <PortalSetupInProgress
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
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
  const { user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings } =
    useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Loading timeout guard — show visible fallback instead of remaining blank
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings) return;
    const timer = setTimeout(() => setTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoadingAuth, isLoadingPublicSettings]);

  if (timedOut && (isLoadingAuth || isLoadingPublicSettings)) {
    return <PortalLoadingTimeout />;
  }

  if (isLoadingAuth || isLoadingPublicSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Unauthenticated → show clean public access screen (never a 403 or blank)
  if (!isAuthenticated || !user) {
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