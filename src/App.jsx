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
import ErrorBoundary from "./components/ErrorBoundary";
import PageNotFound from "./lib/PageNotFound";
import { initializeAnalyticsObserver } from "@/lib/analyticsObserver";
import { scrollToTop } from "@/lib/scroll";
import { setPageMetadata } from "@/lib/seo";

// Analytics observer initialized inside AppInner useEffect — see below
import Home from "./pages/Home";
import Start from "./pages/Start";
import Book from "./pages/Book";
import Contact from "./pages/Contact";
import Industries from "./pages/Industries";
import Blog from "./pages/Blog";
import IndustryTemplate from "./components/landing/IndustryTemplate";
import About from "./pages/About";
import Automations from "./pages/Automations";
import Onboarding from "./internal-pages/Onboarding";
import CaptureLeads from "./internal-pages/CaptureLeads";
import Success from "./internal-pages/Success";
import LegalPage from "./internal-pages/LegalPage";
import AutomationServicePage from "./internal-pages/AutomationServicePage";
import OrderSuccess from "./internal-pages/OrderSuccess";
import BusinessSetup from "./internal-pages/BusinessSetup";
import ThankYou from "./internal-pages/ThankYou";
import CredentialsSetup from "./internal-pages/CredentialsSetup";
import SetupStatus from "./internal-pages/SetupStatus";
import WebsitePreview from "./internal-pages/WebsitePreview";
import AdminInstallGuide from "./internal-pages/AdminInstallGuide";
import AISalesCommandCenter from "./internal-pages/AISalesCommandCenter";
import PerformanceWars from "./internal-pages/PerformanceWars";


const Store = lazy(() => import("./pages/Store"));
const AdminDashboard = lazy(() => import("./internal-pages/AdminDashboard"));
const AdminLeads = lazy(() => import("./internal-pages/AdminLeads"));
const AdminLeadDetail = lazy(() => import("./internal-pages/AdminLeadDetail"));
const AdminAutomation = lazy(() => import("./internal-pages/AdminAutomation"));
const AdminOnboarding = lazy(() => import("./internal-pages/AdminOnboarding"));
const ClientPortal = lazy(() => import("./internal-pages/ClientPortal"));
const ClientDashboard = lazy(() => import("./internal-pages/ClientDashboard"));

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
  "/lead-capture-automation",
  "/missed-call-text-back",
  "/ai-lead-follow-up",
  "/appointment-booking-automation",
  "/review-automation",
  "/customer-reactivation",
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
  "/blog",
  "/about",
  "/automations",
  "/leads/capture",
  "/onboarding",
  "/setup/preview",
  // test/preview routes removed
];

const NOINDEX_PREFIXES = [
  "/admin",
  "/adminleaddetail",
  "/adminsettings",
  "/dashboard",
  "/client-portal",
  "/client-dashboard",
  "/industrytemplate",
  "/lead-intelligence",
  "/medspa-dashboard",
  "/notfound",
  "/sam",
  "/success",
  "/setup",
  "/thank-you",
  "/onboarding",
  "/order-success",
  "/websitespecpreview",
  "/leads",
];

const routePath = (...segments) => `/${segments.join("/")}`;
const dynamicParam = (name) => `:${name}`;

const LEGACY_REDIRECTS = [
  { from: routePath("Blog"), to: routePath("blog") },
  { from: routePath("IndustriesPage"), to: routePath("industries") },
  { from: routePath("IndustryTemplate"), to: routePath("industries") },
  { from: routePath("Roofing"), to: routePath("roofing") },
  { from: routePath("HVAC"), to: routePath("hvac") },
  { from: routePath("Dental"), to: routePath("dental") },
  { from: routePath("MedSpa"), to: routePath("med-spa") },
  { from: routePath("Chiropractic"), to: routePath("chiropractic") },
  { from: routePath("Contractors"), to: routePath("contractors") },
  { from: routePath("industries", "roofing"), to: routePath("roofing") },
  { from: routePath("industries", "hvac"), to: routePath("hvac") },
  { from: routePath("industries", "dental"), to: routePath("dental") },
  { from: routePath("industries", "med-spa"), to: routePath("med-spa") },
  { from: routePath("industries", "chiropractic"), to: routePath("chiropractic") },
  { from: routePath("industries", "contractors"), to: routePath("contractors") },
  { from: routePath("Dashboard"), to: routePath("admin") },
  { from: routePath("AdminSettings"), to: routePath("admin") },
  { from: routePath("AdminLeadDetail"), to: routePath("admin", "leads") },
  { from: routePath("LeadIntelligence"), to: routePath("admin") },
  { from: routePath("Sam"), to: routePath("admin") },
  { from: routePath("MedSpaDashboard"), to: routePath("admin") },
  { from: routePath("WebsiteSpecPreview"), to: routePath("admin") },
  { from: routePath("legal", "privacy"), to: routePath("privacy-policy") },
  { from: routePath("legal", "terms"), to: routePath("terms") },
];

const AUTOMATION_SERVICE_ROUTES = [
  routePath("lead-capture-automation"),
  routePath("missed-call-text-back"),
  routePath("ai-lead-follow-up"),
  routePath("appointment-booking-automation"),
  routePath("review-automation"),
  routePath("customer-reactivation"),
];

const INDUSTRY_ROUTE_SLUGS = [
  "med-spa",
  "dental",
  "hvac",
  "roofing",
  "chiropractic",
  "contractors",
];

const HIDDEN_PUBLIC_ROUTES = [
  { route: routePath("success"), element: <Success /> },
  { route: routePath("onboarding"), element: <Onboarding /> },
  { route: routePath("leads", "capture"), element: <CaptureLeads /> },
  { route: routePath("legal", dynamicParam("type")), element: <LegalPage /> },
  { route: routePath("order-success"), element: <OrderSuccess /> },
  { route: routePath("setup"), element: <BusinessSetup /> },
  { route: routePath("thank-you"), element: <ThankYou /> },
  { route: routePath("setup", "credentials"), element: <CredentialsSetup /> },
  { route: routePath("setup", "status", dynamicParam("orderId")), element: <SetupStatus /> },
  { route: routePath("setup", "status"), element: <SetupStatus /> },
  { route: routePath("setup", "preview", dynamicParam("specId")), element: <WebsitePreview /> },
  { route: routePath("setup", "preview"), element: <WebsitePreview /> },
];

const isPublicPath = (pathname) =>
  PUBLIC_PATHS.some((path) => {
    const normalizedPathname = pathname.toLowerCase();
    const normalizedPath = path.toLowerCase();
    return (
      normalizedPathname === normalizedPath ||
      normalizedPathname.startsWith(`${normalizedPath}/`)
    );
  });

// Fix 1: ScrollToTop — resets scroll position on every route change
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    // Don't scroll to top if navigating to a hash anchor
    if (!location.hash) {
      scrollToTop();
    }
  }, [location.pathname]);
  return null;
}

function AppInner() {
  useEffect(() => {
    // Initialize auto-tracking after React mounts — safe for SSR/pre-render
    if (typeof window !== "undefined") {
      initializeAnalyticsObserver();
    }
  }, []);
  return null;
}

// SectionRedirect — just navigate to home, no auto-scroll
function SectionRedirect({ hash }) {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanupMetadata = setPageMetadata({
      title: "ClientSurge Systems | AI Lead Response and Booking Automation",
      description: "Done-for-you automation that helps appointment-based businesses respond faster, follow up consistently, and book more appointments.",
      canonicalPath: "/",
    });
    navigate("/", { replace: true });
    return cleanupMetadata;
  }, [hash, navigate]);

  return null;
}

function AdminLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:block w-64 border-r border-border p-4">
        <div className="h-6 w-40 rounded bg-muted mb-6" />
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className="mb-3 h-9 rounded-lg bg-muted/70" />
        ))}
      </div>
      <div className="flex-1 p-6">
        <div className="mb-6 h-8 w-56 rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 rounded-xl border border-border bg-muted/40" />
          <div className="h-28 rounded-xl border border-border bg-muted/40" />
          <div className="h-28 rounded-xl border border-border bg-muted/40" />
        </div>
        <div className="mt-6 h-80 rounded-xl border border-border bg-muted/30" />
      </div>
    </div>
  );
}

function RouteIndexingGuard() {
  const location = useLocation();

  useEffect(() => {
    const robotsMeta = document.head.querySelector('meta[name="robots"]');
    if (!robotsMeta) return;

    const previous = robotsMeta.getAttribute("content") || "index,follow";
    const pathname = location.pathname.toLowerCase();
    const shouldNoindex = NOINDEX_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
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
      {LEGACY_REDIRECTS.map(({ from, to }) => (
        <Route
          key={from}
          caseSensitive
          path={from}
          element={<Navigate to={to} replace />}
        />
      ))}
      <Route path={routePath("NotFound")} caseSensitive element={<PageNotFound />} />
      <Route path="/" element={<Home />} />
      <Route path="/start" element={<Start />} />
      <Route path="/book" element={<Book />} />
      <Route path="/book-demo" element={<Navigate to="/book" replace />} />
      <Route path="/industries" element={<Industries />} />
      <Route path={routePath("pricing")} element={<SectionRedirect hash="#pricing" />} />
      <Route path={routePath("faq")} element={<SectionRedirect hash="#faq" />} />
      <Route path={routePath("our-system")} element={<SectionRedirect hash="#services" />} />
      <Route path={routePath("testimonials")} element={<SectionRedirect hash="#testimonials" />} />
      <Route path="/privacy-policy" element={<LegalPage fixedType="privacy" canonicalPath="/privacy-policy" />} />
      <Route path={routePath("terms")} element={<LegalPage fixedType="terms" canonicalPath="/terms" />} />
      <Route path="/login" element={<Navigate to="/client-portal" replace />} />
      <Route path={routePath("ClientPortal")} element={<Navigate to={routePath("client-portal")} replace />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/blog" element={<Blog />} />
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
      <Route path="/about" element={<About />} />
      <Route path="/automations" element={<Automations />} />
      {AUTOMATION_SERVICE_ROUTES.map((path) => (
        <Route key={path} path={path} element={<AutomationServicePage />} />
      ))}
      {INDUSTRY_ROUTE_SLUGS.map((slug) => (
        <Route
          key={slug}
          path={`/${slug}`}
          element={<IndustryTemplate industrySlug={slug} />}
        />
      ))}
      {HIDDEN_PUBLIC_ROUTES.map(({ route, element }) => (
        <Route key={route} path={route} element={element} />
      ))}
      <Route path={routePath("services", dynamicParam("serviceSlug"))} element={<Navigate to="/store" replace />} />

      <Route
        element={
          <ProtectedRoute unauthenticatedElement={<AuthRedirectFallback />} />
        }
      >
        {[
          { route: routePath("client-portal"), Component: ClientPortal },
          { route: routePath("client-dashboard"), Component: ClientDashboard },
        ].map(({ route, Component }) => (
          <Route
            key={route}
            path={route}
            element={
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}>
                <Component />
              </Suspense>
            }
          />
        ))}
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
        {[
          { route: routePath("dashboard"), element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("admin-settings"), element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("admin"), Component: AdminDashboard },
          { route: routePath("admin", "leads"), Component: AdminLeads },
          { route: routePath("admin", "leads", dynamicParam("leadId")), Component: AdminLeadDetail },
          { route: routePath("admin", "automations"), Component: AdminAutomation },
          { route: routePath("lead-intelligence"), element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("sam"), element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("medspa-dashboard"), element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("admin", "onboarding"), Component: AdminOnboarding },
          { route: routePath("admin", "install-guide"), element: <AdminInstallGuide /> },
          { route: routePath("admin", "ai-sales"), element: <AISalesCommandCenter /> },
          { route: routePath("admin", "AIStatusDashboard"), caseSensitive: true, element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("admin", "performance-wars"), element: <PerformanceWars /> },
        ].map(({ route, Component, element, caseSensitive }) => (
          <Route
            key={route}
            caseSensitive={caseSensitive}
            path={route}
            element={
              element || (
                <Suspense fallback={<AdminLoadingSkeleton />}>
                  <Component />
                </Suspense>
              )
            }
          />
        ))}
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
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to content
            </a>
            <ScrollToTop />
            <AutoCTAAnalytics />
            <RouteIndexingGuard />
            <div id="main-content" tabIndex={-1}>
              <AuthenticatedApp />
            </div>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
