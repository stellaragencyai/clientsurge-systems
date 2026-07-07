import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, AlertTriangle, Pause, CheckCircle2, XCircle, Clock, Zap, TrendingUp, FileText, Users, Video, Image as ImageIcon, ExternalLink, RefreshCw } from 'lucide-react';
import MarketingIntegrationSetupWizard from '@/components/marketing/MarketingIntegrationSetupWizard';
import CampaignBuilder from '@/components/marketing/CampaignBuilder';
import MarketingApprovalQueuePanel from '@/components/marketing/MarketingApprovalQueuePanel';
import AIContentCalendar from '@/components/marketing/AIContentCalendar';
import AutopilotControls from '@/components/marketing/AutopilotControls';
import MarketingAnalyticsDashboard from '@/components/marketing/MarketingAnalyticsDashboard';
import SEOContentRepurposingPanel from '@/components/marketing/SEOContentRepurposingPanel';
import FacebookAdsDraftPanel from '@/components/marketing/FacebookAdsDraftPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Megaphone },
  { id: 'channels', label: 'Channels', icon: Users },
  { id: 'campaigns', label: 'Campaigns', icon: Zap },
  { id: 'calendar', label: 'Content Calendar', icon: Clock },
  { id: 'approvals', label: 'Approval Queue', icon: CheckCircle2 },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'seo', label: 'SEO Repurposing', icon: FileText },
  { id: 'facebook-ads', label: 'FB Ads Drafts', icon: Megaphone },
  { id: 'autopilot', label: 'Autopilot', icon: Zap },
];

export default function AIMarketingCommandCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [channels, setChannels] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [failedJobs, setFailedJobs] = useState(0);
  const [scheduledPosts, setScheduledPosts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pausing, setPausing] = useState(false);
  const [analytics, setAnalytics] = useState({ totalImpressions: 0, totalClicks: 0, totalLeads: 0, connectedSources: 0 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channelData, approvalData, failedData, scheduledData] = await Promise.all([
        base44.entities.SocialChannelConnection.list('-created_date', 50),
        base44.entities.MarketingApprovalQueue.filter({ status: 'pending' }, '-created_date', 100),
        base44.entities.MarketingPublishingJob.filter({ status: { $in: ['failed', 'retrying'] } }, '-created_date', 50),
        base44.entities.MarketingPost.filter({ publish_status: 'scheduled' }, 'scheduled_at', 50),
      ]);
      setChannels(channelData || []);
      setPendingApprovals(approvalData?.length || 0);
      setFailedJobs(failedData?.length || 0);
      setScheduledPosts(scheduledData?.length || 0);
    } catch (e) {
      console.error('Failed to load marketing data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseAll = async () => {
    if (!confirm('EMERGENCY PAUSE: This will cancel all scheduled posts, pause all campaigns, and reset autopilot to Approval Required. Continue?')) return;
    setPausing(true);
    try {
      const res = await base44.functions.invoke('pauseAllMarketingAutomation', {});
      alert(res.data?.message || 'All marketing automation paused.');
      loadData();
    } catch (e) {
      alert('Failed to pause: ' + e.message);
    } finally {
      setPausing(false);
    }
  };

  const connectedChannels = channels.filter(c => c.connected_status === 'connected').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-7 h-7" />
              AI Marketing Command Center
            </h1>
            <p className="text-blue-100 text-sm mt-1">Generate, approve, schedule, and publish content across LinkedIn, TikTok, and Instagram</p>
          </div>
          <button
            onClick={handlePauseAll}
            disabled={pausing}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {pausing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
            Emergency Pause All
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'approvals' && pendingApprovals > 0 && (
                    <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingApprovals}
                    </span>
                  )}
                  {tab.id === 'overview' && failedJobs > 0 && (
                    <span className="ml-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {failedJobs}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                channels={channels}
                connectedChannels={connectedChannels}
                pendingApprovals={pendingApprovals}
                failedJobs={failedJobs}
                scheduledPosts={scheduledPosts}
                onNavigate={setActiveTab}
                onRefresh={loadData}
              />
            )}
            {activeTab === 'channels' && <MarketingIntegrationSetupWizard channels={channels} onRefresh={loadData} />}
            {activeTab === 'campaigns' && <CampaignBuilder onNavigate={setActiveTab} />}
            {activeTab === 'calendar' && <AIContentCalendar />}
            {activeTab === 'approvals' && <MarketingApprovalQueuePanel onRefresh={loadData} />}
            {activeTab === 'analytics' && <MarketingAnalyticsDashboard />}
            {activeTab === 'seo' && <SEOContentRepurposingPanel />}
            {activeTab === 'facebook-ads' && <FacebookAdsDraftPanel />}
            {activeTab === 'autopilot' && <AutopilotControls channels={channels} onRefresh={loadData} />}
          </>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ channels, connectedChannels, pendingApprovals, failedJobs, scheduledPosts, onNavigate, onRefresh }) {
  const channelStatus = (platform) => {
    const ch = channels.find(c => c.platform === platform);
    return ch || { connected_status: 'not_connected', publish_capability_status: 'not_ready' };
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Connected Channels" value={`${connectedChannels}/4`} color="blue" onClick={() => onNavigate('channels')} />
        <StatCard icon={Clock} label="Scheduled Posts" value={scheduledPosts} color="indigo" onClick={() => onNavigate('calendar')} />
        <StatCard icon={CheckCircle2} label="Pending Approvals" value={pendingApprovals} color="amber" onClick={() => onNavigate('approvals')} />
        <StatCard icon={AlertTriangle} label="Failed Jobs" value={failedJobs} color="red" onClick={() => onNavigate('overview')} />
      </div>

      {/* Channel status cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Channel Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ChannelStatusCard platform="linkedin" label="LinkedIn" icon={Users} status={channelStatus('linkedin')} onNavigate={onNavigate} />
          <ChannelStatusCard platform="tiktok" label="TikTok" icon={Video} status={channelStatus('tiktok')} onNavigate={onNavigate} />
          <ChannelStatusCard platform="instagram_business" label="Instagram" icon={ImageIcon} status={channelStatus('instagram_business')} onNavigate={onNavigate} />
          <ChannelStatusCard platform="facebook_ads" label="Facebook Ads" icon={Megaphone} status={channelStatus('facebook_ads')} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Recent activity summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => onNavigate('campaigns')} className="w-full text-left flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
              <Zap className="w-4 h-4 text-primary" /> Create new campaign
            </button>
            <button onClick={() => onNavigate('approvals')} className="w-full text-left flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
              <CheckCircle2 className="w-4 h-4 text-amber-500" /> Review pending posts ({pendingApprovals})
            </button>
            <button onClick={() => onNavigate('seo')} className="w-full text-left flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
              <FileText className="w-4 h-4 text-primary" /> Generate SEO content seeds
            </button>
            <button onClick={() => onNavigate('facebook-ads')} className="w-full text-left flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors">
              <Megaphone className="w-4 h-4 text-primary" /> Plan Facebook ad drafts
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-bold text-foreground mb-3">Analytics Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Impressions</span><span className="font-semibold">Not connected</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Website Clicks</span><span className="font-semibold">Not connected</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Leads from Social</span><span className="font-semibold">Not connected</span></div>
            <p className="text-xs text-muted-foreground mt-2">Analytics will populate once platforms are connected and posts are published.</p>
            <button onClick={() => onNavigate('analytics')} className="text-primary text-xs font-semibold mt-2">View Analytics →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-transform hover:scale-[1.02] ${colorMap[color]}`}
    >
      <Icon className="w-5 h-5 mb-2" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </button>
  );
}

function ChannelStatusCard({ platform, label, icon: Icon, status, onNavigate }) {
  const isConnected = status.connected_status === 'connected';
  const isReady = status.publish_capability_status === 'ready_to_publish';

  return (
    <div className={`rounded-xl border p-4 ${isConnected ? 'border-green-200 bg-green-50' : 'border-border bg-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
          <span className="font-semibold text-foreground text-sm">{label}</span>
        </div>
        {isConnected ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {isConnected ? (isReady ? 'Ready to publish' : 'Connected — publish not ready') : 'Not connected'}
      </p>
      {status.error_message && <p className="text-xs text-red-500 mt-1">{status.error_message}</p>}
      <button onClick={() => onNavigate('channels')} className="text-xs text-primary font-semibold mt-2">
        {isConnected ? 'Manage →' : 'Connect →'}
      </button>
    </div>
  );
}