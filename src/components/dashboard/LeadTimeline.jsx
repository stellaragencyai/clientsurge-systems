import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AIClassificationBadge from './AIClassificationBadge';

export default function LeadTimeline({ leadId, lead }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [leadId]);

  const loadTimeline = async () => {
    try {
      const eventData = await base44.entities.CommunicationEvent.filter({ lead_id: leadId }, '-created_date', 100);
      setEvents(eventData || []);
    } catch (err) {
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const allEvents = events.map((event) => ({
    type: event.channel || 'internal',
    timestamp: event.created_date,
    data: event,
  }));

  return (
    <div className="bg-white rounded-lg border border-border p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">Timeline</h3>

      {/* AI Classification Display */}
      {lead?.ai_intent && (
        <div className="mb-6 pb-6 border-b border-border">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">
            Latest AI Classification
          </p>
          <AIClassificationBadge intent={lead.ai_intent} confidence={lead.ai_confidence} />
          {lead.ai_last_classification && (
            <p className="text-xs text-muted-foreground mt-2">
              Suggested Action: <span className="font-semibold">{lead.ai_last_classification}</span>
            </p>
          )}
        </div>
      )}

      {/* Key Timestamps */}
      <div className="space-y-2 mb-6 pb-6 border-b border-border text-sm">
        {lead?.last_contacted_at && (
          <div>
            <span className="text-muted-foreground">Last Contacted:</span>{' '}
            <span className="font-semibold">{formatDate(lead.last_contacted_at)}</span>
          </div>
        )}
        {lead?.booking_link_sent_at && (
          <div>
            <span className="text-muted-foreground">Booking Link Sent:</span>{' '}
            <span className="font-semibold">{formatDate(lead.booking_link_sent_at)}</span>
          </div>
        )}
        {lead?.booked_at && (
          <div>
            <span className="text-muted-foreground">Booked:</span>{' '}
            <span className="font-semibold text-green-600">{formatDate(lead.booked_at)}</span>
          </div>
        )}
      </div>

      {/* Event Timeline */}
      {allEvents.length === 0 ? (
        <p className="text-muted-foreground text-sm">No lead activity yet</p>
      ) : (
        <div className="space-y-4">
          {allEvents.map((event, idx) => {
            const item = event.data;
            const isSms = item.channel === 'sms';
            const isEmail = item.channel === 'email';
            const isFailure = item.status === 'failed';
            const badgeLabel =
              item.channel === 'internal'
                ? 'System'
                : isSms
                  ? item.direction === 'inbound'
                    ? 'Inbound SMS'
                    : 'Outbound SMS'
                  : isEmail
                    ? 'Email'
                    : item.channel || 'Activity';

            return (
              <div key={idx} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      isFailure
                        ? 'bg-red-500'
                        : isSms
                          ? item.direction === 'inbound'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                          : isEmail
                            ? 'bg-amber-500'
                            : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div className="flex-1 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{badgeLabel}</span>
                    {item.ai_generated && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                        AI Generated
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        item.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : item.status === 'processed' || item.status === 'sent' || item.status === 'delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-1">
                    {formatDate(event.timestamp)}
                    {item.provider ? ` • ${item.provider}` : ''}
                  </p>
                  {item.subject && (
                    <p className="font-medium text-foreground mb-2">{item.subject}</p>
                  )}
                  <div className="bg-gray-50 rounded p-3 text-foreground">
                    {item.message_body || item.error_message || 'No additional details recorded.'}
                  </div>
                  {item.status === 'failed' && (
                    <p className="text-xs text-red-600 mt-2 font-medium">Manual follow-up may be needed.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

