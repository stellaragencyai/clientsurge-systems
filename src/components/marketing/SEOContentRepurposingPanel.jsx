import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Sparkles, RefreshCw, ExternalLink, CheckCircle2 } from 'lucide-react';

export default function SEOContentRepurposingPanel() {
  const [seeds, setSeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [industry, setIndustry] = useState('');
  const [count, setCount] = useState(5);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [seedData, campaignData] = await Promise.all([
        base44.entities.SEOContentSeed.list('-created_date', 50),
        base44.entities.MarketingCampaign.list('-created_date', 20),
      ]);
      setSeeds(seedData || []);
      setCampaigns(campaignData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await base44.functions.invoke('generateSEOContentSeeds', {
        campaign_id: campaignId || undefined,
        industry: industry || undefined,
        count,
      });
      await loadData();
    } catch (e) {
      alert('Failed to generate SEO seeds: ' + e.message);
    } finally { setGenerating(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await base44.entities.SEOContentSeed.update(id, { status });
      loadData();
    } catch (e) { alert('Failed: ' + e.message); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Generator */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Generate SEO Content Seeds
        </h2>
        <p className="text-sm text-muted-foreground mb-4">AI generates blog post and landing page ideas with target keywords, search intent, and internal linking targets.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-sm font-semibold text-foreground">Campaign (optional)</label>
            <select value={campaignId} onChange={e => setCampaignId(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm">
              <option value="">No campaign</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.campaign_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Industry (optional)</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" placeholder="e.g. HVAC, Dental, Med Spa" />
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">Count</label>
            <input type="number" value={count} onChange={e => setCount(parseInt(e.target.value) || 5)} min={1} max={10} className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={generating} className="cs-btn-primary text-sm disabled:opacity-50">
          {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Seeds</>}
        </button>
      </div>

      {/* Seeds list */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-3">Content Seeds</h2>
        {seeds.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No SEO content seeds yet. Generate some above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {seeds.map(seed => (
              <div key={seed.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{seed.proposed_blog_title || seed.topic}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Keyword: <strong>{seed.keyword}</strong> · Intent: {seed.search_intent} · Industry: {seed.target_industry || 'General'}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    seed.status === 'published' ? 'bg-green-100 text-green-700' :
                    seed.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    seed.status === 'approved' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{seed.status}</span>
                </div>

                {seed.proposed_landing_page && (
                  <p className="text-xs text-primary mb-1">
                    <ExternalLink className="w-3 h-3 inline mr-1" />
                    {seed.proposed_landing_page}
                  </p>
                )}

                {seed.internal_link_targets?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {seed.internal_link_targets.map((link, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{link}</span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 mt-2">
                  <button onClick={() => updateStatus(seed.id, 'approved')} className="text-xs btn-secondary px-2 py-1">
                    <CheckCircle2 className="w-3 h-3 inline" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}