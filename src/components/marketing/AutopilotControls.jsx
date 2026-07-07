import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Shield, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';

const MODE_DESCRIPTIONS = {
  draft_only: {
    label: 'Draft Only',
    description: 'AI generates content drafts only. Nothing is scheduled or published.',
    color: 'gray',
  },
  approval_required: {
    label: 'Approval Required',
    description: 'AI generates drafts and schedules them after manual approval. This is the default mode.',
    color: 'amber',
  },
  autopilot_limited: {
    label: 'Autopilot Limited',
    description: 'Approved content is auto-published on schedule. New content still requires approval.',
    color: 'blue',
  },
  autopilot_full: {
    label: 'Autopilot Full',
    description: 'AI generates, approves, and publishes content automatically. LOCKED until all conditions are met.',
    color: 'green',
  },
};

export default function AutopilotControls({ channels, onRefresh }) {
  const [updating, setUpdating] = useState(null);
  const [daysApproved, setDaysApproved] = useState(0);

  useEffect(() => {
    // Calculate days of approved content
    calculateDaysApproved();
  }, []);

  const calculateDaysApproved = async () => {
    try {
      const published = await base44.entities.MarketingPost.filter({ publish_status: 'published' }, '-published_at', 500);
      if (published && published.length > 0) {
        const dates = new Set(published.map(p => p.published_at?.split('T')[0]).filter(Boolean));
        setDaysApproved(dates.size);
      }
    } catch (e) { console.error(e); }
  };

  const allConnected = channels.filter(c => c.connected_status === 'connected').length >= 3;
  const noErrors = channels.every(c => !c.error_message);
  const canUnlockFull = allConnected && daysApproved >= 14 && noErrors;

  const handleModeChange = async (channelId, mode) => {
    if (mode === 'autopilot_full' && !canUnlockFull) {
      alert('Autopilot Full is locked. Requirements:\n1. All 3 platforms connected\n2. At least 14 days of approved content posted\n3. No major publishing errors\n4. Manual enablement');
      return;
    }
    setUpdating(channelId);
    try {
      await base44.entities.SocialChannelConnection.update(channelId, { autopilot_mode: mode });
      onRefresh();
    } catch (e) {
      alert('Failed to update: ' + e.message);
    } finally { setUpdating(null); }
  };

  return (
    <div className="space-y-6">
      {/* Autopilot Full unlock requirements */}
      <div className={`rounded-xl border p-4 ${canUnlockFull ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="flex items-start gap-3">
          <Lock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${canUnlockFull ? 'text-green-600' : 'text-amber-600'}`} />
          <div>
            <h3 className="font-semibold text-sm">Autopilot Full Unlock Requirements</h3>
            <div className="mt-2 space-y-1 text-sm">
              <Requirement met={allConnected} label={`All 3 platforms connected (${channels.filter(c => c.connected_status === 'connected').length}/3)`} />
              <Requirement met={daysApproved >= 14} label={`14+ days of approved content posted (${daysApproved} days)`} />
              <Requirement met={noErrors} label="No major publishing errors" />
              <Requirement met={false} label="Manual enablement required" />
            </div>
          </div>
        </div>
      </div>

      {/* Per-channel controls */}
      <div className="space-y-3">
        {channels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No channels connected. Set up integrations first.</p>
          </div>
        ) : (
          channels.map(ch => (
            <div key={ch.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground capitalize">{ch.platform.replace(/_/g, ' ')}</h3>
                  <p className="text-xs text-muted-foreground">Current: {MODE_DESCRIPTIONS[ch.autopilot_mode]?.label || 'Approval Required'}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  ch.autopilot_mode === 'autopilot_full' ? 'bg-green-100 text-green-700' :
                  ch.autopilot_mode === 'autopilot_limited' ? 'bg-blue-100 text-blue-700' :
                  ch.autopilot_mode === 'approval_required' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {MODE_DESCRIPTIONS[ch.autopilot_mode]?.label || 'Approval Required'}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(MODE_DESCRIPTIONS).map(([key, mode]) => (
                  <button
                    key={key}
                    onClick={() => handleModeChange(ch.id, key)}
                    disabled={updating === ch.id || (key === 'autopilot_full' && !canUnlockFull)}
                    className={`text-left p-2 rounded-lg border text-xs transition-colors disabled:opacity-50 ${
                      ch.autopilot_mode === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="font-semibold mb-0.5">{mode.label}</div>
                    <div className="text-muted-foreground text-[10px] leading-tight">{mode.description}</div>
                    {key === 'autopilot_full' && !canUnlockFull && <Lock className="w-3 h-3 mt-1 text-amber-500" />}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Requirement({ met, label }) {
  return (
    <div className="flex items-center gap-2">
      {met ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
      <span className={met ? 'text-green-800' : 'text-amber-800'}>{label}</span>
    </div>
  );
}