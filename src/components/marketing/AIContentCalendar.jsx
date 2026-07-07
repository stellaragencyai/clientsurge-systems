import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const PLATFORMS = ['linkedin', 'tiktok', 'instagram_business', 'facebook_ads'];

export default function AIContentCalendar() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.MarketingPost.list('-scheduled_at', 200);
      setPosts(data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const filtered = posts.filter(p => {
    if (filterPlatform !== 'all' && p.platform !== filterPlatform) return false;
    if (filterStatus !== 'all' && p.publish_status !== filterStatus) return false;
    return true;
  });

  // Group by date
  const grouped = {};
  filtered.forEach(p => {
    const date = p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString() : 'Unscheduled';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(p);
  });

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unscheduled') return 1;
    if (b === 'Unscheduled') return -1;
    return new Date(a) - new Date(b);
  });

  if (loading) {
    return <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Platform</label>
          <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
            <option value="all">All Platforms</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">Publish Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
            <option value="all">All Statuses</option>
            <option value="not_scheduled">Not Scheduled</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Calendar view */}
      {sortedDates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No posts yet. Generate content from the Campaigns tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map(date => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">{date}</h3>
                <span className="text-xs text-muted-foreground">({grouped[date].length} posts)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grouped[date].map(post => <CalendarPostCard key={post.id} post={post} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarPostCard({ post }) {
  const statusIcons = {
    published: { icon: CheckCircle2, color: 'text-green-600', bg: 'border-green-200 bg-green-50' },
    scheduled: { icon: Clock, color: 'text-blue-600', bg: 'border-blue-200 bg-blue-50' },
    failed: { icon: AlertTriangle, color: 'text-red-600', bg: 'border-red-200 bg-red-50' },
    cancelled: { icon: XCircle, color: 'text-gray-400', bg: 'border-gray-200 bg-gray-50' },
    not_scheduled: { icon: Clock, color: 'text-muted-foreground', bg: 'border-border bg-card' },
    publishing: { icon: RefreshCw, color: 'text-amber-600', bg: 'border-amber-200 bg-amber-50' },
  };
  const StatusIcon = statusIcons[post.publish_status]?.icon || Clock;
  const statusStyle = statusIcons[post.publish_status] || statusIcons.not_scheduled;

  const platformColors = {
    linkedin: 'bg-blue-100 text-blue-700',
    tiktok: 'bg-pink-100 text-pink-700',
    instagram_business: 'bg-purple-100 text-purple-700',
    facebook_ads: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className={`rounded-lg border p-3 ${statusStyle.bg}`}>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${platformColors[post.platform] || 'bg-gray-100 text-gray-700'}`}>
          {post.platform}
        </span>
        <StatusIcon className={`w-4 h-4 ${statusStyle.color}`} />
      </div>
      <p className="text-xs text-foreground line-clamp-3">{post.final_text || post.draft_text}</p>
      {post.scheduled_at && (
        <p className="text-xs text-muted-foreground mt-1">{new Date(post.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      )}
    </div>
  );
}