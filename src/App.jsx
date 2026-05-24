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
import {
  isPublicRoute,
  routePath,
  shouldNoindexRoute,
} from "@/lib/routeSecurity";

// Analytics observer initialized inside AppInner useEffect — see below
import Home from "./pages/Home";


const Start = lazy(() => import("./pages/Start"));
const Book = lazy(() => import("./pages/Book"));
const Contact = lazy(() => import("./pages/Contact"));
const Industries = lazy(() => import("./pages/Industries"));
const Blog = lazy(() => import("./pages/Blog"));
const Login = lazy(() => import("./pages/Login"));
const Store = lazy(() => import("./pages/Store"));
const About = lazy(() => import("./pages/About"));
const Automations = lazy(() => import("./pages/Automations"));
const IndustryTemplate = lazy(() => import("./components/landing/IndustryTemplate"));
const Success = lazy(() => import("./internal-pages/Success"));
const CaptureLeads = lazy(() => import("./internal-pages/CaptureLeads"));
const LegalPage = lazy(() => import("./internal-pages/LegalPage"));
const AutomationServicePage = lazy(() => import("./internal-pages/AutomationServicePage"));
const OrderSuccess = lazy(() => import("./internal-pages/OrderSuccess"));
const ThankYou = lazy(() => import("./internal-pages/ThankYou"));
const Onboarding = lazy(() => import("./internal-pages/Onboarding"));
const BusinessSetup = lazy(() => import("./internal-pages/BusinessSetup"));
const CredentialsSetup = lazy(() => import("./internal-pages/CredentialsSetup"));
const SetupStatus = lazy(() => import("./internal-pages/SetupStatus"));
const WebsitePreview = lazy(() => import("./internal-pages/WebsitePreview"));
const AdminDashboard = lazy(() => import("./internal-pages/AdminDashboard"));
const AdminLeads = lazy(() => import("./internal-pages/AdminLeads"));
const AdminLeadDetail = lazy(() => import("./internal-pages/AdminLeadDetail"));
const AdminAutomation = lazy(() => import("./internal-pages/AdminAutomation"));
const AdminOnboarding = lazy(() => import("./internal-pages/AdminOnboarding"));
const AdminInstallGuide = lazy(() => import("./internal-pages/AdminInstallGuide"));
const AISalesCommandCenter = lazy(() => import("./internal-pages/AISalesCommandCenter"));
const PerformanceWars = lazy(() => import("./internal-pages/PerformanceWars"));
const ClientPortal = lazy(() => import("./internal-pages/ClientPortal"));
const ClientDashboard = lazy(() => import("./internal-pages/ClientDashboard"));
const MotionLab = lazy(() => import("./internal-pages/MotionLab"));

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
  { from: routePath("roofing-automation"), to: routePath("roofing") },
  { from: routePath("hvac-automation"), to: routePath("hvac") },
  { from: routePath("dental-automation"), to: routePath("dental") },
  { from: routePath("med-spa-automation"), to: routePath("med-spa") },
  { from: routePath("chiropractic-automation"), to: routePath("chiropractic") },
  { from: routePath("contractor-automation"), to: routePath("contractors") },
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
  { route: routePath("success"), Component: Success },
  { route: routePath("leads", "capture"), Component: CaptureLeads },
  { route: routePath("legal", dynamicParam("type")), Component: LegalPage },
  { route: routePath("order-success"), Component: OrderSuccess },
  { route: routePath("thank-you"), Component: ThankYou },
];

const CLIENT_PRIVATE_ROUTES = [
  { route: routePath("onboarding"), Component: Onboarding },
  { route: routePath("setup"), Component: BusinessSetup },
  { route: routePath("setup", "credentials"), Component: CredentialsSetup },
  { route: routePath("setup", "status", dynamicParam("orderId")), Component: SetupStatus },
  { route: routePath("setup", "status"), Component: SetupStatus },
];

const INTERNAL_ADMIN_ROUTES = [
  { route: routePath("setup", "preview", dynamicParam("specId")), Component: WebsitePreview },
  { route: routePath("setup", "preview"), Component: WebsitePreview },
];

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

function PortalRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tab = params.get("tab");
  const tabMap = {
    services: "plan",
    support: "support",
    billing: "billing",
    leads: "leads",
    tasks: "tasks",
  };
  const nextParams = new URLSearchParams();
  if (tabMap[tab]) {
    nextParams.set("tab", tabMap[tab]);
  }

  return (
    <Navigate
      to={`${routePath("client-portal")}${nextParams.toString() ? `?${nextParams.toString()}` : ""}`}
      replace
    />
  );
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

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}

function SuspendedRoute({
  Component,
  componentProps = {},
  fallback = <RouteLoadingFallback />,
}) {
  return (
    <Suspense fallback={fallback}>
      <Component {...componentProps} />
    </Suspense>
  );
}

function RouteIndexingGuard() {
  const location = useLocation();

  useEffect(() => {
    const robotsMeta = document.head.querySelector('meta[name="robots"]');
    if (!robotsMeta) return;

    const previous = robotsMeta.getAttribute("content") || "index,follow";
    const previousCacheControl = document.head
      .querySelector('meta[http-equiv="Cache-Control"]')
      ?.getAttribute("content");
    const previousPragma = document.head
      .querySelector('meta[http-equiv="Pragma"]')
      ?.getAttribute("content");
    const previousExpires = document.head
      .querySelector('meta[http-equiv="Expires"]')
      ?.getAttribute("content");
    const shouldNoindex = shouldNoindexRoute(location.pathname);

    robotsMeta.setAttribute(
      "content",
      shouldNoindex ? "noindex,nofollow,noarchive" : "index,follow"
    );

    const cacheControlMeta =
      document.head.querySelector('meta[http-equiv="Cache-Control"]') ||
      document.head.appendChild(document.createElement("meta"));
    const pragmaMeta =
      document.head.querySelector('meta[http-equiv="Pragma"]') ||
      document.head.appendChild(document.createElement("meta"));
    const expiresMeta =
      document.head.querySelector('meta[http-equiv="Expires"]') ||
      document.head.appendChild(document.createElement("meta"));

    cacheControlMeta.setAttribute("http-equiv", "Cache-Control");
    pragmaMeta.setAttribute("http-equiv", "Pragma");
    expiresMeta.setAttribute("http-equiv", "Expires");

    if (shouldNoindex) {
      cacheControlMeta.setAttribute("content", "no-store");
      pragmaMeta.setAttribute("content", "no-cache");
      expiresMeta.setAttribute("content", "0");
    } else {
      cacheControlMeta.setAttribute("content", previousCacheControl || "");
      pragmaMeta.setAttribute("content", previousPragma || "");
      expiresMeta.setAttribute("content", previousExpires || "");
    }

    return () => {
      robotsMeta.setAttribute("content", previous);
      cacheControlMeta.setAttribute("content", previousCacheControl || "");
      pragmaMeta.setAttribute("content", previousPragma || "");
      expiresMeta.setAttribute("content", previousExpires || "");
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
  const publicRoute = isPublicRoute(location.pathname);

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
      <Route path="/start" element={<SuspendedRoute Component={Start} />} />
      <Route path="/book" element={<SuspendedRoute Component={Book} />} />
      <Route path="/book-demo" element={<Navigate to="/book" replace />} />
      <Route path="/industries" element={<SuspendedRoute Component={Industries} />} />
      <Route path={routePath("pricing")} element={<SectionRedirect hash="#pricing" />} />
      <Route path={routePath("faq")} element={<SectionRedirect hash="#faq" />} />
      <Route path={routePath("our-system")} element={<SectionRedirect hash="#services" />} />
      <Route path={routePath("testimonials")} element={<SectionRedirect hash="#testimonials" />} />
      <Route
        path="/privacy-policy"
        element={
          <SuspendedRoute
            Component={LegalPage}
            componentProps={{
              fixedType: "privacy",
              canonicalPath: "/privacy-policy",
            }}
          />
        }
      />
      <Route
        path={routePath("terms")}
        element={
          <SuspendedRoute
            Component={LegalPage}
            componentProps={{ fixedType: "terms", canonicalPath: "/terms" }}
          />
        }
      />
      <Route path="/login" element={<SuspendedRoute Component={Login} />} />
      <Route path={routePath("ClientPortal")} element={<Navigate to={routePath("client-portal")} replace />} />
      <Route path="/contact" element={<SuspendedRoute Component={Contact} />} />
      <Route path="/blog" element={<SuspendedRoute Component={Blog} />} />
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
      <Route path="/about" element={<SuspendedRoute Component={About} />} />
      <Route path="/automations" element={<SuspendedRoute Component={Automations} />} />
      {AUTOMATION_SERVICE_ROUTES.map((path) => (
        <Route
          key={path}
          path={path}
          element={<SuspendedRoute Component={AutomationServicePage} />}
        />
      ))}
      {INDUSTRY_ROUTE_SLUGS.map((slug) => (
        <Route
          key={slug}
          path={`/${slug}`}
          element={
            <SuspendedRoute
              Component={IndustryTemplate}
              componentProps={{ industrySlug: slug }}
            />
          }
        />
      ))}
      {HIDDEN_PUBLIC_ROUTES.map(({ route, Component, element }) => (
        <Route
          key={route}
          path={route}
          element={Component ? <SuspendedRoute Component={Component} /> : element}
        />
      ))}
      <Route path={routePath("services", dynamicParam("serviceSlug"))} element={<Navigate to="/store" replace />} />

      <Route
        element={
          <ProtectedRoute unauthenticatedElement={<AuthRedirectFallback />} />
        }
      >
        {[
          { route: routePath("client-portal"), Component: ClientPortal },
          { route: routePath("client-dashboard"), element: <PortalRedirect /> },
          ...CLIENT_PRIVATE_ROUTES,
        ].map(({ route, Component, element }) => (
          <Route
            key={route}
            path={route}
            element={
              Component ? (
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}>
                  <Component />
                </Suspense>
              ) : element
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
          { route: routePath("admin", "install-guide"), Component: AdminInstallGuide },
          { route: routePath("admin", "ai-sales"), Component: AISalesCommandCenter },
          { route: routePath("admin", "AIStatusDashboard"), caseSensitive: true, element: <Navigate to={routePath("admin")} replace /> },
          { route: routePath("admin", "performance-wars"), Component: PerformanceWars },
          {
            route: routePath("motion-lab"),
            element: (
              <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" /></div>}>
                <MotionLab />
              </Suspense>
            ),
          },
          ...INTERNAL_ADMIN_ROUTES,
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
            <main id="main-content" tabIndex={-1}>
              <AuthenticatedApp />
            </main>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
