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
const CookieConsent = lazy(() =>
  import("@/components/landing/CookieConsent").catch(() => ({ default: () => null }))
);
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { TenantProvider } from "@/lib/useTenantContext.jsx";
import { queryClientInstance } from "@/lib/query-client";
import AutoCTAAnalytics from "./components/analytics/AutoCTAAnalytics";
import ErrorBoundary from "./components/ErrorBoundary";
import PageNotFound from "./lib/PageNotFound";
import { installGa4 } from "@/lib/ga4";
import { initializeAnalyticsObserver } from "@/lib/analyticsObserver";
import {
  APP_SHELL_PUBLIC_PATHS,
  LEGACY_REDIRECTS as PUBLIC_ROUTE_REDIRECTS,
} from "@/lib/publicRouteMetadata";
import { shouldNoindexRoute } from "@/lib/routeSecurity";
import { forceScrollToTop } from "@/lib/scroll";

/**
 * ═══════════════════════════════════════════════════════════════════
 * AREA 1 — ROUTE CLASSIFICATION QA CHECKLIST
 * ═══════════════════════════════════════════════════════════════════
 *
 * PUBLIC (no auth required, indexed for SEO):
 *   /  /automations  /pricing  /store  /book  /contact  /about
 *   /industries  /blog  /blog/:slug  /faq  /testimonials  /library
 *   /our-system  /product  /signup  /start  /privacy-policy  /terms
 *   /setup-lookup  /thank-you  /success  /leads/capture  /order-success
 *   /lead-capture-automation  /missed-call-text-back  /ai-lead-follow-up
 *   /appointment-booking-automation  /review-automation  /customer-reactivation
 *   /roofing  /hvac  /plumbing  /dental  /med-spa  /chiropractic  /contractors
 *
 * AUTH_PUBLIC (no auth required, noindex):
 *   /login  /register  /forgot-password  /reset-password
 *
 * PROTECTED_CLIENT (auth required, any role):
 *   /client-portal  /client-dashboard  /dashboard-entry
 *
 * PROTECTED_ADMIN (auth required, admin or super_admin only):
 *   /mission-control  /admin/*  /saas/admin  /dashboard  /admin-settings
 *   /lead-intelligence  /sam  /medspa-dashboard
 *
 * LEGACY REDIRECTS (clean 301-style redirects):
 *   /privacy → /privacy-policy   /product-landing → /product
 *   /client-dashboard-entry → /dashboard-entry
 *   (see lib/publicRouteMetadata.js for full list)
 *
 * ═══════════════════════════════════════════════════════════════════
 */

// Analytics observer initialized inside AppInner useEffect — see below
import Home from "./pages/Home";

const Start = lazy(() => import("./pages/Start"));
const Book = lazy(() => import("./pages/Book"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ProductLanding = lazy(() => import("./pages/ProductLanding"));
const ProductSignup = lazy(() => import("./pages/ProductSignup"));
const RealEstate = lazy(() => import("./pages/RealEstate"));
const PersonalInjury = lazy(() => import("./pages/PersonalInjury"));
const ClientDashboardEntry = lazy(() => import("./pages/ClientDashboardEntry"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const OurSystemPage = lazy(() => import("./pages/OurSystemPage"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const Contact = lazy(() => import("./pages/Contact"));
const Industries = lazy(() => import("./pages/Industries"));
const Blog = lazy(() => import("./pages/Blog"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Store = lazy(() => import("./pages/Store"));
const IndustryPageTemplate = lazy(() => import("./components/landing/IndustryPageTemplate"));
const About = lazy(() => import("./pages/About"));
const Automations = lazy(() => import("./pages/Automations"));
const Onboarding = lazy(() => import("./internal-pages/Onboarding"));
const CaptureLeads = lazy(() => import("./internal-pages/CaptureLeads"));
const Success = lazy(() => import("./internal-pages/Success"));
const LegalPage = lazy(() => import("./internal-pages/LegalPage"));
const AutomationServicePage = lazy(() => import("./internal-pages/AutomationServicePage"));
const OrderSuccess = lazy(() => import("./internal-pages/OrderSuccess"));
const BusinessSetup = lazy(() => import("./internal-pages/BusinessSetup"));
const ThankYou = lazy(() => import("./internal-pages/ThankYou"));
const CredentialsSetup = lazy(() => import("./internal-pages/CredentialsSetup"));
const SetupStatus = lazy(() => import("./internal-pages/SetupStatus"));
const WebsitePreview = lazy(() => import("./internal-pages/WebsitePreview"));
const AdminDashboard = lazy(() => import("./internal-pages/AdminDashboard"));
const AdminLeadDetail = lazy(() => import("./internal-pages/AdminLeadDetail"));
const AdminAutomation = lazy(() => import("./internal-pages/AdminAutomation"));
const AdminOnboarding = lazy(() => import("./internal-pages/AdminOnboarding"));
const AdminInstallGuide = lazy(() => import("./internal-pages/AdminInstallGuide"));
const AISalesCommandCenter = lazy(() => import("./internal-pages/AISalesCommandCenter"));
const PerformanceWars = lazy(() => import("./internal-pages/PerformanceWars"));
const ClientPortal = lazy(() => import("./internal-pages/ClientPortal"));
const ClientSaasDashboard = lazy(() => import("./pages/ClientSaasDashboard"));
const ClientDashboard = lazy(() => import("./internal-pages/ClientDashboard"));
const Library = lazy(() => import("./pages/Library"));
const OnboardingPipeline = lazy(() => import("./internal-pages/OnboardingPipeline"));
const MissionControlDashboard = lazy(() => import("./internal-pages/MissionControlDashboard"));
const MissionControlLogs = lazy(() => import("./internal-pages/MissionControlLogs"));
const SaaSAdminPanel = lazy(() => import("./internal-pages/SaaSAdminPanel"));
const OpportunityReviewQueue = lazy(() => import("./internal-pages/OpportunityReviewQueue"));
const ClientSetupLookup = lazy(() => import("./pages/ClientSetupLookup"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const ProofPage = lazy(() => import("./pages/ProofPage"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const FunctionAudit = lazy(() => import("./internal-pages/FunctionAudit"));
const AdminReconciliation = lazy(() => import("./internal-pages/AdminReconciliation"));
const SystemObservabilityDashboard = lazy(() => import("./components/mission-control/SystemObservabilityDashboard"));
const FunnelOptimizationPage = lazy(() => import("./components/admin/FunnelOptimizationDashboard"));

const PUBLIC_PATHS = APP_SHELL_PUBLIC_PATHS;

const routePath = (...segments) => `/${segments.join("/")}`;
const dynamicParam = (name) => `:${name}`;

// Legacy redirect rules for old URL paths — review quarterly for removal
// DEPRECATED: Remove redirects that haven't been hit in >30 days
const LEGACY_REDIRECTS = PUBLIC_ROUTE_REDIRECTS.map(([from, to]) => ({ from, to }));

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
  "plumbing",
  "roofing",
  "chiropractic",
  "contractors",
  "real-estate",
  "personal-injury",
  "property-services",
];

const HIDDEN_PUBLIC_ROUTES = [
  { route: routePath("success"), Component: Success },
  { route: routePath("onboarding"), Component: Onboarding },
  { route: routePath("leads", "capture"), Component: CaptureLeads },
  { route: routePath("legal", dynamicParam("type")), Component: LegalPage },
  { route: routePath("order-success"), Component: OrderSuccess },
  { route: routePath("setup"), Component: BusinessSetup },
  { route: routePath("thank-you"), Component: ThankYou },
  { route: routePath("setup", "credentials"), Component: CredentialsSetup },
  { route: routePath("setup", "status", dynamicParam("orderId")), Component: SetupStatus },
  { route: routePath("setup", "status"), Component: SetupStatus },
  { route: routePath("setup", "preview", dynamicParam("specId")), Component: WebsitePreview },
  { route: routePath("setup", "preview"), Component: WebsitePreview },
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

// PathNormalizer — single source of truth for all path normalization
// Handles: uppercase → lowercase, legacy admin aliases, industry slug aliases
const PATH_EXPLICIT_MAP = {
  "/Dashboard": "/mission-control",
  "/AdminSettings": "/mission-control",
  "/AdminLeadDetail": "/admin?tab=leads",
  "/LeadIntelligence": "/admin",
  "/Sam": "/admin",
  "/MedSpaDashboard": "/admin",
  "/WebsiteSpecPreview": "/admin",
};

function PathNormalizer() {
  const location = useLocation();
  const { pathname } = location;
  if (PATH_EXPLICIT_MAP[pathname]) {
    return <Navigate to={PATH_EXPLICIT_MAP[pathname]} replace />;
  }
  const lower = pathname.toLowerCase();
  if (pathname !== lower) {
    return <Navigate to={lower + location.search + location.hash} replace />;
  }
  return null;
}

// Fix 1: ScrollToTop — resets scroll position on every route change
function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    // Don't scroll to top if navigating to a hash anchor
    if (!location.hash) {
      return forceScrollToTop();
    }
  }, [location.hash, location.key, location.pathname]);
  return null;
}

function AppInner() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hostname.includes("preview-sandbox")) return;
    installGa4();
    initializeAnalyticsObserver();
    
    // Track all form submissions
    const trackFormSubmits = () => {
      document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', () => {
          if (window.gtag) {
            window.gtag('event', 'form_submit', {
              form_id: form.id || form.name,
              page_path: window.location.pathname,
            });
          }
        });
      });
    };
    
    // Track link clicks
    const trackLinks = () => {
      document.querySelectorAll('a[href]').forEach(link => {
        if (link.href.includes('http') && !link.href.includes(window.location.hostname)) {
          link.addEventListener('click', () => {
            if (window.gtag) {
              window.gtag('event', 'link_click', {
                link_url: link.href,
                link_text: link.textContent,
                link_type: 'external',
              });
            }
          });
        }
      });
    };
    
    trackFormSubmits();
    trackLinks();
    
    // Re-track on navigation
    const observer = new MutationObserver(() => {
      trackFormSubmits();
      trackLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);
  return null;
}

// Redirect section aliases to the homepage hash without giving them their own metadata.
function HashRedirect({ hash }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ pathname: "/", hash }, { replace: true });
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

function RouteLoadingSkeleton() {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ minHeight: "100svh" }}>
      <div className="w-8 h-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
    </div>
  );
}

function LazyRoute({ Component, ...props }) {
  return (
    <Suspense fallback={<RouteLoadingSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
}

function RouteIndexingGuard() {
  const location = useLocation();

  useEffect(() => {
    const robotsMeta = document.head.querySelector('meta[name="robots"]');
    if (!robotsMeta) return;

    const previous = robotsMeta.getAttribute("content") || "index,follow";
    const shouldNoindex = shouldNoindexRoute(location.pathname);

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

function PublicCookieConsent() {
  const location = useLocation();
  // Never render in the Base44 visual editor sandbox — the module request itself gets blocked
  if (typeof window !== "undefined" && window.location.hostname.includes("preview-sandbox")) return null;
  if (!isPublicPath(location.pathname)) return null;
  return (
    <Suspense fallback={null}>
      <CookieConsent />
    </Suspense>
  );
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
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #003B8F, #00AEEF)" }}
        >
          <span className="text-white text-xl font-bold">!</span>
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-foreground">Access Restricted</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          You do not have permission to view this page. If you believe this is an error, please contact support.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors"
          >
            Back to Home
          </a>
          <a
            href="/contact"
            className="cs-btn-primary"
            style={{ fontSize: "0.8125rem", minHeight: "unset", minWidth: "unset" }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

const AuthenticatedAppWithTenant = () => {
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
      <Route path="/product" element={<LazyRoute Component={ProductLanding} />} />
      <Route path="/pricing" element={<LazyRoute Component={PricingPage} />} />
      <Route path="/signup" element={<LazyRoute Component={ProductSignup} />} />
      <Route path="/product-signup" element={<LazyRoute Component={ProductSignup} />} />
      <Route path="/product-signup/" element={<Navigate to="/product-signup" replace />} />
      <Route path="/start" element={<LazyRoute Component={Start} />} />
      <Route path="/book" element={<LazyRoute Component={Book} />} />
      <Route path="/book-demo" element={<Navigate to="/book" replace />} />
      <Route path="/industries" element={<LazyRoute Component={Industries} />} />
      <Route path={routePath("faq")} element={<LazyRoute Component={FAQPage} />} />
      <Route path={routePath("our-system")} element={<LazyRoute Component={OurSystemPage} />} />
      <Route path={routePath("testimonials")} element={<LazyRoute Component={TestimonialsPage} />} />
      <Route path="/privacy-policy" element={<LazyRoute Component={LegalPage} fixedType="privacy" canonicalPath="/privacy-policy" />} />
      <Route path={routePath("terms")} element={<LazyRoute Component={LegalPage} fixedType="terms" canonicalPath="/terms" />} />
      <Route path="/login" element={<LazyRoute Component={Login} />} />
      <Route path="/register" element={<LazyRoute Component={Register} />} />
      <Route path="/forgot-password" element={<LazyRoute Component={ForgotPassword} />} />
      <Route path="/reset-password" element={<LazyRoute Component={ResetPassword} />} />
      <Route path="/opt-out" element={<LazyRoute Component={lazy(() => import("./pages/OptOut"))} />} />
      <Route path={routePath("ClientPortal")} element={<Navigate to={routePath("client-portal")} replace />} />
      <Route path="/contact" element={<LazyRoute Component={Contact} />} />
      <Route path="/blog" element={<LazyRoute Component={Blog} />} />
      <Route path="/blog/:slug" element={<LazyRoute Component={Blog} />} />
      <Route path="/library" element={<LazyRoute Component={Library} />} />
      <Route
        path="/store"
        element={<LazyRoute Component={Store} />}
      />
      <Route path="/about" element={<LazyRoute Component={About} />} />
      <Route path="/automations" element={<LazyRoute Component={Automations} />} />
      <Route path="/how-it-works" element={<LazyRoute Component={HowItWorks} />} />
      <Route path="/setup-lookup" element={<LazyRoute Component={ClientSetupLookup} />} />
      <Route path="/proof" element={<LazyRoute Component={ProofPage} />} />
      {AUTOMATION_SERVICE_ROUTES.map((path) => (
        <Route key={path} path={path} element={<LazyRoute Component={AutomationServicePage} />} />
      ))}
      {INDUSTRY_ROUTE_SLUGS.map((slug) => (
        <Route
          key={slug}
          path={`/${slug}`}
          element={<LazyRoute Component={IndustryPageTemplate} />}
        />
      ))}
      {HIDDEN_PUBLIC_ROUTES.map(({ route, Component }) => (
        <Route key={route} path={route} element={<LazyRoute Component={Component} />} />
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
          { route: routePath("client-saas"), Component: ClientSaasDashboard },
          { route: routePath("dashboard-entry"), Component: ClientDashboardEntry },
        ].map(({ route, Component }) => (
          <Route
            key={route}
            path={route}
            element={
              <Suspense fallback={<RouteLoadingSkeleton />}>
                <Component />
              </Suspense>
            }
          />
        ))}
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["admin", "super_admin"]}
            unauthenticatedElement={<AuthRedirectFallback />}
            unauthorizedElement={<AccessDeniedPage />}
          />
        }
      >
        {[
          { route: routePath("dashboard"), Component: AdminDashboard },
          { route: routePath("admin-settings"), Component: AdminDashboard },
          { route: routePath("mission-control"), element: <Navigate to="/admin" replace /> },
          { route: routePath("admin"), Component: AdminDashboard },
          { route: routePath("admin", "leads"), element: <Navigate to={`${routePath("admin")}?tab=leads`} replace /> },
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
          { route: routePath("admin", "onboarding-pipeline"), Component: OnboardingPipeline },
          { route: routePath("admin", "logs"), Component: MissionControlLogs },
          { route: routePath("saas", "admin"), Component: SaaSAdminPanel },
          { route: routePath("admin", "opportunity-review"), Component: OpportunityReviewQueue },
          { route: routePath("admin", "audit"), Component: FunctionAudit },
          { route: routePath("admin", "reconciliation"), Component: AdminReconciliation },
          { route: routePath("admin", "system-observability"), Component: SystemObservabilityDashboard },
          { route: routePath("admin", "funnel-optimization"), Component: FunnelOptimizationPage },
           { route: routePath("admin", "conversion-insights"), Component: lazy(() => import("./pages/admin/ConversionInsights")) },
           { route: routePath("admin", "task-status"), Component: lazy(() => import("./pages/admin/TaskStatusDashboard")) },
           { route: routePath("admin", "runbook"), Component: lazy(() => import("./pages/admin/SystemRunbook")) },
           { route: routePath("admin", "automation-health"), Component: lazy(() => import("./internal-pages/AutomationHealth")) },
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
          <Router
            style={{ overflowX: "hidden" }}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to content
            </a>
            <ScrollToTop />
            <PathNormalizer />
            <AppInner />
            <AutoCTAAnalytics />
            <RouteIndexingGuard />
            <div id="main-content" tabIndex={-1}>
              <TenantProvider>
                <AuthenticatedAppWithTenant />
              </TenantProvider>
            </div>
            <PublicCookieConsent />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;