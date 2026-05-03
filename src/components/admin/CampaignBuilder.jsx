import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Save, Loader2, ChevronRight, Mail, Eye } from 'lucide-react';

const EMPTY_CAMPAIGN = {
  name: '',
  description: '',
  type: 'custom',
  trigger_type: 'manual',
  steps: [],
  status: 'draft',
};

export default function CampaignBuilder({ sequenceId = null, onClose }) {
  const [campaign, setCampaign] = useState(EMPTY_CAMPAIGN);
  const [selectedStep, setSelectedStep] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (sequenceId) {
      loadSequence();
    }
  }, [sequenceId]);

  const loadSequence = async () => {
    try {
      const sequence = await base44.entities.EmailSequence.get(sequenceId);
      if (sequence) {
        const nextCampaign = {
          ...EMPTY_CAMPAIGN,
          ...sequence,
          steps: Array.isArray(sequence.steps) ? sequence.steps : [],
        };
        setCampaign(nextCampaign);
        setSelectedStep(nextCampaign.steps[0] || null);
      }
    } catch (err) {
      setError('Failed to load sequence');
    }
  };

  const addStep = () => {
    const newStep = {
      id: Math.random().toString(36).substr(2, 9),
      order: campaign.steps.length,
      delay_days: 0,
      delay_hours: 0,
      subject: '',
      body: '',
      condition_type: 'none',
      enabled: true,
    };
    setCampaign({
      ...campaign,
      steps: [...campaign.steps, newStep],
    });
    setSelectedStep(newStep);
  };

  const removeStep = (stepId) => {
    const filtered = campaign.steps.filter(s => s.id !== stepId);
    const reordered = filtered.map((s, idx) => ({ ...s, order: idx }));
    setCampaign({ ...campaign, steps: reordered });
    setSelectedStep(reordered[0] || null);
  };

  const updateStep = (stepId, updates) => {
    setCampaign({
      ...campaign,
      steps: campaign.steps.map(s => s.id === stepId ? { ...s, ...updates } : s),
    });
    setSelectedStep(selectedStep ? { ...selectedStep, ...updates } : null);
  };

  const saveCampaign = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!campaign.name.trim()) {
        setError('Campaign name is required');
        return;
      }
      if (campaign.steps.length === 0) {
        setError('Add at least one email step');
        return;
      }

      if (sequenceId) {
        await base44.entities.EmailSequence.update(sequenceId, campaign);
        setSuccess('Campaign updated successfully');
      } else {
        await base44.entities.EmailSequence.create(campaign);
        setSuccess('Campaign created successfully');
      }

      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setError(err.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-6 max-w-6xl">
      {/* Left: Canvas */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          <input
            type="text"
            value={campaign.name}
            onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
            placeholder="Campaign name (e.g., 'Client Onboarding Sequence')"
            className="text-2xl font-bold w-full border-0 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none mb-2"
          />
          <input
            type="text"
            value={campaign.description}
            onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
            placeholder="Description (optional)"
            className="text-sm w-full border-0 bg-transparent text-muted-foreground placeholder-muted-foreground focus:outline-none"
          />
        </div>

        {/* Campaign Flow */}
        <div className="bg-white rounded-xl border border-border p-8 min-h-96">
          <div className="space-y-4">
            {campaign.steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Mail className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground mb-4">No steps yet. Build your sequence by adding emails.</p>
                <button
                  onClick={addStep}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Add First Email
                </button>
              </div>
            ) : (
              <>
                {campaign.steps.map((step, idx) => (
                  <div key={step.id}>
                    {/* Step Box */}
                    <div
                      onClick={() => setSelectedStep(step)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedStep?.id === step.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            Step {idx + 1} {step.delay_days > 0 || step.delay_hours > 0 ? `(Day ${step.delay_days})` : '(Immediate)'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">{step.subject || 'No subject'}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStep(step.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Arrow */}
                    {idx < campaign.steps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ChevronRight className="w-6 h-6 text-muted-foreground/30 transform rotate-90" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Step Button */}
                <button
                  onClick={addStep}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Email Step
                </button>
              </>
            )}
          </div>
        </div>

        {/* Error/Success */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">{success}</div>
        )}
      </div>

      {/* Right: Step Editor */}
      <div className="bg-white rounded-xl border border-border p-6 h-fit sticky top-6">
        {selectedStep ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Email Content</h3>

            {/* Timing */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">Send After</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={selectedStep.delay_days}
                  onChange={(e) => updateStep(selectedStep.id, { delay_days: parseInt(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
                  placeholder="Days"
                />
                <span className="text-xs text-muted-foreground pt-2">days</span>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">Subject Line</label>
              <input
                type="text"
                value={selectedStep.subject}
                onChange={(e) => updateStep(selectedStep.id, { subject: e.target.value })}
                placeholder="Email subject"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground block">Email Body (HTML)</label>
                <button
                  onClick={() => setShowPreview(p => !p)}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> {showPreview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {showPreview ? (
                <div
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm min-h-32 bg-white prose prose-sm max-w-none overflow-auto"
                  dangerouslySetInnerHTML={{ __html: selectedStep.body || '<p class="text-muted">No content yet</p>' }}
                />
              ) : (
                <textarea
                  value={selectedStep.body}
                  onChange={(e) => updateStep(selectedStep.id, { body: e.target.value })}
                  placeholder="Email content (HTML supported)"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm h-40 font-mono text-xs"
                />
              )}
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">Conditional Logic</label>
              <select
                value={selectedStep.condition_type}
                onChange={(e) => updateStep(selectedStep.id, { condition_type: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="none">No condition</option>
                <option value="email_opened">Send if email opened</option>
                <option value="link_clicked">Send if link clicked</option>
                <option value="status_changed">Send if status changed</option>
              </select>
            </div>

            {/* Toggle */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedStep.enabled}
                onChange={(e) => updateStep(selectedStep.id, { enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-foreground">Enable this step</span>
            </label>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Select a step to edit
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="lg:col-span-2 flex gap-3 justify-end sticky bottom-6">
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted"
          >
            Cancel
          </button>
        )}
        <button
          onClick={saveCampaign}
          disabled={saving}
          className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>
    </div>
  );
}
