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
import AutoCTAAnalytics from "./components/analytics/AutoCTAAnalytics";
import PageNotFound from "./lib/PageNotFound";
import { initializeAnalyticsObserver } from "@/lib/analyticsObserver";

// Initialize auto-tracking on app load
if (typeof window !== "undefined") {
  initializeAnalyticsObserver();
}
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import CaptureLeads from "./pages/CaptureLeads";
import Start from "./pages/Start";
import Book from "./pages/Book";
import Success from "./pages/Success";
import LegalPage from "./pages/LegalPage";
import Contact from "./pages/Contact";
import Industries from "./pages/Industries";
import OrderSuccess from "./pages/OrderSuccess";
import IndustryTemplate from "./components/landing/IndustryTemplate";
import BusinessSetup from "./pages/BusinessSetup";

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
  "/test-option-1",
  "/test-option-2",
  "/test-option-3",
  "/preview-idea-1",
  "/preview-idea-2",
];

const NOINDEX_PREFIXES = [
  "/admin",
  "/dashboard",
  "/client-portal",
  "/lead-intelligence",
  "/medspa-dashboard",
  "/sam",
  "/success",
];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

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
      <Route path="/test-option-1" element={<Navigate to="/" replace />} />
      <Route path="/test-option-2" element={<Navigate to="/" replace />} />
      <Route path="/test-option-3" element={<Navigate to="/" replace />} />
      <Route path="/preview-idea-1" element={<Navigate to="/" replace />} />
      <Route path="/preview-idea-2" element={<Navigate to="/" replace />} />
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
          <Suspense
            fallback={
              <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
              </div>
            }
          >
            <Store />
          </Suspense>
        }
      />
      <Route path="/order-success" element={<OrderSuccess />} />
      <Route path="/setup" element={<BusinessSetup />} />
      <Route path="/:slug" element={<IndustryTemplate />} />

      <Route
        element={
          <ProtectedRoute unauthenticatedElement={<AuthRedirectFallback />} />
        }
      >
        <Route path="/client-portal" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><ClientPortal /></Suspense>} />
        <Route path="/client-dashboard" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><ClientDashboard /></Suspense>} />
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
        <Route path="/admin" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><AdminDashboard /></Suspense>} />
        <Route path="/admin/leads" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><AdminLeads /></Suspense>} />
        <Route path="/admin/leads/:leadId" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><AdminLeadDetail /></Suspense>} />
        <Route path="/admin/automations" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><AdminAutomation /></Suspense>} />
        <Route path="/lead-intelligence" element={<Navigate to="/admin" replace />} />
        <Route path="/sam" element={<Navigate to="/admin" replace />} />
        <Route path="/medspa-dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/onboarding" element={<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}><AdminOnboarding /></Suspense>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AutoCTAAnalytics />
          <RouteIndexingGuard />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;