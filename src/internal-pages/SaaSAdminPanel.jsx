import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import {
  Users, TrendingUp, CreditCard, CheckCircle, AlertCircle,
  Plus, ExternalLink, Eye, EyeOff
} from 'lucide-react';

/**
 * SAAS ADMIN PANEL
 * 
 * Global admin view for managing all tenants:
 * - Overview of all Clients and ClientProjects
 * - Subscription and Order status per client
 * - Activation progress and system health
 * - Quick access to client dashboards
 * 
 * Admin-only interface. Enforces role-based access control.
 */
export default function SaaSAdminPanel() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClient, setExpandedClient] = useState(null);

  // Load all clients and projects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [allClients, allProjects] = await Promise.all([
          base44.entities.Client.list('-created_date', 1000),
          base44.entities.ClientProject.list('-created_date', 1000),
        ]);
        setClients(allClients || []);
        setProjects(allProjects || []);
      } catch (err) {
        console.error('Failed to load SaaS data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get projects for a client
  const getClientProjects = (clientId) => {
    return projects.filter(p => p.client_id === clientId);
  };

  // Get total value for a client
  const getClientTotalValue = (clientId) => {
    const clientProjects = getClientProjects(clientId);
    return clientProjects.reduce((sum, p) => {
      // Would need to query Orders for complete accuracy
      return sum + (p.total_monthly || 0);
    }, 0);
  };

  // Role check
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">SaaS Admin Panel is available to admins only.</p>
        </div>
      </div>
    );
  }

  // Filter clients based on search
  const filteredClients = clients.filter(c =>
    c.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status badge component
  const StatusBadge = ({ status, type = 'status' }) => {
    const statusColors = {
      'Active': 'bg-green-100 text-green-800',
      'Onboarding': 'bg-blue-100 text-blue-800',
      'In Setup': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-purple-100 text-purple-800',
      'Live': 'bg-green-100 text-green-800',
      'Paused': 'bg-gray-100 text-gray-800',
      'Canceled': 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || statusColors['In Setup']}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">SaaS Admin Panel</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-tenant system overview &amp; management
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold text-foreground">
                    {clients.filter(c => c.status === 'Active').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Live Projects</p>
                  <p className="text-2xl font-bold text-foreground">
                    {projects.filter(p => p.client_project_status === 'Live').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No clients found</p>
            </div>
          ) : (
            filteredClients.map(client => {
              const clientProjects = getClientProjects(client.id);
              const isExpanded = expandedClient === client.id;

              return (
                <div
                  key={client.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  {/* Client Row */}
                  <div
                    className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold text-foreground">{client.business_name}</h3>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={client.status} />
                      <span className="text-sm font-medium text-muted-foreground">
                        {clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to client portal
                        }}
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Projects */}
                  {isExpanded && clientProjects.length > 0 && (
                    <div className="border-t border-border bg-muted/30 px-6 py-4">
                      <h4 className="text-sm font-semibold text-foreground mb-3">Projects</h4>
                      <div className="space-y-3">
                        {clientProjects.map(project => (
                          <div
                            key={project.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
                          >
                            <div>
                              <p className="font-medium text-foreground">{project.business_name}</p>
                              <p className="text-xs text-muted-foreground">{project.client_project_status}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={project.client_project_status} />
                              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <ExternalLink className="w-4 h-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}