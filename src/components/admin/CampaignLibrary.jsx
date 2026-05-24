import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Play, Pause, Loader2, Mail } from 'lucide-react';
import CampaignBuilder from './CampaignBuilder';
import DeleteConfirmModal from './DeleteConfirmModal';

const TYPE_COLORS = {
  onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
  nurture: 'bg-blue-50 text-blue-700 border-blue-200',
  reactivation: 'bg-green-50 text-green-700 border-green-200',
  custom: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function CampaignLibrary() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.EmailSequence.list('-created_date', 100);
      setCampaigns(data || []);
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, currentActive) => {
    try {
      await base44.entities.EmailSequence.update(id, {
        active: !currentActive,
        status: !currentActive ? 'active' : 'paused',
      });
      loadCampaigns();
    } catch (err) {
      setError('Failed to update campaign');
    }
  };

  const deleteCampaign = async (id) => {
    try {
      await base44.entities.EmailSequence.delete(id);
      loadCampaigns();
    } catch (err) {
      setError('Failed to delete campaign');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  if (showBuilder) {
    return (
      <div>
        <button
          onClick={() => {
            setShowBuilder(false);
            setEditingId(null);
            loadCampaigns();
          }}
          className="mb-4 text-sm text-primary hover:text-primary/80"
        >
          ← Back to Library
        </button>
        <CampaignBuilder sequenceId={editingId} onClose={() => setShowBuilder(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Campaign Builder</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage email sequences</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowBuilder(true);
          }}
          className="px-6 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-border">
          <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No campaigns yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-xs text-muted-foreground">{campaign.description}</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TYPE_COLORS[campaign.type]}`}>
                  {campaign.type}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 py-4 border-y border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Steps</p>
                  <p className="text-lg font-bold text-foreground">{campaign.steps?.length || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Enrolled</p>
                  <p className="text-lg font-bold text-foreground">{campaign.total_enrolled || 0}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${campaign.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-xs font-medium text-foreground">
                  {campaign.active ? 'Active' : 'Paused'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(campaign.id);
                    setShowBuilder(true);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted text-sm flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(campaign.id, campaign.active)}
                  className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 ${
                    campaign.active
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  {campaign.active ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => setConfirmDeleteId(campaign.id)}
                  className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    {confirmDeleteId && (
      <DeleteConfirmModal
        title="Delete Campaign?"
        description="This will permanently delete the campaign and all its steps. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteCampaign(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    )}
    </div>
  );
}