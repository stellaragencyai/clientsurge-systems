import { lazy, Suspense, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/ProtectedRoute";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import { initializeAnalyticsObserver } from "@/lib/analyticsObserver";
import { scrollToTop } from "@/lib/scroll";
import AutoCTAAnalytics from "./components/analytics/AutoCTAAnalytics";
import ErrorBoundary from "./components/ErrorBoundary";
import IndustryTemplate from "./components/landing/IndustryTemplate";
import PageNotFound from "./lib/PageNotFound";
import Home from "./pages/Home";
import MedSpa from "./pages/MedSpa";
import Onboarding from "./pages/Onboarding";
import CaptureLeads from "./pages/CaptureLeads";
import Start from "./pages/Start";
import Book from "./pages/Book";
import Success from "./pages/Success";
import LegalPage from "./pages/LegalPage";
import Contact from "./pages/Contact";
import Industries from "./pages/Industries";
import OrderSuccess from "./pages/OrderSuccess";
import BusinessSetup from "./pages/BusinessSetup";
import ThankYou from "./pages/ThankYou";
import About from "./pages/About";
import CredentialsSetup from "./pages/CredentialsSetup";

const Store = lazy(() => import("./pages/Store"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const AdminLeadDetail = lazy(() => import("./pages/AdminLeadDetail"));
const AdminAutomation = lazy(() => import("./pages/AdminAutomation"));
const AdminOnboarding = lazy(() => import("./pages/AdminOnboarding"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));

const PUBLIC_PATHS = [
  "/",
  "/store",
  "/order-success",
  "/med-spa",
  "/dental",
  "/hvac",
  "/roofing",
  "/contractors",
  "/chiropractic",
  "/start",
  "/book",
  "/book-demo",
  "/industries",
  "/pricing",
  "/faq",
  "/our-system",
  "/testimonials",
  "/privacy-policy",
  "/terms",
  "/login",
  "/success",
  "/legal",
  "/contact",
  "/leads/capture",
  "/onboarding",
];

const NOINDEX_PREFIXES = [
  "/admin",
  "/dashboard",
  "/client-portal",
  "/client-dashboard",
  "/lead-intelligence",
  "/medspa-dashboard",
  "/sam",
  "/success",
  "/setup",
  "/onboarding",
  "/order-success",
  "/leads",
];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    const navigationEntry =
      typeof window !== "undefined" && typeof window.performance?.getEntriesByType === "function"
        ? window.performance.getEntriesByType("navigation")[0]
        : null;
    const isReload = navigationEntry?.type === "reload";

    // Refreshing the homepage after any section-hash navigation can reopen the
    // page mid-stream in some embedded browsers. Strip the stale hash on reload
    // so the homepage always starts at the top unless the user actively clicked
    // an in-page section link during the current session.
    if (location.pathname === "/" && location.hash && isReload) {
      window.history.replaceState({}, "", "/");
      scrollToTop();
      return;
    }

    if (!location.hash) {
      scrollToTop();
    }
  }, [location.pathname, location.hash]);

  return null;
}

function AppInner() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      initializeAnalyticsObserver();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) {
      return undefined;
    }

    const previousValue = window.history.scrollRestoration;

    // Route changes and homepage hash stripping are handled in-app. Leaving the
    // browser restoration on here can re-open the homepage at an old section on
    // refresh, which feels like the page is auto-scrolling by itself.
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousValue;
    };
  }, []);

  return null;
}

function SectionRedirect({ hash }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });

    const timer = window.setTimeout(() => {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      window.history.replaceState({}, "", `/${hash}`);
    }, 450);

    return () => window.clearTimeout(timer);
  }, [hash, navigate]);

  return null;
}

function RouteIndexingGuard() {
  const location = useLocation();

  useEffect(() => {
    const robotsMeta = document.head.querySelector('meta[name="robots"]');
    if (!robotsMeta) return;

    const previous = robotsMeta.getAttribute("content") || "index,follow";
    const shouldNoindex = NOINDEX_PREFIXES.some(
      (prefix) =>
        location.pathname === prefix || location.pathname.startsWith(`${prefix}/`)
    );

    robotsMeta.setAttribute(
      "content",
      shouldNoindex ? "noindex,nofollow" : "index,follow"
    );

    return () => {
      robotsMeta.setAttribute("content", previous);
    };
  }, [location.pathname]);

  return null;
}

function AuthRedirectFallback() {
  const { navigateToLogin } = useAuth();

  useEffect(() => {
    navigateToLogin();
  }, [navigateToLogin]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}

function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="mb-3 text-2xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}

function RouteLoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80">
      <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}

const fullScreenLoader = (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const publicRoute = isPublicPath(location.pathname);

  if ((isLoadingPublicSettings || isLoadingAuth) && !publicRoute) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    );
  }

  if (authError?.type === "user_not_registered" && !publicRoute) {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/med-spa" element={<MedSpa />} />
      <Route path="/start" element={<Start />} />
      <Route path="/book" element={<Book />} />
      <Route path="/book-demo" element={<Navigate to="/book" replace />} />
      <Route path="/industries" element={<Industries />} />
      <Route path="/pricing" element={<SectionRedirect hash="#pricing" />} />
      <Route path="/faq" element={<SectionRedirect hash="#faq" />} />
      <Route path="/our-system" element={<SectionRedirect hash="#services" />} />
      <Route path="/testimonials" element={<SectionRedirect hash="#testimonials" />} />
      <Route path="/privacy-policy" element={<Navigate to="/legal/privacy" replace />} />
      <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
      <Route path="/login" element={<Navigate to="/client-portal" replace />} />
      <Route path="/success" element={<Success />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/leads/capture" element={<CaptureLeads />} />
      <Route path="/legal/:type" element={<LegalPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route
        path="/store"
        element={
          <Suspense fallback={<RouteLoadingScreen />}>
            <Store />
          </Suspense>
        }
      />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/setup" element={<BusinessSetup />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/about" element={<About />} />
      <Route path="/setup/credentials" element={<CredentialsSetup />} />
      <Route path="/:slug" element={<IndustryTemplate />} />

      <Route
        element={
          <ProtectedRoute unauthenticatedElement={<AuthRedirectFallback />} />
        }
      >
        <Route
          path="/client-portal"
          element={<Suspense fallback={fullScreenLoader}><ClientPortal /></Suspense>}
        />
        <Route
          path="/client-dashboard"
          element={<Suspense fallback={fullScreenLoader}><ClientDashboard /></Suspense>}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["admin"]}
            unauthenticatedElement={<AuthRedirectFallback />}
            unauthorizedElement={<AccessDeniedPage />}
          />
        }
      >
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin-settings" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin"
          element={<Suspense fallback={fullScreenLoader}><AdminDashboard /></Suspense>}
        />
        <Route
          path="/admin/leads"
          element={<Suspense fallback={fullScreenLoader}><AdminLeads /></Suspense>}
        />
        <Route
          path="/admin/leads/:leadId"
          element={<Suspense fallback={fullScreenLoader}><AdminLeadDetail /></Suspense>}
        />
        <Route
          path="/admin/automations"
          element={<Suspense fallback={fullScreenLoader}><AdminAutomation /></Suspense>}
        />
        <Route path="/lead-intelligence" element={<Navigate to="/admin" replace />} />
        <Route path="/sam" element={<Navigate to="/admin" replace />} />
        <Route path="/medspa-dashboard" element={<Navigate to="/admin" replace />} />
        <Route
          path="/admin/onboarding"
          element={<Suspense fallback={fullScreenLoader}><AdminOnboarding /></Suspense>}
        />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router style={{ overflowX: "hidden" }}>
            <ScrollToTop />
            <AppInner />
            <AutoCTAAnalytics />
            <RouteIndexingGuard />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
