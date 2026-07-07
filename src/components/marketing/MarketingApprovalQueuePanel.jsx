import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Edit, Clock, RefreshCw, ExternalLink } from 'lucide-react';

export default function MarketingApprovalQueuePanel({ onRefresh }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MarketingApprovalQueue.filter({ status: 'pending' }, '-created_date', 100);
      const enriched = await Promise.all((data || []).map(async (item) => {
        try {
          const post = await base44.entities.MarketingPost.get(item.post_id);
          return { ...item, post };
        } catch { return item; }
      }));
      setQueue(enriched);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleAction = async (postId, action, extra = {}) => {
    setActionLoading(postId);
    try {
      await base44.functions.invoke('approveMarketingPost', { post_id: postId, action, ...extra });
      await loadQueue();
      if (onRefresh) onRefresh();
    } catch (e) {
      alert('Action failed: ' + e.message);
    } finally { setActionLoading(null); }
  };

  const startEdit = (post) => {
    setEditingPost(post.id);
    setEditText(post.final_text || post.draft_text);
  };

  const saveEdit = async (postId) => {
    await handleAction(postId, 'approve', { edited_text: editText });
    setEditingPost(null);
  };

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="text-muted-foreground">No posts waiting for approval. Generate content from the Campaigns tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Posts Awaiting Approval</h2>
        <span className="text-sm text-muted-foreground">{queue.length} pending</span>
      </div>

      {queue.map(item => (
        <div key={item.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <PlatformBadge platform={item.platform} />
              <span className="text-xs text-muted-foreground">{item.post?.post_type || 'text'}</span>
            </div>
            <span className="text-xs text-muted-foreground">{new Date(item.created_date).toLocaleDateString()}</span>
          </div>

          {editingPost === item.post?.id ? (
            <div className="space-y-2 mb-3">
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <div className="flex gap-2">
                <button onClick={() => saveEdit(item.post.id)} className="cs-btn-primary text-sm">Save & Approve</button>
                <button onClick={() => setEditingPost(null)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">{item.post?.final_text || item.post?.draft_text}</p>
          )}

          {item.post?.video_script && (
            <div className="rounded-lg bg-muted/50 p-2 mb-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Video Script:</p>
              <p className="text-xs text-foreground whitespace-pre-wrap">{item.post.video_script}</p>
            </div>
          )}

          {item.post?.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.post.hashtags.map((h, i) => (
                <span key={i} className="text-xs text-primary">#{h}</span>
              ))}
            </div>
          )}

          {item.post?.utm_url && (
            <div className="text-xs text-muted-foreground mb-2 truncate">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              {item.post.utm_url}
            </div>
          )}

          {item.required_changes && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 mb-2">
              <p className="text-xs text-amber-800"><strong>Changes requested:</strong> {item.required_changes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleAction(item.post.id, 'approve')}
              disabled={actionLoading === item.post.id}
              className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> Approve
            </button>
            <button
              onClick={() => startEdit(item.post)}
              disabled={actionLoading === item.post.id}
              className="flex items-center gap-1 btn-secondary text-sm disabled:opacity-50"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button
              onClick={() => handleAction(item.post.id, 'request_changes', { required_changes: prompt('What changes are needed?') })}
              disabled={actionLoading === item.post.id}
              className="flex items-center gap-1 btn-secondary text-sm disabled:opacity-50"
            >
              <Clock className="w-4 h-4" /> Request Changes
            </button>
            <button
              onClick={() => handleAction(item.post.id, 'reject', { required_changes: prompt('Reason for rejection?') })}
              disabled={actionLoading === item.post.id}
              className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlatformBadge({ platform }) {
  const map = {
    linkedin: { label: 'LinkedIn', class: 'bg-blue-100 text-blue-700' },
    tiktok: { label: 'TikTok', class: 'bg-pink-100 text-pink-700' },
    instagram_business: { label: 'Instagram', class: 'bg-purple-100 text-purple-700' },
    facebook_ads: { label: 'FB Ad Draft', class: 'bg-indigo-100 text-indigo-700' },
  };
  const config = map[platform] || { label: platform, class: 'bg-gray-100 text-gray-700' };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.class}`}>{config.label}</span>;
}