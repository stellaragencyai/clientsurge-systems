import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
      // Redirect to login automatically
      navigateToLogin();
      return null;
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App