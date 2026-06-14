import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';
import { Phone, Mail, Clock, User } from 'lucide-react';

export default function LiveLeadsFeed({ filters, refreshKey }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Active Conversations</h2>
        <span className="text-sm text-muted-foreground">
          {threads.length} active thread{threads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {threads.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">No active conversations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map(thread => (
            <div
              key={thread.id}
              className="rounded-lg border border-border p-4 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-primary" />
                    <span className="font-mono text-sm font-semibold">
                      {thread.lead_id || 'Unknown'}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        thread.thread_status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {thread.thread_status || 'open'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>
                      {thread.last_message_at
                        ? formatDistanceToNow(new Date(thread.last_message_at), {
                          addSuffix: true,
                        })
                        : 'No messages yet'}
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-foreground">
                    {thread.message_count || 0} messages
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {thread.primary_channel || 'sms'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}