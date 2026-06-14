import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Phone, Mail, Clock, User, MessageSquare } from 'lucide-react';
import { useRealTimePolling } from '@/hooks/useRealTimePolling';
import { deltaFetchHelpers } from './DeltaFetchHelper';

export default function LiveLeadsFeed({ filters, refreshKey }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now());

  // Real-time delta fetch - only get new/updated threads
  const fetchDeltaThreads = async (lastTimestamp) => {
    try {
      const newThreads = await deltaFetchHelpers.fetchNewConversationThreads(lastTimestamp);
      if (newThreads.length > 0) {
        setThreads(prevThreads => {
          const existingIds = new Set(prevThreads.map(t => t.id));
          const filtered = newThreads.filter(t => !existingIds.has(t.id));
          return [...filtered, ...prevThreads].slice(0, 50);
        });
        setLastUpdatedTime(Date.now());
      }
      return newThreads;
    } catch (error) {
      console.error('Error fetching delta threads:', error);
      throw error;
    }
  };

  // Real-time polling
  useRealTimePolling(fetchDeltaThreads, 3000, null, null, true);

  // Initial load
  useEffect(() => {
    const loadThreads = async () => {
      setLoading(true);
      try {
        const data = await base44.entities.ConversationThread.list('-last_message_at', 50);
        let filtered = data || [];

        if (filters.phoneNumber) {
          filtered = filtered.filter(t =>
            t.lead_id?.includes(filters.phoneNumber) || false
          );
        }

        setThreads(filtered);
        setLastUpdatedTime(Date.now());
      } catch (error) {
        console.error('Error loading conversation threads:', error);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [filters, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Active Conversations</h2>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          {threads.length} active • {Math.round((Date.now() - lastUpdatedTime) / 1000)}s ago
        </span>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground font-medium">No active conversations</p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map(thread => (
            <div
              key={thread.id}
              className="rounded-lg border border-border p-4 hover:border-primary/30 hover:bg-card/50 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm font-semibold">
                      {thread.lead_id || 'Unknown'}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        thread.thread_status === 'open'
                          ? 'badge-success'
                          : 'badge-neutral'
                      }`}
                    >
                      {thread.thread_status || 'open'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {thread.last_message_at
                        ? formatDistanceToNow(new Date(thread.last_message_at), {
                          addSuffix: true,
                        })
                        : 'No activity'}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm flex flex-col items-end gap-1">
                  <div className="font-semibold text-foreground">
                    {thread.message_count || 0}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted font-medium text-muted-foreground">
                    {thread.primary_channel || 'sms'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}