import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Sparkles, Loader2, CheckCircle2, Clock, Globe, Linkedin, Instagram,
  BookOpen, Filter, ChevronDown, ChevronUp, Copy, Check, Archive, RefreshCw,
  AlertCircle, Twitter, Facebook, Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const INDUSTRIES = [
  { key: 'general', label: 'ClientSurge (General)', color: 'bg-blue-100 text-blue-800' },
  { key: 'med_spa', label: 'Med Spa & Aesthetics', color: 'bg-pink-100 text-pink-800' },
  { key: 'dental', label: 'Dental & Orthodontics', color: 'bg-cyan-100 text-cyan-800' },
  { key: 'chiropractic', label: 'Chiropractic & PT', color: 'bg-purple-100 text-purple-800' },
  { key: 'hvac', label: 'HVAC & Home Services', color: 'bg-orange-100 text-orange-800' },
  { key: 'roofing', label: 'Roofing & Restoration', color: 'bg-slate-100 text-slate-800' },
  { key: 'contractors', label: 'General Contractors', color: 'bg-amber-100 text-amber-800' },
];

const CONTENT_TYPES = [
  { key: 'blog_post', label: 'Blog Post', icon: BookOpen, color: 'text-green-600' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: 'text-blue-600' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-700' },
  { key: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'text-sky-600' },
  { key: 'tiktok_script', label: 'TikTok Script', icon: Video, color: 'text-red-600' },
];

const STATUS_STYLES = {
  draft: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  posted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-muted text-muted-foreground border-border',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function ContentCard({ log, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = CONTENT_TYPES.find(t => t.key === log.content_type) || CONTENT_TYPES[0];
  const Icon = typeInfo.icon;
  const industryInfo = INDUSTRIES.find(i => i.key === log.industry) || INDUSTRIES[0];

  return (
    <div className={`rounded-xl border bg-white transition-all ${log.status === 'archived' ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${typeInfo.color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-snug">{log.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge className={`text-[10px] ${industryInfo.color}`}>{industryInfo.label}</Badge>
            <Badge className={`text-[10px] border ${STATUS_STYLES[log.status] || STATUS_STYLES.draft}`}>
              {log.status}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{typeInfo.label}</span>
            {log.word_count > 0 && <span className="text-[11px] text-muted-foreground">{log.word_count} words</span>}
            <span className="text-[11px] text-muted-foreground">{new Date(log.created_date).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <CopyButton text={log.body} />
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Body */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Content</p>
            <div
              className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: log.body.replace(/\n/g, '<br/>') }}
            />
          </div>

          {/* Hashtags */}
          {log.hashtags?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1.5">Hashtags / Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {log.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            {log.status === 'draft' && (
              <Button size="sm" onClick={() => onStatusChange(log.id, 'approved')} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
            )}
            {log.status === 'approved' && (
              <Button size="sm" onClick={() => onStatusChange(log.id, 'posted')} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                <Globe className="w-3.5 h-3.5" /> Mark as Posted
              </Button>
            )}
            {log.status !== 'archived' && (
              <Button size="sm" variant="outline" onClick={() => onStatusChange(log.id, 'archived')} className="gap-1.5 text-muted-foreground text-xs">
                <Archive className="w-3 h-3" /> Archive
              </Button>
            )}
            <CopyButton text={log.body} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SocialMediaEngine() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generator config
  const [selectedIndustry, setSelectedIndustry] = useState('general');
  const [selectedTypes, setSelectedTypes] = useState(['blog_post', 'linkedin', 'instagram', 'facebook']);
  const [topicOverride, setTopicOverride] = useState('');

  // Filters
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.SocialContentLog.list('-created_date', 200);
      setLogs(data || []);
    } catch (e) {
      setError('Failed to load content log');
    } finally {
      setLoading(false);
    }
  };

  const toggleType = (key) => {
    setSelectedTypes(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleGenerate = async () => {
    if (selectedTypes.length === 0) return;
    setGenerating(true);
    setError('');
    setSuccess('');
    try {
      const res = await base44.functions.invoke('generateSocialContent', {
        industry: selectedIndustry,
        content_types: selectedTypes,
        topic_override: topicOverride || undefined,
      });
      const count = res.data.generated || 0;
      setSuccess(`Generated ${count} piece${count !== 1 ? 's' : ''} of content for ${INDUSTRIES.find(i => i.key === selectedIndustry)?.label}. Topic: "${res.data.topic}"`);
      setTopicOverride('');
      await loadLogs();
    } catch (e) {
      setError(e?.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await base44.entities.SocialContentLog.update(id, { status: newStatus });
      setLogs(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    } catch (e) {
      setError('Failed to update status');
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(l => {
    if (filterIndustry !== 'all' && l.industry !== filterIndustry) return false;
    if (filterType !== 'all' && l.content_type !== filterType) return false;
    if (filterStatus !== 'all' && l.status !== filterStatus) return false;
    return true;
  });

  // Stats
  const stats = {
    total: logs.length,
    drafts: logs.filter(l => l.status === 'draft').length,
    approved: logs.filter(l => l.status === 'approved').length,
    posted: logs.filter(l => l.status === 'posted').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Social Media Engine
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI-generate blog posts and social content for all 6 industries. Approve and track posts across platforms.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Generated', value: stats.total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Drafts', value: stats.drafts, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-50 text-green-700' },
          { label: 'Posted', value: stats.posted, color: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-border p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-1 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Generator */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Generate New Content</h3>

        {/* Industry */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Industry / Channel</label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRIES.map(ind => (
              <button
                key={ind.key}
                onClick={() => setSelectedIndustry(ind.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                  selectedIndustry === ind.key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content types */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Content Types</label>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPES.map(ct => {
              const Icon = ct.icon;
              const selected = selectedTypes.includes(ct.key);
              return (
                <button
                  key={ct.key}
                  onClick={() => toggleType(ct.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all ${
                    selected
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${selected ? 'text-primary' : ct.color}`} />
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Topic override */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Custom Topic (optional — leave blank to auto-pick)</label>
          <input
            type="text"
            value={topicOverride}
            onChange={e => setTopicOverride(e.target.value)}
            placeholder="e.g. How HVAC companies win more jobs with AI follow-up"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <Button
          onClick={handleGenerate}
          disabled={selectedTypes.length === 0 || generating}
          className="gap-2"
        >
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating {selectedTypes.length} piece{selectedTypes.length !== 1 ? 's' : ''}...</>
            : <><Sparkles className="w-4 h-4" /> Generate Content</>
          }
        </Button>
      </div>

      {/* Content Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-foreground">Content Library ({filteredLogs.length})</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterIndustry}
              onChange={e => setFilterIndustry(e.target.value)}
              className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background text-foreground focus:outline-none"
            >
              <option value="all">All Industries</option>
              {INDUSTRIES.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background text-foreground focus:outline-none"
            >
              <option value="all">All Types</option>
              {CONTENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background text-foreground focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="posted">Posted</option>
              <option value="archived">Archived</option>
            </select>
            <Button size="sm" variant="outline" onClick={loadLogs} className="gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No content yet</p>
            <p className="text-xs mt-1">Use the generator above to create your first posts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <ContentCard key={log.id} log={log} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {/* Automation Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Automated Content Schedule</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
            <span><strong>General Blog:</strong> Every Monday 7am — SEO automation blog post</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0" />
            <span><strong>Med Spa:</strong> Every Tuesday — Instagram + Facebook + Blog</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0" />
            <span><strong>Dental:</strong> Every Wednesday — LinkedIn + Facebook + Blog</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0" />
            <span><strong>Chiropractic:</strong> Every Thursday — Instagram + LinkedIn + Blog</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            <span><strong>HVAC:</strong> Every Friday — Facebook + LinkedIn + Blog</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0" />
            <span><strong>Roofing:</strong> Bi-weekly Monday — Facebook + Instagram + Blog</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span><strong>Contractors:</strong> Bi-weekly Wednesday — Facebook + LinkedIn + Blog</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 italic">
          All automated content saves as "draft" — review and approve here before posting.
        </p>
      </div>
    </div>
  );
}