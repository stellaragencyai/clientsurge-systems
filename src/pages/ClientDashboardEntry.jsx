import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from 'lucide-react';

export default function ClientDashboardEntry() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoadingAuth) return;

    const fetchClientData = async () => {
      try {
        if (!user) {
          navigate('/login');
          return;
        }

        // Get client portal context
        const response = await base44.functions.invoke('getClientPortalContext', {});
        if (response.data) {
          setClientData(response.data);
        }
      } catch (err) {
        console.error('Error fetching client data:', err);
        setError('Unable to load your dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [user, isLoadingAuth, navigate]);

  if (isLoadingAuth || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const getStatusIcon = (status) => {
    if (status === 'live') return <CheckCircle2 className="w-6 h-6 text-green-600" />;
    if (status === 'testing') return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    return <Clock className="w-6 h-6 text-blue-600" />;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Waiting to Start',
      setup_in_progress: 'Setup In Progress',
      testing: 'Testing Phase',
      live: 'Live & Active',
      suspended: 'Suspended',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Welcome to ClientSurge</h1>
          <p className="text-muted-foreground text-lg">
            {clientData?.client?.business_name || 'Your Business'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-8">
            {error}
          </div>
        )}

        {/* Status Overview */}
        {clientData?.lifecycle_status && (
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <div className="flex items-start gap-6">
              {getStatusIcon(clientData.lifecycle_status)}
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">System Status</h2>
                <p className="text-muted-foreground mb-4">
                  {getStatusLabel(clientData.lifecycle_status)}
                </p>
                {clientData.lifecycle_status === 'setup_in_progress' && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                      Your setup is in progress. Follow the steps below to get live.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/client-dashboard')}
            className="p-6 rounded-lg border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-colors text-left"
          >
            <h3 className="font-semibold text-lg mb-2">Full Dashboard</h3>
            <p className="text-muted-foreground text-sm mb-4">
              View your leads, automations, analytics, and settings
            </p>
            <div className="flex items-center gap-2 text-primary font-semibold">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          <button
            onClick={() => navigate('/client-dashboard')}
            className="p-6 rounded-lg border border-border hover:border-primary/50 transition-colors text-left"
          >
            <h3 className="font-semibold text-lg mb-2">Onboarding Progress</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Complete your setup steps to go live
            </p>
            <div className="flex items-center gap-2 text-primary font-semibold">
              View Progress <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Key Metrics */}
        {clientData?.metrics && (
          <div className="bg-card border border-border rounded-lg p-8">
            <h3 className="font-semibold text-lg mb-6">Quick Overview</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{clientData.metrics.total_leads || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Leads</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{clientData.metrics.booked || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Booked</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{clientData.metrics.automations_active || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Active Automations</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{clientData.metrics.response_rate || 0}%</div>
                <div className="text-xs text-muted-foreground mt-1">Response Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 p-8 rounded-lg bg-card border border-border text-center">
          <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you get the most out of ClientSurge
          </p>
          <a
            href="mailto:support@clientsurge.com"
            className="inline-block px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}