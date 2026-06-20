import { useState, useEffect, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, LogOut, LayoutDashboard, TrendingUp, Zap, Users, DollarSign, RefreshCw } from 'lucide-react';
import SaasKpiBar from '@/components/saas-portal/SaasKpiBar';
import SaasOnboarding from '@/components/saas-portal/SaasOnboarding';
import SaasAutomations from '@/components/saas-portal/SaasAutomations';
import SaasLeadFeed from '@/components/saas-portal/SaasLeadFeed';
import SaasRevenue from '@/components/saas-portal/SaasRevenue';

const NAV = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'onboarding', label: 'Onboarding', Icon: TrendingUp },
  { id: 'automations', label: 'Automations', Icon: Zap },
  { id: 'leads', label: 'Lead Activity', Icon: Users },
  { id: 'revenue', label: 'Revenue', Icon: DollarSign },
];

const STATUS_CONFIG = {
  live: { label: 'Live', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  testing: { label: 'Testing', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  setup_in_progress: { label: 'Setting Up', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  intake_received: { label: 'Onboarding', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  blocked: { label: 'Blocked', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

export default function ClientSaasDashboard() {
  useLayoutEffect(() => {
    const robots = document.querySelector('meta[name="robots"]');
    if (robots) robots.setAttribute('content', 'noindex,nofollow');
    return () => { if (robots) robots.setAttribute('content', 'index,follow'); };
  }, []);

  const [user, setUser] = useState(null);
  const [context, setContext] = useState(null);
  const [portal, setPortal] = useState(null);
  const [installOS, setInstallOS] = useState(null);
  const [branding, setBranding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    const load = async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) { base44.auth.redirectToLogin(window.location.pathname); return; }

      const me = await base44.auth.me();
      setUser(me);

      // Load portal context
      const ctx = await base44.functions.invoke('getClientPortalContext', {}).catch(() => ({ data: {} }));
      const ctxData = ctx?.data || {};
      setContext(ctxData);

      const clientId = ctxData.project?.client_id;
      const clientProjectId = ctxData.project?.id;
      const orderId = ctxData.order?.id;

      // Load ClientExperiencePortal record
      if (clientId || clientProjectId) {
        const filter = clientId ? { client_id: clientId } : { client_project_id: clientProjectId };
        const portals = await base44.entities.ClientExperiencePortal.filter(filter, '-created_date', 1).catch(() => []);
        let p = portals?.[0] ?? null;

        // If stale or missing, trigger recompute
        if ((!p || !p.last_synced_at) && (clientId || orderId)) {
          await base44.functions.invoke('computeClientExperiencePortal', {
            client_id: clientId, client_project_id: clientProjectId, order_id: orderId,
          }).catch(() => {});
          const refreshed = await base44.entities.ClientExperiencePortal.filter(filter, '-created_date', 1).catch(() => []);
          p = refreshed?.[0] ?? null;
        }
        setPortal(p);
        setLastSynced(p?.last_synced_at ? new Date(p.last_synced_at) : null);
      }

      // Load ClientInstallationOS for onboarding details
      if (orderId) {
        const osRecords = await base44.entities.ClientInstallationOS.filter({ order_id: orderId }, '-created_date', 1).catch(() => []);
        setInstallOS(osRecords?.[0] ?? null);
      }

      // Check for agency branding
      try {
        const brandingRecords = await base44.entities.AgencyBrandingConfig?.filter({}, '-created_date', 1).catch(() => []);
        setBranding(brandingRecords?.[0] ?? null);
      } catch {}

      setLoading(false);
    };
    load();
  }, []);

  const handleRefresh = async () => {
    if (!context) return;
    const clientId = context.project?.client_id;
    const orderId = context.order?.id;
    if (clientId || orderId) {
      await base44.functions.invoke('computeClientExperiencePortal', {
        client_id: clientId, order_id: orderId, force_recompute: true,
      }).catch(() => {});
      const filter = clientId ? { client_id: clientId } : { client_project_id: context.project?.id };
      const refreshed = await base44.entities.ClientExperiencePortal.filter(filter, '-created_date', 1).catch(() => []);
      if (refreshed?.[0]) { setPortal(refreshed[0]); setLastSynced(new Date()); }
    }
  };

  const project = context?.project;
  const order = context?.order;
  const clientId = project?.client_id;
  const stage = portal?.onboarding_stage || 'intake_received';
  const sc = STATUS_CONFIG[stage] || STATUS_CONFIG.intake_received;

  // Apply branding overrides
  const brandName = branding?.brand_name || 'ClientSurge Systems';
  const brandLogo = branding?.logo_url;
  const brandPrimary = branding?.primary_color || '#00AEEF';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!project && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-sm text-center bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <LayoutDashboard className="w-10 h-10 text-blue-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Setting Up Your System</h2>
          <p className="text-sm text-gray-500 mb-6">Your portal will be ready within 24–48 hours of your purchase. We'll email you when it's live.</p>
          <a href="mailto:support@clientsurgesystems.com" className="text-sm font-semibold text-blue-600 hover:underline">Contact Support</a>
        </div>
      </div>
    );
  }

  const sectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <SaasKpiBar portal={portal} />
            <div className="grid md:grid-cols-2 gap-6">
              <SaasOnboarding portal={portal} installOS={installOS} />
              <SaasAutomations portal={portal} clientId={clientId} />
            </div>
          </div>
        );
      case 'onboarding': return <SaasOnboarding portal={portal} installOS={installOS} />;
      case 'automations': return <SaasAutomations portal={portal} clientId={clientId} />;
      case 'leads': return <SaasLeadFeed clientId={clientId} />;
      case 'revenue': return <SaasRevenue portal={portal} clientId={clientId} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {brandLogo
            ? <img src={brandLogo} alt={brandName} className="h-7 w-auto" />
            : <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${brandPrimary}, #003B8F)` }}>
                  <span className="text-white text-[10px] font-bold">CS</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{brandName}</span>
              </div>
          }
          <span className="hidden sm:inline text-xs text-gray-400 border-l border-gray-200 pl-3">Client Portal</span>
        </div>
        <div className="flex items-center gap-4">
          {lastSynced && (
            <button onClick={handleRefresh} className="hidden sm:flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors">
              <RefreshCw className="w-3 h-3" />
              Updated {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          )}
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-gray-700">{project?.business_name}</p>
            <p className="text-[11px] text-gray-400">{user?.email}</p>
          </div>
          <button onClick={() => base44.auth.logout('/')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar nav — desktop */}
        <aside className="hidden md:flex flex-col w-52 border-r border-gray-100 bg-white pt-6 pb-4 px-3">
          {/* Business header */}
          <div className="px-3 mb-6">
            <p className="text-xs font-bold text-gray-900 truncate">{project?.business_name}</p>
            <div className={`flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium w-fit ${sc.bg} ${sc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </div>
          </div>

          <nav className="space-y-1 flex-1">
            {NAV.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />{label}
              </button>
            ))}
          </nav>

          <div className="px-3 pt-4 border-t border-gray-100">
            <a href="mailto:support@clientsurgesystems.com" className="text-xs text-gray-400 hover:text-blue-500 transition-colors">Need help?</a>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 flex">
          {NAV.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                activeSection === id ? 'text-blue-600' : 'text-gray-400'
              }`}>
              <Icon className="w-5 h-5" />{label}
            </button>
          ))}
        </nav>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 min-w-0">
          {/* Page title */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{NAV.find(n => n.id === activeSection)?.label}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{project?.business_name}</p>
            </div>
            {/* AI summary pill */}
            {activeSection === 'overview' && portal?.ai_summary && (
              <div className="hidden lg:block max-w-xs text-xs text-gray-500 bg-white rounded-lg border border-gray-100 shadow-sm px-3 py-2">
                {portal.ai_summary}
              </div>
            )}
          </div>

          {sectionContent()}
        </main>
      </div>
    </div>
  );
}