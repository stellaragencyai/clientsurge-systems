/**
 * SniperDashboard
 * Admin UI for the AI Lead Sniper — browse targets, run manual hunts, see scores.
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Target, Zap, Globe, Star, RefreshCw, Loader2, AlertCircle,
  CheckCircle2, XCircle, ExternalLink, ChevronDown, ChevronUp,
  MapPin, Phone, Building2, TrendingUp, Eye, Filter, Play, Map, List,
} from 'lucide-react';
import SniperMap from './SniperMap';

// Inject Leaflet CSS once
if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id = 'leaflet-css';
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}
// Inject Leaflet JS once
if (typeof window !== 'undefined' && !window.L) {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  document.head.appendChild(script);
}

const NICHES = [
  { key: 'med_spa',      label: 'Med Spa',        color: 'bg-pink-100 text-pink-800' },
  { key: 'dental',       label: 'Dental',          color: 'bg-cyan-100 text-cyan-800' },
  { key: 'chiropractic', label: 'Chiropractic',    color: 'bg-purple-100 text-purple-800' },
  { key: 'hvac',         label: 'HVAC',            color: 'bg-orange-100 text-orange-800' },
  { key: 'roofing',      label: 'Roofing',         color: 'bg-slate-100 text-slate-800' },
  { key: 'contractors',  label: 'Contractors',     color: 'bg-amber-100 text-amber-800' },
];

const QUALITY_CONFIG = {
  none:    { label: 'No Website', color: 'bg-red-100 text-red-700 border-red-200',       dot: 'bg-red-500' },
  low:     { label: 'Bad Website', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  medium:  { label: 'Mediocre',   color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
  high:    { label: 'Good Site',  color: 'bg-green-100 text-green-700 border-green-200',  dot: 'bg-green-500' },
  unknown: { label: 'Unknown',    color: 'bg-gray-100 text-gray-600 border-gray-200',     dot: 'bg-gray-400' },
};

function SniperScoreBadge({ score }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 50 ? 'bg-orange-400' : 'bg-yellow-400';
  return (
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-black text-sm">{score}</span>
    </div>
  );
}

function LeadCard({ lead }) {
  const [expanded, setExpanded] = useState(false);
  const niche = NICHES.find(n => n.key === lead.niche);
  const wq = QUALITY_CONFIG[lead.website_quality] || QUALITY_CONFIG.unknown;

  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <SniperScoreBadge score={lead.sniper_score || lead.lead_score || 0} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-bold text-foreground">{lead.business_name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {lead.city}, {lead.state}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {niche && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${niche.color}`}>{niche.label}</span>}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${wq.color}`}>{wq.label}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {lead.review_count > 0 && (
              <span className="flex items-center gap-1 text-xs text-amber-700 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                {lead.review_rating?.toFixed(1)} ({lead.review_count} reviews)
              </span>
            )}
            {lead.website && (
              <a
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="w-3 h-3" /> {lead.domain || lead.website}
              </a>
            )}
            {!lead.has_website && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                <XCircle className="w-3 h-3" /> No website
              </span>
            )}
            {lead.phone && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="w-3 h-3" /> {lead.phone}
              </span>
            )}
          </div>
        </div>

        <button className="flex-shrink-0 p-1.5 hover:bg-muted rounded-lg transition-colors">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Website Issues */}
          {lead.website_issues?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Website Problems Detected</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.website_issues.map((issue, i) => (
                  <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-2 py-0.5">
                    ⚠ {issue}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Website age */}
          {lead.website_age_estimate && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Website Assessment</p>
              <p className="text-sm text-foreground">{lead.website_age_estimate}</p>
            </div>
          )}

          {/* Upgrade Pitch */}
          {lead.website_upgrade_pitch && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5">🎯 Our Pitch to Them</p>
              <p className="text-sm text-foreground leading-relaxed">{lead.website_upgrade_pitch}</p>
            </div>
          )}

          {/* Outreach Insight */}
          {lead.outreach_insight && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Outreach Intelligence</p>
              <p className="text-sm text-muted-foreground">{lead.outreach_insight}</p>
            </div>
          )}

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {lead.tags.map((tag, i) => (
                <span key={i} className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RunHuntModal({ onClose, onComplete }) {
  const CITY_OPTIONS = [
    'Phoenix AZ', 'Scottsdale AZ', 'Mesa AZ', 'Tempe AZ', 'Chandler AZ',
    'Las Vegas NV', 'Denver CO', 'Dallas TX', 'Houston TX', 'Atlanta GA',
    'Tampa FL', 'Orlando FL', 'Austin TX', 'Charlotte NC', 'Nashville TN',
  ];

  const [selectedCities, setSelectedCities] = useState(['Phoenix AZ', 'Scottsdale AZ']);
  const [selectedNiches, setSelectedNiches] = useState(NICHES.map(n => n.key));
  const [minScore, setMinScore] = useState(40);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleCity = (city) => setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  const toggleNiche = (key) => setSelectedNiches(prev => prev.includes(key) ? prev.filter(n => n !== key) : [...prev, key]);

  const run = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const res = await base44.functions.invoke('runSniperSearch', {
        cities: selectedCities,
        niches: selectedNiches,
        min_score: minScore,
      });
      setResult(res.data);
      onComplete?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'Sniper hunt failed. Check backend logs.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Run Sniper Hunt</h3>
            <p className="text-xs text-muted-foreground">AI will find businesses with great reviews but bad/no websites</p>
          </div>
        </div>

        {!result ? (
          <div className="p-6 space-y-5">
            {/* Cities */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Target Cities ({selectedCities.length} selected)</label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {CITY_OPTIONS.map(city => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedCities.includes(city)
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Niches */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Target Niches</label>
              <div className="flex flex-wrap gap-1.5">
                {NICHES.map(n => (
                  <button
                    key={n.key}
                    onClick={() => toggleNiche(n.key)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      selectedNiches.includes(n.key)
                        ? 'bg-primary text-white border-primary'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Min score */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                Minimum Sniper Score: <span className="text-primary">{minScore}</span>
              </label>
              <input
                type="range" min={20} max={80} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>Cast wide net (20)</span><span>Elite targets only (80)</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={run}
                disabled={running || selectedCities.length === 0 || selectedNiches.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                {running ? 'Hunting…' : `Launch Sniper (${selectedCities.length} cities × ${selectedNiches.length} niches)`}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <p className="font-bold text-foreground text-lg">Hunt Complete!</p>
              <p className="text-muted-foreground text-sm mt-1">{result.message}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-green-50 border border-green-200 p-3">
                <p className="text-2xl font-black text-green-700">{result.saved}</p>
                <p className="text-xs text-green-700">New Targets</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-2xl font-black text-gray-600">{result.skipped_duplicate}</p>
                <p className="text-xs text-gray-600">Duplicates</p>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-2xl font-black text-amber-700">{result.skipped_low_score}</p>
                <p className="text-xs text-amber-700">Low Score</p>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
              View Targets
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SniperDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHunt, setShowHunt] = useState(false);
  const [filterNiche, setFilterNiche] = useState('all');
  const [filterQuality, setFilterQuality] = useState('all');
  const [filterStatus, setFilterStatus] = useState('New');
  const [sortBy, setSortBy] = useState('sniper_score');
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [mapFilteredLeads, setMapFilteredLeads] = useState(null); // set when clicking a city

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Lead.filter({ source: 'sniper_agent' }, '-created_date', 500);
      setLeads(data || []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const baseLeads = mapFilteredLeads || leads;

  const filtered = baseLeads
    .filter(l => {
      if (filterNiche !== 'all' && l.niche !== filterNiche) return false;
      if (filterQuality !== 'all' && l.website_quality !== filterQuality) return false;
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'sniper_score') return (b.sniper_score || b.lead_score || 0) - (a.sniper_score || a.lead_score || 0);
      if (sortBy === 'reviews') return (b.review_count || 0) - (a.review_count || 0);
      if (sortBy === 'newest') return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      return 0;
    });

  // Stats
  const totalTargets = leads.length;
  const highPriority = leads.filter(l => (l.sniper_score || l.lead_score || 0) >= 70).length;
  const noWebsite = leads.filter(l => !l.has_website || l.website_quality === 'none').length;
  const avgScore = leads.length > 0
    ? Math.round(leads.reduce((s, l) => s + (l.sniper_score || l.lead_score || 0), 0) / leads.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-red-600" />
            AI Lead Sniper
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Autonomous AI that hunts established businesses with great reviews but terrible or no websites — your perfect prospects.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowHunt(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
          >
            <Target className="w-4 h-4" /> Run Sniper Hunt
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Targets', value: totalTargets, color: 'bg-red-50 text-red-700', icon: Target },
          { label: 'High Priority (70+)', value: highPriority, color: 'bg-orange-50 text-orange-700', icon: Zap },
          { label: 'No Website', value: noWebsite, color: 'bg-purple-50 text-purple-700', icon: Globe },
          { label: 'Avg Sniper Score', value: avgScore, color: 'bg-blue-50 text-blue-700', icon: TrendingUp },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`rounded-xl border border-border p-4 text-center ${stat.color}`}>
              <Icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-xs font-medium opacity-75 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* View toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setView('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'map' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Map className="w-4 h-4" /> Map View
        </button>
        <button
          onClick={() => setView('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${view === 'list' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <List className="w-4 h-4" /> List View
        </button>
      </div>

      {/* How it works banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-foreground mb-1">How the Sniper Works</p>
          <p className="text-muted-foreground">
            The AI searches for <strong>established businesses</strong> (50+ reviews, 4+ stars) across all 6 niches that have <strong>bad, outdated, or no websites</strong>.
            Each target gets a <strong>Sniper Score</strong> (0-100) based on review volume and website quality — the higher the score, the easier the sale.
            The AI also writes a <strong>personalized pitch</strong> for each business. Runs automatically every 24 hours or manually on demand.
          </p>
        </div>
      </div>

      {/* Map View */}
      {view === 'map' && (
        loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading targets…
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20">
            <Map className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="font-semibold text-foreground">No targets to map yet</p>
            <p className="text-sm text-muted-foreground mt-1">Run a sniper hunt to populate the map.</p>
          </div>
        ) : (
          <SniperMap
            leads={leads}
            onSelectCity={(cityLeads) => {
              setMapFilteredLeads(cityLeads);
              setView('list');
            }}
          />
        )
      )}

      {/* List View */}
      {view === 'list' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Filter:</span>
            </div>
            {mapFilteredLeads && (
              <button
                onClick={() => setMapFilteredLeads(null)}
                className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 font-semibold hover:bg-primary/20 transition-colors"
              >
                <MapPin className="w-3 h-3" /> City filter active × clear
              </button>
            )}
            <select value={filterNiche} onChange={e => setFilterNiche(e.target.value)} className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background focus:outline-none">
              <option value="all">All Niches</option>
              {NICHES.map(n => <option key={n.key} value={n.key}>{n.label}</option>)}
            </select>
            <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)} className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background focus:outline-none">
              <option value="all">All Website Quality</option>
              <option value="none">No Website</option>
              <option value="low">Bad Website</option>
              <option value="medium">Mediocre Website</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background focus:outline-none">
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Responded">Responded</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs rounded-lg border border-border px-2 py-1.5 bg-background focus:outline-none">
              <option value="sniper_score">Sort: Sniper Score</option>
              <option value="reviews">Sort: Most Reviews</option>
              <option value="newest">Sort: Newest</option>
            </select>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} targets shown</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading targets…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Target className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="font-semibold text-foreground">No targets yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Run Sniper Hunt" to start finding hot prospects.</p>
              <button
                onClick={() => setShowHunt(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors mx-auto"
              >
                <Play className="w-4 h-4" /> Launch First Hunt
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(lead => <LeadCard key={lead.id} lead={lead} />)}
            </div>
          )}
        </>
      )}

      {showHunt && (
        <RunHuntModal onClose={() => setShowHunt(false)} onComplete={() => { setShowHunt(false); setTimeout(load, 1000); }} />
      )}
    </div>
  );
}