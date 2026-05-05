import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Wand2, CheckCircle2, XCircle, Eye, RotateCcw, ChevronDown, ChevronUp, Loader2, AlertCircle, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ALL_SECTIONS = [
  { key: 'hero', label: 'Hero', description: 'Headline + subheadline' },
  { key: 'problem', label: 'Problem', description: 'Pain point section' },
  { key: 'solution', label: 'Solution', description: 'Value proposition' },
  { key: 'services', label: 'Services', description: '3 service cards' },
  { key: 'cta', label: 'Call to Action', description: 'CTA heading + button' },
  { key: 'testimonial_intro', label: 'Testimonials Intro', description: 'Social proof intro' },
  { key: 'faq_intro', label: 'FAQ Intro', description: 'FAQ section intro' },
];

const TONE_OPTIONS = ['Professional', 'Warm & Friendly', 'Energetic', 'Luxury', 'Casual'];

function CopyField({ label, value }) {
  if (!value) return null;
  if (typeof value === 'object') {
    return (
      <div className="space-y-1">
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{k.replace(/_/g, ' ')}</span>
            <p className="text-sm text-foreground mt-0.5">{Array.isArray(v) ? v.map(c => `${c.title}: ${c.description}`).join(' | ') : v}</p>
          </div>
        ))}
      </div>
    );
  }
  return <p className="text-sm text-foreground">{value}</p>;
}

function SectionCard({ section, result, onApprove, onReject, isApproved, isRejected }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`rounded-xl border transition-all ${
      isApproved ? 'border-green-300 bg-green-50/50' :
      isRejected ? 'border-red-200 bg-red-50/30 opacity-60' :
      'border-border bg-white'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {isApproved ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" /> :
           isRejected ? <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" /> :
           <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-foreground">{section.label}</p>
            <p className="text-xs text-muted-foreground">{section.description}</p>
          </div>
          {isApproved && <Badge className="ml-2 bg-green-100 text-green-700 border-green-200 text-[10px]">Approved</Badge>}
          {isRejected && <Badge className="ml-2 bg-red-100 text-red-700 border-red-200 text-[10px]">Skipped</Badge>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Diff Preview */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Old (Current) */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Current (Live)</p>
              <div className="rounded-lg bg-muted/40 border border-border p-3 min-h-[80px]">
                {result.old
                  ? <CopyField value={result.old} />
                  : <p className="text-xs text-muted-foreground italic">No existing copy saved</p>
                }
              </div>
            </div>
            {/* New (Generated) */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-2">✨ AI Generated</p>
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 min-h-[80px]">
                <CopyField value={result.new} />
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isApproved && !isRejected && (
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={onApprove} className="gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={onReject} className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="w-3.5 h-3.5" /> Skip
              </Button>
            </div>
          )}
          {(isApproved || isRejected) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { onReject(); onReject(); }} // reset by passing neutral signal
              className="text-xs text-muted-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Undo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WebsiteCopyPanel() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedSections, setSelectedSections] = useState(ALL_SECTIONS.map(s => s.key));
  const [toneOverride, setToneOverride] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null); // { [key]: { old, new, section_label } }
  const [approvedKeys, setApprovedKeys] = useState(new Set());
  const [rejectedKeys, setRejectedKeys] = useState(new Set());
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await base44.entities.Order.filter({ payment_status: 'paid' }, '-created_date', 100);
      setOrders(data || []);
    } catch (e) {
      setError('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find(o => o.id === selectedOrderId);
      setSelectedOrder(order || null);
      setResults(null);
      setApprovedKeys(new Set());
      setRejectedKeys(new Set());
      setSaveSuccess(false);
      setError('');
      // Pre-set tone from existing config if available
      const existingTone = order?.install_configuration?.brand?.tone_of_voice || '';
      setToneOverride(existingTone);
    }
  }, [selectedOrderId, orders]);

  const toggleSection = (key) => {
    setSelectedSections(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    if (!selectedOrderId) return;
    setGenerating(true);
    setError('');
    setResults(null);
    setApprovedKeys(new Set());
    setRejectedKeys(new Set());
    setSaveSuccess(false);

    try {
      const res = await base44.functions.invoke('generateWebsiteCopy', {
        order_id: selectedOrderId,
        sections: selectedSections,
        tone_override: toneOverride || undefined,
      });
      setResults(res.data.sections);
    } catch (e) {
      setError(e?.response?.data?.error || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = (key) => {
    setApprovedKeys(prev => { const s = new Set(prev); s.add(key); return s; });
    setRejectedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  const handleReject = (key) => {
    setRejectedKeys(prev => { const s = new Set(prev); s.add(key); return s; });
    setApprovedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  const handleUndo = (key) => {
    setApprovedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
    setRejectedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
  };

  const handleSaveApproved = async () => {
    if (approvedKeys.size === 0) return;
    setSaving(true);
    setError('');

    const approved_sections = {};
    approvedKeys.forEach(key => {
      if (results[key]) approved_sections[key] = results[key].new;
    });

    try {
      await base44.functions.invoke('approveWebsiteCopy', {
        order_id: selectedOrderId,
        approved_sections,
      });
      setSaveSuccess(true);
      // Merge into results.old so the panel reflects saved state
      setResults(prev => {
        const updated = { ...prev };
        approvedKeys.forEach(key => {
          if (updated[key]) updated[key] = { ...updated[key], old: updated[key].new };
        });
        return updated;
      });
      setApprovedKeys(new Set());
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save copy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const approvedCount = approvedKeys.size;
  const totalResults = results ? Object.keys(results).length : 0;
  const pendingCount = results
    ? Object.keys(results).filter(k => !approvedKeys.has(k) && !rejectedKeys.has(k)).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" /> Website Copy Regenerator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-regenerate specific sections of a client's website copy. Preview changes and approve before saving.
          </p>
        </div>
        {results && approvedCount > 0 && (
          <Button
            onClick={handleSaveApproved}
            disabled={saving}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : `Push ${approvedCount} Section${approvedCount !== 1 ? 's' : ''} Live`}
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Copy saved successfully to client's install configuration.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Configuration */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-5">
        <h3 className="text-sm font-semibold text-foreground">1. Select Client & Options</h3>

        {/* Client selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Order</label>
          {loadingOrders ? (
            <div className="h-10 rounded-lg bg-muted animate-pulse" />
          ) : (
            <select
              value={selectedOrderId}
              onChange={e => setSelectedOrderId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">— Select a paid client order —</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.business_name} — {o.customer_name} ({new Date(o.created_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-lg bg-muted/40 border border-border px-4 py-3 text-xs space-y-1">
            <p><span className="font-medium">Business:</span> {selectedOrder.business_name}</p>
            <p><span className="font-medium">Plan:</span> {selectedOrder.package_type || selectedOrder.plan_type || 'N/A'}</p>
            <p><span className="font-medium">Existing tone:</span> {selectedOrder.install_configuration?.brand?.tone_of_voice || 'Not set'}</p>
            <p><span className="font-medium">Existing copy sections:</span> {
              selectedOrder.install_configuration?.website_copy
                ? Object.keys(selectedOrder.install_configuration.website_copy).join(', ')
                : 'None saved yet'
            }</p>
          </div>
        )}

        {/* Tone override */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Tone of Voice Override</label>
          <select
            value={toneOverride}
            onChange={e => setToneOverride(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Use existing tone (from install config)</option>
            {TONE_OPTIONS.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Section picker */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">2. Select Sections to Regenerate</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {ALL_SECTIONS.map(section => {
              const selected = selectedSections.includes(section.key);
              return (
                <button
                  key={section.key}
                  onClick={() => toggleSection(section.key)}
                  className={`rounded-lg border text-left px-3 py-2.5 text-xs transition-all ${
                    selected
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                  }`}
                >
                  <p className="font-medium">{section.label}</p>
                  <p className="opacity-70 text-[10px] mt-0.5">{section.description}</p>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setSelectedSections(ALL_SECTIONS.map(s => s.key))}
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <span className="text-muted-foreground/40">·</span>
            <button
              onClick={() => setSelectedSections([])}
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={!selectedOrderId || selectedSections.length === 0 || generating}
          className="gap-2 w-full sm:w-auto"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating {selectedSections.length} section{selectedSections.length !== 1 ? 's' : ''}...</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate Copy</>
          )}
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Status bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              3. Preview & Approve — {totalResults} Section{totalResults !== 1 ? 's' : ''} Generated
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-green-700 font-medium">{approvedCount} approved</span>
              <span className="text-red-600 font-medium">{rejectedKeys.size} skipped</span>
              <span>{pendingCount} pending</span>
            </div>
          </div>

          {/* Bulk approve all */}
          {pendingCount > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const all = new Set(Object.keys(results));
                  setApprovedKeys(all);
                  setRejectedKeys(new Set());
                }}
                className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50 text-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve All
              </Button>
            </div>
          )}

          {/* Section cards */}
          <div className="space-y-3">
            {ALL_SECTIONS.filter(s => results[s.key]).map(section => (
              <SectionCard
                key={section.key}
                section={section}
                result={results[section.key]}
                onApprove={() => handleApprove(section.key)}
                onReject={() => {
                  if (approvedKeys.has(section.key) || rejectedKeys.has(section.key)) {
                    handleUndo(section.key);
                  } else {
                    handleReject(section.key);
                  }
                }}
                isApproved={approvedKeys.has(section.key)}
                isRejected={rejectedKeys.has(section.key)}
              />
            ))}
          </div>

          {/* Bottom save bar */}
          {approvedCount > 0 && (
            <div className="sticky bottom-4 z-10">
              <div className="rounded-xl bg-foreground text-background flex items-center justify-between px-5 py-3 shadow-xl">
                <p className="text-sm font-medium">
                  {approvedCount} section{approvedCount !== 1 ? 's' : ''} approved — ready to push live
                </p>
                <Button
                  onClick={handleSaveApproved}
                  disabled={saving}
                  className="gap-2 bg-white text-foreground hover:bg-white/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Push Live'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}