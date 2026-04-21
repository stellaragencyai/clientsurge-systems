import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AutoCTAAnalytics from './components/analytics/AutoCTAAnalytics';
// Add page imports here
import Home from './pages/Home';
import HomeTestOption1 from './pages/HomeTestOption1';
import HomeTestOption2 from './pages/HomeTestOption2';
import HomeTestOption3 from './pages/HomeTestOption3';
import MedSpa from './pages/MedSpa';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import AdminSettings from './pages/AdminSettings';
import CaptureLeads from './pages/CaptureLeads';
import AdminDashboard from './pages/AdminDashboard';
import AdminLeads from './pages/AdminLeads';
import AdminLeadDetail from './pages/AdminLeadDetail';
import LeadIntelligence from './pages/LeadIntelligence';
import Sam from './pages/Sam';
import MedSpaDashboard from './pages/MedSpaDashboard';
import Start from './pages/Start';
import ClientPortal from './pages/ClientPortal';
import Book from './pages/Book';
import Success from './pages/Success';
import LegalPage from './pages/LegalPage';
import Contact from './pages/Contact';
import AdminOnboarding from './pages/AdminOnboarding';
import Industries from './pages/Industries';

// Public routes that do NOT require authentication
const PUBLIC_PATHS = [
  "/",
  "/med-spa",
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
  "/test-option-1",
  "/test-option-2",
  "/test-option-3",
];
const NOINDEX_PREFIXES = ['/admin', '/dashboard', '/client-portal', '/lead-intelligence', '/medspa-dashboard', '/sam', '/test-option-1', '/test-option-2', '/test-option-3', '/success'];

const isPublicPath = (pathname) => {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));
};

function SectionRedirect({ hash }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });

    const timer = window.setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
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

    const previous = robotsMeta.getAttribute('content') || 'index,follow';
    const shouldNoindex = NOINDEX_PREFIXES.some((prefix) => location.pathname === prefix || location.pathname.startsWith(`${prefix}/`));

    robotsMeta.setAttribute('content', shouldNoindex ? 'noindex,nofollow' : 'index,follow');

    return () => {
      robotsMeta.setAttribute('content', previous);
    };
  }, [location.pathname]);

  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const pathname = window.location.pathname;

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Only redirect to login for protected routes — public pages load freely
      if (!isPublicPath(pathname)) {
        navigateToLogin();
        return null;
      }
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/test-option-1" element={<HomeTestOption1 />} />
      <Route path="/test-option-2" element={<HomeTestOption2 />} />
      <Route path="/test-option-3" element={<HomeTestOption3 />} />
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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin-settings" element={<AdminSettings />} />
      <Route path="/leads/capture" element={<CaptureLeads />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/leads" element={<AdminLeads />} />
      <Route path="/admin/leads/:leadId" element={<AdminLeadDetail />} />
      <Route path="/lead-intelligence" element={<LeadIntelligence />} />
      <Route path="/sam" element={<Sam />} />
      <Route path="/medspa-dashboard" element={<MedSpaDashboard />} />
      <Route path="/client-portal" element={<ClientPortal />} />
      <Route path="/legal/:type" element={<LegalPage />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/admin/onboarding" element={<AdminOnboarding />} />
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
  )
}

export default App
