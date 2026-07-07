import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Megaphone, RefreshCw, AlertTriangle, Lock, Sparkles } from 'lucide-react';

export default function FacebookAdsDraftPanel() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [objective, setObjective] = useState('lead_generation');
  const [audience, setAudience] = useState('');
  const [budget, setBudget] = useState('$20-50/day');
  const [adDrafts, setAdDrafts] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignData, draftPosts] = await Promise.all([
        base44.entities.MarketingCampaign.list('-created_date', 20),
        base44.entities.MarketingPost.filter({ platform: 'facebook_ads' }, '-created_date', 50),
      ]);
      setCampaigns(campaignData || []);
      setAdDrafts(draftPosts || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    if (!selectedCampaign) { alert('Select a campaign first'); return; }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('createFacebookAdDraftPlan', {
        campaign_id: selectedCampaign,
        objective,
        audience_description: audience,
        budget_suggestion: budget,
      });
      await loadData();
    } catch (e) {
      alert('Failed to generate ad drafts: ' + e.message);
    } finally { setGenerating(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 text-sm">Facebook Ads — DRAFT ONLY MODE</h3>
            <p className="text-amber-800 text-sm mt-1">
              This module generates ad ideas, copy, audiences, and campaign drafts. No live ad spend can occur without explicit manual approval.
              The "Boost Winning Post" feature is disabled until manually enabled.
            </p>
          </div>
        </div>
      </div>

      {/* Generator */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Generate Facebook Ad Draft Plan
        </h2>
        <p className="text-sm text-muted-foreground mb-4">AI generates ad creative variants, targeting suggestions, and budget recommendations. All drafts — no live spend.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-foreground">Campaign</label>
            <select value={selectedCampaign} onChange={e => setSelectedCampaign(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="">Select campaign...</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.campaign_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Objective</label>
            <select value={objective} onChange={e => setObjective(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="lead_generation">Lead Generation</option>
              <option value="traffic">Traffic</option>
              <option value="engagement">Engagement</option>
              <option value="brand_awareness">Brand Awareness</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Audience (optional)</label>
            <input value={audience} onChange={e => setAudience(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="e.g. HVAC owners aged 30-55" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Budget Suggestion</label>
            <input value={budget} onChange={e => setBudget(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating || !selectedCampaign} className="cs-btn-primary text-sm disabled:opacity-50">
          {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Ad Drafts</>}
        </button>
      </div>

      {/* Ad drafts list */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Ad Draft Concepts</h2>
        {adDrafts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No ad drafts yet. Generate a plan above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {adDrafts.map(draft => (
              <div key={draft.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">FB Ad Draft</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    draft.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                    draft.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{draft.approval_status}</span>
                </div>
                <p className="text-sm text-foreground font-semibold mb-1">Primary Text:</p>
                <p className="text-sm text-muted-foreground mb-2">{draft.final_text || draft.draft_text}</p>
                <p className="text-xs text-muted-foreground"><strong>CTA:</strong> {draft.cta}</p>
                <p className="text-xs text-muted-foreground truncate"><strong>UTM:</strong> {draft.utm_url}</p>
                <div className="mt-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
                  <p className="text-xs text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Draft only — no live ad created or spent.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disabled boost feature */}
      <div className="rounded-xl border border-dashed border-border p-4 opacity-50">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-muted-foreground text-sm">Boost Winning Post (Disabled)</h3>
            <p className="text-xs text-muted-foreground">This feature will allow promoting high-performing organic posts as paid Facebook ads. Disabled until manually enabled.</p>
          </div>
        </div>
      </div>
    </div>
  );
}