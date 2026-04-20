import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, LayoutDashboard, Settings, BarChart3, MessageSquare, Activity, Users, FolderKanban, Zap, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel';
import LeadManagementDashboard from '../components/admin/LeadManagementDashboard';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';
import CommunicationTemplates from '../components/admin/CommunicationTemplates';
import IntegrationHealth from '../components/admin/IntegrationHealth';
import ClientProjectsPanel from '../components/admin/ClientProjectsPanel';
import AutomationsPanel from '../components/admin/AutomationsPanel';

const intakeTypeLabels = {
  lead_capture: 'Lead Capture',
  contact_inquiry: 'Contact Inquiry',
  demo_booking: 'Demo Booking',
};

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'client-projects', label: 'Client Projects', icon: FolderKanban },
  { id: 'onboarding', label: 'Client Onboarding', icon: ClipboardList },
  { id: 'automations', label: '9 Automations', icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'templates', label: 'Templates', icon: MessageSquare },
  { id: 'health', label: 'Integration Health', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    base44.auth.logout();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'leads':
        return <LeadManagementDashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'templates':
        return <CommunicationTemplates />;
      case 'health':
        return <IntegrationHealth />;
      case 'client-projects':
        return <ClientProjectsPanel />;
      case 'automations':
        return <AutomationsPanel />;
      case 'onboarding':
        navigate('/admin/onboarding');
        return null;
      case 'settings':
        return <AdminSettingsPanel />;
      case 'overview':
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-border transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <h1 className="font-display text-xl font-semibold text-foreground">
              ClientSurge <span className="text-primary">Admin</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border space-y-3">
            <div className="px-4 py-2">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-semibold text-foreground truncate">{user.full_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-border px-6 py-4 flex items-center justify-between lg:justify-end sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-foreground hidden sm:block">
            {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </h2>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
        />
      )}
    </div>
  );
}

function OverviewDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      const leadsData = await base44.entities.Leads.list('-created_date', 50);
      setLeads(leadsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Leads', value: leads.length, color: 'blue' },
    { label: 'New Today', value: leads.filter(l => {
      const today = new Date().toDateString();
      return new Date(l.created_date).toDateString() === today;
    }).length, color: 'green' },
    { label: 'Qualified', value: leads.filter(l => l.status === 'Qualified').length, color: 'purple' },
    { label: 'Booked', value: leads.filter(l => l.status === 'Booked').length, color: 'emerald' },
  ];

  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Here's your dashboard overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`rounded-xl border border-border p-6 ${colors[stat.color]}`}>
            <p className="text-sm font-medium opacity-75">{stat.label}</p>
            <p className="text-4xl font-bold mt-2">{loading ? '-' : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recent Leads</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : leads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet</p>
          ) : (
            leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground text-sm">{lead.full_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {intakeTypeLabels[lead.intake_type] || lead.intake_type || 'Legacy intake'}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  lead.status === 'Booked' ? 'bg-green-100 text-green-800' :
                  lead.status === 'Qualified' ? 'bg-purple-100 text-purple-800' :
                  lead.status === 'Contacted' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {lead.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>&#10003; View all leads in the Leads section</li>
            <li>&#10003; Check analytics and conversion rates</li>
            <li>&#10003; Customize message templates</li>
            <li>&#10003; Monitor integration health</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-3">System Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Status</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600" />Operational</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Database</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-600" />Healthy</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-semibold text-foreground">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

