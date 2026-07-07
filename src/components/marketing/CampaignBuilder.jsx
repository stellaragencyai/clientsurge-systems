import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';

const CAMPAIGN_IDEAS = [
  'Turn your website into a 24/7 AI sales machine',
  'Med Spa AI booking automation',
  'Missed call text-back automation',
  'AI receptionist for service businesses',
  'Reduce missed lead response time to under 60 seconds',
  'Automate follow-up for HVAC businesses',
  'AI booking agent for dental practices',
  'Win back past customers with AI reactivation',
];

export default function CampaignBuilder({ onNavigate }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [campaignIdea, setCampaignIdea] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState('lead_generation');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [pillarInput, setPillarInput] = useState('');
  const [generatingPosts, setGeneratingPosts] = useState(false);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MarketingCampaign.list('-created_date', 50);
      setCampaigns(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!campaignIdea.trim()) return;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateMarketingCampaign', {
        campaign_idea: campaignIdea,
        target_audience: targetAudience || undefined,
        goal,
      });
      await loadCampaigns();
      setSelectedCampaign(res.data?.campaign || null);
      setCampaignIdea('');
    } catch (e) {
      alert('Failed to generate campaign: ' + e.message);
    } finally { setGenerating(false); }
  };

  const handleGeneratePosts = async (campaignId, pillar) => {
    if (!pillar.trim()) return;
    setGeneratingPosts(true);
    try {
      await base44.functions.invoke('generatePlatformPostVariants', {
        campaign_id: campaignId,
        content_pillar: pillar,
        platforms: ['linkedin', 'tiktok', 'instagram_business'],
      });
      onNavigate('approvals');
    } catch (e) {
      alert('Failed to generate posts: ' + e.message);
    } finally { setGeneratingPosts(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Campaign generator */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> AI Campaign Generator
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Describe a campaign idea and AI will generate content pillars, posting cadence, and platform strategy.</p>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-foreground">Campaign Idea</label>
            <textarea
              value={campaignIdea}
              onChange={e => setCampaignIdea(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="e.g. Turn your website into a 24/7 AI sales machine"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-foreground">Target Audience (optional)</label>
              <input
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="e.g. HVAC business owners"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Goal</label>
              <select
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="lead_generation">Lead Generation</option>
                <option value="brand_awareness">Brand Awareness</option>
                <option value="traffic">Website Traffic</option>
                <option value="engagement">Engagement</option>
                <option value="thought_leadership">Thought Leadership</option>
                <option value="product_launch">Product Launch</option>
              </select>
            </div>
          </div>

          {/* Quick ideas */}
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN_IDEAS.slice(0, 4).map(idea => (
              <button
                key={idea}
                onClick={() => setCampaignIdea(idea)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted hover:border-primary/30 text-muted-foreground transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !campaignIdea.trim()}
            className="cs-btn-primary text-sm disabled:opacity-50"
          >
            {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Zap className="w-4 h-4" /> Generate Campaign</>}
          </button>
        </div>
      </div>

      {/* Campaign list */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No campaigns yet. Generate one above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map(c => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onSelect={() => setSelectedCampaign(selectedCampaign?.id === c.id ? null : c)}
                expanded={selectedCampaign?.id === c.id}
                pillarInput={pillarInput}
                setPillarInput={setPillarInput}
                onGeneratePosts={(pillar) => handleGeneratePosts(c.id, pillar)}
                generatingPosts={generatingPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onSelect, expanded, pillarInput, setPillarInput, onGeneratePosts, generatingPosts }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-amber-100 text-amber-700',
    completed: 'bg-blue-100 text-blue-700',
    archived: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={onSelect} className="w-full p-4 text-left hover:bg-muted/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-foreground">{campaign.campaign_name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{campaign.description || campaign.offer}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[campaign.status] || statusColors.draft}`}>
                {campaign.status}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{campaign.campaign_goal}</span>
              <span className="text-xs text-muted-foreground">{campaign.weekly_posting_goal} posts/week</span>
            </div>
          </div>
          <ArrowRight className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {campaign.content_pillars?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-1">Content Pillars</h4>
              <div className="flex flex-wrap gap-2">
                {campaign.content_pillars.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{p}</span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-0.5">
            <div>Target Audience: {campaign.target_audience || 'N/A'}</div>
            <div>Landing Page: <a href={campaign.landing_page_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{campaign.landing_page_url}</a></div>
            <div>Platforms: {(campaign.target_platforms || []).join(', ')}</div>
          </div>

          <div className="border-t border-border pt-3">
            <h4 className="text-sm font-semibold text-foreground mb-1">Generate Platform-Specific Posts</h4>
            <p className="text-xs text-muted-foreground mb-2">Enter a content pillar or topic to generate native variants for LinkedIn, TikTok, and Instagram.</p>
            <div className="flex gap-2">
              <input
                value={pillarInput}
                onChange={e => setPillarInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="e.g. Missed call recovery for HVAC"
              />
              <button
                onClick={() => onGeneratePosts(pillarInput)}
                disabled={generatingPosts || !pillarInput.trim()}
                className="cs-btn-primary text-sm disabled:opacity-50"
              >
                {generatingPosts ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}